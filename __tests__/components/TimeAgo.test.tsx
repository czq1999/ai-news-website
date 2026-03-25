import { render, screen } from '@testing-library/react';
import TimeAgo from '@/components/UI/TimeAgo';

describe('TimeAgo', () => {
  it('shows "刚刚" for times within a minute', () => {
    const recent = new Date(Date.now() - 30 * 1000).toISOString();
    render(<TimeAgo dateString={recent} />);
    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });

  it('shows minutes ago', () => {
    const ago = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(<TimeAgo dateString={ago} />);
    expect(screen.getByText('5分钟前')).toBeInTheDocument();
  });

  it('shows hours ago', () => {
    const ago = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    render(<TimeAgo dateString={ago} />);
    expect(screen.getByText('3小时前')).toBeInTheDocument();
  });

  it('shows days ago', () => {
    const ago = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    render(<TimeAgo dateString={ago} />);
    expect(screen.getByText('2天前')).toBeInTheDocument();
  });

  it('shows "未知时间" for invalid date string', () => {
    render(<TimeAgo dateString="not-a-date" />);
    expect(screen.getByText('未知时间')).toBeInTheDocument();
  });
});
