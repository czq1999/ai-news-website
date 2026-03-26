import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { Article, Category } from '@/types/article';
import ArticleCard from '@/components/Article/ArticleCard';

const HOME_BATCH_SIZE = 12;
const CATEGORY_BATCH_SIZE = 12;

interface ArticleFeedProps {
  initialArticles: Article[];
  featured?: boolean;
  category?: Category;
  emptyMessage: string;
}

export default function ArticleFeed({
  initialArticles,
  featured = false,
  category,
  emptyMessage,
}: ArticleFeedProps) {
  const router = useRouter();
  const [allArticles, setAllArticles] = useState<Article[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(initialArticles.length);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const batchSize = featured ? HOME_BATCH_SIZE : CATEGORY_BATCH_SIZE;
  const sourceArticles = allArticles ?? initialArticles;
  const visibleArticles = sourceArticles.slice(0, visibleCount);

  const { featuredArticle, regularArticles } = useMemo(() => {
    if (!featured) {
      return { featuredArticle: undefined, regularArticles: visibleArticles };
    }

    const [first, ...rest] = visibleArticles;
    return { featuredArticle: first, regularArticles: rest };
  }, [featured, visibleArticles]);

  const hasVisibleArticles = visibleArticles.length > 0;
  const hasMore = allArticles ? visibleCount < allArticles.length : true;

  async function handleLoadMore() {
    if (isLoading || !hasMore) {
      return;
    }

    if (allArticles) {
      setVisibleCount(current => Math.min(current + batchSize, allArticles.length));
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${router.basePath}/data/articles-feed.json`);
      if (!response.ok) {
        throw new Error(`Failed to load article feed: ${response.status}`);
      }

      const payload = (await response.json()) as Article[];
      const filteredArticles = category
        ? payload.filter(article => article.category === category)
        : payload;

      setAllArticles(filteredArticles);
      setVisibleCount(current => Math.min(current + batchSize, filteredArticles.length));
    } catch {
      setError('\u52A0\u8F7D\u66F4\u591A\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002');
    } finally {
      setIsLoading(false);
    }
  }

  if (!hasVisibleArticles) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <section className="home-feed">
      {featured && featuredArticle && (
        <div className="featured-slot">
          <ArticleCard article={featuredArticle} featured />
        </div>
      )}

      {regularArticles.length > 0 && (
        <div className="article-grid">
          {regularArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <div className="feed-actions">
        {hasMore && (
          <button
            type="button"
            className="load-more-button"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? '\u52A0\u8F7D\u4E2D...' : '\u52A0\u8F7D\u66F4\u591A'}
          </button>
        )}
        {error && <p className="feed-error">{error}</p>}
      </div>
    </section>
  );
}
