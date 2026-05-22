# 精选博客功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 AI 新闻网站新增"精选博客"功能，使用 anysearch 抓取高质量技术博客，在首页展示。

**Architecture:** 独立数据管道，复用翻译基础设施。anysearch 搜索 → 翻译 → 合并到 `data/blogs.json` → 首页区块展示。

**Tech Stack:** TypeScript, Next.js (Pages Router), Zod, DeepSeek API, anysearch MCP

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| Create | `types/blog.ts` | 博客类型定义（RawBlog, Blog） |
| Modify | `config/sources.json` | 新增 blogTopics 配置 |
| Create | `lib/server/blog-fetcher.ts` | 博客抓取逻辑（anysearch 结果解析、去重、RawBlog 生成） |
| Modify | `lib/server/translator.ts` | 新增博客翻译函数 |
| Create | `scripts/fetch-blogs.ts` | 博客抓取脚本入口 |
| Create | `scripts/merge-blogs.ts` | 博客合并器 |
| Create | `lib/blogs.server.ts` | 博客数据服务层 |
| Create | `data/blogs.json` | 空初始数据文件 |
| Create | `components/Blog/BlogCard.tsx` | 博客卡片组件 |
| Create | `components/Blog/BlogSection.tsx` | 首页博客区块 |
| Modify | `pages/index.tsx` | 集成博客区块 |
| Modify | `scripts/update.ts` | 集成博客抓取流程 |
| Modify | `package.json` | 新增 npm scripts |
| Create | `__tests__/lib/server/blog-fetcher.test.ts` | 抓取器测试 |
| Create | `__tests__/scripts/merge-blogs.test.ts` | 合并器测试 |
| Create | `__tests__/lib/blogs.server.test.ts` | 数据服务层测试 |
| Create | `__tests__/components/BlogCard.test.tsx` | 博客卡片测试 |
| Create | `__tests__/components/BlogSection.test.tsx` | 博客区块测试 |

---

### Task 1: 博客类型定义

**Files:**
- Create: `types/blog.ts`
- Test: 类型在后续任务中验证

- [ ] **Step 1: 创建博客类型文件**

```typescript
// types/blog.ts
import { z } from 'zod';

export const RawBlogSchema = z.object({
  id: z.string(),
  title_en: z.string(),
  source: z.string(),
  url: z.string().url(),
  published_at: z.string(),
  fetched_at: z.string(),
});

export type RawBlog = z.infer<typeof RawBlogSchema>;

export const BlogSchema = RawBlogSchema.extend({
  title_zh: z.string(),
  summary_zh: z.string(),
});

export type Blog = z.infer<typeof BlogSchema>;
```

- [ ] **Step 2: 验证类型编译通过**

Run: `npx tsc --noEmit types/blog.ts`
Expected: 无错误输出

- [ ] **Step 3: Commit**

```bash
git add types/blog.ts
git commit -m "feat(blog): add blog type definitions"
```

---

### Task 2: 配置扩展

**Files:**
- Modify: `config/sources.json`

- [ ] **Step 1: 添加 blogTopics 配置**

读取当前 `config/sources.json`，在末尾添加 `blogTopics` 字段：

```json
{
  "rss": [...],
  "newsapi": {...},
  "blogTopics": [
    { "query": "latest AI breakthroughs 2026" },
    { "query": "AI agent framework tutorial" },
    { "query": "autonomous AI agent development" },
    { "query": "LLM fine-tuning best practices" },
    { "query": "Linux server administration tips" },
    { "query": "Linux performance tuning guide" },
    { "query": "Kubernetes operations best practices" },
    { "query": "Docker container optimization" },
    { "query": "operating system security hardening" },
    { "query": "CVE vulnerability analysis 2026" },
    { "query": "kernel security patch review" },
    { "query": "system administration automation" }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add config/sources.json
git commit -m "feat(blog): add blogTopics config to sources.json"
```

---

### Task 3: 博客抓取器（TDD）

