import { filterNewRawArticles, parseExistingArticles, parseSources } from '@/scripts/update';
import type { Article, RawArticle } from '@/types/article';

describe('parseSources', () => {
  it('parses valid source config', () => {
    const valid = {
      rss: [{ url: 'https://example.com/rss', name: 'Example' }],
      newsapi: { query: 'ai', language: 'en', pageSize: 10 },
    };
    expect(parseSources(valid)).toEqual(valid);
  });

  it('rejects invalid rss configuration', () => {
    expect(() => parseSources({ rss: 'bad', newsapi: {} })).toThrow('Invalid sources.json');
  });
});

describe('parseExistingArticles', () => {
  it('skips invalid article records without throwing', () => {
    // New implementation logs warning and filters out, doesn't throw for single items
    expect(parseExistingArticles([{ nope: true }])).toEqual([]);
  });

  it('throws if input is not an array', () => {
    expect(() => parseExistingArticles({})).toThrow('articles.json must be a JSON array');
  });
});

describe('filterNewRawArticles', () => {
  it('removes existing and duplicate raw articles', () => {
    const existing: Article[] = [
      {
        id: 'old',
        title_en: 'old',
        title_zh: '旧文',
        summary_zh: '旧摘要',
        category: 'llm',
        source: 'Source',
        url: 'https://example.com/old',
        published_at: '2026-03-24T10:00:00Z',
        fetched_at: '2026-03-24T11:00:00Z',
      },
    ];

    const raw: RawArticle[] = [
      {
        id: 'old',
        title_en: 'old',
        source: 'Source',
        url: 'https://example.com/old',
        published_at: '2026-03-24T10:00:00Z',
        fetched_at: '2026-03-24T11:00:00Z',
      },
      {
        id: 'new',
        title_en: 'new',
        source: 'Source',
        url: 'https://example.com/new',
        published_at: '2026-03-24T10:00:00Z',
        fetched_at: '2026-03-24T11:00:00Z',
      },
      {
        id: 'new',
        title_en: 'duplicate new',
        source: 'Source',
        url: 'https://example.com/new',
        published_at: '2026-03-24T10:00:00Z',
        fetched_at: '2026-03-24T11:00:00Z',
      },
    ];

    expect(filterNewRawArticles(raw, existing)).toEqual([raw[1]]);
  });
});
