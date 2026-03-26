import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article, Category } from '@/types/article';
import { getArticlesByCategory, CATEGORIES } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';

interface Props {
  articles: Article[];
  categoryLabel: string;
}

export default function CategoryPage({ articles, categoryLabel }: Props) {
  return (
    <>
      <Head>
        <title>{categoryLabel} | AI Signal</title>
      </Head>
      <Layout>
        <section className="category-page">
          <div className="page-heading">
            <p className="page-heading__eyebrow">分类浏览</p>
            <h1 className="page-heading__title">{categoryLabel}</h1>
          </div>

          {articles.length === 0 ? (
            <p className="empty-state">这个分类下还没有文章。</p>
          ) : (
            <div className="article-grid">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CATEGORIES.map(category => ({ params: { slug: category.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as Category;
  const category = CATEGORIES.find(item => item.slug === slug);

  return {
    props: {
      articles: getArticlesByCategory(slug),
      categoryLabel: category?.label ?? slug,
    },
  };
};
