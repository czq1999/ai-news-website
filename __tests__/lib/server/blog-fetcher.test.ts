import { buildBlogFromSearchResult, deduplicateBlogs } from '@/lib/server/blog-fetcher';
import type { RawBlog } from '@/types/blog';

describe('buildBlogFromSearchResult', () => {
  it('builds a RawBlog from a search result', () => {
    const result = buildBlogFromSearchResult({
      title: 'How to Build AI Agents',
      url: 'https://blog.example.com/ai-agents',
      source: 'Example Blog',
      date: '2026-05-20',
    });

    expect(result).toMatchObject({
      title_en: 'How to Build AI Agents',
      source: 'Example Blog',
      url: 'https://blog.example.com/ai-agents',
    });
    expect(result!.id).toBeDefined();
    expect(result!.fetched_at).toBeDefined();
  });

  it('returns null for invalid URL', () => {
    const result = buildBlogFromSearchResult({
      title: 'Test',
      url: 'not-a-url',
      source: 'Test',
    });
    expect(result).toBeNull();
  });

  it('uses "Unknown" as default source when not provided', () => {
    const result = buildBlogFromSearchResult({
      title: 'Test Article',
      url: 'https://example.com/test',
    });
    expect(result?.source).toBe('Unknown');
  });
});

describe('deduplicateBlogs', () => {
  it('removes duplicates by id', () => {
    const blogs: RawBlog[] = [
      {
        id: '1',
        title_en: 'Title 1',
        source: 'A',
        url: 'https://example.com/1',
        published_at: '2026-05-20T00:00:00Z',
        fetched_at: '2026-05-20T00:00:00Z',
      },
      {
        id: '1',
        title_en: 'Title 1 dup',
        source: 'B',
        url: 'https://example.com/1',
        published_at: '2026-05-20T00:00:00Z',
        fetched_at: '2026-05-20T00:00:00Z',
      },
      {
        id: '2',
        title_en: 'Title 2',
        source: 'A',
        url: 'https://example.com/2',
        published_at: '2026-05-19T00:00:00Z',
        fetched_at: '2026-05-20T00:00:00Z',
      },
    ];

    const result = deduplicateBlogs(blogs);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateBlogs([])).toEqual([]);
  });
});
