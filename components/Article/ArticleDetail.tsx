// components/Article/ArticleDetail.tsx
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';

export default function ArticleDetail({ article }: { article: Article }) {
  return (
    <article className="max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <CategoryBadge category={article.category} />
        <span className="text-gray-500 text-sm">{article.source}</span>
        <TimeAgo dateString={article.published_at} />
      </div>

      <h1 className="text-2xl font-bold text-[#e6edf3] leading-tight mb-6">
        {article.title_zh}
      </h1>

      <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-6 mb-6">
        <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">AI 摘要</p>
        <p className="text-[#c9d1d9] leading-relaxed">{article.summary_zh}</p>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        原文标题：<span className="text-gray-400">{article.title_en}</span>
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#58a6ff] text-[#0d1117] font-medium rounded hover:bg-[#79b8ff] transition-colors text-sm"
      >
        阅读原文 →
      </a>
    </article>
  );
}
