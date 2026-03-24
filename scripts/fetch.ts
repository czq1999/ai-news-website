// scripts/fetch.ts
import { createHash } from 'crypto';
import Parser from 'rss-parser';
import type { RawArticle } from '@/types/article';

export function buildArticleId(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

export function parseRssItem(item: any, sourceName: string): RawArticle | null {
  if (!item.link) return null;
  return {
    id: buildArticleId(item.link),
    title_en: item.title || 'Untitled',
    source: sourceName,
    url: item.link,
    published_at: item.isoDate || new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  };
}

export async function fetchRssSource(
  url: string,
  sourceName: string
): Promise<RawArticle[]> {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL(url);
    return feed.items
      .map(item => parseRssItem(item, sourceName))
      .filter((a): a is RawArticle => a !== null)
      .slice(0, 20); // 每个来源最多取 20 篇
  } catch (err) {
    console.error(`Failed to fetch RSS from ${url}:`, err);
    return [];
  }
}

export async function fetchNewsApi(
  query: string,
  language: string,
  pageSize: number,
  apiKey: string
): Promise<RawArticle[]> {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NewsAPI responded ${res.status}`);
    const data = await res.json();
    return (data.articles || [])
      .filter((a: any) => a.url && a.title)
      .map((a: any) => ({
        id: buildArticleId(a.url),
        title_en: a.title,
        source: a.source?.name || 'NewsAPI',
        url: a.url,
        published_at: a.publishedAt || new Date().toISOString(),
        fetched_at: new Date().toISOString(),
      }));
  } catch (err) {
    console.error('Failed to fetch NewsAPI:', err);
    return [];
  }
}

// Entry point when run directly
if (require.main === module) {
  (async () => {
    const fs = require('fs');
    const sources = JSON.parse(fs.readFileSync('./config/sources.json', 'utf8'));
    const allRaw: RawArticle[] = [];

    for (const feed of sources.rss) {
      const articles = await fetchRssSource(feed.url, feed.name);
      allRaw.push(...articles);
      console.log(`  ${feed.name}: ${articles.length} articles`);
    }

    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      const { query, language, pageSize } = sources.newsapi;
      const newsApiArticles = await fetchNewsApi(query, language, Math.min(pageSize, 10), newsApiKey);
      allRaw.push(...newsApiArticles);
      console.log(`  NewsAPI: ${newsApiArticles.length} articles`);
    }

    fs.writeFileSync('/tmp/raw-articles.json', JSON.stringify(allRaw, null, 2));
    console.log(`Total raw: ${allRaw.length}`);
  })();
}