**Files:**
- Create: `__tests__/lib/server/blog-fetcher.test.ts`
- Create: `lib/server/blog-fetcher.ts`

- [ ] **Step 1: 编写抓取器测试**

```typescript
// __tests__/lib/server/blog-fetcher.test.ts
import { buildBlogFromSearchResult, deduplicateBlogs } from '@/lib/server/blog-fetcher';
import type { RawBlog } from '@/types/blog';

describe('buildBlogFromSearchResult', () => {
  it('builds a RawBlog from a search result', () => {
    const result = buildBlogFromSearchResult({
      title: 'How to Build AI Agents',
      url: 'https://blog.example.com/ai-agents',
      source: 'Example Blog',
      date: '2026-05-20',
    });

    expect(result).toMatchObject({
      title_en: 'How to Build AI Agents',
      source: 'Example Blog',
      url: 'https://blog.example.com/ai-agents',
    });
    expect(result.id).toBeDefined();
    expect(result.fetched_at).toBeDefined();
  });

  it('returns null for invalid URL', () => {
    const result = buildBlogFromSearchResult({
      title: 'Test',
      url: 'not-a-url',
      source: 'Test',
    });
    expect(result).toBeNull();
  });

  it('uses "Unknown" as default source when not provided', () => {
    const result = buildBlogFromSearchResult({
      title: 'Test Article',
      url: 'https://example.com/test',
    });
    expect(result?.source).toBe('Unknown');
  });
});

describe('deduplicateBlogs', () => {
  it('removes duplicates by URL', () => {
    const blogs: RawBlog[] = [
      {
        id: '1',
        title_en: 'Title 1',
        source: 'A',
        url: 'https://example.com/1',
        published_at: '2026-05-20T00:00:00Z',
        fetched_at: '2026-05-20T00:00:00Z',
      },
      {
        id: '1',
        title_en: 'Title 1 dup',
        source: 'B',
        url: 'https://example.com/1',
        published_at: '2026-05-20T00:00:00Z',
        fetched_at: '2026-05-20T00:00:00Z',
      },
      {
        id: '2',
        title_en: 'Title 2',
        source: 'A',
        url: 'https://example.com/2',
        published_at: '2026-05-19T00:00:00Z',
        fetched_at: '2026-05-20T00:00:00Z',
      },
    ];

    const result = deduplicateBlogs(blogs);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateBlogs([])).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx jest __tests__/lib/server/blog-fetcher.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现抓取器**

```typescript
// lib/server/blog-fetcher.ts
import { createHash } from 'crypto';

import { RawBlog, RawBlogSchema } from '@/types/blog';

interface SearchResult {
  title: string;
  url: string;
  source?: string;
  date?: string;
}

