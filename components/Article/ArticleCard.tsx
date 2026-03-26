import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';

const CATEGORY_COLORS: Record<string, string> = {
  llm: '#6EE7F7',
  product: '#F7C36E',
  research: '#A77BF7',
  industry: '#7BF7C0',
};

const CATEGORY_GLOW: Record<string, string> = {
  llm: 'rgba(110,231,247,0.16)',
  product: 'rgba(247,195,110,0.16)',
  research: 'rgba(167,123,247,0.16)',
  industry: 'rgba(123,247,192,0.16)',
};

interface Props {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: Props) {
  const accentColor = CATEGORY_COLORS[article.category] ?? '#6EE7F7';
  const glowColor = CATEGORY_GLOW[article.category] ?? 'rgba(110,231,247,0.16)';

  return (
    <Link
      href={`/article/${article.id}`}
      className="article-card-link"
      style={
        {
          ['--card-accent' as string]: accentColor,
          ['--card-glow' as string]: glowColor,
        } as CSSProperties
      }
    >
      <article className={featured ? 'article-card article-card-featured' : 'article-card'}>
        <div className="article-card__meta">
          <div className="article-card__meta-left">
            <CategoryBadge category={article.category} />
            <span className="mono-label article-source">{article.source}</span>
          </div>
          <TimeAgo dateString={article.published_at} />
        </div>

        <h2 className={featured ? 'card-title-featured' : 'card-title'}>{article.title_zh}</h2>

        <p className="card-summary">{article.summary_zh}</p>

        <div className="article-card__footer">
          <span className="card-footer-link">阅读全文</span>
        </div>
      </article>
    </Link>
  );
}
