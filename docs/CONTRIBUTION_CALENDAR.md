# 持续构建：GitHub 贡献日历

## 当前交付状态

- 正式 data/github_contributions.json 已接入官方真实快照：2026-10-19 17:53:08 UTC 抓取，2025-10-20 至 2026-10-19 共 379 次贡献、42 个活跃日。来自同仓库 Actions 内置只读 token，未新增凭据。
- 缺失数据时显示诚实空态和 GitHub 链接。
- npm run preview:contributions 使用 tests/fixtures/contributions-example.json 构建到 .dev-public/contribution-example。页面醒目标注“示例数据”，生产文件不会被替换。
- 用本地静态 HTTP 服务打开该输出即可看效果。示例构建复用当前工具链，临时配置自动清理。
- 此功能通过独立分支和草稿 PR 审阅；未合并生产，未创建凭据；每日更新工作流待合并到默认分支后才生效。

## 正式数据路径

官方 GraphQL user(login) → contributionsCollection → contributionCalendar，保留 contributionCount 与 contributionLevel 原始分档，不按数量重新分档，不将贡献数叫作 commit 数。只获取每日聚合，不查询私有仓库明细。

构建端运行 npm run contributions:update，读取已有运行环境的 GITHUB_TOKEN。脚本只调用 https://api.github.com/graphql，不接受重定向。令牌只存在请求头中，不写文件、不输出响应正文、不进入 Hugo 数据或前端。前端没有 API 请求、令牌或第三方贡献代理。

日期使用 UTC date-only 原值。刷新请求精确定义为截至更新日的过去 365 个日历日（含当日）；因此可能与 GitHub 个人页默认周对齐窗口的总数不同。日历总计必须与这些日期之和严格一致。规范化支持闰年及 366 日输入，不硬裁上游数据。请求范围以外的周补位为空格，不是零贡献；未来日期不可交互。未完成当天的计数仅代表抓取时刻。

通过日期连续/唯一、有效日历日期、非负整数、原始等级、零值等级一致、总数一致检查后原子替换 JSON。失败返回非零并保留原快照；没有旧快照就继续空态。普通 npm run build 不联网，但先校验已有快照，并拒绝示例数据出现在生产 data 目录。缺失认证不会破坏已有缓存。

更新时间与窗口在页面可见。超过 7 天标记过期；前端也会检查快照时间，以免长期未部署的静态页面一直显示新鲜状态。过期数据仍可浏览，保留原始日期而不填充虚假的“今天”。

## 最小权限接入建议（尚未执行）

优先试用 GitHub Actions 自带的短期 GITHUB_TOKEN，权限仅 contents: read，手动触发一次官方 GraphQL 请求。GitHub 官方确认此 token 可用于 API；2026-10-19 已在本仓库实际验证可读取此用户的 contributionCalendar，成功导出真实快照。如果 API 拒绝，保持回退，不自动扩权、不创建 PAT。

已授权的一次性探测工作流仅在指定同仓库功能分支 PR 首次打开时触发，使用 checkout、Node 22、更新脚本，成功后仅把 data/github_contributions.json 作为保留 3 天的构建产物提供复核。后续 synchronize 不重复探测。首次探测不自动提交到仓库：任何分支推送都可能触发 Cloudflare 预览。该次真实快照已经复核并按用户批准提交到功能分支。

仅运行 Actions 并不会自动更新 Cloudflare 的 Git 构建输入。后续要么经批准将公开聚合快照提交到仓库，要么在经批准的构建环境中读取已有适当认证更新 JSON。本 PR 后续加入的每日更新路线见下节；它在合并到默认分支前不运行。

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


## 每日更新与发布（PR 内待合并）

新增 contribution-refresh.yml 的 cron 为 `0 16 * * *`，使用默认 UTC，等同北京时间（Asia/Shanghai）每天 00:00（UTC 前一天 16:00）。GitHub schedule 只运行默认分支上的工作流，PR 中不会启用；可能延迟或在负载过高时漏跑，不保证整点到达。用户选择零点，整点负载可能增加延迟。公开仓库 60 天没有活动时计划可能被 GitHub 停用。日历仍按 GitHub UTC date-only 统计：北京时间零点对应 UTC 前一天 16:00，因此窗口最后一天通常是北京时间的前一天，且该 UTC 日尚未结束；不能称为刚结束的北京时间全天数据。页面更新日明确标注 UTC。

流程分为两个 job：
1. refresh 保持 contents: read，调用已验证的官方 GraphQL 数据路径、校验 JSON，上传本次运行的短期 artifact。失败即停止，不进入发布。
2. publish 单独申请 contents: write，下载同一运行的已验证 artifact，再次校验真实数据、用户名、日期新鲜度（48 小时内）与当前仓库旧快照。只调用固定 Wang060919/My-Blog 仓库的 data/github_contributions.json Contents API，提交到固定 main 分支。权限是仓库级，GitHub 不能限制到单文件；单文件限制由脚本落实。没有 PAT、Cloudflare API 凭据、Git凭据落盘或仓库设置修改。

Contents API 使用当前文件 blob SHA 作为乐观锁；并发修改返回冲突即失败，不强推、不覆盖、不盲目重试。不同文件的并发提交不会被丢弃。拒绝比已保存快照更旧的数据。完全相同的内容不创建提交。只允许 schedule 或 main 上手动 workflow_dispatch；PR、push、功能分支运行不能进入发布。工作流串行化，避免自己的刷新任务互相竞争。

成功提交唯一 JSON 后，现有 Cloudflare Git 集成预期会为 main 构建并发布新页面；只上传 artifact 不会更新网站。GitHub GITHUB_TOKEN 生成的 push 不触发新的 GitHub Actions 工作流，这是 GitHub 的递归防护，与外部 Cloudflare GitHub App 的部署机制不同。Cloudflare 官方文档说明分支推送会自动部署，但本仓库“Actions 机器人提交 → Cloudflare 自动部署”的完整链路还需合并后首次运行实测，当前不宣称已经验证。若 Cloudflare 构建失败，线上继续保留最近成功部署的页面；不会额外创建 Cloudflare 凭据兜底。

上线还需：用户审阅并合并 PR 到 main；随后等待第一次定时任务，或用户选择在 main 手动运行；核对本次 JSON 提交 SHA 对应的 Cloudflare 部署成功和线上更新时间。现阶段没有合并、没有实际执行写权限发布 job、没有开启默认分支计划。失败时查看 Actions run；不修改分支保护或权限设置来绕过限制。既有只读 contribution-probe.yml 保持一次探测范围，不承担日常更新。

官方依据：
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- https://developers.cloudflare.com/pages/configuration/git-integration/
