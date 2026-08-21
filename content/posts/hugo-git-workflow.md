---
title: "Hugo 博客的正确 Git 提交流程"
date: 2026-08-21T13:14:46+08:00
draft: false
tags: ["Hugo", "Git", "博客"]
categories: ["教程"]
---

## 前言

在使用 Hugo 搭建博客并部署到 Cloudflare Pages 时，正确的 Git 提交流程很重要。本文记录了如何避免提交不必要的构建文件，保持仓库整洁。

## 问题背景

Hugo 会将源文件（`content/`）编译成静态 HTML 文件输出到 `public/` 目录。这些构建产物不应该提交到 Git 仓库，因为：

1. **文件体积大**：每次构建都会生成大量 HTML、CSS、JS 文件
2. **频繁变动**：每次修改都会重新生成，造成大量无意义的 diff
3. **自动构建**：Cloudflare Pages 会自动执行构建，不需要提交构建产物
4. **污染历史**：会让 Git 历史变得混乱，难以追踪真正的内容变更

## 配置 .gitignore

首先创建 `.gitignore` 文件，排除构建输出和临时文件：

```gitignore
# Hugo build output
public/
resources/

# Hugo lock file
.hugo_build.lock

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Node modules (if using npm for theme development)
node_modules/

# Temporary files
*.log
*.tmp
```

## 标准提交流程

### 1. 创建或编辑内容

```bash
# 创建新文章
hugo new posts/my-new-post.md

# 或直接编辑现有文章
# vim content/posts/existing-post.md
```

### 2. 本地预览（可选但推荐）

```bash
# 启动开发服务器，-D 参数显示草稿
hugo server -D

# 浏览器访问 http://localhost:1313 预览效果
# 确认无误后 Ctrl+C 停止服务器
```

### 3. 提交源文件到 Git

```bash
# 查看修改了哪些文件
git status

# 添加要提交的文件
git add content/posts/my-new-post.md

# 或一次添加所有修改（.gitignore 会自动排除构建文件）
git add .

# 提交，使用清晰的提交信息
git commit -m "feat: 添加新文章《文章标题》"

# 推送到远程仓库
git push origin main
```

### 4. 自动部署

推送后，Cloudflare Pages 会自动：
1. 检测到 GitHub 仓库的新提交
2. 执行 `hugo` 构建命令
3. 部署生成的静态文件到 CDN
4. 几分钟后网站自动更新

## 提交信息规范

建议使用语义化的提交信息，让历史记录更清晰：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat:` | 新增文章或功能 | `feat: 添加 Docker 入门教程` |
| `fix:` | 修正内容错误 | `fix: 修正文章中的代码错误` |
| `docs:` | 文档更新 | `docs: 更新 README 说明` |
| `style:` | 样式或格式调整 | `style: 优化代码高亮配置` |
| `chore:` | 日常维护 | `chore: 更新依赖版本` |

## 应该提交的文件

**✅ 应该提交：**
- `content/` - 所有 Markdown 文章和页面
- `hugo.toml` - Hugo 配置文件
- `static/` - 静态资源（图片、自定义 CSS/JS）
- `layouts/` - 自定义布局模板
- `archetypes/` - 文章模板
- `themes/` - 主题文件（如果自己管理）
- `.gitignore` - Git 忽略规则

**❌ 不应该提交：**
- `public/` - Hugo 构建输出目录
- `resources/` - Hugo 资源缓存
- `.hugo_build.lock` - Hugo 锁文件
- `.DS_Store` - macOS 系统文件
- `.vscode/` - 编辑器配置

## 常见问题

### Q: 不小心提交了 public/ 目录怎么办？

```bash
# 从 Git 跟踪中移除（但保留本地文件）
git rm -r --cached public/

# 提交这个改动
git commit -m "chore: 从版本控制中移除 public 目录"

# 推送到远程
git push origin main
```

### Q: 如何验证 .gitignore 是否生效？

```bash
# 查看 Git 状态，确认 public/ 没有出现
git status

# 或者检查是否被忽略
git check-ignore public/
```

### Q: 可以直接用 `git add .` 吗？

可以。只要 `.gitignore` 配置正确，`git add .` 会自动排除被忽略的文件，不会添加 `public/` 等目录。

## 完整示例

从创建文章到发布的完整流程：

```bash
# 1. 创建新文章
hugo new posts/docker-tutorial.md

# 2. 编辑文章内容
# 使用你喜欢的编辑器编辑 content/posts/docker-tutorial.md

# 3. 本地预览
hugo server -D
# 在浏览器中检查效果

# 4. 修改文章头部，将 draft 改为 false
# draft = false

# 5. 提交到 Git
git add content/posts/docker-tutorial.md
git commit -m "feat: 添加 Docker 基础教程"
git push origin main

# 6. 等待 Cloudflare Pages 自动部署
# 几分钟后访问网站即可看到新文章
```

## 总结

使用 Hugo + Git + Cloudflare Pages 的工作流程核心原则：

1. **只提交源文件**，不提交构建产物
2. **配置好 .gitignore**，避免误提交
3. **使用语义化提交信息**，保持历史清晰
4. **相信自动化**，让 CI/CD 完成构建和部署

这样可以保持 Git 仓库整洁，专注于内容创作，而不用担心构建和部署的细节。
