import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import BlogCard from '@/components/Blog/BlogCard';
import Layout from '@/components/Layout/Layout';
import SeoHead from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import type { Blog, BlogTopic } from '@/types/blog';

const INITIAL_BATCH = 12;
const LOAD_MORE_BATCH = 12;

const TOPIC_DISPLAY: Record<BlogTopic, { label: string; accent: string }> = {
  ai: { label: 'AI', accent: '#6EE7F7' },
  ops: { label: '运维', accent: '#F7C36E' },
  security: { label: '安全', accent: '#F77B7B' },
  other: { label: '其他', accent: '#A78BFA' },
};

const TOPIC_OPTIONS = Object.keys(TOPIC_DISPLAY) as BlogTopic[];

interface Props {
  initialBlogs: Blog[];
}

export default function BlogPage({ initialBlogs }: Props) {
  const router = useRouter();
  const [allBlogs, setAllBlogs] = useState<Blog[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<BlogTopic | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${router.basePath}/data/blogs.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<Blog[]>;
      })
      .then((data) => {
        if (!cancelled) setAllBlogs(data);
      })
      .catch(() => {
        if (!cancelled) setError('加载更多失败，请稍后重试。');
      });

    return () => {
      cancelled = true;
    };
  }, [router.basePath]);

  const sourceBlogs = allBlogs ?? initialBlogs;

  const filteredBlogs = useMemo(() => {
    if (!selectedTopic) return sourceBlogs;
    return sourceBlogs.filter((blog) => (blog.topic ?? 'other') === selectedTopic);
  }, [sourceBlogs, selectedTopic]);

  const visibleBlogs = filteredBlogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBlogs.length;

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [selectedTopic]);

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      setVisibleCount((current) => Math.min(current + LOAD_MORE_BATCH, filteredBlogs.length));
    } finally {
      setIsLoadingMore(false);
    }
  }

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const blog of sourceBlogs) {
      const topic = blog.topic ?? 'other';
      counts[topic] = (counts[topic] || 0) + 1;
    }
    return counts;
  }, [sourceBlogs]);

  return (
    <>
      <SeoHead title={`博客 | ${SITE_NAME}`} description="高质量技术博客精选" pathname="/blog" />
      <Layout>
        <section className="category-page">
          <div className="page-heading">
            <p className="page-heading__eyebrow">精选</p>
            <h1 className="page-heading__title">技术博客</h1>
          </div>

          <section className="category-filter" aria-label="博客主题筛选">
            <div className="category-filter__header">
              <div>
                <p className="category-filter__eyebrow">主题筛选</p>
                <h2 className="category-filter__title">按技术领域筛选博客</h2>
              </div>
              <div className="category-filter__summary" aria-live="polite">
                <span>
                  {selectedTopic ? `已选: ${TOPIC_DISPLAY[selectedTopic].label}` : '全部主题'}
                </span>
                <span>
                  {filteredBlogs.length} / {sourceBlogs.length} 篇
                </span>
              </div>
            </div>

            <div className="category-filter__chips">
              <button
                type="button"
                className={`category-filter-chip${!selectedTopic ? ' active' : ''}`}
                style={{ ['--chip-accent' as string]: '#6EE7F7' }}
                onClick={() => setSelectedTopic(null)}
              >
                <span className="category-filter-chip__label">全部</span>
              </button>
              {TOPIC_OPTIONS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={`category-filter-chip${selectedTopic === topic ? ' active' : ''}`}
                  style={{ ['--chip-accent' as string]: TOPIC_DISPLAY[topic].accent }}
                  onClick={() => setSelectedTopic((current) => (current === topic ? null : topic))}
                >
                  <span className="category-filter-chip__label">{TOPIC_DISPLAY[topic].label}</span>
                  <span className="category-filter-chip__hint">{topicCounts[topic] || 0}</span>
                </button>
              ))}
            </div>

            {selectedTopic && (
              <button
                type="button"
                className="category-filter__clear"
                onClick={() => setSelectedTopic(null)}
              >
                清空筛选
              </button>
            )}
          </section>

          {visibleBlogs.length > 0 ? (
            <div className="blog-section__grid">
              {visibleBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          ) : (
            <p className="empty-state">暂无博客，稍后再来。</p>
          )}

          {(hasMore || visibleBlogs.length > 0) && (
            <div className="feed-actions">
              <p className="mono-label">
                已显示 {visibleBlogs.length} / {filteredBlogs.length} 篇
              </p>
              {hasMore && (
                <button
                  type="button"
                  className="load-more-button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? '加载中...' : '加载更多'}
                </button>
              )}
              {error && <p className="feed-error">{error}</p>}
            </div>
          )}
        </section>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllBlogs } = await import('@/lib/blogs.server');
  return { props: { initialBlogs: getAllBlogs().slice(0, INITIAL_BATCH) } };
};
