import Link from 'next/link';
import { useEffect, useState } from 'react';

import ArticleCard from '@/components/Article/ArticleCard';
import BlogCard from '@/components/Blog/BlogCard';
import { useFavorites } from '@/components/Favorites/FavoritesProvider';
import Layout from '@/components/Layout/Layout';
import SeoHead from '@/lib/seo';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

type Tab = 'articles' | 'blogs';

function FavoritesContent() {
  const { favorites, blogFavorites, hydrated, clearFavorites, clearBlogFavorites } = useFavorites();
  const [activeTab, setActiveTab] = useState<Tab>('articles');

  // After hydration, switch to blogs tab if user has blog favorites but no article favorites
  useEffect(() => {
    if (!hydrated) return;
    if (favorites.length === 0 && blogFavorites.length > 0) {
      setActiveTab('blogs');
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) {
    return <p className="empty-state">正在加载收藏内容...</p>;
  }

  const total = favorites.length + blogFavorites.length;

  if (total === 0) {
    return (
      <div className="favorites-empty">
        <p className="empty-state">还没有收藏任何内容，点击卡片右上角的星标即可加入稍后读。</p>
        <div className="favorites-empty__links">
          <Link href="/" className="back-link">
            浏览新闻
          </Link>
          <Link href="/blog" className="back-link">
            浏览博客
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="favorites-page">
      <div className="favorites-tabs" role="tablist">
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'articles'}
          className={`favorites-tab${activeTab === 'articles' ? ' active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          新闻
          <span className="favorites-tab__count">{favorites.length}</span>
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === 'blogs'}
          className={`favorites-tab${activeTab === 'blogs' ? ' active' : ''}`}
          onClick={() => setActiveTab('blogs')}
        >
          博客
          <span className="favorites-tab__count">{blogFavorites.length}</span>
        </button>
      </div>

      {activeTab === 'articles' && (
        <>
          {favorites.length === 0 ? (
            <div className="favorites-empty">
              <p className="empty-state">还没有收藏任何新闻。</p>
              <Link href="/" className="back-link">
                去挑选
              </Link>
            </div>
          ) : (
            <>
              <div className="favorites-toolbar">
                <p className="mono-label">
                  已收藏 <span>{favorites.length}</span> 篇
                </p>
                <button type="button" className="favorites-clear" onClick={clearFavorites}>
                  清空新闻收藏
                </button>
              </div>
              <div className="article-grid">
                {favorites.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'blogs' && (
        <>
          {blogFavorites.length === 0 ? (
            <div className="favorites-empty">
              <p className="empty-state">还没有收藏任何博客。</p>
              <Link href="/blog" className="back-link">
                去挑选
              </Link>
            </div>
          ) : (
            <>
              <div className="favorites-toolbar">
                <p className="mono-label">
                  已收藏 <span>{blogFavorites.length}</span> 篇
                </p>
                <button type="button" className="favorites-clear" onClick={clearBlogFavorites}>
                  清空博客收藏
                </button>
              </div>
              <div className="blog-section__grid">
                {blogFavorites.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            </>
          )}
        </>
      )}
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
