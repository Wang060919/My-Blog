# 2026-09-21 审查修复记录

## 已处理

- 为 8 篇改名文章固定 slug，并增加 16 条 Cloudflare Pages 301 规则，覆盖旧地址有无末尾斜杠的情况。
- 取消自定义 home/section sitemap 输出，恢复全站 sitemap；新增顶层 404 页面，避免未知路径返回首页。
- 删除 Mermaid 全站入口，由主题按 hasMermaid 加载；固定 11.4.0，关闭自动二次初始化，使用 strict 模式并保留主题切换。图表源码按文本处理。
- 删除两份无引用样式和根目录重复 PostCSS 配置；取消跟踪 .hugo_build.lock，保留本地文件。
- 将实际使用的 Babel、PostCSS 及插件声明为直接开发依赖，版本沿用原锁文件，未升级任何已有包。
- 保留 buildStats + PostProcess 流水线和 hugo_stats.json 忽略规则，冷构建已证实无需预存统计文件。
- 开发和预览输出改到 .dev-public；生产构建清理 public 陈旧产物。原工作区生产输出已重新生成。
- 为主题覆盖添加用途说明；保留已有 seo/base.html 注释和定制逻辑。
- 删除三处与标题重复的正文 H1，将 Hello World 改为 H2；新文章模板采用 YAML 并显式设置 slug，已有 TOML 内容保留兼容。
- 增加 LF 行尾约定并规范原有 CRLF 文本；jsconfig 使用跨平台相对路径，清理过期忽略规则并忽略本地工具目录。
- 更新 README、维护与 npm 说明，修正 Analytics 模板路径；历史报告标明适用日期，不篡改历史检查结果。
- 健康检查统一为 npm run check；Bash 文件仅作包装。区分漏洞与审计服务故障，失败时返回非零状态，不自动更新依赖。

## 验证结果

- Windows：Hugo Extended 0.166.0、Node 24.20.0，独立源码副本从无依赖、无统计文件、无资源缓存状态安装并构建成功。
- WSL Ubuntu：Hugo Extended 0.165.0、Node 24.18.0，独立 Linux 目录 npm ci --include=dev、生产构建与产物验证均通过，未覆盖 Windows node_modules。
- 全站 sitemap 含 59 个 URL，包含首页和全部 10 篇已发布文章；robots.txt 指向该 sitemap。
- 只有一篇含图表的文章加载 Mermaid，加载入口为一个；首页不加载。生产 CSS 保留 gh-copy-btn 与 copied。
- Wrangler 4.135.0 本地模拟：16 个旧地址均返回 301、8 个目标均返回 200、未知地址返回 404。
- 原工作区 npm --registry=https://registry.npmjs.org run check 通过。官方源审计为 0 个漏洞；当前机器默认镜像不支持审计，已验证检查脚本将其报告为服务错误。未修改全局 registry。
- package-lock 中已有依赖包记录未变化，仅增加根级直接依赖声明并规范行尾。

## 验证边界

按用户要求未运行浏览器检查，因此图表实际渲染、明暗切换与复制交互未作浏览器验证。Cloudflare 控制台构建设置和正式部署状态不由本地验证证明；建议使用 README 中显式安装 devDependencies 的构建命令，部署后再核对线上 HTTP 状态。
