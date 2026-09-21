# npm 安装与排查

项目通过 package-lock.json 锁定版本。首次安装和构建环境使用：

```sh
npm ci --include=dev
```

Windows 和 WSL/Linux 各用独立目录，避免共用平台相关依赖。registry、代理等取决于当前机器配置，仓库不能证明它们的当前值。

## 只读检查

```sh
npm config get registry
npm outdated
npm audit
```

outdated 非零可能表示存在更新；audit 非零可能表示漏洞，也可能是网络或 registry 错误，应阅读具体输出。不要据此直接运行 npm audit fix --force。

确需更新时，先评估变更与漏洞影响，更新明确的依赖，再检查锁文件、运行生产构建和产物验证。

## 网络与代理

先检查 registry、连接和错误信息，不默认清空缓存或切换全局源。临时代理优先使用当前终端环境变量；也可使用项目 .npmrc（已忽略），其中不要提交令牌或个人代理设置。

npm 源迁移历史见 NPM_SOURCE_MIGRATION.md；该记录不代表另一台机器或当前会话的配置。
