# 博客维护检查清单

定期维护任务，确保博客持续健康运行。

## 📅 每月维护任务

### 1. 依赖更新检查

```bash
# 检查过期依赖
npm outdated

# 查看可用更新
npm update

# 安全审计
npm audit
npm audit fix  # 自动修复安全问题
```

**检查项**：
- [ ] 依赖包无安全漏洞
- [ ] 主要依赖版本在支持周期内
- [ ] Hugo 版本是否有重要更新

### 2. 构建测试

```bash
cd my-blog

# 清理旧构建
rm -rf public

# 执行完整构建
npm run build

# 检查构建输出
# - 无错误或警告
# - 页面数量符合预期
# - 构建时间无异常增长
```

**检查项**：
- [ ] 构建成功，无报错
- [ ] 构建时间 < 40 秒
- [ ] 页面总数符合预期

### 3. SEO 检查

```bash
# 验证 sitemap 生成
ls -lh public/sitemap.xml public/blog/sitemap.xml

# 检查 robots.txt
cat public/robots.txt

# 验证首页元标签
head -100 public/index.html | grep -E "(og:|twitter:|description)"
```

**检查项**：
- [ ] Sitemap 包含所有文章
- [ ] robots.txt 配置正确
- [ ] 元标签完整（title, description, OG tags）

### 4. 内容质量检查

```bash
# 检查 Markdown 代码块是否闭合
for f in content/blog/*/index.md; do
    awk '/```/{if (p) print "  Closed at " NR; else print "  Opened at " NR; p=!p} END{if (p) print "  ❌ Unclosed!"}' "$f"
done

# 查找可能的死链
grep -r "](http" content/blog/ | grep -v "https://"
```

**检查项**：
- [ ] 所有代码块正确闭合
- [ ] 无明显的死链
- [ ] Frontmatter 格式统一

## 🔄 每季度维护任务

### 1. 性能优化

```bash
# 分析打包产物大小
du -sh public/js public/css public/fonts

# 检查图片优化
find public -name "*.jpg" -o -name "*.png" | xargs du -h | sort -h
```

**优化项**：
- [ ] JS 文件总大小 < 500KB
- [ ] CSS 文件总大小 < 100KB
- [ ] 图片格式优化（WebP）

### 2. Hugo 版本更新

```bash
# 检查 Hugo 版本
hugo version

# 访问 https://github.com/gohugoio/hugo/releases
# 查看是否有重大更新
```

### 3. 备份检查

```bash
# 验证 Git 仓库完整性
git fsck

# 确认远程备份
git remote -v
git log --oneline -5
```

## 🚨 紧急维护

### 安全漏洞响应

1. 收到 Dependabot 或安全警告通知
2. 立即运行 `npm audit`
3. 查看漏洞详情和修复建议
4. 执行 `npm audit fix` 或手动更新
5. 测试构建和功能
6. 提交并部署修复

### 构建失败处理

1. 查看构建日志
2. 回滚到上一个可用版本
3. 在本地复现问题
4. 修复并测试
5. 重新部署

## 📊 监控指标

### 构建指标（正常范围）

- 构建时间：25-35 秒
- 页面数量：根据文章数量动态增长
- 依赖包数量：30-40 个
- node_modules 大小：80-120MB

### 性能指标（目标）

- 首页加载时间：< 2 秒
- Lighthouse 性能评分：> 90
- SEO 评分：100
- 可访问性评分：> 90

## 🔧 工具脚本

创建快捷维护脚本：

```bash
# scripts/health-check.sh
#!/bin/bash
echo "🔍 Hugo 博客健康检查"
echo ""
echo "1. 检查依赖..."
npm outdated
echo ""
echo "2. 安全审计..."
npm audit
echo ""
echo "3. 构建测试..."
npm run build
echo ""
echo "4. 检查 Sitemap..."
ls -lh public/sitemap.xml public/blog/sitemap.xml
echo ""
echo "✅ 健康检查完成"
```

使用方法：

```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

## 📝 维护日志

记录重要的维护活动：

| 日期 | 操作 | 结果 | 备注 |
|------|------|------|------|
| 2026-08-29 | 全方位健康体检 | ✅ 通过 | 修复锚点链接，依赖无漏洞 |
| | | | |

---

**最后更新**：2026-08-29  
**下次检查**：2026-09-29
