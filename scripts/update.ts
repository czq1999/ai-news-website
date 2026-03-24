// scripts/update.ts
// Main entry point for GitHub Actions: fetch → translate → merge → write
import { fetchRssSource, fetchNewsApi } from './fetch';
import { translateArticles } from './translate';
import { mergeArticles } from './merge';
import type { Article, RawArticle } from '@/types/article';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

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

function parseSources(raw: unknown): SourcesConfig {
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

function parseExistingArticles(raw: unknown): Article[] {
  if (!Array.isArray(raw)) {
    throw new Error('articles.json must be a JSON array');
  }
  for (const item of raw) {
    if (typeof item !== 'object' || item === null || typeof (item as Record<string, unknown>).id !== 'string') {
      throw new Error('articles.json contains invalid article: missing or non-string id field');
    }
  }
  return raw as Article[];
}

async function main() {
  const sourcesPath = join(process.cwd(), 'config/sources.json');
  const dataPath = join(process.cwd(), 'data/articles.json');

  const sources = parseSources(JSON.parse(readFileSync(sourcesPath, 'utf8')));

  // Step 1: Fetch
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

  // Deduplicate raw articles by id before translating
  const existing: Article[] = parseExistingArticles(JSON.parse(readFileSync(dataPath, 'utf8')));
  const existingIds = new Set(existing.map(a => a.id));
  const newRaw = allRaw.filter(a => !existingIds.has(a.id));
  console.log(`\nNew articles to translate: ${newRaw.length}`);

  if (newRaw.length === 0) {
    console.log('No new articles. Exiting.');
    process.exit(0);
  }

  // Step 2: Translate
  console.log('\nTranslating...');
  const translated = translateArticles(newRaw);
  console.log(`  Translated: ${translated.length}/${newRaw.length}`);

  if (translated.length === 0) {
    console.error('Translation failed: no articles were translated. Exiting.');
    process.exit(1);
  }

  // Step 3: Merge
  console.log('\nMerging...');
  const merged = mergeArticles(existing, translated);
  writeFileSync(dataPath, JSON.stringify(merged, null, 2));
  console.log(`  Total articles: ${merged.length}`);

  console.log('\nDone!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
