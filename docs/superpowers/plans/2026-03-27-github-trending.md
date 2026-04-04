# GitHub Trending 功能 + 移除安全治理分类 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除 `safety` 分类，新增每日 GitHub Trending 自动抓取页面，含 AI 总结 + 项目列表，侧边栏与 Header 均有导航入口。

**Architecture:** 新增 `scripts/fetch-trending.ts` 抓取并翻译 GitHub Trending HTML，结果写入 `data/trending.json`（保留最近 30 天），并入 `npm run update` 流程；`lib/trending.ts` 在构建时读取 JSON，`pages/trending.tsx` 通过 `getStaticProps` 静态生成页面。

**Tech Stack:** Next.js 14 (Pages Router), TypeScript, cheerio (HTML 解析), DeepSeek API, ts-node, Jest

---

## 文件变更清单

| 文件                                       | 操作                                              |
| ------------------------------------------ | ------------------------------------------------- |
| `types/article.ts`                         | 修改：删除 `'safety'`                             |
| `lib/article-categories.ts`                | 修改：删除 safety 条目                            |
| `__tests__/lib/articles.test.ts`           | 修改：更新 CATEGORIES 期望值                      |
| `types/trending.ts`                        | 新增                                              |
| `data/trending.json`                       | 新增（空种子文件）                                |
| `lib/trending.ts`                          | 新增                                              |
| `__tests__/lib/trending.test.ts`           | 新增                                              |
| `scripts/fetch-trending.ts`                | 新增                                              |
| `__tests__/scripts/fetch-trending.test.ts` | 新增                                              |
| `scripts/update.ts`                        | 修改：移除早期退出，末尾调用 fetchAndSaveTrending |
| `pages/trending.tsx`                       | 新增                                              |
| `styles/globals.css`                       | 修改：新增 trending 相关样式                      |
| `components/Layout/Sidebar.tsx`            | 修改：新增热点项目入口                            |
| `components/Layout/Header.tsx`             | 修改：新增热点项目链接                            |

---

## Task 1: 移除 safety 分类

**Files:**

- Modify: `types/article.ts`
- Modify: `lib/article-categories.ts`
- Modify: `__tests__/lib/articles.test.ts`

- [ ] **Step 1: 更新 types/article.ts**

将第 1 行从：

```ts
export type Category = 'llm' | 'product' | 'research' | 'industry' | 'safety';
```

改为：

```ts
export type Category = 'llm' | 'product' | 'research' | 'industry';
```

- [ ] **Step 2: 更新 lib/article-categories.ts**

删除 `ARTICLE_CATEGORIES` 数组中的 safety 条目，整个数组改为：

```ts
export const ARTICLE_CATEGORIES: Array<{
  slug: Category;
  label: string;
  accent: string;
}> = [
  { slug: 'llm', label: '大模型', accent: '#6EE7F7' },
  { slug: 'product', label: 'AI 应用', accent: '#F7C36E' },
  { slug: 'research', label: 'AI 研究', accent: '#A77BF7' },
  { slug: 'industry', label: '产业动态', accent: '#7BF7C0' },
];
```

- [ ] **Step 3: 更新 **tests**/lib/articles.test.ts**

将 `describe('CATEGORIES', ...)` 中的期望值从（包含 safety）改为：

```ts
describe('CATEGORIES', () => {
  it('contains all categories with labels and accents', () => {
    expect(CATEGORIES).toEqual([
      { slug: 'llm', label: '大模型', accent: '#6EE7F7' },
      { slug: 'product', label: 'AI 应用', accent: '#F7C36E' },
      { slug: 'research', label: 'AI 研究', accent: '#A77BF7' },
      { slug: 'industry', label: '产业动态', accent: '#7BF7C0' },
    ]);
  });
});
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx jest __tests__/lib/articles.test.ts --no-coverage
```

Expected: 所有测试 PASS

- [ ] **Step 5: Commit**

```bash
git add types/article.ts lib/article-categories.ts __tests__/lib/articles.test.ts
git commit -m "feat: remove safety category"
```

---

## Task 2: 新增 trending 类型文件 + 空种子数据

**Files:**

- Create: `types/trending.ts`
- Create: `data/trending.json`

- [ ] **Step 1: 创建 types/trending.ts**

