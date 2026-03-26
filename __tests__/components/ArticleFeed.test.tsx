import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArticleFeed from '@/components/Article/ArticleFeed';
import type { Article } from '@/types/article';

jest.mock('next/router', () => ({
  useRouter: () => ({ basePath: '/ai-news-website' }),
}));

const makeArticle = (id: string, category: Article['category'] = 'llm'): Article => ({
  id,
  title_en: `English ${id}`,
  title_zh: `中文 ${id}`,
  summary_zh: `摘要 ${id}`,
  category,
  source: 'Source',
  url: `https://example.com/${id}`,
  published_at: '2026-03-24T10:00:00Z',
  fetched_at: '2026-03-24T11:00:00Z',
});

describe('ArticleFeed', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads more articles from the feed json', async () => {
    const initialArticles = Array.from({ length: 13 }, (_, index) => makeArticle(`a${index}`));
    const allArticles = Array.from({ length: 18 }, (_, index) => makeArticle(`a${index}`));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => allArticles,
    }) as typeof fetch;

    render(<ArticleFeed initialArticles={initialArticles} featured emptyMessage="empty" />);
    fireEvent.click(screen.getByRole('button', { name: '加载更多' }));

    await waitFor(() => {
      expect(screen.getByText('已显示 18 / 18 篇')).toBeInTheDocument();
    });
  });

  it('resets state when the route data changes', async () => {
    const initialArticles = Array.from({ length: 12 }, (_, index) => makeArticle(`a${index}`, 'llm'));
    const allArticles = Array.from({ length: 16 }, (_, index) => makeArticle(`a${index}`, 'llm'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => allArticles,
    }) as typeof fetch;

    const { rerender } = render(
      <ArticleFeed initialArticles={initialArticles} category="llm" emptyMessage="empty" />
    );

    fireEvent.click(screen.getByRole('button', { name: '加载更多' }));

    await waitFor(() => {
      expect(screen.getByText('已显示 16 / 16 篇')).toBeInTheDocument();
    });

    rerender(
      <ArticleFeed
        initialArticles={[makeArticle('b0', 'product')]}
        category="product"
        emptyMessage="empty"
      />
    );

    expect(screen.getByText('已显示 1 / 1 篇')).toBeInTheDocument();
    expect(screen.queryByText('中文 a15')).not.toBeInTheDocument();
    expect(screen.getByText('中文 b0')).toBeInTheDocument();
  });
});
