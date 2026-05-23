import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import BlogCard from '@/components/Blog/BlogCard';
import Layout from '@/components/Layout/Layout';
import SeoHead from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import type { Blog } from '@/types/blog';

const INITIAL_BATCH = 12;
const LOAD_MORE_BATCH = 12;

interface BlogTopic {
  slug: string;
  label: string;
  accent: string;
  keywords: string[];
}

const BLOG_TOPICS: BlogTopic[] = [
  {
    slug: 'ai',
    label: 'AI',
    accent: '#6EE7F7',
    keywords: [
      '大模型',
      'AI',
      'LLM',
      'Agent',
      '机器学习',
      '深度学习',
      'GPT',
      'Transformer',
      '自然语言',
      'NLP',
      'RAG',
      '微调',
      'fine-tun',
    ],
  },
  {
    slug: 'ops',
    label: '运维',
    accent: '#F7C36E',
    keywords: [
      'Linux',
      'Docker',
      'Kubernetes',
      'K8s',
      '运维',
      '服务器',
      '容器',
      '部署',
      'DevOps',
      'CI/CD',
      '监控',
      '性能调优',
    ],
  },
  {
    slug: 'security',
    label: '安全',
    accent: '#F77B7B',
    keywords: [
      'CVE',
      '安全',
      '漏洞',
      '内核',
      '补丁',
      '加固',
      '渗透',
      '攻击',
      '防护',
      '权限',
      '审计',
      '恶意',
    ],
  },
];

function matchTopic(blog: Blog): string | null {
  const text = `${blog.title_zh} ${blog.summary_zh}`.toLowerCase();
  for (const topic of BLOG_TOPICS) {
    if (topic.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return topic.slug;
    }
  }
  return null;
}

interface Props {
  initialBlogs: Blog[];
}

export default function BlogPage({ initialBlogs }: Props) {
  const router = useRouter();
  const [allBlogs, setAllBlogs] = useState<Blog[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

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

  const blogsWithTopic = useMemo(
    () => sourceBlogs.map((blog) => ({ blog, topic: matchTopic(blog) })),
    [sourceBlogs]
  );

  const filteredBlogs = useMemo(() => {
    if (!selectedTopic) return blogsWithTopic;
    return blogsWithTopic.filter((item) => item.topic === selectedTopic);
  }, [blogsWithTopic, selectedTopic]);

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
    for (const item of blogsWithTopic) {
      if (item.topic) {
        counts[item.topic] = (counts[item.topic] || 0) + 1;
      }
    }
    return counts;
  }, [blogsWithTopic]);

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
                  {selectedTopic
                    ? `已选: ${BLOG_TOPICS.find((t) => t.slug === selectedTopic)?.label}`
                    : '全部主题'}
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
              {BLOG_TOPICS.map((topic) => (
                <button
                  key={topic.slug}
                  type="button"
                  className={`category-filter-chip${selectedTopic === topic.slug ? ' active' : ''}`}
                  style={{ ['--chip-accent' as string]: topic.accent }}
                  onClick={() =>
                    setSelectedTopic((current) => (current === topic.slug ? null : topic.slug))
                  }
                >
                  <span className="category-filter-chip__label">{topic.label}</span>
                  <span className="category-filter-chip__hint">{topicCounts[topic.slug] || 0}</span>
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
              {visibleBlogs.map((item) => (
                <BlogCard key={item.blog.id} blog={item.blog} />
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
