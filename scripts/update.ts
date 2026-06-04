import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { z } from 'zod';

import { normalizeArticle } from '@/lib/server/article-normalizer';
import { fetchNewsApi, fetchRssSource } from '@/lib/server/fetcher';
import { translateArticles } from '@/lib/server/translator';
import { Article, ArticleSchema, RawArticle } from '@/types/article';

import { fetchAndSaveBlogs } from './fetch-blogs';
import { fetchAndSaveTrending } from './fetch-trending';
import { mergeArticles } from './merge';

const SourcesConfigSchema = z.object({
  rss: z.array(
    z.object({
      url: z.string().url(),
      name: z.string(),
    })
  ),
  newsapi: z.object({
    query: z.string(),
    language: z.string(),
    pageSize: z.number(),
  }),
});

type SourcesConfig = z.infer<typeof SourcesConfigSchema>;

export function parseSources(raw: unknown): SourcesConfig {
  const result = SourcesConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid sources.json: ${result.error.message}`);
  }
  return result.data;
}

export function parseExistingArticles(raw: unknown): Article[] {
  if (!Array.isArray(raw)) {
    throw new Error('articles.json must be a JSON array');
  }
  return raw
    .map((item, index) => {
      const result = ArticleSchema.safeParse(item);
      if (!result.success) {
        console.warn(
          `articles.json contains invalid article at index ${index}, skipping:`,
          result.error.format()
        );
        return null;
      }
      return result.data;
    })
    .filter((a): a is Article => a !== null);
}

export function filterNewRawArticles(allRaw: RawArticle[], existing: Article[]): RawArticle[] {
  const existingIds = new Set(existing.map((article) => article.id));
  const seenIds = new Set<string>();

  return allRaw.filter((article) => {
    if (existingIds.has(article.id) || seenIds.has(article.id)) {
      return false;
    }

    seenIds.add(article.id);
    return true;
  });
}

async function main() {
  let hasFailures = false;
  const sourcesPath = join(process.cwd(), 'config/sources.json');
  const dataPath = join(process.cwd(), 'data/articles.json');
  const publicFeedPath = join(process.cwd(), 'public/data/articles-feed.json');

  if (!existsSync(sourcesPath)) {
    console.error(`Sources config not found at ${sourcesPath}`);
    process.exit(1);
  }

  const sources = parseSources(JSON.parse(readFileSync(sourcesPath, 'utf8')));

  console.log('Fetching articles...');
  const allRaw: RawArticle[] = [];

  for (const feed of sources.rss) {
    const articles = await fetchRssSource(feed.url, feed.name);
    allRaw.push(...articles);
    console.log(`  ${feed.name}: ${articles.length}`);
  }

  const newsApiKey = process.env.NEWS_API_KEY;
  if (newsApiKey) {
    const { query, language, pageSize } = sources.newsapi;
    const newsApiArticles = await fetchNewsApi(query, language, Math.min(pageSize, 10), newsApiKey);
    allRaw.push(...newsApiArticles);
    console.log(`  NewsAPI: ${newsApiArticles.length}`);
  }

  let existing: Article[] = [];
  if (existsSync(dataPath)) {
    existing = parseExistingArticles(JSON.parse(readFileSync(dataPath, 'utf8')));
  } else {
    console.log('data/articles.json not found, starting with empty list.');
  }

  const newRaw = filterNewRawArticles(allRaw, existing);
  console.log(`\nNew articles to translate: ${newRaw.length}`);

  if (newRaw.length === 0) {
    console.log('No new articles. Skipping translation.');
  } else {
    console.log('\nTranslating...');
    const translated = await translateArticles(newRaw);
    console.log(`  Translated: ${translated.length}/${newRaw.length}`);

    if (translated.length === 0 && newRaw.length > 0) {
      console.error('Translation failed: no articles were translated. Exiting.');
      process.exit(1);
    }

    console.log('\nMerging...');
    let pinnedArticleIds = new Set<string>();
    try {
      const favPath = join(process.cwd(), 'data/favorites.json');
      const favData = JSON.parse(readFileSync(favPath, 'utf8')) as { articles?: string[] };
      if (Array.isArray(favData.articles)) pinnedArticleIds = new Set(favData.articles);
    } catch {
      // favorites.json absent — no pinned protection needed
    }
    const merged = mergeArticles(existing, translated, pinnedArticleIds).map(normalizeArticle);

    // Final validation before write
    const validatedMerged = merged.filter((a) => {
      const res = ArticleSchema.safeParse(a);
      if (!res.success) {
        console.warn(
          `Final merge contained invalid article ${a.id}, dropping:`,
          res.error.format()
        );
        return false;
      }
      return true;
    });

    const dataJson = JSON.stringify(validatedMerged, null, 2);
    writeFileSync(`${dataPath}.tmp`, dataJson);
    renameSync(`${dataPath}.tmp`, dataPath);
    mkdirSync(dirname(publicFeedPath), { recursive: true });
    writeFileSync(`${publicFeedPath}.tmp`, dataJson);
    renameSync(`${publicFeedPath}.tmp`, publicFeedPath);
    console.log(`  Total articles: ${validatedMerged.length}`);
  }

  console.log('\nFetching featured blogs...');
  try {
    await fetchAndSaveBlogs();

    const blogsDataPath = join(process.cwd(), 'data/blogs.json');
    const publicBlogsPath = join(process.cwd(), 'public/data/blogs.json');
    if (existsSync(blogsDataPath)) {
      mkdirSync(dirname(publicBlogsPath), { recursive: true });
      const blogsJson = readFileSync(blogsDataPath);
      writeFileSync(`${publicBlogsPath}.tmp`, blogsJson);
      renameSync(`${publicBlogsPath}.tmp`, publicBlogsPath);
      console.log('  Copied blogs.json to public/data/');
    }
  } catch (err) {
    console.error('Failed to fetch blogs:', err);
    hasFailures = true;
  }

  console.log('\nFetching GitHub Trending...');
  try {
    await fetchAndSaveTrending();
  } catch (err) {
    console.error('Failed to fetch trending:', err);
    hasFailures = true;
  }

  console.log('\nDone!');
  process.exit(hasFailures ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
