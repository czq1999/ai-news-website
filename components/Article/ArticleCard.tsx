import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';
import FavoriteButton from '@/components/Favorites/FavoriteButton';
import HighlightedText from '@/components/Search/HighlightedText';
import { ARTICLE_CATEGORIES } from '@/lib/article-categories';

const CATEGORY_COLOR_MAP = Object.fromEntries(
  ARTICLE_CATEGORIES.map(category => [category.slug, category.accent])
) as Record<string, string>;

interface Props {
  article: Article;
  featured?: boolean;
  highlightTerms?: string[];
}

export default function ArticleCard({ article, featured = false, highlightTerms = [] }: Props) {
  const accentColor = CATEGORY_COLOR_MAP[article.category] ?? '#6EE7F7';
  const glowColor = `${accentColor}29`;

  return (
    <div
      className="article-card-shell"
      style={
        {
          ['--card-accent' as string]: accentColor,
          ['--card-glow' as string]: glowColor,
        } as CSSProperties
      }
    >
      <Link href={`/article/${article.id}`} className="article-card-link">
        <article className={featured ? 'article-card article-card-featured' : 'article-card'}>
          <div className="article-card__meta">
            <div className="article-card__meta-left">
              <CategoryBadge category={article.category} />
              <span className="mono-label article-source">{article.source}</span>
            </div>
            <div className="article-card__meta-right">
              <TimeAgo dateString={article.published_at} />
            </div>
          </div>

          <h2 className={featured ? 'card-title-featured' : 'card-title'}>
            <HighlightedText text={article.title_zh} terms={highlightTerms} />
          </h2>

          <p className="card-summary">
            <HighlightedText text={article.summary_zh} terms={highlightTerms} />
          </p>

          <div className="article-card__footer">
            <span className="card-footer-link">阅读全文</span>
          </div>
        </article>
      </Link>
      <FavoriteButton article={article} />
    </div>
  );
}
