import TimeAgo from '@/components/UI/TimeAgo';
import type { Blog } from '@/types/blog';

interface Props {
  blog: Blog;
}

export default function BlogCard({ blog }: Props) {
  return (
    <a href={blog.url} target="_blank" rel="noopener noreferrer" className="blog-card">
      <div className="blog-card__header">
        <span className="blog-card__source mono-label">{blog.source}</span>
        <span className="blog-card__date mono-label">{blog.published_at.slice(0, 10)}</span>
        <TimeAgo dateString={blog.published_at} />
      </div>

      <h3 className="blog-card__title">{blog.title_zh}</h3>

      <p className="blog-card__summary">{blog.summary_zh}</p>

      <div className="blog-card__footer">
        <span className="blog-card__link">阅读原文 →</span>
      </div>
    </a>
  );
}
