// __tests__/scripts/fetch.test.ts
import { buildArticleId, parseRssItem } from '@/scripts/fetch';

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
    expect(result.title_en).toBe('Test Article');
    expect(result.source).toBe('TestSource');
    expect(result.url).toBe('https://example.com/test');
    expect(result.id).toMatch(/^[a-f0-9]{32}$/);
  });

  it('returns null for items without a link', () => {
    const result = parseRssItem({ title: 'No link' }, 'TestSource');
    expect(result).toBeNull();
  });
});
