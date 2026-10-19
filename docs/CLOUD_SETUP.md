# 可复现的云端构建与 PR 检查

这份配置针对 Linux x64 云端工作区和 GitHub Actions。现有 Windows/macOS/Linux 的本地开发命令不变；不修改用户电脑或全局 Hugo，也不配置 GitHub 凭据。

## 固定工具链

- Node.js **24.19.0**：`.node-version`
- npm **11.9.0**：`package.json` 的 `packageManager`
- Hugo **0.165.0 Extended**：`.hugo-version`
- npm 依赖：提交的 `package-lock.json`，始终使用 `npm ci`

仓库原先要求 Hugo Extended >=0.165.0；云端固定到这个版本，避免使用发行版仓库里过旧的 Hugo。安装方式依据 [Hugo 官方 Linux 安装说明](https://gohugo.io/installation/linux/)，下载 [gohugoio/hugo v0.165.0 官方发布资产](https://github.com/gohugoio/hugo/releases/tag/v0.165.0)。

Linux x64 Extended 压缩包 SHA256 固定为：

```text
f43494894cdf4a8630a201d5c828051c77f523cc66bb3938b30806835470ac20
```

该值核对了官方 release API 的 asset digest 和 `hugo_0.165.0_checksums.txt`。`scripts/setup-cloud.js` 在解压或运行前检查这个值，校验不符即停止；更新 Hugo 时必须同时审查并修改版本和哈希。

## 在新的云端工作区运行

需要 Linux x64、Git、curl、tar，以及上面固定的 Node/npm。仓库无需全局 Hugo。若使用 nvm，可以通过 `nvm install` / `nvm use` 读取 `.node-version`；其他版本管理器选择同一版本即可。

```sh
node --version
npm --version
npm run setup:cloud
npm ci --include=dev --cache .cache/npm
npm run ci
```

`setup:cloud` 无 npm 第三方依赖，可在 npm ci 之前运行。它只将 Hugo 放入 `.tools/hugo/0.165.0/hugo`，压缩包保存在 `.cache/toolchain/`。Node 版本不匹配或平台不是 Linux x64 时会明确退出；不自动修改系统工具链。

`hugo-runner.js` 不向 Hugo 子进程传递宿主全局 `NODE_PATH`，只使用项目锁定的依赖；这也解决了本次云端环境中全局模块路径与 Hugo 的 Node 权限解析器组合导致 PostCSS 卡住的问题，没有放宽 Node 或系统安全权限。

`hugo-runner.js` 优先使用显式 `HUGO_BINARY`，其次使用仓库的固定版本，最后使用系统 Hugo。默认将 Hugo 缓存保存在仓库 `.cache/hugo/`，解决隔离环境中 home 目录不可写的问题；显式 `HUGO_CACHEDIR` 仍受尊重。`.tools/` 和 `.cache/` 都已忽略，不提交二进制、缓存或构建产物。

## 本地自动验证

```sh
npm test         # 搜索、动效和浅色启动回归，无额外测试依赖
npm run build    # Hugo 生产构建
npm run verify   # 检查已生成的生产产物
npm run ci      # 按上述顺序运行；任一步失败即停止
```

搜索测试执行 `site.js` 中实际的搜索代码区块，使用 Node vm 和确定性的 DOM/fetch/timer 测试桩。它覆盖方向键、旧请求失效、即时提交、debounce 取消、重置和错误降级；不是完整 DOM、屏幕阅读器或真实浏览器测试。动效测试覆盖减少动态效果、页面隐藏、首次入场与回退；浅色测试覆盖旧暗色偏好、系统暗色、存储被禁用、无脚本初始状态和控件移除。

浏览器回归还应验证桌面与 390/320px 手机尺寸、当前浅色呈现、正常/减少动态效果、键盘焦点，以及首页滚动与回退行为。浏览器无法启动时，应单独报告原因，不能把逻辑测试或构建通过当成浏览器通过，也不应关闭系统安全限制来绕过。

`npm run ci` 和 PR 工作流只涵盖功能测试、构建与产物校验，**不包含依赖安全审计**。`npm run check` 保留原有的 outdated/audit 检查，审计失败时返回非零状态；功能 CI 通过不能代替安全检查通过。2026-10-19 先通过三个现有版本范围内的补丁更新（brace-expansion 1.1.21、source-map-js 1.2.2、postcss-selector-parser 7.1.6）修复五个 advisory；更新后审计仍有 10 个 high 受影响包记录，全部源于 braces 3.0.3 的 GHSA-vfj7-8cjw-p6xm。该包当时暂无官方补丁，本轮没有升级/降级框架或执行 audit fix --force。

真正的冷构建要使用新的源码副本：开始时没有 node_modules、public、resources 或 hugo_stats.json。重复安装现有目录不算冷构建。

## GitHub Actions

`.github/workflows/check.yml` 在 pull_request 和手动触发时运行测试、构建和产物校验：

- Ubuntu 24.04 runner，15 分钟超时，同一 PR 更新后取消旧检查
- 官方 checkout/setup-node action 固定到已核对的 commit SHA
- 仅读取仓库内容的 `contents: read` 权限
- checkout 不持久化 Git 凭据
- 不使用 secrets，不上传产物，不评论、不推送、不部署

这是待提交的工作流文件。在本地运行相同命令成功，不等于 GitHub Actions 已实际运行。此次云端配置没有设置分支保护，也没有授权推送、创建 PR 或部署。
