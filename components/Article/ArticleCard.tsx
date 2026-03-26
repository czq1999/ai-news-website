// components/Article/ArticleCard.tsx
import Link from 'next/link';
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';

const CATEGORY_COLORS: Record<string, string> = {
  llm:      '#6EE7F7',
  product:  '#F7C36E',
  research: '#A77BF7',
  industry: '#7BF7C0',
};

const CATEGORY_GLOW: Record<string, string> = {
  llm:      'rgba(110,231,247,0.10)',
  product:  'rgba(247,195,110,0.10)',
  research: 'rgba(167,123,247,0.10)',
  industry: 'rgba(123,247,192,0.10)',
};

interface Props {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({ article, featured = false }: Props) {
  const accentColor = CATEGORY_COLORS[article.category] ?? '#6EE7F7';
  const glowColor   = CATEGORY_GLOW[article.category]   ?? 'rgba(110,231,247,0.10)';

  return (
    <Link href={`/article/${article.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: featured ? '14px' : '10px',
          padding: featured ? '20px 20px 18px' : '14px 14px 12px',
          borderRadius: '8px',
          backgroundColor: '#0F0F1A',
          borderTop:    '1px solid #1A1A2E',
          borderRight:  '1px solid #1A1A2E',
          borderBottom: '1px solid #1A1A2E',
          borderLeft:   `3px solid ${accentColor}`,
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(-2px)';
          el.style.boxShadow = `0 0 0 1px ${glowColor}, 0 12px 36px rgba(0,0,0,0.55)`;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <CategoryBadge category={article.category} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#3A3A55',
              letterSpacing: '0.04em',
            }}
          >
            {article.source}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <TimeAgo dateString={article.published_at} />
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: featured ? "'Syne', 'Noto Sans SC', sans-serif" : "'Noto Sans SC', sans-serif",
            fontWeight: featured ? 700 : 500,
            fontSize: featured ? '18px' : '13px',
            lineHeight: featured ? '1.45' : '1.5',
            color: '#E8E8F0',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            letterSpacing: featured ? '-0.01em' : '0',
          }}
        >
          {article.title_zh}
        </h2>

        {/* Summary */}
        <p
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: '12px',
            color: '#6B6B8A',
            lineHeight: '1.7',
            margin: 0,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: featured ? 4 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.summary_zh}
        </p>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingTop: '10px',
            borderTop: '1px solid #1A1A2E',
            marginTop: 'auto',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: accentColor,
              opacity: 0.8,
              letterSpacing: '0.04em',
            }}
          >
            阅读原文 →
          </span>
        </div>
      </div>
    </Link>
  );
}
