import { useState } from 'react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import SeoHead from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import type { TrendingDay } from '@/types/trending';

interface Props {
  days: TrendingDay[];
}

export default function TrendingPage({ days }: Props) {
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? '');
  const current = days.find(d => d.date === selectedDate) ?? days[0];
  const recentDays = days.slice(0, 7);

  if (!current) {
    return (
      <>
        <SeoHead
          title={`热点项目 | ${SITE_NAME}`}
          description="每日 GitHub Trending 项目精选"
          pathname="/trending"
        />
        <Layout>
          <section className="category-page">
            <div className="page-heading">
              <p className="page-heading__eyebrow">GitHub</p>
              <h1 className="page-heading__title">热点项目</h1>
            </div>
            <p className="empty-state">暂无数据，稍后再来。</p>
          </section>
        </Layout>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={`热点项目 | ${SITE_NAME}`}
        description="每日 GitHub Trending 项目精选"
        pathname="/trending"
      />
      <Layout>
        <section className="category-page">
          <div className="page-heading">
            <p className="page-heading__eyebrow">GitHub</p>
            <h1 className="page-heading__title">热点项目</h1>
          </div>

          <div className="trending-summary">
            <p>{current.summary_zh}</p>
          </div>

          {recentDays.length > 1 && (
            <div className="trending-date-tabs">
              {recentDays.map(d => (
                <button
                  key={d.date}
                  type="button"
                  className={`trending-date-tab${d.date === selectedDate ? ' active' : ''}`}
                  onClick={() => setSelectedDate(d.date)}
                >
                  {d.date.slice(5)}
                </button>
              ))}
            </div>
          )}

          <ol className="trending-list">
            {current.projects.map(project => (
              <li key={project.name} className="trending-item">
                <span className="trending-item__rank">#{project.rank}</span>
                <div className="trending-item__body">
                  <div className="trending-item__meta">
                    <a
                      href={project.url}
                      className="trending-item__name"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.name}
                    </a>
                    {project.language && (
                      <span className="trending-item__lang">{project.language}</span>
                    )}
                    <span className="trending-item__stars">★ {project.stars_today.toLocaleString()} today</span>
                  </div>
                  {(project.description_zh || project.description_en) && (
                    <p className="trending-item__desc">
                      {project.description_zh || project.description_en}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getTrendingData } = await import('@/lib/trending');
  const data = getTrendingData();
  return { props: { days: data.days } };
};
