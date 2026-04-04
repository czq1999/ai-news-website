import type { Article } from '@/types/article';

export const SITE_NAME = 'AI Signal';
export const SITE_DESCRIPTION = '每日聚合 AI 资讯，追踪大模型、产品更新、研究进展与行业动态。';
export const SITE_ORIGIN = 'https://czq1999.github.io';
export const SITE_BASE_PATH = '/ai-news-website';
export const SITE_URL = `${SITE_ORIGIN}${SITE_BASE_PATH}`;

export function buildCanonicalUrl(pathname = '/'): string {
  const normalizedPath = pathname === '/' ? '' : pathname;
  return `${SITE_URL}${normalizedPath}`;
}

export function buildArticleStructuredData(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title_zh,
    alternativeHeadline: article.title_en,
    description: article.summary_zh,
    datePublished: article.published_at,
    dateModified: article.fetched_at,
    mainEntityOfPage: buildCanonicalUrl(`/article/${article.id}`),
    url: article.url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    author: {
      '@type': 'Organization',
      name: article.source,
    },
  };
}

export function buildWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    inLanguage: 'zh-CN',
  };
}
