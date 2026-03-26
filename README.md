# AI News Website

一个基于 Next.js 14 的 AI 新闻聚合站点。项目会抓取英文 AI 新闻源，调用翻译脚本生成中文标题与摘要，再以静态站点形式发布到 GitHub Pages。

## 功能概览

- 首页、分类页、详情页三层信息架构
- 聚合大模型、产品、研究、行业四类内容
- 详情页展示中文摘要、原文标题、来源信息与时间
- 通过 `public/data/articles-feed.json` 支持前端“加载更多”
- 更新脚本支持 RSS 与 NewsAPI 抓取、翻译、合并、发布

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址为 `http://localhost:3000`。

## 常用命令

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run update
```

## 数据更新流程

`npm run update` 会执行以下步骤：

1. 读取 `config/sources.json`
2. 抓取 RSS 和 NewsAPI 内容
3. 过滤已有文章与本次抓取中的重复文章
4. 调用翻译接口生成中文标题、摘要和分类
5. 合并到 `data/articles.json`
6. 同步生成 `public/data/articles-feed.json`

## 环境变量

- `DEEPSEEK_API_KEY`: 翻译脚本所需
- `NEWS_API_KEY`: 可选，用于补充 NewsAPI 数据源

## 目录结构

- `pages/`: 页面与静态路由
- `components/`: UI 组件
- `lib/`: 服务端数据读取、SEO 与标准化逻辑
- `scripts/`: 抓取、翻译、合并、更新脚本
- `data/`: 构建时使用的文章数据
- `public/data/`: 前端加载更多使用的数据文件
- `__tests__/`: 组件、页面和脚本测试

## 部署说明

项目当前配置了 `basePath: /ai-news-website`，适合发布到 GitHub Pages：

- 站点地址: `https://czq1999.github.io/ai-news-website`
- 仓库地址: `https://github.com/czq1999/ai-news-website`
