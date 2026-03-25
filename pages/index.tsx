// pages/index.tsx
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article } from '@/types/article';
import { getAllArticles } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';

interface Props { articles: Article[] }

export default function Home({ articles }: Props) {
  return (
    <>
      <Head>
        <title>AI Daily - AI 资讯聚合</title>
        <meta name="description" content="每日 AI 资讯聚合，英文权威来源，中文呈现" />
      </Head>
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {articles.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-16">暂无文章，等待下次更新...</p>
          )}
        </div>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { articles: getAllArticles() } };
};
