import type { Category } from '@/types/article';

const CONFIG: Record<Category, { label: string; color: string; bg: string; border: string }> = {
  llm: {
    label: '大模型',
    color: '#6EE7F7',
    bg: 'rgba(110,231,247,0.08)',
    border: 'rgba(110,231,247,0.24)',
  },
  product: {
    label: '产品',
    color: '#F7C36E',
    bg: 'rgba(247,195,110,0.08)',
    border: 'rgba(247,195,110,0.24)',
  },
  research: {
    label: '研究',
    color: '#A77BF7',
    bg: 'rgba(167,123,247,0.08)',
    border: 'rgba(167,123,247,0.24)',
  },
  industry: {
    label: '行业',
    color: '#7BF7C0',
    bg: 'rgba(123,247,192,0.08)',
    border: 'rgba(123,247,192,0.24)',
  },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, color, bg, border } = CONFIG[category] ?? CONFIG.llm;

  return (
    <span
      className="category-badge"
      style={{
        color,
        backgroundColor: bg,
        border: `1px solid ${border}`,
      }}
    >
      {label}
    </span>
  );
}
