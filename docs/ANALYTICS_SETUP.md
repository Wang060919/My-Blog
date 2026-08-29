# Web Analytics 配置指南

本文档记录如何为博客添加 Web Analytics 追踪。

## 推荐方案

### 1. Cloudflare Web Analytics（推荐）

**优点**：
- 免费且无限流量
- 隐私友好，不使用 Cookie
- 与 Cloudflare Pages 深度集成
- 轻量级，不影响页面性能

**配置步骤**：

1. 登录 Cloudflare Dashboard
2. 进入 Web Analytics 页面
3. 添加站点：`https://my-blog-1tn.pages.dev`
4. 获取 JavaScript snippet
5. 在 `layouts/partials/head/custom.html` 中添加代码：

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'></script>
```

### 2. Google Analytics 4（可选）

**配置步骤**：

1. 创建 GA4 属性，获取 Measurement ID（格式：G-XXXXXXXXXX）
2. 在 `config/_default/params.toml` 中添加：

```toml
[googleAnalytics]
  id = "G-XXXXXXXXXX"
```

3. 在 `config/_default/hugo.toml` 中添加：

```toml
googleAnalytics = "G-XXXXXXXXXX"
```

### 3. Plausible Analytics（隐私友好）

开源、隐私友好的替代方案。

**配置步骤**：

1. 注册 Plausible 账户（付费服务，或自托管）
2. 添加域名
3. 在 `layouts/partials/head/custom.html` 中添加：

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

## 注意事项

1. **GDPR 合规**：如使用 Google Analytics，需添加 Cookie 同意横幅
2. **性能影响**：推荐使用 `defer` 或 `async` 加载脚本
3. **隐私政策**：添加隐私政策页面说明数据收集方式

## 当前状态

- ❌ 未配置任何 Analytics
- ✅ 已准备好添加配置的文件结构

## 后续操作

1. 选择合适的 Analytics 服务
2. 按照上述步骤配置
3. 验证数据是否正确收集
4. 更新隐私政策页面（如需要）
