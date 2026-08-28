# Wang的技术博客

基于 Hugo 和 **Doks** 主题的静态个人博客，部署到 Cloudflare Pages。

## 技术栈

- **Hugo v0.165.0+** (Extended 版本)
- **Doks 主题** (通过 `@thulite/doks-core` npm 包)
- **Mermaid.js** (图表支持)
- **TailwindCSS** (样式框架)
- **Cloudflare Pages** (部署)

## 本地开发

需要 Hugo Extended `v0.165.0` 或更高版本，以及 Node.js `>=20.11.0`。

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

本地预览地址为 `http://localhost:1313/`。

## 生产构建

```bash
npm run build
```

构建产物输出到 `public/` 目录，该目录由 Git 忽略，不应提交到仓库。

## Cloudflare Pages 配置

在 Cloudflare Pages 中连接 GitHub 仓库后，使用以下配置：

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `npm run build` |
| 构建输出目录 | `public` |
| Node 版本 | `>=20.11.0` |
| Hugo 版本 | `0.165.0` 或更高的 Extended 版本 |

## 内容安全

`hugo.toml` 启用了 Goldmark 的 `unsafe` 渲染，以支持文章中的 `<details>` 和 `<br>`。仅应提交可信来源的 Markdown 内容。

## 项目结构

```
├── assets/           # CSS/JS 资源
├── config/           # Hugo 配置文件
│   └── _default/
│       ├── languages.toml
│       ├── menus/
│       ├── module.toml
│       └── params.toml
├── content/          # 博客文章与页面
│   ├── posts/        # 文章目录
│   └── docs/         # 文档
├── layouts/          # 自定义布局模板
│   ├── shortcodes/   # 自定义短代码
│   └── _partials/    # 部分模板
├── static/           # 静态资源 (图标、图片)
├── hugo.toml         # 主配置文件
└── package.json      # npm 依赖
```

## 开发指南

### 创建新文章

```bash
hugo new posts/文章标题/index.md
```

### 文章 Front Matter 示例

```yaml
---
title: "文章标题"
date: 2024-08-28T10:00:00+08:00
draft: false
description: "精简的文章摘要，控制在 110-160 字符之间" # SEO 描述
tags: ["标签1", "标签2"]
categories: ["分类"]
---
```

### Mermaid 图表支持

```markdown
{{< mermaid >}}
graph TD
    A[开始] --> B[处理]
    B --> C[结束]
{{< /mermaid >}}
```

## 许可证

MIT © Wang
