import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import HeaderSearch from '@/components/Search/HeaderSearch';
import {
  getRecommendedArticles,
  normalizeSearchHistory,
  SEARCH_HISTORY_KEY,
} from '@/lib/article-search';
import type { Article } from '@/types/article';

function readSearchHistory() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawHistory = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!rawHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(rawHistory) as unknown;
    return Array.isArray(parsedHistory)
      ? normalizeSearchHistory(
          parsedHistory.filter((item): item is string => typeof item === 'string')
        )
      : [];
  } catch {
    return [];
  }
}

export default function GlobalHeaderSearch() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const query = typeof router.query.q === 'string' ? router.query.q : '';
    setValue(query);
  }, [router.query.q]);

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      try {
        const response = await fetch(`${router.basePath}/data/articles-feed.json`);
        if (!response.ok) {
          throw new Error(`Failed to load article feed: ${response.status}`);
        }

        const payload = (await response.json()) as Article[];
        if (!cancelled) {
          setArticles(payload);
        }
      } catch {
        if (!cancelled) {
          setArticles([]);
        }
      }
    }

    loadArticles();
    return () => {
      cancelled = true;
    };
  }, [router.basePath]);

  useEffect(() => {
    setHistory(readSearchHistory());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SEARCH_HISTORY_KEY) {
        setHistory(readSearchHistory());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const popularArticles = useMemo(() => getRecommendedArticles(articles, 4), [articles]);

  const persistHistory = (nextValue: string) => {
    const trimmed = nextValue.trim();
    if (!trimmed) {
      return;
    }

    setHistory((current) => {
      const normalized = normalizeSearchHistory([
        trimmed,
        ...current.filter((item) => item !== trimmed),
      ]);

      try {
        window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(normalized));
      } catch {
        // Ignore browser storage failures.
      }

      return normalized;
    });
  };

  const commitQuery = async (nextValue: string) => {
    const trimmed = nextValue.trim();
    if (trimmed) {
      persistHistory(trimmed);
    }

    await router.push(
      {
        pathname: '/',
        query: trimmed ? { q: trimmed } : {},
      },
      undefined,
      { shallow: false }
    );
  };

  return (
    <HeaderSearch
      articles={articles}
      history={history}
      popularArticles={popularArticles}
      value={value}
      onChange={setValue}
      onCommit={commitQuery}
    />
  );
}
