// lib/articles.ts
import articlesData from '@/data/articles.json';
import type { Article, Category } from '@/types/article';

const articles = articlesData as Article[];

export const CATEGORIES = [
  { slug: 'llm' as Category, label: '大模型' },
  { slug: 'product' as Category, label: '产品' },
  { slug: 'research' as Category, label: '研究' },
  { slug: 'industry' as Category, label: '行业' },
];

export function getAllArticles(): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getArticlesByCategory(category: Category): Article[] {
  return getAllArticles().filter(a => a.category === category);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find(a => a.id === id);
}
