import { getAllBlogs, getBlogById, getRecentBlogs } from '@/lib/blogs.server';

// Mock the data import to provide test data
jest.mock('@/data/blogs.json', () => [
  {
    id: 'blog-old',
    title_en: 'Old Blog',
    title_zh: '旧博客',
    summary_zh: '旧摘要',
    source: 'Test',
    url: 'https://example.com/old',
    published_at: '2026-05-01T10:00:00Z',
    fetched_at: '2026-05-22T08:00:00Z',
  },
  {
    id: 'blog-new',
    title_en: 'New Blog',
    title_zh: '新博客',
    summary_zh: '新摘要',
    source: 'Test',
    url: 'https://example.com/new',
    published_at: '2026-05-22T10:00:00Z',
    fetched_at: '2026-05-22T08:00:00Z',
  },
]);

describe('getAllBlogs', () => {
  it('returns blogs sorted by published_at descending', () => {
    const result = getAllBlogs();
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i += 1) {
      expect(new Date(result[i - 1].published_at).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i].published_at).getTime()
      );
    }
  });

  it('returns newest blog first', () => {
    const result = getAllBlogs();
    expect(result[0].id).toBe('blog-new');
  });
});

describe('getRecentBlogs', () => {
  it('returns the specified number of blogs', () => {
    const result = getRecentBlogs(3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('returns all blogs if count exceeds total', () => {
    const all = getAllBlogs();
    const result = getRecentBlogs(999);
    expect(result.length).toBe(all.length);
  });
});

describe('getBlogById', () => {
  it('returns the blog with matching id', () => {
    const all = getAllBlogs();
    if (all.length > 0) {
      expect(getBlogById(all[0].id)?.id).toBe(all[0].id);
    }
  });

  it('returns undefined for missing id', () => {
    expect(getBlogById('nonexistent')).toBeUndefined();
  });
});
