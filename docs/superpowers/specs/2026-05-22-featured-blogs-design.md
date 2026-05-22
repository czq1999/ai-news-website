# 精选博客功能设计文档

**日期**: 2026-05-22
**状态**: 设计完成，待审阅

## 1. 概述

为 AI 新闻网站新增"精选博客"功能，使用 anysearch 实时搜索引擎抓取高质量技术博客，主题覆盖 AI、Agent、Linux 运维、操作系统运维、操作系统漏洞。博客数据独立于新闻数据，在首页以专属区块展示。

## 2. 架构设计

```
anysearch (搜索博客)
    ↓
scripts/fetch-blogs.ts   — 按主题搜索，提取 URL 和元数据，生成 RawBlog
    ↓
lib/server/translator.ts — 复用现有翻译逻辑，翻译博客标题和摘要
    ↓
scripts/merge-blogs.ts   — 去重后合并到 data/blogs.json
    ↓
data/blogs.json          — 独立存储博客数据
    ↓
lib/blogs.server.ts      — 运行时读取博客数据
    ↓
components/Blog/BlogSection.tsx — 首页"精选博客"区块
```

### 设计决策

- 博客类型 `RawBlog` 复用 `RawArticle` 的结构（id、title_en、source、url、published_at、fetched_at）
- 翻译后的 `Blog` 在 `RawBlog` 基础上增加 `title_zh`、`summary_zh`
- 博客没有 category 字段（所有博客统一归类为"精选博客"）
- 搜索主题配置在 `config/sources.json` 的新 `blogTopics` 字段中

## 3. 类型定义

### `types/blog.ts`

```typescript
export type RawBlog = {
  id: string;           // URL 的 MD5 hash
  title_en: string;
  source: string;       // 来源平台名
  url: string;
  published_at: string;
  fetched_at: string;
};

export type Blog = RawBlog & {
  title_zh: string;
  summary_zh: string;
};
```

## 4. 配置结构

### `config/sources.json` 扩展

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

覆盖 5 个主题方向：AI、Agent、Linux 运维、操作系统运维、操作系统漏洞。

## 5. 抓取器设计

### `scripts/fetch-blogs.ts`

```typescript
export async function fetchAndSaveBlogs(): Promise<void> {
  // 1. 读取 config/sources.json 中的 blogTopics
  // 2. 对每个 topic 调用 anysearch 搜索
  // 3. 从搜索结果中提取博客 URL 和元数据
  // 4. 生成 RawBlog 对象（id = URL 的 MD5）
  // 5. 输出到临时文件供翻译使用
}
```

关键设计点：
- **anysearch 调用方式**：通过 MCP 工具调用 anysearch，获取搜索结果
- **结果过滤**：过滤掉非博客类内容（如产品页面、文档首页等），只保留实际博客文章
- **去重**：同一 URL 只保留一次
- **数量控制**：每个查询最多取 10 条结果，总共不超过 100 条新博客

## 6. 翻译器设计

复用现有 `lib/server/translator.ts` 的翻译逻辑，新增博客翻译函数：

```typescript
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
```

关键调整：
- **不分配 category**：博客统一归类，不需要分类字段
- **摘要侧重技术深度**：博客内容比新闻更深入，摘要应体现技术价值
- **复用批量翻译逻辑**：每批 15 篇，失败重试等机制完全复用

## 7. 合并器设计

### `scripts/merge-blogs.ts`

```typescript
export function mergeBlogs(existing: Blog[], incoming: Blog[]): Blog[] {
  const existingIds = new Set(existing.map((b) => b.id));
  const newOnes = incoming.filter((b) => !existingIds.has(b.id));
  const combined = [...existing, ...newOnes];
  combined.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return combined.slice(0, MAX_BLOGS);  // 限制最大数量，如 200
}
```

## 8. 更新流程集成

### `scripts/update.ts` 修改

```typescript
async function main() {
  // ... 现有新闻抓取流程 ...
  
  console.log('\nFetching featured blogs...');
  try {
    await fetchAndSaveBlogs();
  } catch (err) {
    console.error('Failed to fetch blogs:', err);
  }
  
  // ... 现有 GitHub Trending 抓取 ...
}
```

### npm scripts 扩展

```json
{
  "scripts": {
    "update": "...",           // 现有新闻更新
    "update:blogs": "...",     // 博客更新（可独立触发）
    "update:all": "..."        // 同时更新新闻和博客
  }
}
```

