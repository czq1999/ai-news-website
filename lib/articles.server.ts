import articlesData from '@/data/articles.json';
import { normalizeArticle } from '@/lib/server/article-normalizer';
import type { Article, Category } from '@/types/article';

const articles = (articlesData as Article[]).map(normalizeArticle);

export function getAllArticles(): Article[] {
  return [...articles].sort((a, b) => {
    const aTime = new Date(b.published_at).getTime() || 0;
    const bTime = new Date(a.published_at).getTime() || 0;
    return aTime - bTime;
  });
}

export function getArticlesByCategory(category: Category): Article[] {
  return getAllArticles().filter((article) => article.category === category);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find((article) => article.id === id);
}
