// pages/index.tsx
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article } from '@/types/article';
import { getAllArticles } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';

interface Props { articles: Article[] }

export default function Home({ articles }: Props) {
  const [featured, ...rest] = articles;

  return (
    <>
      <Head>
        <title>AI Signal — AI 资讯聚合</title>
        <meta name="description" content="每日 AI 资讯聚合，英文权威来源，中文呈现" />
      </Head>
      <Layout>
        {articles.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              padding: '64px 0',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              color: '#3A3A55',
            }}
          >
            暂无文章，等待下次更新...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Featured first article */}
            {featured && (
              <div>
                <ArticleCard article={featured} featured />
              </div>
            )}

            {/* Regular grid */}
            {rest.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                }}
              >
                {rest.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        )}
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { articles: getAllArticles() } };
};
