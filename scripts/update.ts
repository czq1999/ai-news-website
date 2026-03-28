import { fetchRssSource, fetchNewsApi } from './fetch';
import { translateArticles } from './translate';
import { mergeArticles } from './merge';
import { fetchAndSaveTrending } from './fetch-trending';
import type { Article, RawArticle } from '@/types/article';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { normalizeArticle } from '@/lib/server/article-normalizer';

interface RssFeedConfig {
  url: string;
  name: string;
}

interface NewsApiConfig {
  query: string;
  language: string;
  pageSize: number;
}

interface SourcesConfig {
  rss: RssFeedConfig[];
  newsapi: NewsApiConfig;
}

export function parseSources(raw: unknown): SourcesConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('sources.json must be a JSON object');
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.rss)) {
    throw new Error('sources.json must have an "rss" array');
  }
  const rss: RssFeedConfig[] = obj.rss.map((item: unknown, i: number) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`rss[${i}] must be an object`);
    }
    const feed = item as Record<string, unknown>;
    if (typeof feed.url !== 'string' || typeof feed.name !== 'string') {
      throw new Error(`rss[${i}] must have string "url" and "name"`);
    }
    return { url: feed.url, name: feed.name };
  });

  if (typeof obj.newsapi !== 'object' || obj.newsapi === null) {
    throw new Error('sources.json must have a "newsapi" object');
  }
  const na = obj.newsapi as Record<string, unknown>;
  if (
    typeof na.query !== 'string' ||
    typeof na.language !== 'string' ||
    typeof na.pageSize !== 'number'
  ) {
    throw new Error('sources.json newsapi must have string "query", "language" and number "pageSize"');
  }
  const newsapi: NewsApiConfig = {
    query: na.query,
    language: na.language,
    pageSize: na.pageSize,
  };

  return { rss, newsapi };
}

export function parseExistingArticles(raw: unknown): Article[] {
  if (!Array.isArray(raw)) {
    throw new Error('articles.json must be a JSON array');
  }
  for (const item of raw) {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as Record<string, unknown>).id !== 'string'
    ) {
      throw new Error('articles.json contains invalid article: missing or non-string id field');
    }
  }
  return raw as Article[];
}

export function filterNewRawArticles(allRaw: RawArticle[], existing: Article[]): RawArticle[] {
  const existingIds = new Set(existing.map(article => article.id));
  const seenIds = new Set<string>();

  return allRaw.filter(article => {
    if (existingIds.has(article.id) || seenIds.has(article.id)) {
      return false;
    }

    seenIds.add(article.id);
    return true;
  });
}

async function main() {
  const sourcesPath = join(process.cwd(), 'config/sources.json');
  const dataPath = join(process.cwd(), 'data/articles.json');
  const publicFeedPath = join(process.cwd(), 'public/data/articles-feed.json');

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
    const newsApiArticles = await fetchNewsApi(
      query,
      language,
      Math.min(pageSize, 10),
      newsApiKey
    );
    allRaw.push(...newsApiArticles);
    console.log(`  NewsAPI: ${newsApiArticles.length}`);
  }

  const existing: Article[] = parseExistingArticles(JSON.parse(readFileSync(dataPath, 'utf8')));
  const newRaw = filterNewRawArticles(allRaw, existing);
  console.log(`\nNew articles to translate: ${newRaw.length}`);

  if (newRaw.length === 0) {
    console.log('No new articles. Skipping translation.');
  } else {
    console.log('\nTranslating...');
    const translated = await translateArticles(newRaw);
    console.log(`  Translated: ${translated.length}/${newRaw.length}`);

    if (translated.length === 0) {
      console.error('Translation failed: no articles were translated. Exiting.');
      process.exit(1);
    }

    console.log('\nMerging...');
    const merged = mergeArticles(existing, translated).map(normalizeArticle);
    writeFileSync(dataPath, JSON.stringify(merged, null, 2));
    mkdirSync(dirname(publicFeedPath), { recursive: true });
    writeFileSync(publicFeedPath, JSON.stringify(merged, null, 2));
    console.log(`  Total articles: ${merged.length}`);
  }

  console.log('\nFetching GitHub Trending...');
  await fetchAndSaveTrending();

  console.log('\nDone!');
  process.exit(0);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
