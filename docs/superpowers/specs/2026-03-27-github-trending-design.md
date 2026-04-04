# GitHub Trending 功能 + 移除安全治理分类 设计文档

**日期：** 2026-03-27
**状态：** 已确认，待实现

---

## 概述

本次变更包含两部分：

1. **移除 `safety`（安全治理）分类** — 该分类在现有数据中无任何文章，从类型定义、分类配置、翻译 prompt 中全部删除。
2. **新增 GitHub Trending 功能** — 每日自动抓取 GitHub Trending，用 DeepSeek 生成中文总结和描述，展示在独立的 `/trending` 页面，并在侧边栏与 Header 添加导航入口。

---

## 第一部分：移除安全治理分类

### 涉及文件

| 文件                        | 变更内容                                       |
| --------------------------- | ---------------------------------------------- |
| `types/article.ts`          | 从 `Category` union type 中删除 `'safety'`     |
| `lib/article-categories.ts` | 从 `ARTICLE_CATEGORIES` 数组中删除 safety 条目 |
| `scripts/translate.ts`      | 从翻译 prompt 中删除安全治理分类说明           |

### 注意

`data/articles.json` 中现有 0 篇文章归入 safety 分类，无需数据迁移。

---

## 第二部分：GitHub Trending 功能

### 数据结构

新增文件 `data/trending.json`，保留最近 30 天数据：

```json
{
  "days": [
    {
      "date": "2026-03-27",
      "summary_zh": "今日 GitHub Trending 以 AI 推理框架为主，多个项目今日新增 stars 超 500...",
      "projects": [
        {
          "rank": 1,
          "name": "owner/repo",
          "url": "https://github.com/owner/repo",
          "description_en": "原始英文描述",
          "description_zh": "翻译后的中文描述",
          "language": "Python",
          "stars_total": 12400,
          "stars_today": 856
        }
      ]
    }
  ]
}
```

### 新增类型文件 `types/trending.ts`

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

### 数据抓取流程

新增脚本 `scripts/fetch-trending.ts`：

```
抓取 github.com/trending（HTML 解析，无需 API key）
    ↓
提取前 25 个项目（name, url, description_en, language, stars_total, stars_today）
    ↓
调用 DeepSeek：批量翻译 description_en → description_zh
    ↓
调用 DeepSeek：基于项目列表生成当日 summary_zh（100-150 字）
    ↓
读取 data/trending.json，合并当天数据，裁剪超过 30 天的旧记录
    ↓
写回 data/trending.json
```

### 集成到现有更新流程

`scripts/update.ts` 末尾追加调用 `fetch-trending.ts`，无需修改 GitHub Actions workflow。

### 数据读取层 `lib/trending.ts`

提供以下函数（服务端专用，供 `getStaticProps` 调用）：

- `getTrendingData(): TrendingData` — 读取全部数据
- `getLatestTrendingDay(): TrendingDay | null` — 返回最新一天
- `getTrendingDayByDate(date: string): TrendingDay | null` — 按日期查询

### 页面 `pages/trending.tsx`

使用 `getStaticProps` 静态生成，布局如下：

```
┌─────────────────────────────────────────┐
│  2026-03-27  GitHub 热点项目             │
│  ┌─────────────────────────────────────┐│
│  │ AI 总结：今日 Trending 以...         ││
│  └─────────────────────────────────────┘│
│                                         │
│  [03-27] [03-26] [03-25] ...（最近7天） │
│                                         │
│  #1  owner/repo          Python ★ 856   │
│      中文描述...                [GitHub]│
│  #2  ...                                │
└─────────────────────────────────────────┘
```

### 导航变更

**侧边栏 `components/Layout/Sidebar.tsx`：**

在"收藏"条目下方、分类列表上方新增"热点项目"入口，链接至 `/trending`，独立硬编码（不进入 `FILTER_CATEGORIES` 数组）。

**Header `components/Layout/Header.tsx`：**

在"收藏"链接旁新增"热点项目"文字链接，active 状态样式与收藏链接一致。

---

## 文件变更汇总

| 文件                            | 操作                           |
| ------------------------------- | ------------------------------ |
| `types/article.ts`              | 修改：删除 `'safety'`          |
| `lib/article-categories.ts`     | 修改：删除 safety 条目         |
| `scripts/translate.ts`          | 修改：删除 safety 分类说明     |
| `types/trending.ts`             | 新增                           |
| `data/trending.json`            | 新增（脚本生成）               |
| `scripts/fetch-trending.ts`     | 新增                           |
| `scripts/update.ts`             | 修改：追加 fetch-trending 调用 |
| `lib/trending.ts`               | 新增                           |
| `pages/trending.tsx`            | 新增                           |
| `components/Layout/Sidebar.tsx` | 修改：新增热点项目入口         |
| `components/Layout/Header.tsx`  | 修改：新增热点项目链接         |

---

## 不在本次范围内

- GitHub Trending 历史归档（超过 30 天）
- 按语言/话题筛选 trending
- trending 数据的搜索功能
