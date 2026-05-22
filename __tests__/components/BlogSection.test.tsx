import { render, screen } from '@testing-library/react';

import BlogSection from '@/components/Blog/BlogSection';
import type { Blog } from '@/types/blog';

const makeBlog = (id: string): Blog => ({
  id,
  title_en: `Title ${id}`,
  title_zh: `标题 ${id}`,
  summary_zh: `摘要 ${id}`,
  source: 'Test',
  url: `https://example.com/${id}`,
  published_at: '2026-05-20T10:00:00Z',
  fetched_at: '2026-05-22T08:00:00Z',
});

describe('BlogSection', () => {
  it('renders section heading', () => {
    render(<BlogSection blogs={[makeBlog('1')]} />);
    expect(screen.getByText('精选博客')).toBeInTheDocument();
  });

  it('renders blog cards', () => {
    const blogs = [makeBlog('1'), makeBlog('2')];
    render(<BlogSection blogs={blogs} />);
    expect(screen.getByText('标题 1')).toBeInTheDocument();
    expect(screen.getByText('标题 2')).toBeInTheDocument();
  });

  it('renders empty state when no blogs', () => {
    render(<BlogSection blogs={[]} />);
    expect(screen.getByText('暂无精选博客')).toBeInTheDocument();
  });

  it('renders at most 8 blogs', () => {
    const blogs = Array.from({ length: 10 }, (_, i) => makeBlog(`${i}`));
    render(<BlogSection blogs={blogs} />);
    expect(screen.getByText('标题 0')).toBeInTheDocument();
    expect(screen.getByText('标题 7')).toBeInTheDocument();
    expect(screen.queryByText('标题 8')).not.toBeInTheDocument();
  });
});
