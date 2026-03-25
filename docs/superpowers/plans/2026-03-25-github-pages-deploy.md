# GitHub Pages 静态部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ai-news-website 部署到 `czq1999.github.io/ai-news-website/`，使国内用户无需 VPN 即可访问，并在每次文章更新时自动重新构建部署。

**Architecture:** 在 `next.config.mjs` 开启 Next.js 静态导出（`output: 'export'`）并设置 `basePath`，构建产物输出到 `out/` 目录。在现有的 fetch-and-translate GitHub Actions workflow 中，将 commit 步骤改为输出 `articles_changed` 标志，并追加有条件执行的构建和 Pages 部署步骤，在同一 job 内完成整条链路。

**Tech Stack:** Next.js 14 static export、GitHub Actions (`actions/upload-pages-artifact@v3`、`actions/deploy-pages@v4`)

---

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `next.config.mjs` | 添加 `output: 'export'` 和 `basePath` |
| Modify | `.github/workflows/fetch-and-translate.yml` | 新增 permissions、改造 commit 步骤输出标志、追加构建和部署步骤 |

---

## Task 1：配置 Next.js 静态导出

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: 修改 `next.config.mjs`**

将文件改为：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/ai-news-website',
};

export default nextConfig;
```

- [ ] **Step 2: 本地验证构建**

```bash
npm run build
```

预期结果：
- 构建成功，无报错
- 生成 `out/` 目录
- `out/index.html` 存在
- `out/_next/` 中的静态资源路径包含 `/ai-news-website/_next/` 前缀（可用 `grep -r "/_next/" out/index.html` 验证）

- [ ] **Step 3: 将 `out/` 加入 `.gitignore`（如果尚未存在）**

检查 `.gitignore` 是否已有 `/out` 或 `out/`，若没有则追加：

```
/out
```

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs .gitignore
git commit -m "feat: enable Next.js static export with basePath for GitHub Pages"
```

---

## Task 2：更新 GitHub Actions Workflow

**Files:**
- Modify: `.github/workflows/fetch-and-translate.yml`

- [ ] **Step 1: 更新 job 级别 permissions**

将现有的：

```yaml
    permissions:
      contents: write         # 需要写权限来 push 到仓库
```

改为：

```yaml
    permissions:
      contents: write         # 需要写权限来 push 到仓库
      pages: write            # 部署到 GitHub Pages
      id-token: write         # OIDC 部署所必需，必须在 job 级别
```

- [ ] **Step 2: 改造 "Commit and push if changed" 步骤**

为该步骤添加 `id: commit`，并在两个分支都写入 `$GITHUB_OUTPUT`：

将现有的：

```yaml
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

替换为：

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
```

- [ ] **Step 3: 追加构建和部署步骤**

在 "Commit and push if changed" 步骤之后追加以下三个步骤：

```yaml
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

- [ ] **Step 4: 验证完整 workflow 文件结构**

最终 `.github/workflows/fetch-and-translate.yml` 应为：

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
      pages: write            # 部署到 GitHub Pages
      id-token: write         # OIDC 部署所必需，必须在 job 级别

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

      - name: Run update script
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
          NEWS_API_KEY: ${{ secrets.NEWS_API_KEY }}
        run: npm run update

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

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/fetch-and-translate.yml
git commit -m "feat: add GitHub Pages build and deploy to fetch-and-translate workflow"
```

---

## Task 3：手动配置 GitHub 仓库（一次性操作，需在浏览器中完成）

> 这两步需要在 GitHub 网页端完成，不涉及代码改动。

- [ ] **Step 1: 开启 GitHub Pages**

1. 打开 `https://github.com/czq1999/ai-news-website/settings/pages`
2. 在 **Build and deployment** → **Source** 下拉框选择 **GitHub Actions**
3. 保存

- [ ] **Step 2: 确认 Workflow 写权限**

1. 打开 `https://github.com/czq1999/ai-news-website/settings/actions`
2. 在 **Workflow permissions** 部分确认选中 **Read and write permissions**
3. 保存

---

## Task 4：端到端验证

- [ ] **Step 1: 手动触发 Workflow**

在 GitHub Actions 页面，手动触发 `Fetch and Translate AI News` workflow（workflow_dispatch），观察执行过程：
- 若本次有新文章：应看到 Build、Upload、Deploy 步骤全部绿色通过
- 若无新文章：Build/Upload/Deploy 步骤显示 skipped（橙色），属正常

- [ ] **Step 2: 访问验证**

Workflow 成功后，访问：
```
https://czq1999.github.io/ai-news-website/
```

预期：页面正常加载，样式和链接均正常，文章分类跳转有效。

- [ ] **Step 3: 强制触发一次含文章更新的构建（可选）**

如果上一步 workflow 因无新文章而跳过了部署，可临时修改 workflow 中 commit 步骤，将 `articles_changed=false` 改为 `articles_changed=true` 触发一次完整部署，验证后还原。

或者直接检查 `gh-pages` 分支（GitHub Actions 的 `deploy-pages` action 会将其创建为内部分支），确认部署记录存在。