```ts
export interface TrendingProject {
  rank: number;
  name: string;
  url: string;
  description_en: string;
  description_zh: string;
  language: string;
  stars_total: number;
  stars_today: number;
}

export interface TrendingDay {
  date: string; // YYYY-MM-DD
  summary_zh: string;
  projects: TrendingProject[];
}

export interface TrendingData {
  days: TrendingDay[];
}
```

- [ ] **Step 2: 创建 data/trending.json 空种子文件**

```json
{
  "days": []
}
```

- [ ] **Step 3: Commit**

```bash
git add types/trending.ts data/trending.json
git commit -m "feat: add trending types and seed data file"
```

---

## Task 3: 创建 lib/trending.ts（TDD）

**Files:**

- Create: `__tests__/lib/trending.test.ts`
- Create: `lib/trending.ts`

- [ ] **Step 1: 编写失败测试 **tests**/lib/trending.test.ts**

```ts
import type { TrendingData } from '@/types/trending';

const mockData: TrendingData = {
  days: [
    {
      date: '2026-03-27',
      summary_zh: '今日热点以 AI 推理框架为主。',
      projects: [
        {
          rank: 1,
          name: 'owner/repo',
          url: 'https://github.com/owner/repo',
          description_en: 'A great repo',
          description_zh: '一个很棒的仓库',
          language: 'Python',
          stars_total: 1000,
          stars_today: 100,
        },
      ],
    },
    {
      date: '2026-03-26',
      summary_zh: '昨日热点总结。',
      projects: [],
    },
  ],
};

jest.mock('@/data/trending.json', () => mockData, { virtual: true });

import { getTrendingData, getLatestTrendingDay, getTrendingDayByDate } from '@/lib/trending';

describe('getTrendingData', () => {
  it('returns all days', () => {
    const data = getTrendingData();
    expect(data.days).toHaveLength(2);
  });
});

describe('getLatestTrendingDay', () => {
  it('returns the first day', () => {
    const day = getLatestTrendingDay();
    expect(day?.date).toBe('2026-03-27');
  });
});

describe('getTrendingDayByDate', () => {
  it('returns matching day', () => {
    const day = getTrendingDayByDate('2026-03-26');
    expect(day?.date).toBe('2026-03-26');
  });

  it('returns null for unknown date', () => {
    expect(getTrendingDayByDate('2020-01-01')).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx jest __tests__/lib/trending.test.ts --no-coverage
```

Expected: FAIL with "Cannot find module '@/lib/trending'"

- [ ] **Step 3: 实现 lib/trending.ts**

```ts
import trendingData from '@/data/trending.json';
import type { TrendingData, TrendingDay } from '@/types/trending';

const data = trendingData as TrendingData;

export function getTrendingData(): TrendingData {
  return data;
}

export function getLatestTrendingDay(): TrendingDay | null {
  return data.days[0] ?? null;
}

export function getTrendingDayByDate(date: string): TrendingDay | null {
  return data.days.find((d) => d.date === date) ?? null;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx jest __tests__/lib/trending.test.ts --no-coverage
```

Expected: 所有 4 个测试 PASS

- [ ] **Step 5: Commit**

```bash
git add lib/trending.ts __tests__/lib/trending.test.ts
git commit -m "feat: add lib/trending data access layer"
```

---

## Task 4: 安装 cheerio + 创建 scripts/fetch-trending.ts（TDD）

**Files:**

- Modify: `package.json`（通过 npm install）
- Create: `__tests__/scripts/fetch-trending.test.ts`
- Create: `scripts/fetch-trending.ts`

- [ ] **Step 1: 安装 cheerio**

```bash
npm install cheerio
```

Expected: cheerio 出现在 package.json dependencies 中

- [ ] **Step 2: 编写失败测试 **tests**/scripts/fetch-trending.test.ts**

```ts
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
    days: [{ date: '2026-03-26', summary_zh: '昨日总结', projects: [] }],
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
```

- [ ] **Step 3: 运行测试确认失败**

```bash
npx jest __tests__/scripts/fetch-trending.test.ts --no-coverage
```

Expected: FAIL with "Cannot find module '@/scripts/fetch-trending'"

- [ ] **Step 4: 实现 scripts/fetch-trending.ts**

