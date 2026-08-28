# Mermaid配置完成说明

## 已完成的配置

### 1. 创建了 `layouts/partials/extend_head.html`
这个文件会被PaperMod主题自动加载，用于添加Mermaid支持。

特点：
- 使用CDN加载Mermaid 10版本
- 自动检测暗色/亮色主题
- 自定义了配色方案以匹配博客主题

### 2. 创建了 `layouts/shortcodes/mermaid.html`
这是Hugo的shortcode，用于在markdown中嵌入Mermaid图表。

**使用方法：**
```markdown
{{< mermaid >}}
graph TD
    A[节点1] --> B[节点2]
{{< /mermaid >}}
```

### 3. 更新了文章中的流程图
已将 ```mermaid 代码块改为 {{< mermaid >}} shortcode语法。

## 部署步骤

### 方法1：使用Cloudflare Pages自动部署
如果你的博客是通过Git推送到Cloudflare Pages自动部署的：

1. 提交更改：
```bash
cd /mnt/d/AI-Workspace/Hugo/my-blog
git add .
git commit -m "feat: 添加Mermaid图表支持"
git push
```

2. 等待Cloudflare Pages自动构建和部署

### 方法2：手动构建（如果本地有Hugo）
```bash
cd /mnt/d/AI-Workspace/Hugo/my-blog
hugo
# 构建产物在 public/ 目录
```

## 验证

部署完成后，访问你的博客文章：
https://my-blog-1tn.pages.dev/posts/ai%E8%BE%85%E5%8A%A9%E5%BC%80%E5%8F%91%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5/

应该能看到两个美观的流程图：
1. 四个工程准则的垂直流程图（蓝紫橙绿配色）
2. SOP循环的水平流程图（带圈数字，五种颜色）

## 故障排查

如果Mermaid图表仍未显示：
1. 检查浏览器控制台是否有JavaScript错误
2. 确认网络能访问 cdn.jsdelivr.net
3. 清除浏览器缓存后重新访问
4. 确认文章中使用的是 `{{< mermaid >}}` shortcode语法，而不是 ```mermaid 代码块

## 自定义主题颜色
