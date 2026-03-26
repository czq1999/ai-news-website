// components/UI/CategoryBadge.tsx
import type { Category } from '@/types/article';

const CONFIG: Record<Category, { label: string; color: string; bg: string; border: string }> = {
  llm:      { label: '大模型', color: '#6EE7F7', bg: 'rgba(110,231,247,0.07)', border: 'rgba(110,231,247,0.25)' },
  product:  { label: '产品',   color: '#F7C36E', bg: 'rgba(247,195,110,0.07)', border: 'rgba(247,195,110,0.25)' },
  research: { label: '研究',   color: '#A77BF7', bg: 'rgba(167,123,247,0.07)', border: 'rgba(167,123,247,0.25)' },
  industry: { label: '行业',   color: '#7BF7C0', bg: 'rgba(123,247,192,0.07)', border: 'rgba(123,247,192,0.25)' },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, color, bg, border } = CONFIG[category] ?? CONFIG.llm;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: '3px',
        color,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        letterSpacing: '0.04em',
        lineHeight: '1.6',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}
