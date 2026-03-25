// components/Article/ArticleCard.tsx
import Link from 'next/link';
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`}>
      <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-4 hover:border-[#58a6ff]/50 hover:bg-[#1c2128] transition-colors cursor-pointer h-full flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="text-xs text-gray-500">{article.source}</span>
          <TimeAgo dateString={article.published_at} />
        </div>
        <h2 className="text-[#e6edf3] font-medium text-sm leading-snug line-clamp-2">
          {article.title_zh}
        </h2>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 flex-1">
          {article.summary_zh}
        </p>
      </div>
    </Link>
  );
}
