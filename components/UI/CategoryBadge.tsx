// components/UI/CategoryBadge.tsx
import type { Category } from '@/types/article';

const CONFIG: Record<Category, { label: string; className: string }> = {
  llm:      { label: '大模型', className: 'text-blue-400 bg-blue-400/10' },
  product:  { label: '产品',   className: 'text-orange-400 bg-orange-400/10' },
  research: { label: '研究',   className: 'text-purple-400 bg-purple-400/10' },
  industry: { label: '行业',   className: 'text-green-400 bg-green-400/10' },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, className } = CONFIG[category] ?? CONFIG.llm;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${className}`}>
      {label}
    </span>
  );
}
