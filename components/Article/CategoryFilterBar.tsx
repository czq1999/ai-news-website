import type { Category } from '@/types/article';
import { FILTER_CATEGORIES } from '@/lib/article-categories';

interface CategoryFilterBarProps {
  selectedCategories: Category[];
  totalCount: number;
  matchedCount: number;
  onSelectCategory: (category: Category) => void;
  onClear: () => void;
}

export default function CategoryFilterBar({
  selectedCategories,
  totalCount,
  matchedCount,
  onSelectCategory,
  onClear,
}: CategoryFilterBarProps) {
  const hasSelection = selectedCategories.length > 0;

  return (
    <section className="category-filter" aria-label="新闻分类筛选">
      <div className="category-filter__header">
        <div>
          <p className="category-filter__eyebrow">分类筛选</p>
          <h2 className="category-filter__title">按 AI 细分主题组合筛选新闻</h2>
        </div>
        <div className="category-filter__summary" aria-live="polite">
          <span>{hasSelection ? `已选 ${selectedCategories.length} 类` : '全部分类'}</span>
          <span>
            {matchedCount} / {totalCount} 篇
          </span>
        </div>
      </div>

      <div className="category-filter__chips">
        {FILTER_CATEGORIES.map(option => {
          const isAll = option.slug === 'all';
          const active = isAll ? !hasSelection : selectedCategories.includes(option.slug as Category);

          return (
            <button
              key={option.slug}
              type="button"
              className={`category-filter-chip${active ? ' active' : ''}`}
              style={{ ['--chip-accent' as string]: option.accent }}
              onClick={() => {
                if (isAll) {
                  onClear();
                  return;
                }

                onSelectCategory(option.slug as Category);
              }}
            >
              <span className="category-filter-chip__label">{option.label}</span>
              {!isAll && <span className="category-filter-chip__hint">可叠加</span>}
            </button>
          );
        })}
      </div>

      {hasSelection && (
        <button type="button" className="category-filter__clear" onClick={onClear}>
          清空筛选
        </button>
      )}
    </section>
  );
}
