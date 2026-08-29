#!/bin/bash

# Hugo 博客健康检查脚本
# 用法: ./scripts/health-check.sh

set -e

echo "🔍 Hugo 博客健康检查"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo "📦 1. 检查依赖状态..."
echo "-------------------"
if npm outdated; then
    echo -e "${GREEN}✅ 所有依赖都是最新版本${NC}"
else
    echo -e "${YELLOW}⚠️  发现可更新的依赖${NC}"
fi
echo ""

echo "🔒 2. 安全审计..."
echo "-------------------"
if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✅ 无安全漏洞${NC}"
else
    echo -e "${RED}❌ 发现安全漏洞，请运行 'npm audit fix' 修复${NC}"
fi
echo ""
echo "🏗️  3. 构建测试..."
echo "-------------------"
BUILD_START=$(date +%s)

if npm run build > /tmp/hugo-build.log 2>&1; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    
    # 提取构建信息
    PAGES=$(grep "Pages" /tmp/hugo-build.log | awk '{print $3}')
    
    echo -e "${GREEN}✅ 构建成功${NC}"
    echo "   页面数: $PAGES"
    echo "   耗时: ${BUILD_TIME}秒"
    
    if [ $BUILD_TIME -gt 40 ]; then
        echo -e "${YELLOW}⚠️  构建时间超过 40 秒，可能需要优化${NC}"
    fi
else
    echo -e "${RED}❌ 构建失败${NC}"
    cat /tmp/hugo-build.log
    exit 1
fi
echo ""

echo "🗺️  4. 检查 Sitemap..."
echo "-------------------"
if [ -f "public/sitemap.xml" ] && [ -f "public/blog/sitemap.xml" ]; then
    SITEMAP_SIZE=$(wc -c < public/sitemap.xml)
    BLOG_SITEMAP_SIZE=$(wc -c < public/blog/sitemap.xml)
    
    echo -e "${GREEN}✅ Sitemap 文件存在${NC}"
    echo "   主 sitemap: ${SITEMAP_SIZE} 字节"
    echo "   博客 sitemap: ${BLOG_SITEMAP_SIZE} 字节"
else
    echo -e "${RED}❌ Sitemap 文件缺失${NC}"
fi
echo ""

echo "📄 5. 检查 robots.txt..."
echo "-------------------"
if [ -f "public/robots.txt" ]; then
    echo -e "${GREEN}✅ robots.txt 存在${NC}"
    cat public/robots.txt
else
    echo -e "${RED}❌ robots.txt 缺失${NC}"
fi
echo ""

echo "🔍 6. 内容质量检查..."
echo "-------------------"
UNCLOSED_BLOCKS=0

for f in content/blog/*/index.md; do
    if [ -f "$f" ]; then
        # 检查未闭合的代码块
        UNCLOSED=$(awk '/```/{count++} END{if (count % 2 != 0) print "1"; else print "0"}' "$f")
        if [ "$UNCLOSED" = "1" ]; then
            echo -e "${RED}❌ 未闭合代码块: $f${NC}"
            UNCLOSED_BLOCKS=$((UNCLOSED_BLOCKS + 1))
        fi
    fi
done

if [ $UNCLOSED_BLOCKS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有 Markdown 代码块正确闭合${NC}"
else
    echo -e "${RED}❌ 发现 $UNCLOSED_BLOCKS 个文件有未闭合的代码块${NC}"
fi
echo ""

echo "📊 7. 资源大小统计..."
echo "-------------------"
if [ -d "public/js" ] && [ -d "public/css" ]; then
    JS_SIZE=$(du -sh public/js | awk '{print $1}')
    CSS_SIZE=$(du -sh public/css | awk '{print $1}')
    
    echo "   JavaScript: $JS_SIZE"
    echo "   CSS: $CSS_SIZE"
else
    echo -e "${YELLOW}⚠️  资源目录不存在${NC}"
fi
echo ""

echo "🎉 健康检查完成！"
echo "===================="
echo ""
echo "📝 建议操作:"
echo "   1. 定期运行此脚本（每月一次）"
echo "   2. 关注构建时间变化"
echo "   3. 保持依赖更新"
echo "   4. 查看完整文档: docs/MAINTENANCE_CHECKLIST.md"
echo ""

# 清理临时文件
rm -f /tmp/hugo-build.log
