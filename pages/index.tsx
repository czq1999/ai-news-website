import type { GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article } from '@/types/article';
import Layout from '@/components/Layout/Layout';
import ArticleFeed from '@/components/Article/ArticleFeed';

const INITIAL_HOME_ARTICLES = 13;

interface Props {
  articles: Article[];
}

export default function Home({ articles }: Props) {
  return (
    <>
      <Head>
        <title>AI Signal | AI 资讯聚合</title>
        <meta name="description" content="每日 AI 资讯聚合，英文信源，中文速览。" />
      </Head>
      <Layout>
        <ArticleFeed
          initialArticles={articles}
          featured
          emptyMessage="暂无文章，稍后再来看看。"
        />
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllArticles } = await import('@/lib/articles.server');
  return { props: { articles: getAllArticles().slice(0, INITIAL_HOME_ARTICLES) } };
};
