import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Article } from '@/types/article';
import type { Blog } from '@/types/blog';

const FAVORITES_STORAGE_KEY = 'ai-news:favorites:v1';
const BLOG_FAVORITES_STORAGE_KEY = 'ai-news:blog-favorites:v1';

type FavoritesContextValue = {
  favorites: Article[];
  blogFavorites: Blog[];
  hydrated: boolean;
  isFavorite: (articleId: string) => boolean;
  isBlogFavorite: (blogId: string) => boolean;
  toggleFavorite: (article: Article) => void;
  toggleBlogFavorite: (blog: Blog) => void;
  removeFavorite: (articleId: string) => void;
  removeBlogFavorite: (blogId: string) => void;
  clearFavorites: () => void;
  clearBlogFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readStoredFavorites<T extends { id: string }>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string');
  } catch {
    return [];
  }
}

function syncToServer(type: 'article' | 'blog', ids: string[]) {
  fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ids }),
  }).catch(() => {});
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Article[]>([]);
  const [blogFavorites, setBlogFavorites] = useState<Blog[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readStoredFavorites<Article>(FAVORITES_STORAGE_KEY));
    setBlogFavorites(readStoredFavorites<Blog>(BLOG_FAVORITES_STORAGE_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    syncToServer(
      'article',
      favorites.map((a) => a.id)
    );
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(BLOG_FAVORITES_STORAGE_KEY, JSON.stringify(blogFavorites));
    syncToServer(
      'blog',
      blogFavorites.map((b) => b.id)
    );
  }, [blogFavorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        setFavorites(readStoredFavorites<Article>(FAVORITES_STORAGE_KEY));
      } else if (event.key === BLOG_FAVORITES_STORAGE_KEY) {
        setBlogFavorites(readStoredFavorites<Blog>(BLOG_FAVORITES_STORAGE_KEY));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated]);

  const toggleFavorite = useCallback((article: Article) => {
    setFavorites((current) => {
      const exists = current.some((item) => item.id === article.id);
      return exists ? current.filter((item) => item.id !== article.id) : [article, ...current];
    });
  }, []);

  const toggleBlogFavorite = useCallback((blog: Blog) => {
    setBlogFavorites((current) => {
      const exists = current.some((item) => item.id === blog.id);
      return exists ? current.filter((item) => item.id !== blog.id) : [blog, ...current];
    });
  }, []);

  const removeFavorite = useCallback((articleId: string) => {
    setFavorites((current) => current.filter((a) => a.id !== articleId));
  }, []);

  const removeBlogFavorite = useCallback((blogId: string) => {
    setBlogFavorites((current) => current.filter((b) => b.id !== blogId));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const clearBlogFavorites = useCallback(() => {
    setBlogFavorites([]);
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      blogFavorites,
      hydrated,
      isFavorite: (articleId) => favorites.some((a) => a.id === articleId),
      isBlogFavorite: (blogId) => blogFavorites.some((b) => b.id === blogId),
      toggleFavorite,
      toggleBlogFavorite,
      removeFavorite,
      removeBlogFavorite,
      clearFavorites,
      clearBlogFavorites,
    }),
    [
      favorites,
      blogFavorites,
      hydrated,
      toggleFavorite,
      toggleBlogFavorite,
      removeFavorite,
      removeBlogFavorite,
      clearFavorites,
      clearBlogFavorites,
    ]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
