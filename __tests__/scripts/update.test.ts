import { filterNewRawArticles, parseExistingArticles, parseSources } from '@/scripts/update';
import type { Article, RawArticle } from '@/types/article';

describe('parseSources', () => {
  it('parses valid source config', () => {
    expect(
      parseSources({
        rss: [{ url: 'https://example.com/rss', name: 'Example' }],
        newsapi: { query: 'ai', language: 'en', pageSize: 10 },
      })
    ).toEqual({
      rss: [{ url: 'https://example.com/rss', name: 'Example' }],
      newsapi: { query: 'ai', language: 'en', pageSize: 10 },
    });
  });

  it('rejects invalid rss configuration', () => {
    expect(() => parseSources({ rss: 'bad', newsapi: {} })).toThrow('sources.json must have an "rss" array');
  });
});

describe('parseExistingArticles', () => {
  it('rejects invalid article records', () => {
    expect(() => parseExistingArticles([{ nope: true }])).toThrow(
      'articles.json contains invalid article: missing or non-string id field'
    );
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
