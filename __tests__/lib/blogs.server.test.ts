import { getAllBlogs, getBlogById, getRecentBlogs } from '@/lib/blogs.server';

describe('getAllBlogs', () => {
  it('returns blogs sorted by published_at descending', () => {
    const result = getAllBlogs();
    for (let i = 1; i < result.length; i += 1) {
      expect(new Date(result[i - 1].published_at).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i].published_at).getTime()
      );
    }
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
