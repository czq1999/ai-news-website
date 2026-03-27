import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import ArticleCard from '@/components/Article/ArticleCard';
import { FavoritesProvider } from '@/components/Favorites/FavoritesProvider';
import type { Article } from '@/types/article';

function renderWithProviders(ui: ReactElement) {
  return render(<FavoritesProvider>{ui}</FavoritesProvider>);
}

const mockArticle: Article = {
  id: 'abc123',
  title_en: 'OpenAI releases GPT-5',
  title_zh: 'OpenAI 发布 GPT-5',
  summary_zh: '这是一段关于 GPT-5 发布的中文摘要内容。',
  category: 'llm',
  source: 'TechCrunch',
  url: 'https://example.com/gpt5',
  published_at: new Date(Date.now() - 7200000).toISOString(),
  fetched_at: new Date().toISOString(),
};

describe('ArticleCard', () => {
  it('renders the Chinese title', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('OpenAI 发布 GPT-5')).toBeInTheDocument();
  });

  it('renders the source name', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('TechCrunch')).toBeInTheDocument();
  });

  it('renders the Chinese summary', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />);
    expect(screen.getByText(/GPT-5 发布/)).toBeInTheDocument();
  });

  it('links to the article detail page', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/article/abc123');
  });

  it('renders the call to action text', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('阅读全文')).toBeInTheDocument();
  });
});
