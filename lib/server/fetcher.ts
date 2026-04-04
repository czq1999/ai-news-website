import { createHash } from 'crypto';
import Parser from 'rss-parser';

import { RawArticle, RawArticleSchema } from '@/types/article';

export function buildArticleId(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

export function parseRssItem(
  item: { title?: string; link?: string; isoDate?: string },
  sourceName: string
): RawArticle | null {
  if (!item.link) return null;
  const raw = {
    id: buildArticleId(item.link),
    title_en: item.title || 'Untitled',
    source: sourceName,
    url: item.link,
    published_at: item.isoDate || new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  };
  const result = RawArticleSchema.safeParse(raw);
  if (!result.success) return null;
  return result.data;
}

export async function fetchRssSource(url: string, sourceName: string): Promise<RawArticle[]> {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL(url);
    const articles = feed.items
      .map((item) => {
        if (!item.link) return null;
        const raw = {
          id: buildArticleId(item.link),
          title_en: item.title || 'Untitled',
          source: sourceName,
          url: item.link,
          published_at: item.isoDate || new Date().toISOString(),
          fetched_at: new Date().toISOString(),
        };
        const result = RawArticleSchema.safeParse(raw);
        if (!result.success) {
          console.warn(`Invalid RSS item from ${sourceName}:`, result.error.format());
          return null;
        }
        return result.data;
      })
      .filter((a): a is RawArticle => a !== null)
      .slice(0, 20);

    return articles;
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
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&language=${encodeURIComponent(language)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`NewsAPI responded ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) {
      return [];
    }

    return data.articles
      .map(
        (a: { url?: string; title?: string; source?: { name?: string }; publishedAt?: string }) => {
          if (!a.url || !a.title) return null;
          const raw = {
            id: buildArticleId(a.url),
            title_en: a.title,
            source: a.source?.name || 'NewsAPI',
            url: a.url,
            published_at: a.publishedAt || new Date().toISOString(),
            fetched_at: new Date().toISOString(),
          };
          const result = RawArticleSchema.safeParse(raw);
          if (!result.success) {
            console.warn(`Invalid NewsAPI item:`, result.error.format());
            return null;
          }
          return result.data;
        }
      )
      .filter((a): a is RawArticle => a !== null);
  } catch (err) {
    console.error('Failed to fetch NewsAPI:', err);
    return [];
  }
}
