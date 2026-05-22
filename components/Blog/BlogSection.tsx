import type { Blog } from '@/types/blog';

import BlogCard from './BlogCard';

const MAX_DISPLAY = 8;

interface Props {
  blogs: Blog[];
}

export default function BlogSection({ blogs }: Props) {
  const displayBlogs = blogs.slice(0, MAX_DISPLAY);

  return (
    <section className="blog-section">
      <div className="blog-section__header">
        <h2 className="blog-section__title">精选博客</h2>
        <p className="blog-section__subtitle">高质量技术博客精选</p>
      </div>

      {displayBlogs.length === 0 ? (
        <p className="blog-section__empty">暂无精选博客</p>
      ) : (
        <div className="blog-section__grid">
          {displayBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </section>
  );
}
