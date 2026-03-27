import type { Article } from '@/types/article';
import ArticleCard from '@/components/Article/ArticleCard';
import { splitSearchQuery } from '@/lib/article-search';

interface SearchResultsProps {
  query: string;
  results: Article[];
  recommendedArticles: Article[];
  onClear: () => void;
}

export default function SearchResults({
  query,
  results,
  recommendedArticles,
  onClear,
}: SearchResultsProps) {
  const terms = splitSearchQuery(query);

  if (!query.trim()) {
    return null;
  }

  return (
    <section className="search-results">
      <div className="page-heading">
        <p className="page-heading__eyebrow">全局搜索</p>
        <h1 className="page-heading__title">“{query}” 的搜索结果</h1>
      </div>

      <div className="search-results__toolbar">
        <p className="search-results__count">
          共找到 <strong>{results.length}</strong> 条结果
        </p>
        <button type="button" className="search-results__clear" onClick={onClear}>
          清空搜索
        </button>
      </div>

      {results.length > 0 ? (
        <div className="search-results__grid">
          {results.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              featured={index === 0}
              highlightTerms={terms}
            />
          ))}
        </div>
      ) : (
        <div className="search-results__empty">
          <p className="empty-state">没有找到相关结果，先看看这些热门新闻。</p>
          <div className="search-results__recommendations">
            {recommendedArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} featured={index === 0} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
