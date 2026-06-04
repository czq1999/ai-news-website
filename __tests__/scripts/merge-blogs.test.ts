import { mergeBlogs } from '@/scripts/merge-blogs';
import type { Blog } from '@/types/blog';

const makeBlog = (id: string, published_at: string): Blog => ({
  id,
  title_en: `Title ${id}`,
  title_zh: `标题 ${id}`,
  summary_zh: `摘要 ${id}`,
  source: 'Test',
  url: `https://example.com/${id}`,
  published_at,
  fetched_at: '2026-05-22T11:00:00Z',
  topic: 'other',
});

describe('mergeBlogs', () => {
  it('adds new blogs to existing ones', () => {
    const existing = [makeBlog('old1', '2026-05-22T08:00:00Z')];
    const incoming = [makeBlog('new1', '2026-05-22T10:00:00Z')];
    const result = mergeBlogs(existing, incoming);
    expect(result).toHaveLength(2);
  });

  it('deduplicates by id', () => {
    const existing = [makeBlog('dup1', '2026-05-22T08:00:00Z')];
    const incoming = [makeBlog('dup1', '2026-05-22T08:00:00Z')];
    const result = mergeBlogs(existing, incoming);
    expect(result).toHaveLength(1);
  });

  it('sorts by published_at descending', () => {
    const existing = [makeBlog('a', '2026-05-22T06:00:00Z')];
    const incoming = [makeBlog('b', '2026-05-22T10:00:00Z')];
    const result = mergeBlogs(existing, incoming);
    expect(result[0].id).toBe('b');
  });

  it('truncates to 200 blogs maximum', () => {
    const existing = Array.from({ length: 190 }, (_, i) =>
      makeBlog(`e${i}`, '2026-05-22T08:00:00Z')
    );
    const incoming = Array.from({ length: 20 }, (_, i) =>
      makeBlog(`n${i}`, '2026-05-22T10:00:00Z')
    );
    const result = mergeBlogs(existing, incoming);
    expect(result).toHaveLength(200);
  });

  it('returns empty array when both inputs are empty', () => {
    expect(mergeBlogs([], [])).toEqual([]);
  });

  it('preserves pinned blogs even when over the limit', () => {
    const existing = Array.from({ length: 200 }, (_, i) =>
      makeBlog(`e${i}`, '2026-05-22T08:00:00Z')
    );
    // pinned blog has older date, would normally be dropped
    const pinned = makeBlog('pinned', '2020-01-01T00:00:00Z');
    existing.push(pinned);
    const pinnedIds = new Set(['pinned']);
    const result = mergeBlogs(existing, [], pinnedIds);
    expect(result.some((b) => b.id === 'pinned')).toBe(true);
    expect(result).toHaveLength(200);
  });
});
