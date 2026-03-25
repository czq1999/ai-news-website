import { render, screen } from '@testing-library/react';
import CategoryBadge from '@/components/UI/CategoryBadge';

describe('CategoryBadge', () => {
  it('renders the correct Chinese label for llm', () => {
    render(<CategoryBadge category="llm" />);
    expect(screen.getByText('大模型')).toBeInTheDocument();
  });

  it('renders the correct label for product', () => {
    render(<CategoryBadge category="product" />);
    expect(screen.getByText('产品')).toBeInTheDocument();
  });

  it('renders the correct label for research', () => {
    render(<CategoryBadge category="research" />);
    expect(screen.getByText('研究')).toBeInTheDocument();
  });

  it('renders the correct label for industry', () => {
    render(<CategoryBadge category="industry" />);
    expect(screen.getByText('行业')).toBeInTheDocument();
  });

  it('applies blue color class for llm', () => {
    const { container } = render(<CategoryBadge category="llm" />);
    expect(container.firstChild).toHaveClass('text-blue-400');
  });

  it('applies orange color class for product', () => {
    const { container } = render(<CategoryBadge category="product" />);
    expect(container.firstChild).toHaveClass('text-orange-400');
  });

  it('applies purple color class for research', () => {
    const { container } = render(<CategoryBadge category="research" />);
    expect(container.firstChild).toHaveClass('text-purple-400');
  });

  it('applies green color class for industry', () => {
    const { container } = render(<CategoryBadge category="industry" />);
    expect(container.firstChild).toHaveClass('text-green-400');
  });
});
