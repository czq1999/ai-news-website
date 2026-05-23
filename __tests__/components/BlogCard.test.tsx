import { render, screen } from '@testing-library/react';

import BlogCard from '@/components/Blog/BlogCard';
import type { Blog } from '@/types/blog';

const mockBlog: Blog = {
  id: 'test123',
  title_en: 'How to Build AI Agents',
  title_zh: '如何构建 AI Agent',
  summary_zh:
    '本文介绍了构建 AI Agent 的核心技术和最佳实践，涵盖工具调用、记忆管理和多步推理等关键概念。',
  source: 'AI Blog',
  url: 'https://example.com/ai-agents',
  published_at: '2026-05-20T10:00:00Z',
  fetched_at: '2026-05-22T08:00:00Z',
  topic: 'ai',
};

describe('BlogCard', () => {
  it('renders blog title in Chinese', () => {
    render(<BlogCard blog={mockBlog} />);
    expect(screen.getByText('如何构建 AI Agent')).toBeInTheDocument();
  });

  it('renders blog summary', () => {
    render(<BlogCard blog={mockBlog} />);
    expect(screen.getByText(/本文介绍了构建 AI Agent/)).toBeInTheDocument();
  });

  it('renders source name', () => {
    render(<BlogCard blog={mockBlog} />);
    expect(screen.getByText('AI Blog')).toBeInTheDocument();
  });

  it('links to original article', () => {
    render(<BlogCard blog={mockBlog} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/ai-agents');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
