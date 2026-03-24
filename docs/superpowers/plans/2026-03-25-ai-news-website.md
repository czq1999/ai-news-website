# AI 新闻聚合网站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个全自动 AI 资讯聚合网站，每 6 小时抓取英文 AI 新闻、通过 claude CLI 翻译成中文，以静态页面形式展示，无运行时后端。

**Architecture:** GitHub Actions 作为定时后端，每 6 小时运行一次抓取+翻译脚本，将结果写入仓库的 `data/articles.json`，push 触发 Vercel 重新构建静态页面。前端是 Next.js Pages Router，所有页面通过 `getStaticProps` / `getStaticPaths` 构建为纯静态 HTML。

**Tech Stack:** Next.js 14 (Pages Router) · TypeScript · Tailwind CSS · Jest + React Testing Library · rss-parser · ts-node · claude CLI · Vercel

---

## 文件结构

```
ai-news-website/
├── config/
│   └── sources.json            # RSS 来源列表 + NewsAPI 配置
├── data/
│   └── articles.json           # 文章数据（提交到仓库，随时更新）
├── types/
│   └── article.ts              # Article 接口定义
├── lib/
│   └── articles.ts             # 服务端数据加载工具函数
├── scripts/
│   ├── fetch.ts                # 抓取 RSS + NewsAPI，返回 RawArticle[]
│   ├── translate.ts            # 通过 claude -p CLI 翻译，返回 Article[]
│   ├── merge.ts                # 合并去重截断，写入 articles.json
│   └── update.ts               # 入口：依次调用 fetch → translate → merge
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx         # 左侧分类导航
│   │   └── Header.tsx          # 顶部品牌栏
│   ├── Article/
│   │   ├── ArticleCard.tsx     # 文章卡片（列表页）
│   │   └── ArticleDetail.tsx   # 文章详情内容块
│   └── UI/
│       ├── CategoryBadge.tsx   # 分类颜色标签
│       └── TimeAgo.tsx         # 相对时间显示
├── pages/
│   ├── index.tsx               # 首页（全部文章）
│   ├── category/[slug].tsx     # 分类页
│   └── article/[slug].tsx      # 文章详情页
├── __tests__/
│   ├── lib/articles.test.ts
│   ├── scripts/merge.test.ts
│   ├── scripts/fetch.test.ts
│   ├── components/CategoryBadge.test.tsx
│   ├── components/TimeAgo.test.tsx
│   └── components/ArticleCard.test.tsx
└── .github/
    └── workflows/
        └── fetch-and-translate.yml
```

---

## Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`（由 create-next-app 生成）
- Create: `tailwind.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: 创建 Next.js 项目**

在项目根目录运行：
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --no-app --no-src-dir --import-alias="@/*"
```
选项说明：`--no-app` 使用 Pages Router，`--no-src-dir` 不创建 src 目录。

- [ ] **Step 2: 在 .gitignore 追加排除 superpowers 目录**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 3: 验证项目启动**

```bash
npm run dev
```
预期：浏览器打开 http://localhost:3000 显示 Next.js 默认页面。Ctrl+C 停止。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

## Task 2: 配置测试框架

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json`（添加 test script 和 jest 配置）

- [ ] **Step 1: 安装测试依赖**

```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

- [ ] **Step 2: 创建 jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.(ts|tsx)'],
};

export default config;
```

- [ ] **Step 3: 创建 jest.setup.ts**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: 在 package.json 添加 test script**

在 `"scripts"` 中添加：
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: 验证测试框架可运行**

创建临时测试文件 `__tests__/smoke.test.ts`：
```typescript
test('smoke test', () => {
  expect(1 + 1).toBe(2);
});
```
运行：
```bash
npx jest __tests__/smoke.test.ts
```
预期：PASS。删除该文件。

- [ ] **Step 6: 提交**

```bash
git add jest.config.ts jest.setup.ts package.json package-lock.json
git commit -m "chore: set up Jest with ts-jest and React Testing Library"
```

---

## Task 3: 定义类型 + 配置文件 + 初始数据

**Files:**
- Create: `types/article.ts`
- Create: `config/sources.json`
- Create: `data/articles.json`

- [ ] **Step 1: 创建 types/article.ts**

```typescript
// types/article.ts
export type Category = 'llm' | 'product' | 'research' | 'industry';

