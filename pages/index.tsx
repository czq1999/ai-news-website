import type { GetStaticProps } from 'next';
import type { Article } from '@/types/article';
import Layout from '@/components/Layout/Layout';
import ArticleFeed from '@/components/Article/ArticleFeed';
import SeoHead from '@/lib/seo';
import { SITE_DESCRIPTION, SITE_NAME, buildWebsiteStructuredData } from '@/lib/site';

const INITIAL_HOME_ARTICLES = 13;

interface Props {
  articles: Article[];
}

export default function Home({ articles }: Props) {
  return (
    <>
      <SeoHead title={`${SITE_NAME} | AI 资讯聚合`} description={SITE_DESCRIPTION} pathname="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteStructuredData()) }}
      />
      <Layout>
        <ArticleFeed initialArticles={articles} featured emptyMessage="暂无文章，稍后再来看看。" />
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllArticles } = await import('@/lib/articles.server');
  return { props: { articles: getAllArticles().slice(0, INITIAL_HOME_ARTICLES) } };
};