```ts
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { TrendingData, TrendingDay, TrendingProject } from '@/types/trending';

interface RawTrendingProject {
  rank: number;
  name: string;
  url: string;
  description_en: string;
  language: string;
  stars_total: number;
  stars_today: number;
}

interface DeepSeekResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export function parseTrendingProjects(html: string): RawTrendingProject[] {
  const $ = cheerio.load(html);
  const projects: RawTrendingProject[] = [];

  $('article.Box-row').each((index, el) => {
    if (index >= 25) return false;

    const href = $(el).find('h2 a').attr('href') ?? '';
    const name = href.replace(/^\//, '').replace(/\s/g, '');
    if (!name) return;

    const url = `https://github.com/${name}`;
    const description_en = $(el).find('p').first().text().trim();
    const language = $(el).find('[itemprop="programmingLanguage"]').text().trim();

    const starsTodayText = $(el).find('.d-inline-block.float-sm-right').text().trim();
    const starsTodayMatch = starsTodayText.replace(/,/g, '').match(/(\d+)/);
    const stars_today = starsTodayMatch ? parseInt(starsTodayMatch[1], 10) : 0;

    const starsText = $(el).find('a[href$="/stargazers"]').text().trim().replace(/,/g, '');
    const stars_total = parseInt(starsText, 10) || 0;

    projects.push({
      rank: index + 1,
      name,
      url,
      description_en,
      language,
      stars_total,
      stars_today,
    });
  });

  return projects;
}

