import { createHash } from 'crypto';

import { RawBlog, RawBlogSchema } from '@/types/blog';

export function buildBlogId(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

interface SearchResult {
  title: string;
  url: string;
  source?: string;
  date?: string;
}

export function buildBlogFromSearchResult(result: SearchResult): RawBlog | null {
  if (!result.url || !result.title) return null;

  try {
    new URL(result.url);
  } catch {
    return null;
  }

  const raw: RawBlog = {
    id: buildBlogId(result.url),
    title_en: result.title,
    source: result.source || 'Unknown',
    url: result.url,
    published_at: result.date ? new Date(result.date).toISOString() : new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  };

  const parsed = RawBlogSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

export function deduplicateBlogs(blogs: RawBlog[]): RawBlog[] {
  const seen = new Set<string>();
  return blogs.filter((blog) => {
    if (seen.has(blog.id)) return false;
    seen.add(blog.id);
    return true;
  });
}