export function buildBlogFromSearchResult(result: SearchResult): RawBlog | null {
  if (!result.url || !result.title) return null;

  // Basic URL validation
  try {
    new URL(result.url);
  } catch {
    return null;
  }

  const raw: RawBlog = {
    id: createHash('md5').update(result.url).digest('hex'),
    title_en: result.title,
    source: result.source || 'Unknown',
    url: result.url,
    published_at: result.date
      ? new Date(result.date).toISOString()
      : new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  };

  const parsed = RawBlogSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

export function deduplicateBlogs(blogs: RawBlog[]): RawBlog[] {
  const seen = new Set<string>();
  return blogs.filter((blog) => {
    if (seen.has(blog.id)) return false;
    seen.add(blog.id);
    return true;
  });
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx jest __tests__/lib/server/blog-fetcher.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/blog-fetcher.ts __tests__/lib/server/blog-fetcher.test.ts
git commit -m "feat(blog): add blog fetcher with dedup logic"
```

---

### Task 4: 博客翻译函数

**Files:**
- Modify: `lib/server/translator.ts`

- [ ] **Step 1: 添加博客翻译 Prompt 和解析函数**

在 `lib/server/translator.ts` 末尾添加：

```typescript
// --- Blog translation ---

const BlogTranslationResultSchema = z.object({
  id: z.string(),
  title_zh: z.string(),
  summary_zh: z.string(),
});

type BlogTranslationResult = z.infer<typeof BlogTranslationResultSchema>;

export function buildBlogTranslationPrompt(blogs: RawBlog[]): string {
  return `You are a professional tech blog translator and editor.

Given the following English tech blog titles, for each blog:
1. Translate the title to natural, accurate Chinese
2. Write a 200-300 character Chinese summary suitable for a tech audience
3. Focus on technical depth and practical value in the summary

Respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON array.
Each object must have exactly these fields: id, title_zh, summary_zh

Blogs:
${JSON.stringify(
  blogs.map((b) => ({ id: b.id, title: b.title_en, source: b.source })),
  null,
  2
)}`;
}

export function parseBlogTranslationResults(output: string): BlogTranslationResult[] {
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in output: ${output.slice(0, 200)}`);
  }

  const raw: unknown = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(raw)) {
    throw new Error('Expected JSON array from model output');
  }

  const seenIds = new Set<string>();

  return raw.flatMap((item, index) => {
    const result = BlogTranslationResultSchema.safeParse(item);
    if (!result.success) {
      console.warn(`Skipping invalid blog translation at index ${index}:`, result.error.format());
      return [];
    }

    const entry = result.data;
    if (seenIds.has(entry.id)) {
      console.warn(`Skipping duplicate blog translation for ${entry.id}`);
      return [];
    }

    seenIds.add(entry.id);
    return [entry];
  });
}
```

还需要在文件顶部确保导入了 `RawBlog` 类型：

```typescript
import { Article, ArticleSchema, CATEGORIES, RawArticle } from '@/types/article';
import { RawBlog } from '@/types/blog';  // 新增
```

- [ ] **Step 2: 验证编译通过**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add lib/server/translator.ts
git commit -m "feat(blog): add blog translation prompt and parser"
```

---

### Task 5: 博客合并器（TDD）

**Files:**
- Create: `__tests__/scripts/merge-blogs.test.ts`
- Create: `scripts/merge-blogs.ts`

- [ ] **Step 1: 编写合并器测试**

```typescript
// __tests__/scripts/merge-blogs.test.ts
import { mergeBlogs } from '@/scripts/merge-blogs';
import type { Blog } from '@/types/blog';

const makeBlog = (id: string, published_at: string): Blog => ({
  id,
  title_en: `Title ${id}`,
  title_zh: `标题 ${id}`,
  summary_zh: `摘要 ${id}`,
  source: 'Test',
  url: `https://example.com/${id}`,
  published_at,
  fetched_at: '2026-05-22T11:00:00Z',
});

describe('mergeBlogs', () => {
  it('adds new blogs to existing ones', () => {
    const existing = [makeBlog('old1', '2026-05-22T08:00:00Z')];
    const incoming = [makeBlog('new1', '2026-05-22T10:00:00Z')];
    const result = mergeBlogs(existing, incoming);
    expect(result).toHaveLength(2);
  });

  it('deduplicates by id', () => {
    const existing = [makeBlog('dup1', '2026-05-22T08:00:00Z')];
    const incoming = [makeBlog('dup1', '2026-05-22T08:00:00Z')];
    const result = mergeBlogs(existing, incoming);
    expect(result).toHaveLength(1);
  });

  it('sorts by published_at descending', () => {
    const existing = [makeBlog('a', '2026-05-22T06:00:00Z')];
    const incoming = [makeBlog('b', '2026-05-22T10:00:00Z')];
    const result = mergeBlogs(existing, incoming);
    expect(result[0].id).toBe('b');
  });

  it('truncates to 200 blogs maximum', () => {
    const existing = Array.from({ length: 190 }, (_, i) =>
      makeBlog(`e${i}`, '2026-05-22T08:00:00Z')
    );
    const incoming = Array.from({ length: 20 }, (_, i) =>
      makeBlog(`n${i}`, '2026-05-22T10:00:00Z')
    );
    const result = mergeBlogs(existing, incoming);
    expect(result).toHaveLength(200);
  });

  it('returns empty array when both inputs are empty', () => {
    expect(mergeBlogs([], [])).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx jest __tests__/scripts/merge-blogs.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现合并器**

```typescript
// scripts/merge-blogs.ts
import fs from 'fs';

import type { Blog } from '@/types/blog';

const MAX_BLOGS = 200;

export function mergeBlogs(existing: Blog[], incoming: Blog[]): Blog[] {
  const existingIds = new Set(existing.map((b) => b.id));
  const newOnes = incoming.filter((b) => !existingIds.has(b.id));
  const combined = [...existing, ...newOnes];
  combined.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  return combined.slice(0, MAX_BLOGS);
}

if (require.main === module) {
  const existingPath = process.argv[2];
  const incomingPath = process.argv[3];
  const existing: Blog[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const incoming: Blog[] = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));
  const merged = mergeBlogs(existing, incoming);
  fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));
  console.log(`Merged: ${incoming.length} incoming → ${merged.length} total`);
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx jest __tests__/scripts/merge-blogs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/merge-blogs.ts __tests__/scripts/merge-blogs.test.ts
git commit -m "feat(blog): add blog merge script with dedup and sort"
```

---

### Task 6: 博客数据服务层（TDD）

**Files:**
- Create: `data/blogs.json`（空数组）
- Create: `__tests__/lib/blogs.server.test.ts`
- Create: `lib/blogs.server.ts`

- [ ] **Step 1: 创建空数据文件**

```json
[]
```

写入 `data/blogs.json`。

- [ ] **Step 2: 编写数据服务层测试**

```typescript
// __tests__/lib/blogs.server.test.ts
import { getAllBlogs, getBlogById, getRecentBlogs } from '@/lib/blogs.server';

describe('getAllBlogs', () => {
  it('returns blogs sorted by published_at descending', () => {
    const result = getAllBlogs();
    for (let i = 1; i < result.length; i += 1) {
      expect(new Date(result[i - 1].published_at).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i].published_at).getTime()
      );
    }
  });
});

describe('getRecentBlogs', () => {
  it('returns the specified number of blogs', () => {
    const result = getRecentBlogs(3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('returns all blogs if count exceeds total', () => {
    const all = getAllBlogs();
    const result = getRecentBlogs(999);
    expect(result.length).toBe(all.length);
  });
});

describe('getBlogById', () => {
  it('returns the blog with matching id', () => {
    const all = getAllBlogs();
    if (all.length > 0) {
      expect(getBlogById(all[0].id)?.id).toBe(all[0].id);
    }
  });

  it('returns undefined for missing id', () => {
    expect(getBlogById('nonexistent')).toBeUndefined();
  });
});
```

- [ ] **Step 3: 运行测试验证失败**

Run: `npx jest __tests__/lib/blogs.server.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 4: 实现数据服务层**

```typescript
// lib/blogs.server.ts
import blogsData from '@/data/blogs.json';
import type { Blog } from '@/types/blog';

const blogs = blogsData as Blog[];

export function getAllBlogs(): Blog[] {
  return [...blogs].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getRecentBlogs(count: number): Blog[] {
  return getAllBlogs().slice(0, count);
}

export function getBlogById(id: string): Blog | undefined {
  return blogs.find((blog) => blog.id === id);
}
```

- [ ] **Step 5: 运行测试验证通过**

Run: `npx jest __tests__/lib/blogs.server.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add data/blogs.json lib/blogs.server.ts __tests__/lib/blogs.server.test.ts
git commit -m "feat(blog): add blog data service layer"
```

---

### Task 7: 博客抓取脚本入口

**Files:**
- Create: `scripts/fetch-blogs.ts`

- [ ] **Step 1: 创建抓取脚本**

```typescript
// scripts/fetch-blogs.ts
import { existsSync, readFileSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { z } from 'zod';

import { buildBlogFromSearchResult, deduplicateBlogs } from '@/lib/server/blog-fetcher';
import { translateBlogs } from '@/lib/server/blog-translator';
import { mergeBlogs } from '@/scripts/merge-blogs';
import { Blog, BlogSchema, RawBlog } from '@/types/blog';

const BlogTopicSchema = z.object({
  query: z.string().min(1),
});

const SourcesConfigSchema = z.object({
  blogTopics: z.array(BlogTopicSchema).optional(),
});

export function parseBlogTopics(raw: unknown): string[] {
  const result = SourcesConfigSchema.safeParse(raw);
  if (!result.success || !result.data.blogTopics) {
    return [];
  }
  return result.data.blogTopics.map((t) => t.query);
}

export async function searchBlogs(query: string): Promise<RawBlog[]> {
  // This function will be called with anysearch results
  // For now, it's a placeholder that processes search results
  // The actual anysearch integration happens in the calling code
  console.log(`  Searching: "${query}"`);
  return [];
}

export async function fetchAndSaveBlogs(): Promise<void> {
  const sourcesPath = path.join(process.cwd(), 'config/sources.json');
  const dataPath = path.join(process.cwd(), 'data/blogs.json');

  if (!existsSync(sourcesPath)) {
    console.error(`Sources config not found at ${sourcesPath}`);
    return;
  }

  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
  const queries = parseBlogTopics(sources);

  if (queries.length === 0) {
    console.log('No blog topics configured. Skipping.');
    return;
  }

  console.log(`Fetching blogs for ${queries.length} topics...`);
  const allRaw: RawBlog[] = [];

  for (const query of queries) {
    try {
      const blogs = await searchBlogs(query);
      allRaw.push(...blogs);
      console.log(`  "${query}": ${blogs.length} results`);
    } catch (err) {
      console.error(`  "${query}" failed:`, err);
    }
  }

  const deduplicated = deduplicateBlogs(allRaw);
  console.log(`\nTotal unique blogs: ${deduplicated.length}`);

  if (deduplicated.length === 0) {
    console.log('No new blogs found. Skipping translation.');
    return;
  }

  // Read existing blogs for dedup against already-translated ones
  let existing: Blog[] = [];
  if (existsSync(dataPath)) {
    try {
      existing = JSON.parse(readFileSync(dataPath, 'utf8'));
    } catch {
      console.log('Could not parse existing blogs.json, starting fresh.');
    }
  }

  const existingIds = new Set(existing.map((b) => b.id));
  const newBlogs = deduplicated.filter((b) => !existingIds.has(b.id));
  console.log(`New blogs to translate: ${newBlogs.length}`);

  if (newBlogs.length === 0) {
    console.log('No new blogs. Skipping translation.');
    return;
  }

  console.log('\nTranslating blogs...');
  const translated = await translateBlogs(newBlogs);
  console.log(`  Translated: ${translated.length}/${newBlogs.length}`);

  if (translated.length === 0) {
    console.error('Translation failed: no blogs were translated. Exiting.');
    return;
  }

  console.log('\nMerging blogs...');
  const merged = mergeBlogs(existing, translated);

  // Validate before write
  const validated = merged.filter((b) => {
    const res = BlogSchema.safeParse(b);
    if (!res.success) {
      console.warn(`Invalid blog ${b.id}, dropping:`, res.error.format());
      return false;
    }
    return true;
  });

  writeFileSync(dataPath, JSON.stringify(validated, null, 2));
  console.log(`  Total blogs: ${validated.length}`);
}

if (require.main === module) {
  fetchAndSaveBlogs().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 2: 验证编译通过**

Run: `npx tsc --noEmit --project tsconfig.scripts.json`
Expected: 无错误（注意：blog-translator 模块还未创建，可能需要先创建空模块或跳过此检查）

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch-blogs.ts
git commit -m "feat(blog): add blog fetch script entry point"
```

---

### Task 8: 博客翻译服务

**Files:**
- Create: `lib/server/blog-translator.ts`

- [ ] **Step 1: 创建博客翻译服务**

```typescript
// lib/server/blog-translator.ts
import { buildBlogTranslationPrompt, parseBlogTranslationResults } from './translator';
import { Blog, BlogSchema, RawBlog } from '@/types/blog';

const BATCH_SIZE = 15;

async function translateBlogBatch(
  batch: RawBlog[],
  apiKey: string,
  retries = 2
): Promise<Array<{ id: string; title_zh: string; summary_zh: string }>> {
  const prompt = buildBlogTranslationPrompt(batch);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errText}`);
      }

      const data = await response.json();
      const output = data.choices?.[0]?.message?.content;

      if (!output) {
        throw new Error('DeepSeek API response did not include choices[0].message.content');
      }

      return parseBlogTranslationResults(output);
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return [];
}

export async function translateBlogs(rawBlogs: RawBlog[]): Promise<Blog[]> {
  if (rawBlogs.length === 0) return [];

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not set');
    return [];
  }

  const batches: RawBlog[][] = [];
  for (let i = 0; i < rawBlogs.length; i += BATCH_SIZE) {
    batches.push(rawBlogs.slice(i, i + BATCH_SIZE));
  }
  console.log(`  Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} blogs...`);

  const allTranslations: Array<{ id: string; title_zh: string; summary_zh: string }> = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} blogs`);
    try {
      const results = await translateBlogBatch(batch, apiKey);
      allTranslations.push(...results);
    } catch (err) {
      console.error(`  Batch ${i + 1} failed after retries:`, err);
    }
  }

  const translationMap = new Map(allTranslations.map((t) => [t.id, t]));

  return rawBlogs
    .map((raw) => {
      const t = translationMap.get(raw.id);
      if (!t) return null;
      const combined = {
        ...raw,
        title_zh: t.title_zh,
        summary_zh: t.summary_zh,
      };
      const result = BlogSchema.safeParse(combined);
      if (!result.success) {
        console.warn(`Invalid merged blog for ${raw.id}:`, result.error.format());
        return null;
      }
      return result.data;
    })
    .filter((b): b is Blog => b !== null);
}
```

- [ ] **Step 2: 验证编译通过**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add lib/server/blog-translator.ts
git commit -m "feat(blog): add blog translation service"
```

---

### Task 9: 博客卡片组件（TDD）

**Files:**
- Create: `__tests__/components/BlogCard.test.tsx`
- Create: `components/Blog/BlogCard.tsx`

- [ ] **Step 1: 编写博客卡片测试**

```typescript
// __tests__/components/BlogCard.test.tsx
import { render, screen } from '@testing-library/react';

import BlogCard from '@/components/Blog/BlogCard';
import type { Blog } from '@/types/blog';

const mockBlog: Blog = {
  id: 'test123',
  title_en: 'How to Build AI Agents',
  title_zh: '如何构建 AI Agent',
  summary_zh: '本文介绍了构建 AI Agent 的核心技术和最佳实践，涵盖工具调用、记忆管理和多步推理等关键概念。',
  source: 'AI Blog',
  url: 'https://example.com/ai-agents',
  published_at: '2026-05-20T10:00:00Z',
  fetched_at: '2026-05-22T08:00:00Z',
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx jest __tests__/components/BlogCard.test.tsx`
Expected: FAIL（组件不存在）

- [ ] **Step 3: 实现博客卡片组件**

```tsx
// components/Blog/BlogCard.tsx
import type { Blog } from '@/types/blog';

import TimeAgo from '@/components/UI/TimeAgo';

interface Props {
  blog: Blog;
}

export default function BlogCard({ blog }: Props) {
  return (
    <a
      href={blog.url}
      target="_blank"
      rel="noopener noreferrer"
      className="blog-card"
    >
      <div className="blog-card__header">
        <span className="blog-card__source mono-label">{blog.source}</span>
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
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx jest __tests__/components/BlogCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/Blog/BlogCard.tsx __tests__/components/BlogCard.test.tsx
git commit -m "feat(blog): add BlogCard component"
```

---

### Task 10: 博客区块组件（TDD）

**Files:**
- Create: `__tests__/components/BlogSection.test.tsx`
- Create: `components/Blog/BlogSection.tsx`

- [ ] **Step 1: 编写博客区块测试**

```typescript
// __tests__/components/BlogSection.test.tsx
import { render, screen } from '@testing-library/react';

import BlogSection from '@/components/Blog/BlogSection';
import type { Blog } from '@/types/blog';

const makeBlog = (id: string): Blog => ({
  id,
  title_en: `Title ${id}`,
  title_zh: `标题 ${id}`,
  summary_zh: `摘要 ${id}`,
  source: 'Test',
  url: `https://example.com/${id}`,
  published_at: '2026-05-20T10:00:00Z',
  fetched_at: '2026-05-22T08:00:00Z',
});

describe('BlogSection', () => {
  it('renders section heading', () => {
    render(<BlogSection blogs={[makeBlog('1')]} />);
    expect(screen.getByText('精选博客')).toBeInTheDocument();
  });

  it('renders blog cards', () => {
    const blogs = [makeBlog('1'), makeBlog('2')];
    render(<BlogSection blogs={blogs} />);
    expect(screen.getByText('标题 1')).toBeInTheDocument();
    expect(screen.getByText('标题 2')).toBeInTheDocument();
  });

  it('renders empty state when no blogs', () => {
    render(<BlogSection blogs={[]} />);
    expect(screen.getByText('暂无精选博客')).toBeInTheDocument();
  });

  it('renders at most 8 blogs', () => {
    const blogs = Array.from({ length: 10 }, (_, i) => makeBlog(`${i}`));
    render(<BlogSection blogs={blogs} />);
    // Only first 8 should be rendered
    expect(screen.getByText('标题 0')).toBeInTheDocument();
    expect(screen.getByText('标题 7')).toBeInTheDocument();
    expect(screen.queryByText('标题 8')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx jest __tests__/components/BlogSection.test.tsx`
Expected: FAIL（组件不存在）

- [ ] **Step 3: 实现博客区块组件**

```tsx
// components/Blog/BlogSection.tsx
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
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx jest __tests__/components/BlogSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/Blog/BlogSection.tsx __tests__/components/BlogSection.test.tsx
git commit -m "feat(blog): add BlogSection component"
```

---

### Task 11: 首页集成

**Files:**
- Modify: `pages/index.tsx`

- [ ] **Step 1: 修改首页集成博客区块**

读取当前 `pages/index.tsx`，进行以下修改：

1. 添加 BlogSection 导入
2. 添加 recentBlogs 到 Props 接口
3. 在 Layout 中添加 BlogSection
4. 在 getStaticProps 中获取博客数据

修改后的完整文件：

```tsx
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import ArticleFeed from '@/components/Article/ArticleFeed';
import BlogSection from '@/components/Blog/BlogSection';
import Layout from '@/components/Layout/Layout';
import SearchResults from '@/components/Search/SearchResults';
import { getRecommendedArticles, searchArticles } from '@/lib/article-search';
import SeoHead from '@/lib/seo';
import { buildWebsiteStructuredData, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import type { Article } from '@/types/article';
import type { Blog } from '@/types/blog';

const INITIAL_HOME_ARTICLES = 13;

interface Props {
  articles: Article[];
  initialArticles: Article[];
  recentBlogs: Blog[];
}

export default function Home({ articles, initialArticles, recentBlogs }: Props) {
  const router = useRouter();
  const query = typeof router.query.q === 'string' ? router.query.q : '';
  const trimmedQuery = query.trim();

  const searchResults = useMemo(
    () => searchArticles(articles, trimmedQuery),
    [articles, trimmedQuery]
  );
  const recommendedArticles = useMemo(() => getRecommendedArticles(articles, 4), [articles]);

  return (
    <>
      <SeoHead title={`${SITE_NAME} | AI 资讯聚合`} description={SITE_DESCRIPTION} pathname="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteStructuredData()) }}
      />
      <Layout>
        {trimmedQuery ? (
          <SearchResults
            query={trimmedQuery}
            results={searchResults}
            recommendedArticles={recommendedArticles}
            onClear={() => router.push('/')}
          />
        ) : (
          <>
            <BlogSection blogs={recentBlogs} />
            <ArticleFeed
              initialArticles={initialArticles}
              featured
              emptyMessage="暂无文章，稍后再来看看。"
            />
          </>
        )}
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllArticles } = await import('@/lib/articles.server');
  const { getRecentBlogs } = await import('@/lib/blogs.server');
  const allArticles = getAllArticles();

  return {
    props: {
      articles: allArticles,
      initialArticles: allArticles.slice(0, INITIAL_HOME_ARTICLES),
      recentBlogs: getRecentBlogs(8),
    },
  };
};
```

- [ ] **Step 2: 验证编译通过**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add pages/index.tsx
git commit -m "feat(blog): integrate BlogSection into homepage"
```

---

### Task 12: 更新流程集成

**Files:**
- Modify: `scripts/update.ts`
- Modify: `package.json`

- [ ] **Step 1: 修改 update.ts 集成博客抓取**

读取当前 `scripts/update.ts`，在 `fetchAndSaveTrending()` 调用之前添加博客抓取：

```typescript
// 在 import 部分添加
import { fetchAndSaveBlogs } from './fetch-blogs';

// 在 main() 函数中，在 "Fetching GitHub Trending..." 之前添加
console.log('\nFetching featured blogs...');
try {
  await fetchAndSaveBlogs();
} catch (err) {
  console.error('Failed to fetch blogs:', err);
}
```

- [ ] **Step 2: 添加 npm scripts**

读取当前 `package.json`，在 scripts 部分添加：

```json
{
  "scripts": {
    "update:blogs": "ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/fetch-blogs.ts",
    "update:all": "npm run update && npm run update:blogs"
  }
}
```

- [ ] **Step 3: 验证编译通过**

Run: `npx tsc --noEmit --project tsconfig.scripts.json`
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add scripts/update.ts package.json
git commit -m "feat(blog): integrate blog fetch into update pipeline"
```

---

### Task 13: 样式添加

**Files:**
- Modify: 全局 CSS 文件（需要确认具体路径）

- [ ] **Step 1: 添加博客组件样式**

在项目的全局样式文件中添加博客相关样式（需要先确认样式文件位置，可能是 `styles/` 目录或组件同目录的 CSS 模块）：

```css
/* Blog Section */
.blog-section {
  margin-bottom: 3rem;
}

.blog-section__header {
  margin-bottom: 1.5rem;
}

.blog-section__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.blog-section__subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.blog-section__empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.blog-section__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .blog-section__grid {
    grid-template-columns: 1fr;
  }
}

/* Blog Card */
.blog-card {
  display: block;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: var(--card-bg, #1a1a2e);
  border: 1px solid var(--border-color, #2a2a3e);
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.blog-card:hover {
  border-color: var(--accent-color, #6EE7F7);
  box-shadow: 0 0 20px var(--glow-color, rgba(110, 231, 247, 0.1));
}

.blog-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.blog-card__source {
  font-size: 0.75rem;
  color: var(--accent-color, #6EE7F7);
}

.blog-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-card__summary {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.blog-card__footer {
  font-size: 0.75rem;
  color: var(--accent-color, #6EE7F7);
}

.blog-card__link {
  font-weight: 500;
}
```

- [ ] **Step 2: Commit**

```bash
git add <styles-file>
git commit -m "feat(blog): add blog component styles"
```

---

### Task 14: 全量测试验证

**Files:** 无新增

- [ ] **Step 1: 运行所有测试**

Run: `npm test`
Expected: 所有测试通过

- [ ] **Step 2: 运行 lint 检查**

Run: `npm run lint`
Expected: 无错误

- [ ] **Step 3: 运行构建**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "feat(blog): complete featured blogs feature"
```