### GitHub Actions 考虑

由于 anysearch 是 MCP 工具，在 GitHub Actions 中无法直接调用。设计两种模式：

1. **本地模式**：直接调用 anysearch MCP 工具
2. **CI 模式**：通过 CLI 或 API 调用 anysearch（需要确认 anysearch 是否有 CLI 版本）

## 9. 前端展示设计

### 首页"精选博客"区块

在首页文章列表上方新增一个醒目的博客展示区域：

```
┌─────────────────────────────────────────────────┐
│  📰 最新资讯                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 文章 │ │ 文章 │ │ 文章 │ │ 文章 │  ...          │
│  └─────┘ └─────┘ └─────┘ └─────┘               │
├─────────────────────────────────────────────────┤
│  📝 精选博客                                      │
│  ┌─────────────────┐ ┌─────────────────┐        │
│  │ 博客标题         │ │ 博客标题         │        │
│  │ 中文摘要...      │ │ 中文摘要...      │        │
│  │ 来源 · 日期      │ │ 来源 · 日期      │        │
│  └─────────────────┘ └─────────────────┘        │
│  ┌─────────────────┐ ┌─────────────────┐        │
│  │ 博客标题         │ │ 博客标题         │        │
│  │ 中文摘要...      │ │ 中文摘要...      │        │
│  │ 来源 · 日期      │ │ 来源 · 日期      │        │
│  └─────────────────┘ └─────────────────┘        │
└─────────────────────────────────────────────────┘
```

### 组件设计

```typescript
// components/Blog/BlogSection.tsx
interface BlogSectionProps {
  blogs: Blog[];
}

// 展示最近 8 篇博客
// 每篇显示：中文标题、中文摘要（截断）、来源、日期
// 点击跳转到原文
```

### 数据获取

```typescript
// pages/index.tsx - getStaticProps 中新增博客数据
export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getAllArticles } = await import('@/lib/articles.server');
  const { getRecentBlogs } = await import('@/lib/blogs.server');
  
  return {
    props: {
      articles: getAllArticles(),
      initialArticles: getAllArticles().slice(0, INITIAL_HOME_ARTICLES),
      recentBlogs: getRecentBlogs(8),  // 新增
    },
  };
};
```

## 10. 数据服务层

### `lib/blogs.server.ts`

```typescript
import blogsData from '@/data/blogs.json';
import type { Blog } from '@/types/blog';

const blogs = (blogsData as Blog[]);

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

## 11. 错误处理

- **anysearch 调用失败**：跳过该查询，继续处理其他查询，不中断整体流程
- **翻译失败**：跳过失败的批次，保留已翻译的博客
- **数据文件损坏**：如果 `data/blogs.json` 不存在或格式错误，从空列表开始
- **空结果**：如果搜索无结果，正常结束，不报错

## 12. 测试策略

### 单元测试

```typescript
// __tests__/scripts/fetch-blogs.test.ts
- 测试 anysearch 结果解析
- 测试 URL 去重逻辑
- 测试 RawBlog 生成

// __tests__/lib/blogs.server.test.ts
- 测试博客数据读取
- 测试 getRecentBlogs 排序和截断
```

### 配置验证

```typescript
// 在 fetch-blogs.ts 中验证 blogTopics 配置
const BlogTopicSchema = z.object({
  query: z.string().min(1),
  domain: z.string().optional(),
});
```

## 13. 实现计划

1. 创建 `types/blog.ts` - 博客类型定义
2. 修改 `config/sources.json` - 新增 blogTopics 配置
3. 创建 `scripts/fetch-blogs.ts` - 博客抓取器
4. 修改 `lib/server/translator.ts` - 新增博客翻译函数
5. 创建 `scripts/merge-blogs.ts` - 博客合并器
6. 修改 `scripts/update.ts` - 集成博客抓取流程
7. 创建 `lib/blogs.server.ts` - 博客数据服务层
8. 创建 `components/Blog/BlogSection.tsx` - 首页博客区块
9. 修改 `pages/index.tsx` - 集成博客区块
10. 添加测试用例

## 14. 待确认事项

1. anysearch 是否有 CLI 版本，可在 GitHub Actions 中使用？
2. 博客内容是否需要全文抓取，还是只保留标题和摘要？
3. 是否需要博客详情页，还是只在首页展示区块？
