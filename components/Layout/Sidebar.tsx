import Link from 'next/link';
import { useRouter } from 'next/router';
import { CATEGORIES } from '@/lib/article-categories';

const CATEGORY_COLORS: Record<string, string> = {
  llm: '#6EE7F7',
  product: '#F7C36E',
  research: '#A77BF7',
  industry: '#7BF7C0',
};

interface SidebarProps {
  menuOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ menuOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const currentCategory =
    router.pathname === '/' ? 'all' : (router.query.slug as string) ?? 'all';

  const isActive = (slug: string) =>
    slug === 'all' ? router.pathname === '/' : currentCategory === slug;

  return (
    <aside id="site-sidebar" className={`sidebar-drawer${menuOpen ? ' open' : ''}`}>
      <div className="sidebar-label">分类</div>

      <nav className="sidebar-nav" aria-label="文章分类">
        <Link
          href="/"
          className={`sidebar-link${isActive('all') ? ' active' : ''}`}
          style={{ ['--sidebar-accent' as string]: '#6EE7F7' }}
          onClick={onClose}
        >
          <span className="sidebar-link__label">全部</span>
        </Link>

        {CATEGORIES.map(cat => {
          const accent = CATEGORY_COLORS[cat.slug] ?? '#6EE7F7';
          const active = isActive(cat.slug);

          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`sidebar-link${active ? ' active' : ''}`}
              style={{ ['--sidebar-accent' as string]: accent }}
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
