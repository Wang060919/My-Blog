# 持续构建：GitHub 贡献日历

## 当前交付状态

- 正式 data/github_contributions.json 已接入官方真实快照：2026-10-19 17:53:08 UTC 抓取，2025-10-20 至 2026-10-19 共 379 次贡献、42 个活跃日。来自同仓库 Actions 内置只读 token，未新增凭据。
- 缺失数据时显示诚实空态和 GitHub 链接。
- npm run preview:contributions 使用 tests/fixtures/contributions-example.json 构建到 .dev-public/contribution-example。页面醒目标注“示例数据”，生产文件不会被替换。
- 用本地静态 HTTP 服务打开该输出即可看效果。示例构建复用当前工具链，临时配置自动清理。
- 此功能通过独立分支和草稿 PR 审阅；未合并生产，未创建凭据；Worker＋KV代码尚未部署，自动更新未启用。

## 正式数据路径

官方 GraphQL user(login) → contributionsCollection → contributionCalendar，保留 contributionCount 与 contributionLevel 原始分档，不按数量重新分档，不将贡献数叫作 commit 数。只获取每日聚合，不查询私有仓库明细。

构建端运行 npm run contributions:update，读取已有运行环境的 GITHUB_TOKEN。脚本只调用 https://api.github.com/graphql，不接受重定向。令牌只存在请求头中，不写文件、不输出响应正文、不进入 Hugo 数据或前端。前端没有 API 请求、令牌或第三方贡献代理。

日期使用 UTC date-only 原值。刷新请求精确定义为截至更新日的过去 365 个日历日（含当日）；因此可能与 GitHub 个人页默认周对齐窗口的总数不同。日历总计必须与这些日期之和严格一致。规范化支持闰年及 366 日输入，不硬裁上游数据。请求范围以外的周补位为空格，不是零贡献；未来日期不可交互。未完成当天的计数仅代表抓取时刻。

通过日期连续/唯一、有效日历日期、非负整数、原始等级、零值等级一致、总数一致检查后原子替换 JSON。失败返回非零并保留原快照；没有旧快照就继续空态。普通 npm run build 不联网，但先校验已有快照，并拒绝示例数据出现在生产 data 目录。缺失认证不会破坏已有缓存。

更新时间与窗口在页面可见。超过 7 天标记过期；前端也会检查快照时间，以免长期未部署的静态页面一直显示新鲜状态。过期数据仍可浏览，保留原始日期而不填充虚假的“今天”。

## 最小权限接入建议（尚未执行）

优先试用 GitHub Actions 自带的短期 GITHUB_TOKEN，权限仅 contents: read，手动触发一次官方 GraphQL 请求。GitHub 官方确认此 token 可用于 API；2026-10-19 已在本仓库实际验证可读取此用户的 contributionCalendar，成功导出真实快照。如果 API 拒绝，保持回退，不自动扩权、不创建 PAT。

已授权的一次性探测工作流仅在指定同仓库功能分支 PR 首次打开时触发，使用 checkout、Node 22、更新脚本，成功后仅把 data/github_contributions.json 作为保留 3 天的构建产物提供复核。后续 synchronize 不重复探测。首次探测不自动提交到仓库：任何分支推送都可能触发 Cloudflare 预览。该次真实快照已经复核并按用户批准提交到功能分支。

仅运行 Actions 并不会自动更新 Cloudflare 的 Git 构建输入。后续要么经批准将公开聚合快照提交到仓库，要么在经批准的构建环境中读取已有适当认证更新 JSON。当前选择 Worker＋KV 独立缓存路线；不向 main 写入每日数据提交。

官方资料：
- https://docs.github.com/en/graphql/reference/users#contributioncalendar
- https://docs.github.com/en/graphql/reference/users#contributionlevel
- https://docs.github.com/en/actions/tutorials/authenticate-with-github_token

## 交互与测试

- 桌面完整年视图，小屏保持 21px 方格与 3px 间隔，默认滚到最新约三个月，可横向查看全年。
- 单个 Tab 入口；左右按周、上下按天，Home/End 到首尾；空格不聚焦；Escape 恢复窗口说明。
- hover、focus、touch click 更新固定详情行，不依赖 hover-only 浮层。
- 提供原生“查看日期”输入，作为密集格子的等价大目标入口。
- 无 JS 仍有静态格子、原生 title、总计与来源；动效不影响数据可见性。
- 整块和周列只在首次进入视窗时短暂出现；不循环；reduced-motion 不启动动画，运行中切换时取消。
- npm test 包括数据校验；npm run ci 包括原有搜索/动效/主题测试、贡献测试、生产构建和验证。

生产验收入口是 npm run build / npm run ci。直接运行 Hugo 或普通 npm preview 不替代这一步，也不能证明快照通过生产校验。

来源审计：GitHub Actions run 39297874494，artifact 12209890568，ZIP SHA256 0e3006f558054a63691352cab628e8d695449cc81fd182b463685a36bd754250。


## 当前自动更新方案：Worker＋KV（未部署）

已删除写入 main 的 contribution-refresh.yml、publish-contributions.js 和专用发布测试。仓库剩余 Actions 仅检查代码，以及保留已完成的一次只读数据探测；没有 contents:write 工作流。

独立实现位于 workers/contributions，部署与手动初始化步骤见该目录 README。Cron 按北京时间每天00:00（UTC16:00）抓取官方数据，验证后写KV，失败保留旧值。GET只读缓存，网页仅在配置了真实HTTPS endpoint后读取；默认空endpoint保留静态真实快照。无需每日Git提交或重新部署网站。

尚未创建或部署Worker/KV、未填写Secret、未配置在线endpoint，因此不能说自动更新已启用。GitHub读取token由用户自行创建并直接填入Cloudflare Secret。合并本站PR也不会自动部署Worker或开通Cloudflare服务。免费额度按轻量路径设计，实际CPU/配额/真实Cron需在获批部署后验证。
