# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm test             # 运行所有测试
npm run test:watch   # 监听模式运行测试
npm run update       # 抓取新文章 → 翻译 → 合并到 data/articles.json
```

运行单个测试文件：

```bash
npx jest __tests__/lib/articles.test.ts
npx jest __tests__/scripts/fetch.test.ts
```

## 环境变量

- `DEEPSEEK_API_KEY` — 翻译所必需（使用 deepseek-chat 模型）
- `NEWS_API_KEY` — 可选，从 NewsAPI 抓取额外文章

## 架构

这是一个 **Next.js 14（Pages Router）** 项目，展示从英文 RSS/API 聚合并翻译为中文的 AI 新闻。

### 数据流

```
config/sources.json
    ↓
scripts/fetch.ts     — 从 RSS feeds 和 NewsAPI 抓取，生成 RawArticle（无中文字段）
    ↓
scripts/translate.ts — 调用 DeepSeek API，批量翻译（每批 15 篇），补全 title_zh、summary_zh、category
    ↓
scripts/merge.ts     — 去重后合并到现有 articles，按 published_at 降序排列
    ↓
data/articles.json   — 静态数据文件，作为唯一真实来源
    ↓
lib/articles.ts      — 运行时读取 JSON，提供 getAllArticles / getArticlesByCategory / getArticleById
    ↓
pages/               — Next.js 静态生成页面，通过 getStaticProps 消费数据
```

### 核心类型

`types/article.ts` 定义了两个核心接口：

- `RawArticle` — 抓取后、翻译前的文章（无中文字段，id 为 URL 的 MD5 hash）
- `Article` — 翻译后的完整文章，包含 `title_zh`、`summary_zh`、`category`

Category 只有四种：`llm` | `product` | `research` | `industry`

### 页面结构

- `pages/index.tsx` — 首页，展示全部文章网格
- `pages/category/[slug].tsx` — 分类页
- `pages/article/[id].tsx` — 文章详情页（链接至原文）

所有页面使用 `getStaticProps` 静态生成，无 API 路由。

### 翻译机制

`scripts/translate.ts` 以每批 15 篇向 DeepSeek 发送请求，要求返回纯 JSON 数组（含 `id`、`title_zh`、`summary_zh`、`category`）。翻译失败的批次会被跳过但不会中断整体流程。

### 路径别名

`@/` 映射到项目根目录（在 `tsconfig.json` 和 `tsconfig.scripts.json` 中均已配置）。脚本使用 `tsconfig.scripts.json`（CommonJS 模块），前端代码使用默认 `tsconfig.json`（ESNext）。

### 测试

测试文件位于 `__tests__/`，分三个子目录镜像源码结构（`components/`、`lib/`、`scripts/`）。测试环境为 jsdom，通过 ts-jest 运行。