export interface Article {
  id: string;           // URL 的 MD5 hash
  title_en: string;     // 原始英文标题
  title_zh: string;     // AI 翻译的中文标题
  summary_zh: string;   // AI 生成的 200-300 字中文摘要
  category: Category;   // 由 Claude 在翻译步骤中自动判断
  source: string;       // 来源名称，如 "TechCrunch"
  url: string;          // 原文链接
  published_at: string; // ISO 8601
  fetched_at: string;   // ISO 8601
}

export interface RawArticle {
  id: string;
  title_en: string;
  source: string;
  url: string;
  published_at: string;
  fetched_at: string;
}
```

- [ ] **Step 2: 创建 config/sources.json**

```json
{
  "rss": [
    { "name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/feed/" },
    { "name": "The Verge", "url": "https://www.theverge.com/rss/index.xml" },
    { "name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/technology-lab" },
    { "name": "Wired", "url": "https://www.wired.com/feed/rss" },
    { "name": "MIT Tech Review", "url": "https://www.technologyreview.com/feed/" },
    { "name": "VentureBeat AI", "url": "https://venturebeat.com/category/ai/feed/" }
  ],
  "newsapi": {
    "query": "artificial intelligence",
    "language": "en",
    "pageSize": 10
  }
}
```

- [ ] **Step 3: 创建 data/articles.json（空数组）**

```json
[]
```

- [ ] **Step 4: 提交**

```bash
git add types/ config/ data/
git commit -m "chore: add Article types, source config, and empty data file"
```

---

## Task 4: 数据加载工具库（TDD）

**Files:**
- Create: `lib/articles.ts`
- Create: `__tests__/lib/articles.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// __tests__/lib/articles.test.ts
import { getAllArticles, getArticlesByCategory, getArticleById, CATEGORIES } from '@/lib/articles';
import type { Article } from '@/types/article';

const mockArticles: Article[] = [
  {
    id: 'abc123',
    title_en: 'OpenAI releases GPT-5',
    title_zh: 'OpenAI 发布 GPT-5',
    summary_zh: '摘要内容',
    category: 'llm',
    source: 'TechCrunch',
    url: 'https://example.com/1',
    published_at: '2026-03-24T10:00:00Z',
    fetched_at: '2026-03-24T11:00:00Z',
  },
  {
    id: 'def456',
    title_en: 'Google launches Gemini 2',
    title_zh: 'Google 发布 Gemini 2',
    summary_zh: '摘要内容2',
    category: 'product',
    source: 'The Verge',
    url: 'https://example.com/2',
    published_at: '2026-03-24T08:00:00Z',
    fetched_at: '2026-03-24T11:00:00Z',
  },
];

jest.mock('@/data/articles.json', () => mockArticles, { virtual: true });

describe('getAllArticles', () => {
  it('returns all articles sorted by published_at descending', () => {
    const result = getAllArticles();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('abc123');
  });
});

describe('getArticlesByCategory', () => {
  it('filters articles by category', () => {
    const result = getArticlesByCategory('llm');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abc123');
  });

  it('returns empty array for unknown category', () => {
    expect(getArticlesByCategory('unknown' as any)).toHaveLength(0);
  });
});

describe('getArticleById', () => {
  it('returns the article with matching id', () => {
    expect(getArticleById('abc123')?.title_en).toBe('OpenAI releases GPT-5');
  });

  it('returns undefined for missing id', () => {
    expect(getArticleById('nope')).toBeUndefined();
  });
});

