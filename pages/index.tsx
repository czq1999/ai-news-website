import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import ArticleFeed from '@/components/Article/ArticleFeed';
import Layout from '@/components/Layout/Layout';
import SearchResults from '@/components/Search/SearchResults';
import { getRecommendedArticles, searchArticles } from '@/lib/article-search';
import SeoHead from '@/lib/seo';
import { buildWebsiteStructuredData, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import type { Article } from '@/types/article';

const INITIAL_HOME_ARTICLES = 24;

interface Props {
  initialArticles: Article[];
}

export default function Home({ initialArticles }: Props) {
  const router = useRouter();
  const query = typeof router.query.q === 'string' ? router.query.q : '';
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (query) {
      fetch(`${router.basePath}/data/articles-feed.json`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Article[]) => {
          setAllArticles(Array.isArray(data) ? data : []);
          setIsHydrated(true);
        })
        .catch(() => setIsHydrated(true));
    }
  }, [query, router.basePath]);

  const searchResults = query && isHydrated ? searchArticles(allArticles, query) : [];
  const recommended = query && isHydrated ? getRecommendedArticles(allArticles, 4) : [];

  const clearSearch = () => {
    router.push('/', undefined, { shallow: true });
  };

  return (
    <>
      <SeoHead title={`${SITE_NAME} | AI 资讯聚合`} description={SITE_DESCRIPTION} pathname="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebsiteStructuredData()).replace(/</g, '\\u003c'),
        }}
      />
      <Layout>
        {query ? (
          <SearchResults
            query={query}
            results={searchResults}
            recommendedArticles={recommended}
            onClear={clearSearch}
          />
        ) : (
          <ArticleFeed initialArticles={initialArticles} emptyMessage="暂无文章，稍后再来看看。" />
        )}
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllArticles } = await import('@/lib/articles.server');

  return {
    props: {
      initialArticles: getAllArticles().slice(0, INITIAL_HOME_ARTICLES),
    },
  };
};
