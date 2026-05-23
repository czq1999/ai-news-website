import { createHash } from 'crypto';

import { RawBlog, RawBlogSchema } from '@/types/blog';

function canonicalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('utm_term');
    parsed.searchParams.delete('utm_content');
    parsed.searchParams.delete('ref');
    parsed.searchParams.delete('source');
    parsed.hash = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildBlogId(url: string): string {
  return createHash('md5').update(canonicalizeUrl(url)).digest('hex');
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

  let published_at: string;
  if (result.date) {
    const d = new Date(result.date);
    published_at = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } else {
    published_at = new Date().toISOString();
  }

  const raw: RawBlog = {
    id: buildBlogId(result.url),
    title_en: result.title,
    source: result.source || 'Unknown',
    url: result.url,
    published_at,
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
