import { z } from 'zod';

export const RawBlogSchema = z.object({
  id: z.string(),
  title_en: z.string(),
  source: z.string(),
  url: z.string().url(),
  published_at: z.string(),
  fetched_at: z.string(),
});

export type RawBlog = z.infer<typeof RawBlogSchema>;

export const BLOG_TOPICS = ['ai', 'ops', 'security', 'other'] as const;
export type BlogTopic = (typeof BLOG_TOPICS)[number];

export const BlogSchema = RawBlogSchema.extend({
  title_zh: z.string(),
  summary_zh: z.string(),
  topic: z.enum(BLOG_TOPICS).default('other'),
});

export type Blog = z.infer<typeof BlogSchema>;
