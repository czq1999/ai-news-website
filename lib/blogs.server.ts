import blogsData from '@/data/blogs.json';
import { Blog, BlogSchema } from '@/types/blog';

const blogs: Blog[] = (Array.isArray(blogsData) ? blogsData : [])
  .map((item) => BlogSchema.safeParse(item))
  .filter((r): r is { success: true; data: Blog } => r.success)
  .map((r) => r.data);

export function getAllBlogs(): Blog[] {
  return [...blogs].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getRecentBlogs(count: number): Blog[] {
  return getAllBlogs().slice(0, count);
}

export function getBlogById(id: string): Blog | undefined {
  return blogs.find((blog) => blog.id === id);
}
