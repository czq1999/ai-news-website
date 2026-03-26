import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { Article } from '@/types/article';
import { getAllArticles, getArticleById } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleDetail from '@/components/Article/ArticleDetail';

interface Props {
  article: Article;
}

export default function ArticlePage({ article }: Props) {
  return (
    <>
      <Head>
        <title>{article.title_zh} | AI Signal</title>
        <meta name="description" content={article.summary_zh.slice(0, 150)} />
      </Head>
      <Layout>
        <div className="article-page">
          <Link href="/" className="back-link">
            返回首页
          </Link>
          <ArticleDetail article={article} />
        </div>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllArticles().map(article => ({ params: { slug: article.id } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const article = getArticleById(params!.slug as string);

  if (!article) {
    return { notFound: true };
  }

  return { props: { article } };
};
