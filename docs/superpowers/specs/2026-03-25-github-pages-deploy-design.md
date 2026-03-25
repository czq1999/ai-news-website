# 设计文档：GitHub Pages 静态部署

**日期：** 2026-03-25
**目标：** 将 ai-news-website 部署到 `czq1999.github.io/ai-news-website/`，使国内用户无需 VPN 即可访问。

---

## 背景

项目目前通过 Vercel 部署，国内访问需要 VPN。用户的 `czq1999.github.io`（Hexo 博客）在国内可正常访问。GitHub Pages 对非用户仓库会以 `username.github.io/repo-name/` 的形式托管，因此 `ai-news-website` 仓库可以直接部署在 `czq1999.github.io/ai-news-website/`，无需改名或修改 Hexo 项目。

---

## 方案

**Next.js 静态导出 + GitHub Actions 自动构建部署**

将现有 Next.js 应用配置为静态导出模式，并在现有的 fetch-and-translate workflow 中追加构建和部署步骤。Vercel 部署保持不变，作为国际访问入口。

---

## 变更内容

### 1. `next.config.mjs`

新增两个配置项：

```js
output: 'export',
basePath: '/ai-news-website',
```

- `output: 'export'`：构建时生成纯静态文件到 `out/` 目录，替代 Next.js server-side 渲染
- `basePath: '/ai-news-website'`：所有路由、`<Link>`、静态资源路径自动加前缀，现有组件无需修改

本项目所有页面均使用 `getStaticProps`，与静态导出完全兼容，无 ISR/SSR 依赖。

### 2. `.github/workflows/fetch-and-translate.yml`

在现有 workflow 末尾追加步骤（仅在有新文章时执行，无新文章时 `update` 脚本以 `process.exit(0)` 提前退出，构建步骤不会运行）：

```yaml
- name: Build static site
  run: npm run build

- name: Upload Pages artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: out/

- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4
```

workflow 需要新增 permissions：

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

**执行链路：**

```
定时触发（每 6 小时）
  → 抓取 RSS + NewsAPI
  → DeepSeek 翻译
  → 提交 data/articles.json
  → next build（生成 out/）
  → 部署 out/ 到 GitHub Pages
  → czq1999.github.io/ai-news-website/ 更新
```

无新文章时，`npm run update` 在提交步骤前 `process.exit(0)`，构建和部署步骤不执行。

### 3. GitHub 仓库手动配置（一次性）

需在 GitHub 仓库设置中完成：

1. Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**
2. Settings → Actions → General → Workflow permissions 确认勾选 **Read and write permissions**

---

## 不变的内容

- Vercel 部署继续存在，国际用户仍可通过 Vercel URL 访问
- 所有 React 组件、页面文件、`lib/`、`scripts/` 均无需修改
- `data/articles.json` 的更新机制不变

---

## 约束与注意事项

- `output: 'export'` 下 `next/image` 默认禁用图片优化，如将来用到 `<Image>` 组件需配置 `unoptimized: true`
- `basePath` 仅对 Next.js 内部路由生效，外部绝对 URL（如原文链接）不受影响
- `gh-pages` 分支由 GitHub Actions 自动管理，不需要手动创建
