import { parseTrendingProjects, mergeTrendingDay } from '@/scripts/fetch-trending';
import type { TrendingData, TrendingDay } from '@/types/trending';

const SAMPLE_HTML = `
<html><body>
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/tensorflow/tensorflow">tensorflow / tensorflow</a>
  </h2>
  <p class="col-9 color-fg-muted my-1 pr-4">An Open Source ML Framework for Everyone</p>
  <div class="f6 color-fg-muted mt-2">
    <span itemprop="programmingLanguage">Python</span>
    <a href="/tensorflow/tensorflow/stargazers" class="Link--muted d-inline-block ml-0 mr-3">185,432</a>
    <span class="d-inline-block float-sm-right"><a>1,234 stars today</a></span>
  </div>
</article>
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/microsoft/vscode">microsoft / vscode</a>
  </h2>
  <p class="col-9 color-fg-muted my-1 pr-4">Visual Studio Code</p>
  <div class="f6 color-fg-muted mt-2">
    <span itemprop="programmingLanguage">TypeScript</span>
    <a href="/microsoft/vscode/stargazers" class="Link--muted d-inline-block ml-0 mr-3">165,000</a>
    <span class="d-inline-block float-sm-right"><a>567 stars today</a></span>
  </div>
</article>
</body></html>
`;

describe('parseTrendingProjects', () => {
  it('extracts projects from GitHub trending HTML', () => {
    const projects = parseTrendingProjects(SAMPLE_HTML);
    expect(projects).toHaveLength(2);

    expect(projects[0]).toEqual({
      rank: 1,
      name: 'tensorflow/tensorflow',
      url: 'https://github.com/tensorflow/tensorflow',
      description_en: 'An Open Source ML Framework for Everyone',
      language: 'Python',
      stars_total: 185432,
      stars_today: 1234,
    });

    expect(projects[1].name).toBe('microsoft/vscode');
    expect(projects[1].language).toBe('TypeScript');
    expect(projects[1].stars_today).toBe(567);
  });

  it('returns empty array for empty HTML', () => {
    expect(parseTrendingProjects('<html></html>')).toHaveLength(0);
  });
});

describe('mergeTrendingDay', () => {
  const existing: TrendingData = {
    days: [
      { date: '2026-03-26', summary_zh: '昨日总结', projects: [] },
    ],
  };

  const newDay: TrendingDay = {
    date: '2026-03-27',
    summary_zh: '今日总结',
    projects: [],
  };

  it('prepends new day and keeps existing', () => {
    const result = mergeTrendingDay(existing, newDay);
    expect(result.days[0].date).toBe('2026-03-27');
    expect(result.days[1].date).toBe('2026-03-26');
    expect(result.days).toHaveLength(2);
  });

  it('replaces existing day with same date', () => {
    const updated: TrendingDay = { date: '2026-03-26', summary_zh: '更新版', projects: [] };
    const result = mergeTrendingDay(existing, updated);
    expect(result.days).toHaveLength(1);
    expect(result.days[0].summary_zh).toBe('更新版');
  });

  it('trims to 30 days', () => {
    const manyDays: TrendingData = {
      days: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        summary_zh: '',
        projects: [],
      })),
    };
    const extra: TrendingDay = { date: '2026-02-01', summary_zh: '', projects: [] };
    const result = mergeTrendingDay(manyDays, extra);
    expect(result.days).toHaveLength(30);
    expect(result.days[0].date).toBe('2026-02-01');
  });
});
