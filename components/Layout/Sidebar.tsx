import Link from 'next/link';
import { useRouter } from 'next/router';

import { useFavorites } from '@/components/Favorites/FavoritesProvider';

interface SidebarProps {
  menuOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ menuOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { favorites } = useFavorites();

  return (
    <aside id="site-sidebar" className={`sidebar-drawer${menuOpen ? ' open' : ''}`}>
      <div className="sidebar-label">导航</div>

      <nav className="sidebar-nav" aria-label="主导航">
        <Link
          href="/"
          className={`sidebar-link${router.pathname === '/' ? ' active' : ''}`}
          style={{ ['--sidebar-accent' as string]: '#6EE7F7' }}
          onClick={onClose}
        >
          {router.pathname === '/' && <span className="sidebar-link__dot" aria-hidden="true" />}
          <span className="sidebar-link__label">新闻</span>
        </Link>

        <Link
          href="/blog"
          className={`sidebar-link${router.pathname === '/blog' ? ' active' : ''}`}
          style={{ ['--sidebar-accent' as string]: '#A78BFA' }}
          onClick={onClose}
        >
          {router.pathname === '/blog' && <span className="sidebar-link__dot" aria-hidden="true" />}
          <span className="sidebar-link__label">博客</span>
        </Link>

        <Link
          href="/trending"
          className={`sidebar-link${router.pathname === '/trending' ? ' active' : ''}`}
          style={{ ['--sidebar-accent' as string]: '#6EE7F7' }}
          onClick={onClose}
        >
          {router.pathname === '/trending' && (
            <span className="sidebar-link__dot" aria-hidden="true" />
          )}
          <span className="sidebar-link__label">热点项目</span>
        </Link>

        <Link
          href="/favorites"
          className={`sidebar-link${router.pathname === '/favorites' ? ' active' : ''}`}
          style={{ ['--sidebar-accent' as string]: '#F7C36E' }}
          onClick={onClose}
        >
          <span className="sidebar-link__label">收藏</span>
          <span className="sidebar-link__count">{favorites.length}</span>
        </Link>
      </nav>
    </aside>
  );
}
