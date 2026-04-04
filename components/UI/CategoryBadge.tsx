import { getCategoryOption } from '@/lib/article-categories';
import type { Category } from '@/types/article';

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, accent } = getCategoryOption(category);
  const backgroundColor = `${accent}14`;
  const borderColor = `${accent}3d`;

  return (
    <span
      className="category-badge"
      style={{
        color: accent,
        backgroundColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      {label}
    </span>
  );
}
