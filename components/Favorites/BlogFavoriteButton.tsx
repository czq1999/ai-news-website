import type { Blog } from '@/types/blog';

import { useFavorites } from './FavoritesProvider';

interface BlogFavoriteButtonProps {
  blog: Blog;
}

export default function BlogFavoriteButton({ blog }: BlogFavoriteButtonProps) {
  const { hydrated, isBlogFavorite, toggleBlogFavorite } = useFavorites();
  const favorite = hydrated && isBlogFavorite(blog.id);

  return (
    <button
      type="button"
      className={`favorite-button${favorite ? ' active' : ''}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleBlogFavorite(blog);
      }}
      aria-label={favorite ? '取消收藏' : '收藏到稍后读'}
      aria-pressed={favorite}
      title={favorite ? '取消收藏' : '收藏到稍后读'}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M9 1.8l2.07 4.19 4.63.67-3.35 3.27.79 4.61L9 12.84l-4.14 2.2.79-4.61L2.3 6.66l4.63-.67L9 1.8z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
