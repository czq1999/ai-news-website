// pages/category/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article, Category } from '@/types/article';
import { getArticlesByCategory, CATEGORIES } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';

interface Props { articles: Article[]; categoryLabel: string }

export default function CategoryPage({ articles, categoryLabel }: Props) {
  return (
    <>
      <Head>
        <title>{categoryLabel} - AI Daily</title>
      </Head>
      <Layout>
        <h1 className="text-lg font-semibold text-[#e6edf3] mb-4">{categoryLabel}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {articles.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-16">暂无文章</p>
          )}
        </div>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CATEGORIES.map(c => ({ params: { slug: c.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string as Category;
  const cat = CATEGORIES.find(c => c.slug === slug);
  return {
    props: {
      articles: getArticlesByCategory(slug),
      categoryLabel: cat?.label ?? slug,
    },
  };
};
