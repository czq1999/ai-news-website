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

  it('applies the configured accent color for llm', () => {
    render(<CategoryBadge category="llm" />);
    expect(screen.getByText('大模型')).toHaveStyle({ color: '#6EE7F7' });
  });
});
