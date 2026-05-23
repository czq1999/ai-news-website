import type { GetStaticProps } from 'next';

import ArticleFeed from '@/components/Article/ArticleFeed';
import Layout from '@/components/Layout/Layout';
import SeoHead from '@/lib/seo';
import { buildWebsiteStructuredData, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import type { Article } from '@/types/article';

const INITIAL_HOME_ARTICLES = 24;

interface Props {
  initialArticles: Article[];
}

export default function Home({ initialArticles }: Props) {
  return (
    <>
      <SeoHead title={`${SITE_NAME} | AI 资讯聚合`} description={SITE_DESCRIPTION} pathname="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteStructuredData()) }}
      />
      <Layout>
        <ArticleFeed initialArticles={initialArticles} emptyMessage="暂无文章，稍后再来看看。" />
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
