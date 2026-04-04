import { z } from 'zod';

export const CATEGORIES = ['llm', 'product', 'research', 'industry'] as const;

export const CategorySchema = z.enum(CATEGORIES);

export type Category = z.infer<typeof CategorySchema>;

export const RawArticleSchema = z.object({
  id: z.string(),
  title_en: z.string(),
  source: z.string(),
  url: z.string().url(),
  published_at: z.string(), // We could use z.string().datetime() if strictly ISO
  fetched_at: z.string(),
});

export type RawArticle = z.infer<typeof RawArticleSchema>;

export const ArticleSchema = RawArticleSchema.extend({
  title_zh: z.string(),
  summary_zh: z.string(),
  category: CategorySchema,
});

export type Article = z.infer<typeof ArticleSchema>;
