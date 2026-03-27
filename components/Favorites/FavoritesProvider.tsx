import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Article } from '@/types/article';

const FAVORITES_STORAGE_KEY = 'ai-news:favorites:v1';

type FavoritesContextValue = {
  favorites: Article[];
  hydrated: boolean;
  isFavorite: (articleId: string) => boolean;
  toggleFavorite: (article: Article) => void;
  removeFavorite: (articleId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readFavorites(): Article[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Article[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(item => item && typeof item.id === 'string');
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Article[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== FAVORITES_STORAGE_KEY) {
        return;
      }

      setFavorites(readFavorites());
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      hydrated,
      isFavorite: articleId => favorites.some(article => article.id === articleId),
      toggleFavorite: article => {
        setFavorites(current => {
          const exists = current.some(item => item.id === article.id);
          if (exists) {
            return current.filter(item => item.id !== article.id);
          }

          return [article, ...current];
        });
      },
      removeFavorite: articleId => {
        setFavorites(current => current.filter(article => article.id !== articleId));
      },
      clearFavorites: () => {
        setFavorites([]);
      },
    }),
    [favorites, hydrated],
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
