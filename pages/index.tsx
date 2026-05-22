import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import ArticleFeed from '@/components/Article/ArticleFeed';
import BlogSection from '@/components/Blog/BlogSection';
import Layout from '@/components/Layout/Layout';
import SearchResults from '@/components/Search/SearchResults';
import { getRecommendedArticles, searchArticles } from '@/lib/article-search';
import SeoHead from '@/lib/seo';
import { buildWebsiteStructuredData, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import type { Article } from '@/types/article';
import type { Blog } from '@/types/blog';

const INITIAL_HOME_ARTICLES = 13;

interface Props {
  articles: Article[];
  initialArticles: Article[];
  recentBlogs: Blog[];
}

export default function Home({ articles, initialArticles, recentBlogs }: Props) {
  const router = useRouter();
  const query = typeof router.query.q === 'string' ? router.query.q : '';
  const trimmedQuery = query.trim();

  const searchResults = useMemo(
    () => searchArticles(articles, trimmedQuery),
    [articles, trimmedQuery]
  );
  const recommendedArticles = useMemo(() => getRecommendedArticles(articles, 4), [articles]);

  return (
    <>
      <SeoHead title={`${SITE_NAME} | AI 资讯聚合`} description={SITE_DESCRIPTION} pathname="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteStructuredData()) }}
      />
      <Layout>
        {trimmedQuery ? (
          <SearchResults
            query={trimmedQuery}
            results={searchResults}
            recommendedArticles={recommendedArticles}
            onClear={() => router.push('/')}
          />
        ) : (
          <>
            <BlogSection blogs={recentBlogs} />
            <ArticleFeed
              initialArticles={initialArticles}
              featured
              emptyMessage="暂无文章，稍后再来看看。"
            />
          </>
        )}
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllArticles } = await import('@/lib/articles.server');
  const { getRecentBlogs } = await import('@/lib/blogs.server');
  const allArticles = getAllArticles();

  return {
    props: {
      articles: allArticles,
      initialArticles: allArticles.slice(0, INITIAL_HOME_ARTICLES),
      recentBlogs: getRecentBlogs(8),
    },
  };
};
