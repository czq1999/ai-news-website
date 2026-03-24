import { mergeArticles } from '@/scripts/merge';
import type { Article } from '@/types/article';

const makeArticle = (id: string, published_at: string): Article => ({
  id,
  title_en: `Title ${id}`,
  title_zh: `标题 ${id}`,
  summary_zh: `摘要 ${id}`,
  category: 'llm',
  source: 'Test',
  url: `https://example.com/${id}`,
  published_at,
  fetched_at: '2026-03-24T11:00:00Z',
});

describe('mergeArticles', () => {
  it('adds new articles to existing ones', () => {
    const existing = [makeArticle('old1', '2026-03-24T08:00:00Z')];
    const incoming = [makeArticle('new1', '2026-03-24T10:00:00Z')];
    const result = mergeArticles(existing, incoming);
    expect(result).toHaveLength(2);
  });

  it('deduplicates by id', () => {
    const existing = [makeArticle('dup1', '2026-03-24T08:00:00Z')];
    const incoming = [makeArticle('dup1', '2026-03-24T08:00:00Z')];
    const result = mergeArticles(existing, incoming);
    expect(result).toHaveLength(1);
  });

  it('sorts by published_at descending', () => {
    const existing = [makeArticle('a', '2026-03-24T06:00:00Z')];
    const incoming = [makeArticle('b', '2026-03-24T10:00:00Z')];
    const result = mergeArticles(existing, incoming);
    expect(result[0].id).toBe('b');
  });

  it('truncates to 500 articles maximum', () => {
    const existing = Array.from({ length: 490 }, (_, i) =>
      makeArticle(`e${i}`, '2026-03-24T08:00:00Z')
    );
    const incoming = Array.from({ length: 20 }, (_, i) =>
      makeArticle(`n${i}`, '2026-03-24T10:00:00Z')
    );
    const result = mergeArticles(existing, incoming);
    expect(result).toHaveLength(500);
  });
});
