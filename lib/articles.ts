import iconv from 'iconv-lite';
import articlesData from '@/data/articles.json';
import type { Article, Category } from '@/types/article';

const SUSPICIOUS_FRAGMENTS = [
  '鍒氬垰',
  '鍙戝竷',
  '鎽樿',
  '鏆傛棤',
  '闃呰',
  '鍘熸枃',
  '鍒嗙被',
  '鏍囬',
  '淇冮攢',
  '浼樻儬',
  '鐮旂┒',
  '琛屼笟',
  '澶фā鍨',
];

export function normalizeChineseText(value: string): string {
  if (!value || !SUSPICIOUS_FRAGMENTS.some(fragment => value.includes(fragment))) {
    return value;
  }

  try {
    const repaired = iconv.decode(iconv.encode(value, 'gb18030'), 'utf8').trim();
    return repaired || value;
  } catch {
    return value;
  }
}

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    title_zh: normalizeChineseText(article.title_zh),
    summary_zh: normalizeChineseText(article.summary_zh),
  };
}

const articles = (articlesData as Article[]).map(normalizeArticle);

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
  return articles.find(article => article.id === id);
}
