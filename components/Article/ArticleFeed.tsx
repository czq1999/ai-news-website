import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import ArticleCard from '@/components/Article/ArticleCard';
import CategoryFilterBar from '@/components/Article/CategoryFilterBar';
import { isCategorySlug } from '@/lib/article-categories';
import type { Article, Category } from '@/types/article';

const HOME_BATCH_SIZE = 12;
const CATEGORY_BATCH_SIZE = 12;
const FILTER_STORAGE_KEY = 'ai-news.category-filters.v1';

interface ArticleFeedProps {
  initialArticles: Article[];
  featured?: boolean;
  category?: Category;
  emptyMessage: string;
}

function readStoredCategories(): Category[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (value): value is Category => typeof value === 'string' && isCategorySlug(value)
    );
  } catch {
    return [];
  }
}

export default function ArticleFeed({
  initialArticles,
  featured = false,
  category,
  emptyMessage,
}: ArticleFeedProps) {
  const router = useRouter();
  const batchSize = featured ? HOME_BATCH_SIZE : CATEGORY_BATCH_SIZE;
  const initialVisibleCount = initialArticles.length;
  const [allArticles, setAllArticles] = useState<Article[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const feedRequestRef = useRef<Promise<Article[]> | null>(null);

  useEffect(() => {
    const storedCategories = readStoredCategories();
    setSelectedCategories(
      storedCategories.length > 0 ? storedCategories : category ? [category] : []
    );
    setIsHydrated(true);
  }, [category]);

  useEffect(() => {
    setAllArticles(null);
    setVisibleCount(initialVisibleCount);
    setIsLoadingMore(false);
    setError('');
  }, [category, initialVisibleCount, initialArticles]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      if (selectedCategories.length === 0) {
        window.localStorage.removeItem(FILTER_STORAGE_KEY);
      } else {
        window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(selectedCategories));
      }
    } catch {
      // Ignore storage failures in restricted browsers.
    }
  }, [isHydrated, selectedCategories]);

  useEffect(() => {
    let cancelled = false;

    const request = fetch(`${router.basePath}/data/articles-feed.json`).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load article feed: ${response.status}`);
      }

      return (await response.json()) as Article[];
    });

    feedRequestRef.current = request;

    request
      .then((payload) => {
        if (!cancelled) {
          setAllArticles(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('加载更多失败，请稍后重试。');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router.basePath]);

  const sourceArticles = allArticles ?? initialArticles;

  const filteredArticles = useMemo(() => {
    if (selectedCategories.length === 0) {
      return sourceArticles;
    }

    const selection = new Set(selectedCategories);
    return sourceArticles.filter((article) => selection.has(article.category));
  }, [selectedCategories, sourceArticles]);

  useEffect(() => {
    setVisibleCount(Math.min(initialVisibleCount, Math.max(filteredArticles.length, 1)));
  }, [filteredArticles.length, initialVisibleCount]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);

  const { featuredArticle, regularArticles } = useMemo(() => {
    if (!featured) {
      return { featuredArticle: undefined, regularArticles: visibleArticles };
    }

    const [first, ...rest] = visibleArticles;
    return { featuredArticle: first, regularArticles: rest };
  }, [featured, visibleArticles]);

  const hasVisibleArticles = filteredArticles.length > 0;
  const totalCount = filteredArticles.length;
  const hasMore = visibleCount < filteredArticles.length;

  function toggleCategory(categoryToToggle: Category) {
    setSelectedCategories((current) =>
      current.includes(categoryToToggle)
        ? current.filter((item) => item !== categoryToToggle)
        : [...current, categoryToToggle]
    );
  }

  function clearCategories() {
    setSelectedCategories([]);
  }

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      if (!allArticles && feedRequestRef.current) {
        await feedRequestRef.current;
      }

      setVisibleCount((current) => Math.min(current + batchSize, filteredArticles.length));
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!hasVisibleArticles) {
    return (
      <section className="home-feed">
        <CategoryFilterBar
          selectedCategories={selectedCategories}
          totalCount={sourceArticles.length}
          matchedCount={filteredArticles.length}
          onSelectCategory={toggleCategory}
          onClear={clearCategories}
        />
        <p className="empty-state">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="home-feed">
      <CategoryFilterBar
        selectedCategories={selectedCategories}
        totalCount={sourceArticles.length}
        matchedCount={filteredArticles.length}
        onSelectCategory={toggleCategory}
        onClear={clearCategories}
      />

      {featured && featuredArticle && (
        <div className="featured-slot">
          <ArticleCard article={featuredArticle} featured />
        </div>
      )}

      {regularArticles.length > 0 && (
        <div className="article-grid">
          {regularArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <div className="feed-actions">
        <p className="mono-label">
          已显示 {visibleArticles.length} / {totalCount} 篇
        </p>
        {hasMore && (
          <button
            type="button"
            className="load-more-button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? '加载中...' : '加载更多'}
          </button>
        )}
        {error && <p className="feed-error">{error}</p>}
      </div>
    </section>
  );
}
