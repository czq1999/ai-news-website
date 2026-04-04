import Head from 'next/head';

import { buildCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

interface SeoHeadProps {
  title: string;
  description?: string;
  pathname?: string;
  ogType?: 'website' | 'article';
}

export default function SeoHead({
  title,
  description = SITE_DESCRIPTION,
  pathname = '/',
  ogType = 'website',
}: SeoHeadProps) {
  const canonicalUrl = buildCanonicalUrl(pathname);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
}
