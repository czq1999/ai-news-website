// pages/article/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { Article } from '@/types/article';
import { getAllArticles, getArticleById } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleDetail from '@/components/Article/ArticleDetail';

interface Props { article: Article }

export default function ArticlePage({ article }: Props) {
  return (
    <>
      <Head>
        <title>{article.title_zh} - AI Daily</title>
        <meta name="description" content={article.summary_zh.slice(0, 150)} />
      </Head>
      <Layout>
        <div className="mb-4">
          <Link href="/" className="text-[#58a6ff] text-sm hover:underline">← 返回首页</Link>
        </div>
        <ArticleDetail article={article} />
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllArticles().map(a => ({ params: { slug: a.id } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const article = getArticleById(params!.slug as string);
  if (!article) return { notFound: true };
  return { props: { article } };
};