export function mergeTrendingDay(existing: TrendingData, newDay: TrendingDay): TrendingData {
  const filtered = existing.days.filter((d) => d.date !== newDay.date);
  const days = [newDay, ...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  return { days };
}

async function callDeepSeek(prompt: string, apiKey: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as DeepSeekResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function translateDescriptions(
  projects: RawTrendingProject[],
  apiKey: string
): Promise<Map<string, string>> {
  const items = projects.map((p) => ({ name: p.name, description: p.description_en }));
  const prompt = `Translate these GitHub project descriptions to Chinese. Return ONLY a JSON array. Each object must have exactly "name" and "description_zh" fields.

Projects:
${JSON.stringify(items, null, 2)}`;

  const output = await callDeepSeek(prompt, apiKey, 4096);
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return new Map();

  const results = JSON.parse(jsonMatch[0]) as Array<{ name: string; description_zh: string }>;
  return new Map(results.map((r) => [r.name, r.description_zh ?? '']));
}

async function generateSummary(projects: RawTrendingProject[], apiKey: string): Promise<string> {
  const list = projects
    .slice(0, 10)
    .map((p) => `${p.name}: ${p.description_en}`)
    .join('\n');
  const prompt = `Based on today's GitHub Trending projects listed below, write a 100-150 character Chinese summary describing the main themes and highlights. Return ONLY the Chinese summary text.

${list}`;

  const output = await callDeepSeek(prompt, apiKey, 256);
  return output || '今日 GitHub Trending 项目精选。';
}

export async function fetchAndSaveTrending(): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('  DEEPSEEK_API_KEY not set, skipping trending fetch');
    return;
  }

  const trendingPath = join(process.cwd(), 'data/trending.json');

  console.log('  Fetching github.com/trending...');
  const response = await fetch('https://github.com/trending', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Bot/1.0)',
      Accept: 'text/html',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub Trending fetch failed: ${response.status}`);
  }
  const html = await response.text();

  const rawProjects = parseTrendingProjects(html);
  console.log(`  Parsed ${rawProjects.length} trending projects`);

  console.log('  Translating descriptions...');
  let descMap = new Map<string, string>();
  try {
    descMap = await translateDescriptions(rawProjects, apiKey);
  } catch (err) {
    console.error('  Description translation failed:', err);
  }

  console.log('  Generating summary...');
  let summary_zh = '今日 GitHub Trending 项目精选。';
  try {
    summary_zh = await generateSummary(rawProjects, apiKey);
  } catch (err) {
    console.error('  Summary generation failed:', err);
  }

  const today = new Date().toISOString().slice(0, 10);
  const projects: TrendingProject[] = rawProjects.map((p) => ({
    ...p,
    description_zh: descMap.get(p.name) ?? '',
  }));

  const newDay: TrendingDay = { date: today, summary_zh, projects };

  const existing: TrendingData = existsSync(trendingPath)
    ? (JSON.parse(readFileSync(trendingPath, 'utf8')) as TrendingData)
    : { days: [] };

  const merged = mergeTrendingDay(existing, newDay);
  writeFileSync(trendingPath, JSON.stringify(merged, null, 2));
  console.log(`  Trending saved: ${projects.length} projects for ${today}`);
}

if (require.main === module) {
  fetchAndSaveTrending().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx jest __tests__/scripts/fetch-trending.test.ts --no-coverage
```

Expected: 所有 5 个测试 PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/fetch-trending.ts __tests__/scripts/fetch-trending.test.ts
git commit -m "feat: add GitHub trending scraper script"
```

---

## Task 5: 集成 fetch-trending 到 scripts/update.ts

**Files:**

- Modify: `scripts/update.ts`

- [ ] **Step 1: 重构 update.ts main 函数**

当前 `update.ts` 在无新文章时提前 `process.exit(0)`，需改为让 trending fetch 始终执行。将 `main()` 函数替换为：

```ts
import { fetchRssSource, fetchNewsApi } from './fetch';
import { translateArticles } from './translate';
import { mergeArticles } from './merge';
import { fetchAndSaveTrending } from './fetch-trending';
import type { Article, RawArticle } from '@/types/article';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { normalizeArticle } from '@/lib/server/article-normalizer';

// ... parseSources, parseExistingArticles, filterNewRawArticles 保持不变 ...

async function main() {
  const sourcesPath = join(process.cwd(), 'config/sources.json');
  const dataPath = join(process.cwd(), 'data/articles.json');
  const publicFeedPath = join(process.cwd(), 'public/data/articles-feed.json');

  const sources = parseSources(JSON.parse(readFileSync(sourcesPath, 'utf8')));

  console.log('Fetching articles...');
  const allRaw: RawArticle[] = [];

  for (const feed of sources.rss) {
    const articles = await fetchRssSource(feed.url, feed.name);
    allRaw.push(...articles);
    console.log(`  ${feed.name}: ${articles.length}`);
  }

  const newsApiKey = process.env.NEWS_API_KEY;
  if (newsApiKey) {
    const { query, language, pageSize } = sources.newsapi;
    const newsApiArticles = await fetchNewsApi(query, language, Math.min(pageSize, 10), newsApiKey);
    allRaw.push(...newsApiArticles);
    console.log(`  NewsAPI: ${newsApiArticles.length}`);
  }

  const existing: Article[] = parseExistingArticles(JSON.parse(readFileSync(dataPath, 'utf8')));
  const newRaw = filterNewRawArticles(allRaw, existing);
  console.log(`\nNew articles to translate: ${newRaw.length}`);

  if (newRaw.length > 0) {
    console.log('\nTranslating...');
    const translated = await translateArticles(newRaw);
    console.log(`  Translated: ${translated.length}/${newRaw.length}`);

    if (translated.length > 0) {
      console.log('\nMerging...');
      const merged = mergeArticles(existing, translated).map(normalizeArticle);
      writeFileSync(dataPath, JSON.stringify(merged, null, 2));
      mkdirSync(dirname(publicFeedPath), { recursive: true });
      writeFileSync(publicFeedPath, JSON.stringify(merged, null, 2));
      console.log(`  Total articles: ${merged.length}`);
    } else {
      console.error('Translation failed: no articles were translated.');
    }
  }

  console.log('\nFetching GitHub Trending...');
  await fetchAndSaveTrending();

  console.log('\nDone!');
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

注意：`parseSources`、`parseExistingArticles`、`filterNewRawArticles` 函数体保持不变，只改 `main()` 函数和顶部 import。

- [ ] **Step 2: 运行现有 update 相关测试确认不回归**

```bash
npx jest __tests__/scripts/update.test.ts --no-coverage
```

Expected: 所有测试 PASS

- [ ] **Step 3: Commit**

```bash
git add scripts/update.ts
git commit -m "feat: integrate trending fetch into update pipeline"
```

---

## Task 6: 创建 pages/trending.tsx + 添加 CSS

**Files:**

- Create: `pages/trending.tsx`
- Modify: `styles/globals.css`

- [ ] **Step 1: 创建 pages/trending.tsx**

```tsx
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
  const current = days.find((d) => d.date === selectedDate) ?? days[0];
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
              {recentDays.map((d) => (
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
            {current.projects.map((project) => (
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
                    <span className="trending-item__stars">
                      ★ {project.stars_today.toLocaleString()} today
                    </span>
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
```

- [ ] **Step 2: 在 styles/globals.css 末尾追加 trending 样式**

在文件末尾添加：

```css
/* ── Trending Page ─────────────────────────────── */
.trending-summary {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.trending-date-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.trending-date-tab {
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.trending-date-tab:hover {
  background: var(--surface);
  color: var(--text-primary);
}

.trending-date-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #000;
}

.trending-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trending-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.15s;
}

.trending-item:hover {
  border-color: var(--accent);
}

.trending-item__rank {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-tertiary);
  min-width: 2rem;
  padding-top: 0.15rem;
}

.trending-item__body {
  flex: 1;
  min-width: 0;
}

.trending-item__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.trending-item__name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
}

.trending-item__name:hover {
  color: var(--accent);
}

.trending-item__lang {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: var(--surface-2, var(--border));
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.trending-item__stars {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin-left: auto;
}

.trending-item__desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}
```

- [ ] **Step 3: 运行构建验证页面编译正常**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Generating static pages` 包含 `/trending`，无 TypeScript 错误

- [ ] **Step 4: Commit**

```bash
git add pages/trending.tsx styles/globals.css
git commit -m "feat: add /trending page with project list and date tabs"
```

---

## Task 7: 更新导航（Sidebar + Header）

**Files:**

- Modify: `components/Layout/Sidebar.tsx`
- Modify: `components/Layout/Header.tsx`

- [ ] **Step 1: 更新 Sidebar.tsx**

在"收藏"链接之后、`FILTER_CATEGORIES.map` 之前，插入"热点项目"链接：

```tsx
<Link
  href="/trending"
  className={`sidebar-link${router.pathname === '/trending' ? ' active' : ''}`}
  style={{ ['--sidebar-accent' as string]: '#6EE7F7' }}
  onClick={onClose}
>
  {router.pathname === '/trending' && <span className="sidebar-link__dot" aria-hidden="true" />}
  <span className="sidebar-link__label">热点项目</span>
</Link>
```

完整的 `nav` 内容应为：

1. 收藏链接（已有）
2. 热点项目链接（新增）
3. `{FILTER_CATEGORIES.map(...)}` （已有）

- [ ] **Step 2: 更新 Header.tsx**

在"收藏"链接之后，`<div className="header-actions">` 之前，插入"热点项目"链接：

```tsx
<Link
  href="/trending"
  className={`header-meta-link${router.pathname === '/trending' ? ' active' : ''}`}
>
  热点项目
</Link>
```

完整的 `header-meta` div 内容应为：

```tsx
<div className="header-meta">
  <span className="header-meta-text">AI 新闻聚合</span>
  <Link
    href="/favorites"
    className={`header-meta-link${router.pathname === '/favorites' ? ' active' : ''}`}
  >
    收藏 <span>{favorites.length}</span>
  </Link>
  <Link
    href="/trending"
    className={`header-meta-link${router.pathname === '/trending' ? ' active' : ''}`}
  >
    热点项目
  </Link>
  <div className="header-actions">
    <GlobalHeaderSearch />
  </div>
</div>
```

- [ ] **Step 3: 运行构建确认无错误**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build completed successfully，无 TypeScript 或 ESLint 错误

- [ ] **Step 4: 运行全部测试**

```bash
npm test -- --no-coverage
```

Expected: 所有测试 PASS

- [ ] **Step 5: Commit**

```bash
git add components/Layout/Sidebar.tsx components/Layout/Header.tsx
git commit -m "feat: add trending navigation to sidebar and header"
```

---

## 完成验证

- [ ] `npm run build` 成功，`/trending` 出现在静态页面列表中
- [ ] `npm test` 全部通过
- [ ] 侧边栏菜单：收藏 → 热点项目 → 全部 → 大模型 → AI应用 → AI研究 → 产业动态（无安全治理）
- [ ] Header：收藏 | 热点项目
- [ ] `/trending` 页面在无数据时显示"暂无数据，稍后再来"
- [ ] `ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/fetch-trending.ts` 可独立运行（需 DEEPSEEK_API_KEY）
