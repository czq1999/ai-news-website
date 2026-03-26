// components/Layout/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CATEGORIES } from '@/lib/articles';

const CATEGORY_COLORS: Record<string, string> = {
  llm:      '#6EE7F7',
  product:  '#F7C36E',
  research: '#A77BF7',
  industry: '#7BF7C0',
};

export default function Sidebar() {
  const router = useRouter();
  const currentCategory =
    router.pathname === '/' ? 'all' :
    (router.query.slug as string) ?? 'all';

  const isActive = (slug: string) =>
    slug === 'all' ? router.pathname === '/' : currentCategory === slug;

  return (
    <aside style={{ width: '160px', flexShrink: 0, paddingTop: '4px' }}>
      {/* Section label */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: '#3A3A55',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          paddingLeft: '12px',
          paddingBottom: '10px',
          marginBottom: '4px',
          borderBottom: '1px solid #1A1A2E',
        }}
      >
        分类
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '6px' }}>
        {/* All */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '0 6px 6px 0',
            fontSize: '13px',
            textDecoration: 'none',
            transition: 'all 0.15s',
            fontFamily: "'Noto Sans SC', sans-serif",
            fontWeight: isActive('all') ? 500 : 400,
            color: isActive('all') ? '#E8E8F0' : '#6B6B8A',
            backgroundColor: isActive('all') ? '#0F0F1A' : 'transparent',
            borderLeft: isActive('all') ? '2px solid #6EE7F7' : '2px solid transparent',
          }}
        >
          全部
        </Link>

        {CATEGORIES.map(cat => {
          const accent = CATEGORY_COLORS[cat.slug] ?? '#6EE7F7';
          const active = isActive(cat.slug);
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '0 6px 6px 0',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all 0.15s',
                fontFamily: "'Noto Sans SC', sans-serif",
                fontWeight: active ? 500 : 400,
                color: active ? '#E8E8F0' : '#6B6B8A',
                backgroundColor: active ? '#0F0F1A' : 'transparent',
                borderLeft: active ? `2px solid ${accent}` : '2px solid transparent',
              }}
            >
              {active && (
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: accent,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${accent}`,
                  }}
                />
              )}
              {cat.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
