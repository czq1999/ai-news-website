# AI 新闻聚合网站设计规格

**日期：** 2026-03-24
**状态：** 已批准

---

## 概述

一个全自动的 AI 资讯聚合网站，从英文权威来源抓取新闻，通过 AI 翻译成中文后展示给用户。无用户账号体系，纯展示站点，无运行时后端。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | Next.js 14 + TypeScript |
| 样式 | Tailwind CSS |
| 自动化 | GitHub Actions（定时任务） |
| 部署 | Vercel（免费套餐） |
| AI 翻译 | Claude API（claude-haiku-4-5，成本最低） |
| 数据存储 | 仓库内 JSON 文件（`data/articles.json`） |

---

## 架构

```
[RSS Feeds / NewsAPI]
        ↓（每小时）
[GitHub Actions]
  1. 抓取新文章
  2. 去重（URL hash）
  3. 调用 Claude API 翻译标题+生成摘要
  4. 写入 data/articles.json
  5. git commit + push
        ↓（push 触发）
[Vercel 重新构建]
  Next.js SSG 静态生成所有页面
        ↓
[全球 CDN 分发给用户]
```

**核心原则：** 运行时零服务器，GitHub Actions 充当隐形后端，所有页面为静态 HTML。

---

## 页面路由

| 路由 | 描述 |
|------|------|
| `/` | 首页：侧边栏分类导航 + 文章卡片网格 |
| `/category/[slug]` | 分类页：按类别筛选的文章列表 |
| `/article/[slug]` | 文章详情页：中文标题、摘要、原文链接 |

---

## 数据模型

`data/articles.json` 存储文章数组，最多保留 500 条（自动滚动淘汰）：

```typescript
interface Article {
  id: string;           // URL 的 MD5 hash
  title_en: string;     // 原始英文标题
  title_zh: string;     // AI 翻译的中文标题
  summary_zh: string;   // AI 生成的 200-300 字中文摘要
  category: 'llm' | 'product' | 'research' | 'industry';
  source: string;       // 来源名称，如 "TechCrunch"
  url: string;          // 原文链接
  published_at: string; // ISO 8601 时间
  fetched_at: string;   // ISO 8601 时间
}
```

---

## 数据来源

### RSS Feeds（`config/sources.json`）

- TechCrunch AI
- The Verge
- Ars Technica
- Wired
- MIT Technology Review
- VentureBeat AI

### News API

- NewsAPI.org（免费套餐，每日 100 次请求）

---

## GitHub Actions 工作流

**文件：** `.github/workflows/fetch-and-translate.yml`
**触发：** 每小时（`cron: '0 * * * *'`）

```
步骤：
1. Checkout 仓库
2. 安装 Node.js 依赖
3. 运行 scripts/fetch.ts — 抓取 RSS + API，返回新文章列表
4. 运行 scripts/translate.ts — 调用 Claude API 批量翻译
5. 运行 scripts/merge.ts — 合并到 data/articles.json，去重，截断至 500 条
6. Git commit & push（仅当有新文章时）
```

**所需 Secrets：**
- `CLAUDE_API_KEY` — Anthropic API 密钥
- `NEWS_API_KEY` — NewsAPI.org 密钥

---

## 前端组件结构

```
components/
  Layout/
    Sidebar.tsx       — 左侧分类导航
    Header.tsx        — 顶部品牌栏 + 搜索框
  Article/
    ArticleCard.tsx   — 文章卡片（首页/分类页用）
    ArticleDetail.tsx — 文章详情内容
  UI/
    CategoryBadge.tsx — 分类标签（颜色编码）
    TimeAgo.tsx       — 相对时间显示

pages/
  index.tsx           — 首页
  category/[slug].tsx — 分类页
  article/[slug].tsx  — 详情页

scripts/
  fetch.ts            — 抓取 RSS + NewsAPI
  translate.ts        — Claude API 翻译
  merge.ts            — 数据合并与去重

data/
  articles.json       — 文章数据

config/
  sources.json        — RSS 来源配置
```

---

## 视觉设计

- **风格：** 深色科技风（GitHub 深色系）
- **布局：** 左侧固定侧边栏 + 右侧卡片网格
- **主色：** `#58a6ff`（蓝色强调）
- **背景：** `#0d1117`（主背景）/ `#161b22`（卡片背景）
- **分类颜色编码：**
  - 大模型（llm）：`#58a6ff` 蓝
  - 产品（product）：`#f78166` 橙红
  - 研究（research）：`#d2a8ff` 紫
  - 行业（industry）：`#3fb950` 绿

---

## 文章详情页内容

- 中文标题（大字号）
- 来源 + 发布时间
- 分类标签
- AI 生成中文摘要（200-300 字）
- "阅读原文"按钮（跳转至原始 URL）
- **不托管全文**（规避版权风险）

---

## 约束与边界

- **不含用户系统**：无登录、无收藏、无评论
- **不含搜索后端**：搜索功能（如有）基于客户端过滤
- **不含数据库**：所有数据以 JSON 文件存储于仓库
- **内容更新延迟**：最大约 1 小时（由 Actions 触发频率决定）+ 约 1-2 分钟构建时间
- **API 成本控制**：使用 claude-haiku-4-5，每篇文章翻译成本约 $0.001

---

## 成功标准

1. GitHub Actions 能自动抓取并翻译文章，无需人工干预
2. 每小时至少更新一次内容
3. 首页加载时间 < 2 秒（Vercel CDN）
4. 所有页面通过 Next.js SSG 生成，对 SEO 友好
