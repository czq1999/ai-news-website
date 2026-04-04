import type { CSSProperties } from 'react';

import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';
import type { Article } from '@/types/article';

const CATEGORY_COLORS: Record<string, string> = {
  llm: '#6EE7F7',
  product: '#F7C36E',
  research: '#A77BF7',
  industry: '#7BF7C0',
};

export default function ArticleDetail({ article }: { article: Article }) {
  const accentColor = CATEGORY_COLORS[article.category] ?? '#6EE7F7';
  const sourceHost = (() => {
    try {
      return new URL(article.url).hostname.replace(/^www\./, '');
    } catch {
      return article.source;
    }
  })();

  return (
    <article
      className="article-detail"
      style={{ ['--detail-accent' as string]: accentColor } as CSSProperties}
    >
      <div className="article-detail__meta">
        <CategoryBadge category={article.category} />
        <span className="mono-label article-source">{article.source}</span>
        <TimeAgo dateString={article.published_at} />
      </div>

      <h1 className="article-detail__title">{article.title_zh}</h1>

      <section className="detail-panel detail-panel--summary">
        <p className="detail-summary-label">AI 摘要</p>
        <p className="detail-summary-text">{article.summary_zh}</p>
      </section>

      <section className="detail-panel">
        <p className="detail-section-label">原文标题</p>
        <p className="detail-original-title">{article.title_en}</p>
      </section>

      <section className="detail-panel">
        <p className="detail-section-label">来源信息</p>
        <p className="detail-original-title">来源：{article.source}</p>
        <p className="detail-original-title">域名：{sourceHost}</p>
        <p className="detail-original-title">
          发布时间：{new Date(article.published_at).toLocaleString('zh-CN', { hour12: false })}
        </p>
        <p className="detail-original-title">
          抓取时间：{new Date(article.fetched_at).toLocaleString('zh-CN', { hour12: false })}
        </p>
      </section>

      <a href={article.url} target="_blank" rel="noopener noreferrer" className="cta-button">
        阅读原文
      </a>
    </article>
  );
}
