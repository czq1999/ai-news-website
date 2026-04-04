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

在现有 workflow 的同一 job 内，"Commit and push if changed" 步骤之后追加以下步骤。`upload-pages-artifact` 和 `deploy-pages` 必须在同一 job 中运行。

**跳过机制：** 在 "Commit and push if changed" 步骤中，通过 `git diff --staged --quiet` 判断是否有变化，将结果写入 step output（`articles_changed=true/false`），后续构建和部署步骤用 `if: steps.<id>.outputs.articles_changed == 'true'` 条件控制，无新文章时跳过。

```yaml
- name: Commit and push if changed
  id: commit
  run: |
    git config user.name "AI News Bot"
    git config user.email "bot@users.noreply.github.com"
    git add data/articles.json
    if git diff --staged --quiet; then
      echo "No changes to commit"
      echo "articles_changed=false" >> $GITHUB_OUTPUT
    else
      git commit -m "chore: update articles [skip ci]"
      git push
      echo "articles_changed=true" >> $GITHUB_OUTPUT
    fi

- name: Build static site
  if: steps.commit.outputs.articles_changed == 'true'
  run: npm run build

- name: Upload Pages artifact
  if: steps.commit.outputs.articles_changed == 'true'
  uses: actions/upload-pages-artifact@v3
  with:
    path: out/

- name: Deploy to GitHub Pages
  if: steps.commit.outputs.articles_changed == 'true'
  uses: actions/deploy-pages@v4
```

workflow 的 job 级别 `permissions` 需新增（追加到现有 `contents: write` 旁）：

```yaml
jobs:
  update:
    permissions:
      contents: write
      pages: write
      id-token: write # OIDC 部署所必需，必须在 job 级别
```

**执行链路：**

```
定时触发（每 6 小时）
  → 抓取 RSS + NewsAPI
  → DeepSeek 翻译
  → 提交 data/articles.json（有变化时）
      ├─ 无新文章 → articles_changed=false → 跳过构建和部署
      └─ 有新文章 → articles_changed=true
            → next build（生成 out/）
            → 部署 out/ 到 GitHub Pages
            → czq1999.github.io/ai-news-website/ 更新
```

注意：提交信息保留 `[skip ci]` 标记，防止该 push 再次触发本 workflow 形成循环。

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
