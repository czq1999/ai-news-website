import type { Category } from '@/types/article';

export type CategorySlug = Category | 'all';

export interface CategoryOption {
  slug: CategorySlug;
  label: string;
  accent: string;
}

export const ARTICLE_CATEGORIES: Array<{
  slug: Category;
  label: string;
  accent: string;
}> = [
  { slug: 'llm', label: '大模型', accent: '#6EE7F7' },
  { slug: 'product', label: 'AI 应用', accent: '#F7C36E' },
  { slug: 'research', label: 'AI 研究', accent: '#A77BF7' },
  { slug: 'industry', label: '产业动态', accent: '#7BF7C0' },
];

export const CATEGORIES = ARTICLE_CATEGORIES;

export const FILTER_CATEGORIES: CategoryOption[] = [
  { slug: 'all', label: '全部', accent: '#6EE7F7' },
  ...ARTICLE_CATEGORIES,
];

export function getCategoryOption(category: CategorySlug): CategoryOption {
  if (category === 'all') {
    return FILTER_CATEGORIES[0];
  }

  return (
    ARTICLE_CATEGORIES.find((option) => option.slug === category) ?? {
      slug: 'all',
      label: '全部',
      accent: '#6EE7F7',
    }
  );
}

export function isCategorySlug(value: string): value is Category {
  return ARTICLE_CATEGORIES.some((option) => option.slug === value);
}
