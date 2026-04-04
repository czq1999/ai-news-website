import { CATEGORIES } from '@/lib/article-categories';
import type { Article } from '@/types/article';

export const SEARCH_HISTORY_KEY = 'ai-signal-search-history';
export const MAX_SEARCH_HISTORY = 8;

const CATEGORY_LABELS = new Map(CATEGORIES.map(({ slug, label }) => [slug, label]));

export function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLowerCase().trim();
}

export function splitSearchQuery(query: string) {
  return Array.from(
    new Set(
      normalizeSearchText(query)
        .split(/[\s,，。；;、/\\|]+/)
        .map((term) => term.trim())
        .filter(Boolean)
    )
  );
}

export function getCategoryLabel(category: Article['category']) {
  return CATEGORY_LABELS.get(category) ?? category;
}

export function buildArticleSearchText(article: Article) {
  return normalizeSearchText(
    [
      article.title_zh,
      article.title_en,
      article.summary_zh,
      article.source,
      getCategoryLabel(article.category),
    ]
      .join(' ')
      .replace(/\s+/g, ' ')
  );
}

function getPublishedAtScore(article: Article) {
  const publishedAt = new Date(article.published_at).getTime();
  if (Number.isNaN(publishedAt)) {
    return 0;
  }

  const diffDays = Math.max(0, (Date.now() - publishedAt) / 86_400_000);
  return Math.max(0, 30 - diffDays);
}

export function searchArticles(articles: Article[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const terms = splitSearchQuery(normalizedQuery);

  if (!normalizedQuery || terms.length === 0) {
    return [];
  }

  return articles
    .map((article) => {
      const searchableText = buildArticleSearchText(article);
      const titleText = normalizeSearchText(`${article.title_zh} ${article.title_en}`);
      const summaryText = normalizeSearchText(article.summary_zh);

      const matched = terms.every((term) => searchableText.includes(term));
      if (!matched) {
        return null;
      }

      let score = 0;

      if (titleText.includes(normalizedQuery)) {
        score += 120;
      } else if (titleText.includes(terms[0] ?? '')) {
        score += 60;
      }

      if (summaryText.includes(normalizedQuery)) {
        score += 35;
      }

      if (searchableText.startsWith(normalizedQuery)) {
        score += 20;
      }

      score += terms.reduce((total, term) => total + (searchableText.includes(term) ? 12 : 0), 0);
      score += getPublishedAtScore(article);

      return { article, score };
    })
    .filter((item): item is { article: Article; score: number } => Boolean(item))
    .sort((left, right) => right.score - left.score)
    .map((item) => item.article);
}

export function getRecommendedArticles(articles: Article[], limit = 4) {
  return [...articles]
    .sort((left, right) => {
      const leftTime = new Date(left.published_at).getTime();
      const rightTime = new Date(right.published_at).getTime();
      return rightTime - leftTime;
    })
    .slice(0, limit);
}

export function normalizeSearchHistory(history: string[]) {
  return Array.from(new Set(history.map((item) => item.trim()).filter(Boolean))).slice(
    0,
    MAX_SEARCH_HISTORY
  );
}
