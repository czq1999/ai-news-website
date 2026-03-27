import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ArticleFeed from '@/components/Article/ArticleFeed';
import type { Article } from '@/types/article';

jest.mock('next/router', () => ({
  useRouter: () => ({ basePath: '/ai-news-website' }),
}));

jest.mock('@/components/Favorites/FavoriteButton', () => ({
  __esModule: true,
  default: () => null,
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
    window.localStorage.clear();
  });

  it('loads more articles from the feed json', async () => {
    const initialArticles = Array.from({ length: 13 }, (_, index) => makeArticle(`a${index}`));
    const allArticles = Array.from({ length: 18 }, (_, index) => makeArticle(`a${index}`));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => allArticles,
    }) as typeof fetch;

    render(<ArticleFeed initialArticles={initialArticles} featured emptyMessage="empty" />);
    fireEvent.click(await screen.findByRole('button', { name: '加载更多' }));

    await waitFor(() => {
      expect(screen.getByText('已显示 18 / 18 篇')).toBeInTheDocument();
    });
  });

  it('restores category preferences from localStorage', async () => {
    const initialArticles = [
      makeArticle('a0', 'llm'),
      makeArticle('a1', 'product'),
      makeArticle('a2', 'research'),
    ];
    const allArticles = [...initialArticles];
    window.localStorage.setItem('ai-news.category-filters.v1', JSON.stringify(['product']));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => allArticles,
    }) as typeof fetch;

    render(<ArticleFeed initialArticles={initialArticles} emptyMessage="empty" />);

    await waitFor(() => {
      expect(screen.getByText('中文 a1')).toBeInTheDocument();
    });

    expect(screen.queryByText('中文 a0')).not.toBeInTheDocument();
    expect(
      screen.getByText('AI 应用', { selector: '.category-filter-chip__label' }).closest('button')
    ).toHaveClass('active');
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

    fireEvent.click(await screen.findByRole('button', { name: '加载更多' }));

    await waitFor(() => {
      expect(screen.getByText('已显示 16 / 16 篇')).toBeInTheDocument();
    });

    window.localStorage.removeItem('ai-news.category-filters.v1');
    rerender(
      <ArticleFeed
        initialArticles={[makeArticle('b0', 'product')]}
        category="product"
        emptyMessage="empty"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('已显示 1 / 1 篇')).toBeInTheDocument();
    });

    expect(screen.queryByText('中文 a15')).not.toBeInTheDocument();
    expect(screen.getByText('中文 b0')).toBeInTheDocument();
  });
});
