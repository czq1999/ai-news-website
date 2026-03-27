import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Article } from '@/types/article';
import HighlightedText from '@/components/Search/HighlightedText';
import { searchArticles, splitSearchQuery } from '@/lib/article-search';

interface HeaderSearchProps {
  articles: Article[];
  history: string[];
  popularArticles: Article[];
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
}

export default function HeaderSearch({
  articles,
  history,
  popularArticles,
  value,
  onChange,
  onCommit,
}: HeaderSearchProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const query = value.trim();

  const suggestions = useMemo(() => {
    if (query) {
      return searchArticles(articles, query).slice(0, 6);
    }

    return popularArticles.slice(0, 6);
  }, [articles, popularArticles, query]);

  const shouldShowPanel = focused || Boolean(query);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSelect = (nextValue: string) => {
    const committedValue = nextValue.trim();
    onChange(committedValue);
    onCommit(committedValue);
    setFocused(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query) {
      return;
    }

    onCommit(query);
    setFocused(false);
  };

  return (
    <div className="header-search-shell" ref={shellRef}>
      <form className="header-search" role="search" onSubmit={handleSubmit}>
        <div className="header-search__field">
          <span className="header-search__icon" aria-hidden="true">
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M13 13l4 4" strokeLinecap="round" />
            </svg>
          </span>

          <input
            className="header-search__input"
            value={value}
            onChange={event => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                setFocused(false);
                event.currentTarget.blur();
              }
            }}
            placeholder="搜索 AI 新闻、关键词或来源"
            aria-label="全局关键词搜索"
            aria-autocomplete="list"
          />

          {value && (
            <button
              type="button"
              className="header-search__clear"
              onClick={() => {
                onChange('');
                onCommit('');
                setFocused(true);
              }}
              aria-label="清空搜索"
            >
              ×
            </button>
          )}
        </div>
      </form>

      {shouldShowPanel && (
        <div className="header-search__panel" id="header-search-panel" role="listbox">
          {query ? (
            <>
              <div className="header-search__section-label">实时联想</div>
              {suggestions.length > 0 ? (
                <div className="header-search__suggestions">
                  {suggestions.map(article => (
                    <button
                      type="button"
                      key={article.id}
                      className="header-search__suggestion"
                      onClick={() => handleSelect(article.title_zh)}
                    >
                      <span className="header-search__suggestion-title">
                        <HighlightedText text={article.title_zh} terms={splitSearchQuery(query)} />
                      </span>
                      <span className="header-search__suggestion-meta">{article.source}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="header-search__empty">没有匹配结果，试试更具体的关键词。</p>
              )}
            </>
          ) : (
            <>
              <div className="header-search__section">
                <div className="header-search__section-label">搜索历史</div>
                {history.length > 0 ? (
                  <div className="header-search__history">
                    {history.slice(0, 5).map(item => (
                      <button
                        type="button"
                        key={item}
                        className="header-search__history-chip"
                        onClick={() => handleSelect(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="header-search__empty">开始输入关键词，历史会保存在本地。</p>
                )}
              </div>

              <div className="header-search__section">
                <div className="header-search__section-label">热门新闻</div>
                <div className="header-search__suggestions">
                  {suggestions.map(article => (
                    <button
                      type="button"
                      key={article.id}
                      className="header-search__suggestion"
                      onClick={() => handleSelect(article.title_zh)}
                    >
                      <span className="header-search__suggestion-title">{article.title_zh}</span>
                      <span className="header-search__suggestion-meta">{article.source}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
