import { buildArticleId, parseRssItem, fetchRssSource, fetchNewsApi } from '@/scripts/fetch';

describe('buildArticleId', () => {
  it('returns consistent MD5 hash for same URL', () => {
    const id1 = buildArticleId('https://example.com/article');
    const id2 = buildArticleId('https://example.com/article');
    expect(id1).toBe(id2);
  });

  it('returns different hashes for different URLs', () => {
    const id1 = buildArticleId('https://example.com/a');
    const id2 = buildArticleId('https://example.com/b');
    expect(id1).not.toBe(id2);
  });

  it('returns a 32-character hex string', () => {
    const id = buildArticleId('https://example.com/test');
    expect(id).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe('parseRssItem', () => {
  it('converts RSS item to RawArticle', () => {
    const item = {
      title: 'Test Article',
      link: 'https://example.com/test',
      isoDate: '2026-03-24T10:00:00Z',
    };
    const result = parseRssItem(item, 'TestSource');
    expect(result).not.toBeNull();
    expect(result!.title_en).toBe('Test Article');
    expect(result!.source).toBe('TestSource');
    expect(result!.url).toBe('https://example.com/test');
    expect(result!.id).toMatch(/^[a-f0-9]{32}$/);
  });

  it('returns null for items without a link', () => {
    const result = parseRssItem({ title: 'No link' }, 'TestSource');
    expect(result).toBeNull();
  });
});

describe('fetchRssSource', () => {
  it('returns empty array when RSS feed fails', async () => {
    const result = await fetchRssSource('not-a-valid-url', 'TestSource');
    expect(result).toEqual([]);
  });
});

describe('fetchNewsApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    (global as { fetch?: typeof fetch }).fetch = undefined;
  });

  it('returns empty array when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as typeof fetch;

    const result = await fetchNewsApi('ai', 'en', 10, 'test-key');
    expect(result).toEqual([]);
  });

  it('filters out articles without url or title', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        articles: [
          {
            url: 'https://example.com/1',
            title: 'Valid Article',
            source: { name: 'Test' },
            publishedAt: '2026-03-24T10:00:00Z',
          },
          { url: null, title: 'No URL', source: { name: 'Test' } },
          { url: 'https://example.com/3', title: null, source: { name: 'Test' } },
        ],
      }),
    }) as typeof fetch;

    const result = await fetchNewsApi('ai', 'en', 10, 'test-key');
    expect(result).toHaveLength(1);
    expect(result[0].title_en).toBe('Valid Article');
  });

  it('returns empty array when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'bad key',
    }) as typeof fetch;

    const result = await fetchNewsApi('ai', 'en', 10, 'bad-key');
    expect(result).toEqual([]);
  });
});
