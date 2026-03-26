import type { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import type { Article } from '@/types/article';
import Layout from '@/components/Layout/Layout';
import ArticleDetail from '@/components/Article/ArticleDetail';
import SeoHead from '@/lib/seo';
import { buildArticleStructuredData } from '@/lib/site';

interface Props {
  article: Article;
}

export default function ArticlePage({ article }: Props) {
  return (
    <>
      <SeoHead
        title={`${article.title_zh} | AI Signal`}
        description={article.summary_zh.slice(0, 150)}
        pathname={`/article/${article.id}`}
        ogType="article"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleStructuredData(article)) }}
      />
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
  paths: (await import('@/lib/articles.server')).getAllArticles().map(article => ({
    params: { slug: article.id },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const { getArticleById } = await import('@/lib/articles.server');
  const article = getArticleById(params!.slug as string);

  if (!article) {
    return { notFound: true };
  }

  return { props: { article } };
};
