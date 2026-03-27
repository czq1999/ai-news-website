import Link from 'next/link';
import { useRouter } from 'next/router';
import { useFavorites } from '@/components/Favorites/FavoritesProvider';
import GlobalHeaderSearch from '@/components/Search/GlobalHeaderSearch';

interface HeaderProps {
  onToggleMenu: () => void;
  menuOpen: boolean;
}

export default function Header({ onToggleMenu, menuOpen }: HeaderProps) {
  const router = useRouter();
  const { favorites } = useFavorites();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button
          type="button"
          className="hamburger-btn"
          onClick={onToggleMenu}
          aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={menuOpen}
          aria-controls="site-sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>

        <Link href="/" className="brand-link">
          <span className="brand-wordmark">
            AI <span>SIGNAL</span>
          </span>
          <span className="pulse-dot" />
        </Link>

        <div className="header-meta">
          <span className="header-meta-text">AI 新闻聚合</span>
          <Link
            href="/favorites"
            className={`header-meta-link${router.pathname === '/favorites' ? ' active' : ''}`}
          >
            收藏 <span>{favorites.length}</span>
          </Link>
          <div className="header-actions">
            <GlobalHeaderSearch />
          </div>
        </div>
      </div>
    </header>
  );
}
