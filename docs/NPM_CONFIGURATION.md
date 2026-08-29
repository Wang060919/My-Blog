# npm 配置说明

## 当前配置

本项目已切换到 **npm 官方源**，不再使用镜像源。

### 查看当前源

```bash
npm config get registry
```

**当前配置**：`https://registry.npmjs.org/`

---

## 为什么使用官方源

### ✅ 优点

1. **安全审计可用** - `npm audit` 命令正常工作
2. **最新的包信息** - 无延迟，实时同步
3. **完整的功能** - 所有 npm 特性都支持
4. **更可靠** - 官方维护，稳定性高

### ⚠️ 可能的问题

1. **速度较慢**（中国大陆用户）
   - 解决方案：使用科学上网工具
   - 或者：在项目根目录创建 `.npmrc` 文件配置代理

2. **偶尔连接失败**
   - 解决方案：重试或检查网络连接

---

## 常用命令

### 安装依赖

```bash
npm install
```

### 安全审计

```bash
# 检查安全漏洞
npm audit

# 自动修复（尽可能）
npm audit fix

# 强制修复（可能引入破坏性更新）
npm audit fix --force
```

### 更新依赖

```bash
# 查看可更新的包
npm outdated

# 更新所有包到 package.json 允许的最新版本
npm update

# 更新特定包
npm update package-name
```

---

## 切换源（如果需要）

### 切换到淘宝镜像（不推荐）

```bash
npm config set registry https://registry.npmmirror.com/
```

**缺点**：
- ❌ `npm audit` 无法使用
- ❌ 包信息可能有延迟
- ❌ 某些新包可能不可用

### 切换回官方源

```bash
npm config set registry https://registry.npmjs.org/
```

---

## 使用代理（推荐方案）

如果官方源速度慢，推荐使用代理而不是镜像源。

### 方式 1：使用环境变量

```bash
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
npm install
```

### 方式 2：配置 npm 代理

```bash
npm config set proxy http://127.0.0.1:7890
npm config set https-proxy http://127.0.0.1:7890
```

**取消代理**：

```bash
npm config delete proxy
npm config delete https-proxy
```

### 方式 3：项目级配置（推荐）

在项目根目录创建 `.npmrc` 文件：

```ini
proxy=http://127.0.0.1:7890
https-proxy=http://127.0.0.1:7890
```

**注意**：`.npmrc` 已添加到 `.gitignore`，不会提交到版本控制。

---

## 故障排查

### 问题：npm install 很慢

**解决方案**：
1. 检查网络连接
2. 配置代理（见上方）
3. 使用 `npm install --verbose` 查看详细日志

### 问题：npm audit 失败

**解决方案**：
1. 确认使用官方源：`npm config get registry`
2. 如果不是官方源，切换回去：
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

### 问题：某个包下载失败

**解决方案**：
1. 清除缓存：`npm cache clean --force`
2. 删除 node_modules：`rm -rf node_modules`
3. 重新安装：`npm install`

---

## 相关文件

- **全局配置**：`~/.npmrc`
- **项目配置**：`my-blog/.npmrc` (如果存在)
- **缓存目录**：`~/.npm/`

---

**最后更新**：2026-08-29  
**当前源**：https://registry.npmjs.org/
