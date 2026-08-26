# Wang的技术博客

基于 Hugo 和 PaperMod 的静态个人博客，部署到 Cloudflare Pages。

## 本地开发

需要 Hugo Extended `v0.164.0` 或更高版本。

```powershell
hugo server -D
```

本地预览地址为 `http://localhost:1313/`。

## 生产构建

```powershell
hugo --gc --minify
```

构建产物输出到 `public/`，该目录由 Git 忽略，不应提交到仓库。

## Cloudflare Pages

在 Cloudflare Pages 中连接 GitHub 仓库后，使用以下配置：

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `hugo --gc --minify` |
| 构建输出目录 | `public` |
| Hugo 版本 | `0.164.0` 或更高的 Extended 版本 |

## 内容安全

`hugo.toml` 启用了 Goldmark 的 `unsafe` 渲染，以支持文章中的 `<details>` 和 `<br>`。仅应提交可信来源的 Markdown 内容。
