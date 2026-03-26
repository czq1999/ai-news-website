import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article, Category } from '@/types/article';
import { CATEGORIES } from '@/lib/article-categories';
import Layout from '@/components/Layout/Layout';
import ArticleFeed from '@/components/Article/ArticleFeed';

const INITIAL_CATEGORY_ARTICLES = 12;

interface Props {
  articles: Article[];
  categoryLabel: string;
  category: Category;
}

export default function CategoryPage({ articles, categoryLabel, category }: Props) {
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

          <ArticleFeed
            initialArticles={articles}
            category={category}
            emptyMessage="这个分类下还没有文章。"
          />
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
  const { getArticlesByCategory } = await import('@/lib/articles.server');

  return {
    props: {
      articles: getArticlesByCategory(slug).slice(0, INITIAL_CATEGORY_ARTICLES),
      category: slug,
      categoryLabel: category?.label ?? slug,
    },
  };
};
