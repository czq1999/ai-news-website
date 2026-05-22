import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import Home from '@/pages/index';
import type { Article } from '@/types/article';

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
  }),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/Layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/Article/ArticleFeed', () => ({
  __esModule: true,
  default: () => <div>feed</div>,
}));

jest.mock('@/components/Blog/BlogSection', () => ({
  __esModule: true,
  default: () => <div>blog section</div>,
}));

const article: Article = {
  id: '1',
  title_en: 'English title',
  title_zh: '中文标题',
  summary_zh: '中文摘要',
  category: 'llm',
  source: 'Source',
  url: 'https://example.com/1',
  published_at: '2026-03-24T10:00:00Z',
  fetched_at: '2026-03-24T11:00:00Z',
};

describe('Home page SEO', () => {
  it('renders title and canonical metadata through the SEO helper', () => {
    render(<Home articles={[article]} initialArticles={[article]} recentBlogs={[]} />);

    expect(screen.getByText('AI Signal | AI 资讯聚合')).toBeInTheDocument();
    expect(screen.getByText('feed')).toBeInTheDocument();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://czq1999.github.io/ai-news-website'
    );
  });
});
