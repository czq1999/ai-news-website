// components/Article/ArticleDetail.tsx
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';

const CATEGORY_COLORS: Record<string, string> = {
  llm:      '#6EE7F7',
  product:  '#F7C36E',
  research: '#A77BF7',
  industry: '#7BF7C0',
};

export default function ArticleDetail({ article }: { article: Article }) {
  const accentColor = CATEGORY_COLORS[article.category] ?? '#6EE7F7';

  return (
    <article style={{ maxWidth: '680px' }}>
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <CategoryBadge category={article.category} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#3A3A55',
            letterSpacing: '0.04em',
          }}
        >
          {article.source}
        </span>
        <TimeAgo dateString={article.published_at} />
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'Syne', 'Noto Sans SC', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(20px, 4vw, 26px)',
          lineHeight: 1.35,
          color: '#E8E8F0',
          margin: '0 0 32px',
          letterSpacing: '-0.02em',
        }}
      >
        {article.title_zh}
      </h1>

      {/* AI Summary block */}
      <div
        style={{
          borderRadius: '8px',
          padding: '20px 22px',
          marginBottom: '24px',
          backgroundColor: '#0F0F1A',
          borderTop:    '1px solid #1A1A2E',
          borderRight:  '1px solid #1A1A2E',
          borderBottom: '1px solid #1A1A2E',
          borderLeft:   `3px solid ${accentColor}`,
        }}
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: '#3A3A55',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          AI 摘要
        </p>
        <p
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: '15px',
            color: '#C0C0D4',
            lineHeight: '1.85',
            margin: 0,
            fontWeight: 300,
          }}
        >
          {article.summary_zh}
        </p>
      </div>

      {/* Original title */}
      <div
        style={{
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '32px',
          backgroundColor: '#0F0F1A',
          border: '1px solid #1A1A2E',
        }}
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: '#3A3A55',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          原文标题
        </p>
        <p
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: '13px',
            color: '#6B6B8A',
            margin: 0,
            lineHeight: '1.5',
          }}
        >
          {article.title_en}
        </p>
      </div>

      {/* CTA Button */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 22px',
          borderRadius: '6px',
          backgroundColor: accentColor,
          color: '#090910',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '-0.01em',
          textDecoration: 'none',
          transition: 'opacity 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.opacity = '0.88';
          el.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }}
      >
        阅读原文 →
      </a>
    </article>
  );
}
