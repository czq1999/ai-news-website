import type { GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article } from '@/types/article';
import { getAllArticles } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';

interface Props {
  articles: Article[];
}

export default function Home({ articles }: Props) {
  const [featured, ...rest] = articles;

  return (
    <>
      <Head>
        <title>AI Signal | AI 资讯聚合</title>
        <meta name="description" content="每日 AI 资讯聚合，英文信源，中文速览。" />
      </Head>
      <Layout>
        {articles.length === 0 ? (
          <p className="empty-state">暂无文章，稍后再来看看。</p>
        ) : (
          <section className="home-feed">
            {featured && (
              <div className="featured-slot">
                <ArticleCard article={featured} featured />
              </div>
            )}

            {rest.length > 0 && (
              <div className="article-grid">
                {rest.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>
        )}
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { articles: getAllArticles() } };
};