describe('CATEGORIES', () => {
  it('contains all four categories with labels', () => {
    expect(CATEGORIES.map(c => c.slug)).toEqual(['llm', 'product', 'research', 'industry']);
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npx jest __tests__/lib/articles.test.ts
```
预期：FAIL（模块不存在）。

- [ ] **Step 3: 实现 lib/articles.ts**

```typescript
// lib/articles.ts
import articlesData from '@/data/articles.json';
import type { Article, Category } from '@/types/article';

const articles = articlesData as Article[];

export const CATEGORIES = [
  { slug: 'llm' as Category, label: '大模型' },
  { slug: 'product' as Category, label: '产品' },
  { slug: 'research' as Category, label: '研究' },
  { slug: 'industry' as Category, label: '行业' },
];

export function getAllArticles(): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getArticlesByCategory(category: Category): Article[] {
  return getAllArticles().filter(a => a.category === category);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find(a => a.id === id);
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npx jest __tests__/lib/articles.test.ts
```
预期：PASS（4 suites）。

- [ ] **Step 5: 提交**

```bash
git add lib/ __tests__/lib/
git commit -m "feat: add articles data loading library with tests"
```

---

## Task 5: Merge 脚本（TDD）

**Files:**
- Create: `scripts/merge.ts`
- Create: `__tests__/scripts/merge.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// __tests__/scripts/merge.test.ts
import { mergeArticles } from '@/scripts/merge';
import type { Article } from '@/types/article';

const makeArticle = (id: string, published_at: string): Article => ({
  id,
  title_en: `Title ${id}`,
  title_zh: `标题 ${id}`,
  summary_zh: `摘要 ${id}`,
  category: 'llm',
  source: 'Test',
  url: `https://example.com/${id}`,
  published_at,
  fetched_at: '2026-03-24T11:00:00Z',
});

describe('mergeArticles', () => {
  it('adds new articles to existing ones', () => {
    const existing = [makeArticle('old1', '2026-03-24T08:00:00Z')];
    const incoming = [makeArticle('new1', '2026-03-24T10:00:00Z')];
    const result = mergeArticles(existing, incoming);
    expect(result).toHaveLength(2);
  });

  it('deduplicates by id', () => {
    const existing = [makeArticle('dup1', '2026-03-24T08:00:00Z')];
    const incoming = [makeArticle('dup1', '2026-03-24T08:00:00Z')];
    const result = mergeArticles(existing, incoming);
    expect(result).toHaveLength(1);
  });

  it('sorts by published_at descending', () => {
    const existing = [makeArticle('a', '2026-03-24T06:00:00Z')];
    const incoming = [makeArticle('b', '2026-03-24T10:00:00Z')];
    const result = mergeArticles(existing, incoming);
    expect(result[0].id).toBe('b');
  });

  it('truncates to 500 articles maximum', () => {
    const existing = Array.from({ length: 490 }, (_, i) =>
      makeArticle(`e${i}`, '2026-03-24T08:00:00Z')
    );
    const incoming = Array.from({ length: 20 }, (_, i) =>
      makeArticle(`n${i}`, '2026-03-24T10:00:00Z')
    );
    const result = mergeArticles(existing, incoming);
    expect(result).toHaveLength(500);
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npx jest __tests__/scripts/merge.test.ts
```
预期：FAIL。

- [ ] **Step 3: 实现 scripts/merge.ts**

```typescript
// scripts/merge.ts
import type { Article } from '@/types/article';

const MAX_ARTICLES = 500;

export function mergeArticles(existing: Article[], incoming: Article[]): Article[] {
  const existingIds = new Set(existing.map(a => a.id));
  const newOnes = incoming.filter(a => !existingIds.has(a.id));
  const combined = [...existing, ...newOnes];
  combined.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  return combined.slice(0, MAX_ARTICLES);
}

// When run directly: read stdin as existing JSON + new articles JSON, write merged to stdout
if (require.main === module) {
  const existingPath = process.argv[2];
  const incomingPath = process.argv[3];
  const fs = require('fs');
  const existing: Article[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const incoming: Article[] = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));
  const merged = mergeArticles(existing, incoming);
  fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
  console.log(`Merged: ${incoming.length} incoming → ${merged.length} total (${merged.length - existing.length < 0 ? 0 : merged.length - existing.length} new)`);
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npx jest __tests__/scripts/merge.test.ts
```
预期：PASS（4 suites）。

- [ ] **Step 5: 提交**

```bash
git add scripts/merge.ts __tests__/scripts/merge.test.ts
git commit -m "feat: add article merge script with deduplication and truncation"
```

---

## Task 6: Fetch 脚本（TDD）

**Files:**
- Create: `scripts/fetch.ts`
- Create: `__tests__/scripts/fetch.test.ts`

- [ ] **Step 1: 安装 rss-parser 和 crypto 类型**

```bash
npm install rss-parser
npm install -D @types/node
```

- [ ] **Step 2: 写失败测试**

```typescript
// __tests__/scripts/fetch.test.ts
import { buildArticleId, parseRssItem } from '@/scripts/fetch';

describe('buildArticleId', () => {
  it('returns consistent MD5 hash for same URL', () => {
    const id1 = buildArticleId('https://example.com/article');
    const id2 = buildArticleId('https://example.com/article');
    expect(id1).toBe(id2);
  });

  it('returns different hashes for different URLs', () => {
    const id1 = buildArticleId('https://example.com/a');
    const id2 = buildArticleId('https://example.com/b');
    expect(id1).not.toBe(id2);
  });

  it('returns a 32-character hex string', () => {
    const id = buildArticleId('https://example.com/test');
    expect(id).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe('parseRssItem', () => {
  it('converts RSS item to RawArticle', () => {
    const item = {
      title: 'Test Article',
      link: 'https://example.com/test',
      isoDate: '2026-03-24T10:00:00Z',
    };
    const result = parseRssItem(item, 'TestSource');
    expect(result.title_en).toBe('Test Article');
    expect(result.source).toBe('TestSource');
    expect(result.url).toBe('https://example.com/test');
    expect(result.id).toMatch(/^[a-f0-9]{32}$/);
  });

  it('returns null for items without a link', () => {
    const result = parseRssItem({ title: 'No link' }, 'TestSource');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: 运行确认失败**

```bash
npx jest __tests__/scripts/fetch.test.ts
```
预期：FAIL。

- [ ] **Step 4: 实现 scripts/fetch.ts**

```typescript
// scripts/fetch.ts
import { createHash } from 'crypto';
import Parser from 'rss-parser';
import type { RawArticle } from '@/types/article';

export function buildArticleId(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

export function parseRssItem(item: any, sourceName: string): RawArticle | null {
  if (!item.link) return null;
  return {
    id: buildArticleId(item.link),
    title_en: item.title || 'Untitled',
    source: sourceName,
    url: item.link,
    published_at: item.isoDate || new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  };
}

export async function fetchRssSource(
  url: string,
  sourceName: string
): Promise<RawArticle[]> {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL(url);
    return feed.items
      .map(item => parseRssItem(item, sourceName))
      .filter((a): a is RawArticle => a !== null)
      .slice(0, 20); // 每个来源最多取 20 篇
  } catch (err) {
    console.error(`Failed to fetch RSS from ${url}:`, err);
    return [];
  }
}

export async function fetchNewsApi(
  query: string,
  language: string,
  pageSize: number,
  apiKey: string
): Promise<RawArticle[]> {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NewsAPI responded ${res.status}`);
    const data = await res.json();
    return (data.articles || [])
      .filter((a: any) => a.url && a.title)
      .map((a: any) => ({
        id: buildArticleId(a.url),
        title_en: a.title,
        source: a.source?.name || 'NewsAPI',
        url: a.url,
        published_at: a.publishedAt || new Date().toISOString(),
        fetched_at: new Date().toISOString(),
      }));
  } catch (err) {
    console.error('Failed to fetch NewsAPI:', err);
    return [];
  }
}

// Entry point when run directly
if (require.main === module) {
  (async () => {
    const fs = require('fs');
    const sources = JSON.parse(fs.readFileSync('./config/sources.json', 'utf8'));
    const allRaw: RawArticle[] = [];

    for (const feed of sources.rss) {
      const articles = await fetchRssSource(feed.url, feed.name);
      allRaw.push(...articles);
      console.log(`  ${feed.name}: ${articles.length} articles`);
    }

    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      const { query, language, pageSize } = sources.newsapi;
      const newsApiArticles = await fetchNewsApi(query, language, Math.min(pageSize, 10), newsApiKey);
      allRaw.push(...newsApiArticles);
      console.log(`  NewsAPI: ${newsApiArticles.length} articles`);
    }

    fs.writeFileSync('/tmp/raw-articles.json', JSON.stringify(allRaw, null, 2));
    console.log(`Total raw: ${allRaw.length}`);
  })();
}
```

- [ ] **Step 5: 运行确认通过**

```bash
npx jest __tests__/scripts/fetch.test.ts
```
预期：PASS。

- [ ] **Step 6: 提交**

```bash
git add scripts/fetch.ts __tests__/scripts/fetch.test.ts package.json package-lock.json
git commit -m "feat: add RSS and NewsAPI fetch script with tests"
```

---

## Task 7: Translate 脚本

**Files:**
- Create: `scripts/translate.ts`

注意：此脚本调用 `claude -p` CLI，不写单元测试（依赖外部 CLI，集成测试范畴）。

- [ ] **Step 1: 实现 scripts/translate.ts**

```typescript
// scripts/translate.ts
import { execFileSync } from 'child_process';
import type { Article, RawArticle } from '@/types/article';

interface TranslationResult {
  id: string;
  title_zh: string;
  summary_zh: string;
  category: 'llm' | 'product' | 'research' | 'industry';
}

export function buildTranslationPrompt(articles: RawArticle[]): string {
  return `You are a professional AI news translator and editor.

Given the following English AI news article titles, for each article:
1. Translate the title to natural, accurate Chinese
2. Write a 150-200 character Chinese summary suitable for a tech news audience
3. Assign ONE category from: llm (large language models/AI models), product (product launches/updates/tools), research (academic papers/technical research), industry (business/investment/company news)

Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON array.
Each object must have exactly these fields: id, title_zh, summary_zh, category

Articles:
${JSON.stringify(articles.map(a => ({ id: a.id, title: a.title_en, source: a.source })), null, 2)}`;
}

export function translateArticles(rawArticles: RawArticle[]): Article[] {
  if (rawArticles.length === 0) return [];

  const prompt = buildTranslationPrompt(rawArticles);
  let output: string;

  try {
    output = execFileSync('claude', ['-p', prompt], {
      encoding: 'utf8',
      timeout: 120_000, // 2 minutes
      env: { ...process.env },
    });
  } catch (err) {
    console.error('claude CLI failed:', err);
    return [];
  }

  let translations: TranslationResult[];
  try {
    // Extract JSON array from output (claude may include extra text)
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in output');
    translations = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Failed to parse translation output:', err);
    console.error('Raw output:', output);
    return [];
  }

  const translationMap = new Map(translations.map(t => [t.id, t]));

  return rawArticles
    .map(raw => {
      const t = translationMap.get(raw.id);
      if (!t) return null;
      return {
        ...raw,
        title_zh: t.title_zh,
        summary_zh: t.summary_zh,
        category: t.category,
      } as Article;
    })
    .filter((a): a is Article => a !== null);
}

// Entry point when run directly
if (require.main === module) {
  const fs = require('fs');
  const rawArticles: RawArticle[] = JSON.parse(
    fs.readFileSync('/tmp/raw-articles.json', 'utf8')
  );
  console.log(`Translating ${rawArticles.length} articles...`);
  const translated = translateArticles(rawArticles);
  fs.writeFileSync('/tmp/translated-articles.json', JSON.stringify(translated, null, 2));
  console.log(`Translated: ${translated.length}`);
}
```

- [ ] **Step 2: 提交**

```bash
git add scripts/translate.ts
git commit -m "feat: add translate script using claude CLI"
```

---

## Task 8: Update 入口脚本

**Files:**
- Create: `scripts/update.ts`

- [ ] **Step 1: 实现 scripts/update.ts**

```typescript
// scripts/update.ts
// Main entry point for GitHub Actions: fetch → translate → merge → write
import { fetchRssSource, fetchNewsApi } from './fetch';
import { translateArticles } from './translate';
import { mergeArticles } from './merge';
import type { Article, RawArticle } from '@/types/article';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const sourcesPath = join(process.cwd(), 'config/sources.json');
  const dataPath = join(process.cwd(), 'data/articles.json');
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));

  // Step 1: Fetch
  console.log('📡 Fetching articles...');
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

  // Deduplicate raw articles by id before translating
  const existing: Article[] = JSON.parse(readFileSync(dataPath, 'utf8'));
  const existingIds = new Set(existing.map(a => a.id));
  const newRaw = allRaw.filter(a => !existingIds.has(a.id));
  console.log(`\n✨ New articles to translate: ${newRaw.length}`);

  if (newRaw.length === 0) {
    console.log('No new articles. Exiting.');
    process.exit(0);
  }

  // Step 2: Translate
  console.log('\n🌐 Translating...');
  const translated = translateArticles(newRaw);
  console.log(`  Translated: ${translated.length}/${newRaw.length}`);

  // Step 3: Merge
  console.log('\n💾 Merging...');
  const merged = mergeArticles(existing, translated);
  writeFileSync(dataPath, JSON.stringify(merged, null, 2));
  console.log(`  Total articles: ${merged.length}`);

  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: 在 package.json 添加 update script**

在 `"scripts"` 中添加：
```json
"update": "ts-node --project tsconfig.json -r tsconfig-paths/register scripts/update.ts"
```

- [ ] **Step 3: 安装运行时依赖**

```bash
npm install -D ts-node tsconfig-paths
```

- [ ] **Step 4: 提交**

```bash
git add scripts/update.ts package.json package-lock.json
git commit -m "feat: add update orchestration script"
```

---

## Task 9: GitHub Actions 工作流

**Files:**
- Create: `.github/workflows/fetch-and-translate.yml`

- [ ] **Step 1: 创建工作流文件**

```yaml
# .github/workflows/fetch-and-translate.yml
name: Fetch and Translate AI News

on:
  schedule:
    - cron: '0 */6 * * *'   # 每 6 小时运行一次
  workflow_dispatch:          # 允许手动触发

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write         # 需要写权限来 push 到仓库

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Claude Code CLI
        run: npm install -g @anthropic-ai/claude-code

      - name: Run update script
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          NEWS_API_KEY: ${{ secrets.NEWS_API_KEY }}
        run: npm run update

      - name: Commit and push if changed
        run: |
          git config user.name "AI News Bot"
          git config user.email "bot@users.noreply.github.com"
          git add data/articles.json
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore: update articles [skip ci]"
            git push
          fi
```

- [ ] **Step 2: 提交**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow for scheduled article updates"
```

---

## Task 10: UI 原子组件（TDD）

**Files:**
- Create: `components/UI/CategoryBadge.tsx`
- Create: `components/UI/TimeAgo.tsx`
- Create: `__tests__/components/CategoryBadge.test.tsx`
- Create: `__tests__/components/TimeAgo.test.tsx`

- [ ] **Step 1: 写 CategoryBadge 失败测试**

```tsx
// __tests__/components/CategoryBadge.test.tsx
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
});
```

- [ ] **Step 2: 写 TimeAgo 失败测试**

```tsx
// __tests__/components/TimeAgo.test.tsx
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
});
```

- [ ] **Step 3: 运行确认失败**

```bash
npx jest __tests__/components/
```
预期：FAIL。

- [ ] **Step 4: 实现 components/UI/CategoryBadge.tsx**

```tsx
// components/UI/CategoryBadge.tsx
import type { Category } from '@/types/article';

const CONFIG: Record<Category, { label: string; className: string }> = {
  llm:      { label: '大模型', className: 'text-blue-400 bg-blue-400/10' },
  product:  { label: '产品',   className: 'text-orange-400 bg-orange-400/10' },
  research: { label: '研究',   className: 'text-purple-400 bg-purple-400/10' },
  industry: { label: '行业',   className: 'text-green-400 bg-green-400/10' },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, className } = CONFIG[category] ?? CONFIG.llm;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${className}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 5: 实现 components/UI/TimeAgo.tsx**

```tsx
// components/UI/TimeAgo.tsx
export default function TimeAgo({ dateString }: { dateString: string }) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  let text: string;
  if (diff < 60)             text = '刚刚';
  else if (diff < 3600)      text = `${Math.floor(diff / 60)}分钟前`;
  else if (diff < 86400)     text = `${Math.floor(diff / 3600)}小时前`;
  else                       text = `${Math.floor(diff / 86400)}天前`;

  return <span className="text-xs text-gray-500">{text}</span>;
}
```

- [ ] **Step 6: 运行确认通过**

```bash
npx jest __tests__/components/
```
预期：PASS。

- [ ] **Step 7: 提交**

```bash
git add components/UI/ __tests__/components/
git commit -m "feat: add CategoryBadge and TimeAgo UI components with tests"
```

---

## Task 11: ArticleCard 组件（TDD）

**Files:**
- Create: `components/Article/ArticleCard.tsx`
- Create: `__tests__/components/ArticleCard.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
// __tests__/components/ArticleCard.test.tsx
import { render, screen } from '@testing-library/react';
import ArticleCard from '@/components/Article/ArticleCard';
import type { Article } from '@/types/article';

const mockArticle: Article = {
  id: 'abc123',
  title_en: 'OpenAI releases GPT-5',
  title_zh: 'OpenAI 发布 GPT-5',
  summary_zh: '这是一段关于 GPT-5 发布的中文摘要内容。',
  category: 'llm',
  source: 'TechCrunch',
  url: 'https://example.com/gpt5',
  published_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  fetched_at: new Date().toISOString(),
};

describe('ArticleCard', () => {
  it('renders the Chinese title', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('OpenAI 发布 GPT-5')).toBeInTheDocument();
  });

  it('renders the source name', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('TechCrunch')).toBeInTheDocument();
  });

  it('renders the Chinese summary', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText(/GPT-5 发布/)).toBeInTheDocument();
  });

  it('links to the article detail page', () => {
    render(<ArticleCard article={mockArticle} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/article/abc123');
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npx jest __tests__/components/ArticleCard.test.tsx
```
预期：FAIL。

- [ ] **Step 3: 实现 components/Article/ArticleCard.tsx**

```tsx
// components/Article/ArticleCard.tsx
import Link from 'next/link';
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`}>
      <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-4 hover:border-[#58a6ff]/50 hover:bg-[#1c2128] transition-colors cursor-pointer h-full flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="text-xs text-gray-500">{article.source}</span>
          <TimeAgo dateString={article.published_at} />
        </div>
        <h2 className="text-[#e6edf3] font-medium text-sm leading-snug line-clamp-2">
          {article.title_zh}
        </h2>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 flex-1">
          {article.summary_zh}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npx jest __tests__/components/ArticleCard.test.tsx
```
预期：PASS。

- [ ] **Step 5: 提交**

```bash
git add components/Article/ArticleCard.tsx __tests__/components/ArticleCard.test.tsx
git commit -m "feat: add ArticleCard component with tests"
```

---

## Task 12: Layout 组件

**Files:**
- Create: `components/Layout/Sidebar.tsx`
- Create: `components/Layout/Header.tsx`
- Create: `components/Layout/Layout.tsx`

- [ ] **Step 1: 实现 components/Layout/Sidebar.tsx**

```tsx
// components/Layout/Sidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CATEGORIES } from '@/lib/articles';

export default function Sidebar() {
  const router = useRouter();
  const currentCategory =
    router.pathname === '/' ? 'all' :
    (router.query.slug as string) ?? 'all';

  const isActive = (slug: string) =>
    slug === 'all' ? router.pathname === '/' : currentCategory === slug;

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-1 pt-2">
      <Link
        href="/"
        className={`px-3 py-2 rounded text-sm transition-colors ${
          isActive('all')
            ? 'bg-[#21262d] text-[#58a6ff]'
            : 'text-gray-400 hover:text-gray-200 hover:bg-[#161b22]'
        }`}
      >
        🏠 全部
      </Link>
      {CATEGORIES.map(cat => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className={`px-3 py-2 rounded text-sm transition-colors ${
            isActive(cat.slug)
              ? 'bg-[#21262d] text-[#58a6ff]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#161b22]'
          }`}
        >
          {cat.label}
        </Link>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: 实现 components/Layout/Header.tsx**

```tsx
// components/Layout/Header.tsx
export default function Header() {
  return (
    <header className="border-b border-[#21262d] bg-[#0d1117]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
        <span className="text-[#58a6ff] font-bold text-lg tracking-tight">⚡ AI Daily</span>
        <span className="text-gray-600 text-sm">· AI 资讯聚合</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: 实现 components/Layout/Layout.tsx**

```tsx
// components/Layout/Layout.tsx
import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add components/Layout/
git commit -m "feat: add Sidebar, Header, and Layout components"
```

---

## Task 13: ArticleDetail 组件

**Files:**
- Create: `components/Article/ArticleDetail.tsx`

- [ ] **Step 1: 实现 components/Article/ArticleDetail.tsx**

```tsx
// components/Article/ArticleDetail.tsx
import type { Article } from '@/types/article';
import CategoryBadge from '@/components/UI/CategoryBadge';
import TimeAgo from '@/components/UI/TimeAgo';

export default function ArticleDetail({ article }: { article: Article }) {
  return (
    <article className="max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <CategoryBadge category={article.category} />
        <span className="text-gray-500 text-sm">{article.source}</span>
        <TimeAgo dateString={article.published_at} />
      </div>

      <h1 className="text-2xl font-bold text-[#e6edf3] leading-tight mb-6">
        {article.title_zh}
      </h1>

      <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-6 mb-6">
        <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">AI 摘要</p>
        <p className="text-[#c9d1d9] leading-relaxed">{article.summary_zh}</p>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        原文标题：<span className="text-gray-400">{article.title_en}</span>
      </div>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#58a6ff] text-[#0d1117] font-medium rounded hover:bg-[#79b8ff] transition-colors text-sm"
      >
        阅读原文 →
      </a>
    </article>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add components/Article/ArticleDetail.tsx
git commit -m "feat: add ArticleDetail component"
```

---

## Task 14: 页面实现

**Files:**
- Modify: `pages/index.tsx`
- Create: `pages/category/[slug].tsx`
- Create: `pages/article/[slug].tsx`
- Modify: `pages/_app.tsx`（添加全局样式）

- [ ] **Step 1: 修改 pages/_app.tsx**

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

- [ ] **Step 2: 实现首页 pages/index.tsx**

```tsx
// pages/index.tsx
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article } from '@/types/article';
import { getAllArticles } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';

interface Props { articles: Article[] }

export default function Home({ articles }: Props) {
  return (
    <>
      <Head>
        <title>AI Daily - AI 资讯聚合</title>
        <meta name="description" content="每日 AI 资讯聚合，英文权威来源，中文呈现" />
      </Head>
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {articles.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-16">暂无文章，等待下次更新...</p>
          )}
        </div>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { articles: getAllArticles() } };
};
```

- [ ] **Step 3: 实现分类页 pages/category/[slug].tsx**

```tsx
// pages/category/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import type { Article, Category } from '@/types/article';
import { getArticlesByCategory, CATEGORIES } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleCard from '@/components/Article/ArticleCard';

interface Props { articles: Article[]; categoryLabel: string }

export default function CategoryPage({ articles, categoryLabel }: Props) {
  return (
    <>
      <Head>
        <title>{categoryLabel} - AI Daily</title>
      </Head>
      <Layout>
        <h1 className="text-lg font-semibold text-[#e6edf3] mb-4">{categoryLabel}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {articles.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-16">暂无文章</p>
          )}
        </div>
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: CATEGORIES.map(c => ({ params: { slug: c.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as Category;
  const cat = CATEGORIES.find(c => c.slug === slug);
  return {
    props: {
      articles: getArticlesByCategory(slug),
      categoryLabel: cat?.label ?? slug,
    },
  };
};
```

- [ ] **Step 4: 实现文章详情页 pages/article/[slug].tsx**

```tsx
// pages/article/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { Article } from '@/types/article';
import { getAllArticles, getArticleById } from '@/lib/articles';
import Layout from '@/components/Layout/Layout';
import ArticleDetail from '@/components/Article/ArticleDetail';

interface Props { article: Article }

export default function ArticlePage({ article }: Props) {
  return (
    <>
      <Head>
        <title>{article.title_zh} - AI Daily</title>
        <meta name="description" content={article.summary_zh.slice(0, 150)} />
      </Head>
      <Layout>
        <div className="mb-4">
          <Link href="/" className="text-[#58a6ff] text-sm hover:underline">← 返回首页</Link>
        </div>
        <ArticleDetail article={article} />
      </Layout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getAllArticles().map(a => ({ params: { slug: a.id } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const article = getArticleById(params!.slug as string);
  if (!article) return { notFound: true };
  return { props: { article } };
};
```

- [ ] **Step 5: 启动开发服务器验证页面**

```bash
npm run dev
```
打开 http://localhost:3000，确认：
- 首页正常显示（空数据时显示"暂无文章"提示）
- 侧边栏分类链接可点击
- `/category/llm` 路由可访问

- [ ] **Step 6: 提交**

```bash
git add pages/ components/
git commit -m "feat: implement all pages (home, category, article detail)"
```

---

## Task 15: 构建验证 + Vercel 部署准备

**Files:**
- Create: `vercel.json`（可选，用于自定义构建）

- [ ] **Step 1: 运行完整测试套件**

```bash
npx jest
```
预期：所有测试 PASS。

- [ ] **Step 2: 运行生产构建**

```bash
npm run build
```
预期：构建成功，无报错。输出示例：
```
Route (pages)
┌ ○ /
├ ○ /category/[slug]  (4 pages)
└ ○ /article/[slug]   (0 pages, data is empty)
```

- [ ] **Step 3: 在 GitHub 仓库设置 Secrets**

进入 GitHub 仓库 → Settings → Secrets and variables → Actions，添加：
- `ANTHROPIC_API_KEY`：你的 Anthropic API Key
- `NEWS_API_KEY`：NewsAPI.org 的 API Key（可从 https://newsapi.org 免费注册获取）

- [ ] **Step 4: 连接 Vercel**

1. 访问 https://vercel.com，使用 GitHub 账号登录
2. 点击 "Add New Project"，导入此仓库
3. 框架预设选 **Next.js**，其余保持默认
4. 点击 Deploy

- [ ] **Step 5: 手动触发 GitHub Actions 验证**

推送代码到 GitHub 后，进入 Actions 标签页，手动触发 `Fetch and Translate AI News` workflow，确认：
- 工作流正常完成
- `data/articles.json` 有内容被推送
- Vercel 自动触发重新部署

- [ ] **Step 6: 最终提交**

```bash
git add -A
git commit -m "chore: final build verification and deployment prep"
git push
```

---

## 快速参考

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npx jest` | 运行所有测试 |
| `npm run update` | 本地手动触发抓取+翻译 |

| Secret | 获取方式 |
|--------|----------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com → API Keys |
| `NEWS_API_KEY` | https://newsapi.org → 免费注册 |
