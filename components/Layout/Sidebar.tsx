// components/Layout/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CATEGORIES } from '@/lib/articles';

export default function Sidebar() {
  const router = useRouter();
  const currentCategory =
    router.pathname === '/' ? 'all' :
    (router.query.slug as string) ?? 'all';

  const isActive = (slug: string) =>
    slug === 'all' ? router.pathname === '/' : currentCategory === slug;

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-1 pt-2">
      <Link
        href="/"
        className={`px-3 py-2 rounded text-sm transition-colors ${
          isActive('all')
            ? 'bg-[#21262d] text-[#58a6ff]'
            : 'text-gray-400 hover:text-gray-200 hover:bg-[#161b22]'
        }`}
      >
        🏠 全部
      </Link>
      {CATEGORIES.map(cat => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className={`px-3 py-2 rounded text-sm transition-colors ${
            isActive(cat.slug)
              ? 'bg-[#21262d] text-[#58a6ff]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#161b22]'
          }`}
        >
          {cat.label}
        </Link>
      ))}
    </aside>
  );
}
