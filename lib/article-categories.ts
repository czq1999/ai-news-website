import type { Category } from '@/types/article';

export const CATEGORIES: Array<{ slug: Category; label: string }> = [
  { slug: 'llm', label: '大模型' },
  { slug: 'product', label: '产品' },
  { slug: 'research', label: '研究' },
  { slug: 'industry', label: '行业' },
];
