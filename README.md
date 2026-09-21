# Wang的技术博客

基于 Hugo、Doks 和 Bootstrap/SCSS 的静态个人博客，部署到 Cloudflare Pages。

## 本地开发

需要 Hugo Extended 0.165.0 或更高版本、Node.js >=20.11.0 和 npm。

```sh
npm ci --include=dev
npm run dev
```

开发地址为 http://localhost:1313/，开发产物写入 `.dev-public/`。
Windows 与 WSL/Linux 使用不同的平台依赖，请各用独立目录安装；不要共用同一个 `node_modules/`。

## 构建与检查

```sh
npm run build
npm run verify
```

生产构建使用 `config/production/hugo.toml` 中的域名，输出到 `public/`，并清除其中不再使用的旧产物。`public/` 只放生成文件，不手动保存资产。`npm run preview` 在 `.dev-public/` 中预览生产模式。

`npm run verify` 校验现有生产产物：文章与首页 sitemap、旧链接规则、404 页面、Mermaid 按需加载，以及复制按钮样式保留。它不替代浏览器交互验证或上线后的 HTTP 检查。

`npm run check` 执行依赖更新查询、安全审计、生产构建及产物校验；发现漏洞、审计无法完成或验证失败时返回非零状态，不自动修改依赖。WSL/Linux 也可执行 `bash scripts/health-check.sh`。

冷构建应在没有 `node_modules/`、`public/`、`resources/` 和 `hugo_stats.json` 的独立源码副本中运行上述安装、构建、验证命令。直接在原目录重新安装不等于冷构建。

## Cloudflare Pages

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `npm ci --include=dev && npm run build && npm run verify` |
| 输出目录 | `public` |
| Node | >=20.11.0 |
| Hugo | Extended >=0.165.0 |

构建命令显式安装 devDependencies，确保 Dart Sass、PostCSS 和 Babel 可用。控制台配置不在仓库内，需要部署时核对。

`static/_redirects` 保存 8 篇文章中文旧地址到英文新地址的 HTTP 301 规则，同时覆盖带和不带末尾斜杠的旧地址。Hugo 本地服务器不执行 Cloudflare 规则；应使用 Pages 本地模拟或在部署后确认 HTTP 状态与 Location。`layouts/404.html` 生成顶层 404 页面，避免未知路径被当作首页。

## 项目结构

```text
assets/                  SCSS、自定义 JS、图标源文件
config/_default/         Hugo 主配置、语言、菜单、模块挂载
config/production/       生产域名
config/development/      本地开发域名
config/postcss.config.js 唯一的 PostCSS 配置
content/blog/            文章 page bundles
content/docs/            文档栏目
layouts/                 模板覆盖与短代码
static/                  静态资产及 _redirects
scripts/                 构建入口、健康检查与产物校验
docs/                    维护说明与历史记录
```

## 创建文章

```sh
hugo new content blog/my-new-post/index.md
```

新文章默认使用 YAML front matter，并处于草稿状态。已有 TOML 文章继续支持，无需为统一格式重写。

```yaml
---
title: "文章标题"
slug: my-new-post
date: 2026-09-21T10:00:00+08:00
draft: false
description: "文章摘要"
tags: ["标签"]
categories: ["技术"]
---
```

模板已经输出文章 H1，正文从二级标题开始。发布后保持 `slug` 不变；若必须改变 URL，同步添加旧地址重定向。

## Mermaid 与内容安全

使用 `mermaid` 围栏代码块或 `{{< mermaid >}}` 短代码。仅含图表的页面加载固定版本 Mermaid 11.4.0，使用 strict 模式，并支持明暗主题切换。

`config/_default/hugo.toml` 保留 Goldmark 的 `unsafe` 渲染以支持文章中的 HTML；只发布可信、经过检查的内容。

## 主题升级

自定义样式入口为 `assets/scss/common/_custom.scss`；自定义代码为 `assets/js/custom.js`。`assets/js/mermaid-init.js` 覆盖主题加载器以固定版本。

升级 Doks/SEO 包时，核对 `layouts/` 中带注释的覆盖：导航相对链接、语言标签、contributors 空值处理、首页、Dart Sass、favicon 与 Open Graph。`seo/base.html` 有意禁用 base 标签。生产 CSS 使用 buildStats + PostProcess，等待页面统计生成后再执行 PurgeCSS；`hugo_stats.json` 保持忽略，不预先提交或伪造。

更多维护步骤见 [维护检查清单](docs/MAINTENANCE_CHECKLIST.md)。

## 许可证

MIT © Wang
