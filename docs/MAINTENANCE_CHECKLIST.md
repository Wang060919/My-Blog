# 博客维护检查清单

最后更新：2026-09-21。以可验证结果为准，不使用固定页面数、构建耗时或依赖数量判断健康。

## 日常维护

- [ ] 在当前平台的独立目录运行 `npm ci --include=dev`。
- [ ] 运行 `npm run check`，确认最终退出状态；更新提示不代表必须升级。
- [ ] 对 npm audit 发现的漏洞阅读依赖路径与影响，评估最小升级，不直接执行强制修复。
- [ ] 打开生产预览，检查首页、文章、目录、代码复制、图表与明暗主题。
- [ ] 新文章有明确 slug，正文不重复 H1；改动已发布 URL 时补重定向。

`scripts/health-check.sh` 只是跨平台检查入口的 Bash 包装，不再维护第二套实现。

若当前镜像不支持安全审计，可临时执行 `npm --registry=https://registry.npmjs.org run check`，不会改变全局 registry 配置。

## 发布前

- [ ] 在独立源码副本进行冷构建：不带旧统计文件、依赖或资源缓存。
- [ ] 执行 `npm ci --include=dev`、`npm run build`、`npm run verify`。
- [ ] sitemap 包含首页和全部已发布文章；robots.txt 指向该全站 sitemap。
- [ ] `public/404.html` 和 `public/_redirects` 存在。
- [ ] 生产 CSS 保留 `.gh-copy-btn` 和 `.copied`；图表页面只有一个 Mermaid 入口。
- [ ] Cloudflare 构建命令显式安装 devDependencies，输出目录为 public。
- [ ] 部署后抽查旧地址返回 301、目标文章返回 200、未知地址返回 404，并确认域名和 canonical 正确。

生产构建会清除 public 中陈旧文件，开发/预览使用 .dev-public。不要将源文件放进这两个生成目录。无需提交 hugo_stats.json、resources、node_modules 或 .hugo_build.lock。

## 主题与工具升级

- [ ] 比较 README 列出的模板覆盖与新版主题差异，不直接删除覆盖文件。
- [ ] 检查固定的 Mermaid 版本；升级后验证图表和主题切换。
- [ ] 复查唯一的 config/postcss.config.js 和动态 CSS safelist。
- [ ] Windows 与 WSL/Linux 分别安装平台依赖，不相互覆盖 node_modules。
- [ ] 审查 Git diff 和锁文件变化，避免夹带无关升级。

历史 FIX_REPORT 与 NPM_SOURCE_MIGRATION 只记录当时结果，不作为当前构建或安全状态的证据。
