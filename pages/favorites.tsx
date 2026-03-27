import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';
import SeoHead from '@/lib/seo';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { useFavorites } from '@/components/Favorites/FavoritesProvider';

function FavoritesContent() {
  const { favorites, hydrated, clearFavorites } = useFavorites();

  if (!hydrated) {
    return <p className="empty-state">正在加载收藏内容...</p>;
  }

  if (favorites.length === 0) {
    return (
      <div className="favorites-empty">
        <p className="empty-state">
          还没有收藏任何新闻，点击卡片右上角的星标即可加入稍后读。
        </p>
        <Link href="/" className="back-link">
          返回首页挑选
        </Link>
      </div>
    );
  }

  return (
    <section className="favorites-page">
      <div className="favorites-toolbar">
        <p className="mono-label">
          已收藏 <span>{favorites.length}</span> 篇
        </p>
        <button type="button" className="favorites-clear" onClick={clearFavorites}>
          清空收藏
        </button>
      </div>

      <div className="article-grid">
        {favorites.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

export default function FavoritesPage() {
  return (
    <>
      <SeoHead title={`收藏 | ${SITE_NAME}`} description={SITE_DESCRIPTION} pathname="/favorites" />
      <Layout>
        <section className="category-page">
          <div className="page-heading">
            <p className="page-heading__eyebrow">稍后读</p>
            <h1 className="page-heading__title">收藏列表</h1>
          </div>

          <FavoritesContent />
        </section>
      </Layout>
    </>
  );
}
