import Link from 'next/link';
import { useRouter } from 'next/router';

import { useFavorites } from '@/components/Favorites/FavoritesProvider';
import { FILTER_CATEGORIES } from '@/lib/article-categories';

interface SidebarProps {
  menuOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ menuOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { favorites } = useFavorites();
  const currentCategory =
    router.pathname === '/' ? 'all' : ((router.query.slug as string) ?? 'all');

  const isActive = (slug: string) =>
    slug === 'all' ? router.pathname === '/' : currentCategory === slug;

  return (
    <aside id="site-sidebar" className={`sidebar-drawer${menuOpen ? ' open' : ''}`}>
      <div className="sidebar-label">分类</div>

      <nav className="sidebar-nav" aria-label="文章分类">
        <Link
          href="/favorites"
          className={`sidebar-link${router.pathname === '/favorites' ? ' active' : ''}`}
          style={{ ['--sidebar-accent' as string]: '#F7C36E' }}
          onClick={onClose}
        >
          <span className="sidebar-link__label">收藏</span>
          <span className="sidebar-link__count">{favorites.length}</span>
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

        {FILTER_CATEGORIES.map((cat) => {
          const href = cat.slug === 'all' ? '/' : `/category/${cat.slug}`;
          const active = isActive(cat.slug);

          return (
            <Link
              key={cat.slug}
              href={href}
              className={`sidebar-link${active ? ' active' : ''}`}
              style={{ ['--sidebar-accent' as string]: cat.accent }}
              onClick={onClose}
            >
              {active && <span className="sidebar-link__dot" aria-hidden="true" />}
              <span className="sidebar-link__label">{cat.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
