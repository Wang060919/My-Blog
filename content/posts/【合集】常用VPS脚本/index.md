---
title: "【合集】常用 VPS 脚本与实用运维工具汇总"
date: 2024-08-26T20:30:00+08:00
draft: false
tags: ["VPS", "Linux", "NodeSeek", "运维脚本", "测速跑分", "DD重装"]
categories: ["运维技术"]
description: "整理自 NodeSeek 社区的常用 VPS 一键脚本合集，涵盖系统 DD 重装、性能跑分、流媒体解锁检测、网络测速、路由回程与环境部署等。"
---

# 【合集】常用 VPS 脚本与工具汇总

> 本文整理自 NodeSeek 社区，涵盖系统重装、性能跑分、网络测速、流媒体解锁检测、路由回程、常用环境部署以及独立服务器（杜甫）维护等常用一键脚本。

---

## 1、DD 重装脚本

原帖参考：https://www.nodeseek.com/post-116193-1

### 史上最强 DD 脚本 (leitbogioro)
```bash
wget --no-check-certificate -qO InstallNET.sh 'https://raw.githubusercontent.com/leitbogioro/Tools/master/Linux_reinstall/InstallNET.sh' && chmod a+x InstallNET.sh && bash InstallNET.sh -debian 12 -pwd '密码'
```

### 萌咖大佬的脚本
```bash
bash <(wget --no-check-certificate -qO- 'https://raw.githubusercontent.com/MoeClub/Note/master/InstallNET.sh') -d 11 -v 64 -p 你的密码 -port 端口 -a -firmware
```

### beta.gs 大佬的脚本
```bash
wget --no-check-certificate -O NewReinstall.sh https://raw.githubusercontent.com/fcurrk/reinstall/master/NewReinstall.sh && chmod a+x NewReinstall.sh && bash NewReinstall.sh
```

### DD Windows（使用 leitbogioro 脚本）
```bash
bash <(curl -sSL https://raw.githubusercontent.com/leitbogioro/Tools/master/Linux_reinstall/InstallNET.sh) -windows 10 -lang "cn"
```

- **账户**：`Administrator`
- **密码**：`Teddysun.com`

> **Windows 激活方法**：  
> 使用 `Win + R` 快捷键打开运行框，输入 `powershell` 运行，在打开的命令行中输入：
> ```powershell
> irm https://get.activated.win | iex
> ```

---

## 2、综合测试脚本

### bench.sh
```bash
wget -qO- bench.sh | bash
```

### LemonBench
```bash
wget -qO- https://raw.githubusercontent.com/LemonBench/LemonBench/main/LemonBench.sh | bash -s -- --fast
```

### 融合怪测评脚本
```bash
bash <(wget -qO- --no-check-certificate https://gitlab.com/spiritysdx/za/-/raw/main/ecs.sh)
```

### NodeBench
```bash
bash <(curl -sL https://raw.githubusercontent.com/LloydAsp/NodeBench/main/NodeBench.sh)
```

---

## 3、性能测试 (YABS)

### 完整测试
```bash
curl -sL yabs.sh | bash
```

### 跳过网络，测 Geekbench 5
```bash
curl -sL yabs.sh | bash -s -- -i5
```

### 跳过网络和磁盘，测 Geekbench 5
```bash
curl -sL yabs.sh | bash -s -- -if5
```

### 改测 Geekbench 5（不测 GB6）
```bash
curl -sL yabs.sh | bash -s -- -5
```

---

## 4、流媒体及 IP 质量测试

### 最常用流媒体检测
```bash
bash <(curl -L -s check.unlock.media)
```

### 原生检测脚本
```bash
bash <(curl -sL Media.Check.Place)
```

### 准确度最高检测
```bash
bash <(curl -L -s https://github.com/1-stream/RegionRestrictionCheck/raw/main/check.sh)
```

### IP 质量体检脚本
```bash
bash <(curl -sL IP.Check.Place)
```

### 一键修改解锁 DNS
```bash
wget https://raw.githubusercontent.com/Jimmyzxk/DNS-Alice-Unlock/refs/heads/main/dns-unlock.sh && bash dns-unlock.sh
```

### BBR v3 优化脚本
```bash
# 安装别名
bash <(curl -fsSL "https://raw.githubusercontent.com/Eric86777/vps-tcp-tune/main/install-alias.sh?$(date +%s)")

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc

# 以后直接使用
bbr
```

---

## 5、测速脚本

### Speedtest
```bash
bash <(curl -sL bash.icu/speedtest)
```

### Taier
```bash
bash <(curl -sL res.yserver.ink/taier.sh)
```

### hyperspeed
```bash
bash <(curl -Lso- https://bench.im/hyperspeed)
```

### 全球测速 (nws.sh)
```bash
# 全球测速
wget -qO- nws.sh | bash

# 区域速度测试
wget -qO- nws.sh | bash -s -- -r region_name

# Ping 和路由测试
wget -qO- nws.sh | bash -s -- -rt [region]
```

---

## 6、回程测试

### 直接显示回程（小白用这个）
```bash
curl https://raw.githubusercontent.com/ludashi2020/backtrace/main/install.sh -sSf | sh
```

### 回程详细测试（推荐）
```bash
wget -N --no-check-certificate https://raw.githubusercontent.com/Chennhaoo/Shell_Bash/master/AutoTrace.sh && chmod +x AutoTrace.sh && bash AutoTrace.sh
```
```bash
wget https://ghproxy.com/https://raw.githubusercontent.com/vpsxb/testrace/main/testrace.sh -O testrace.sh && bash testrace.sh
```

---

## 7、功能脚本

### 添加 SWAP
```bash
wget https://www.moerats.com/usr/shell/swap.sh && bash swap.sh
```

### Fail2ban
```bash
wget --no-check-certificate https://raw.githubusercontent.com/FunctionClub/Fail2ban/master/fail2ban.sh && bash fail2ban.sh 2>&1 | tee fail2ban.log
```

### 一键开启 BBR（适用于较新的 Debian、Ubuntu）
```bash
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
sysctl -p
sysctl net.ipv4.tcp_available_congestion_control
lsmod | grep bbr
```

### 多功能 BBR 安装脚本
```bash
wget -N --no-check-certificate "https://gist.github.com/zeruns/a0ec603f20d1b86de6a774a8ba27588f/raw/4f9957ae23f5efb2bb7c57a198ae2cffebfb1c56/tcp.sh" && chmod +x tcp.sh && ./tcp.sh
```

### 锐速 / BBRPLUS / BBR2 / BBR3 (tcpx)
```bash
wget -O tcpx.sh "https://github.com/ylx2016/Linux-NetSpeed/raw/master/tcpx.sh" && chmod +x tcpx.sh && ./tcpx.sh
```

### TCP 窗口调优
```bash
wget http://sh.nekoneko.cloud/tools.sh -O tools.sh && bash tools.sh
```

### 添加 WARP
```bash
wget -N https://gitlab.com/fscarmen/warp/-/raw/main/menu.sh && bash menu.sh [option] [lisence/url/token]
```

### 25 端口开放测试
```bash
telnet smtp.aol.com 25
```

---

## 8、一键安装常用环境及软件

### Docker
```bash
bash <(curl -sL 'https://get.docker.com')
```

### Python
```bash
curl -O https://raw.githubusercontent.com/lx969788249/lxspacepy/master/pyinstall.sh && chmod +x pyinstall.sh && ./pyinstall.sh
```

### iperf3
```bash
apt install -y iperf3
```

### Realm 端口转发
```bash
bash <(curl -L https://raw.githubusercontent.com/zhouh047/realm-oneclick-install/main/realm.sh) -i
```

### GOST 转发
```bash
wget --no-check-certificate -O gost.sh https://raw.githubusercontent.com/qqrrooty/EZgost/main/gost.sh && chmod +x gost.sh && ./gost.sh
```

### 极光面板
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Aurora-Admin-Panel/deploy/main/install.sh)
```

### 哪吒监控
```bash
curl -L https://raw.githubusercontent.com/naiba/nezha/master/script/install.sh -o nezha.sh && chmod +x nezha.sh && sudo ./nezha.sh
```

**哪吒面板自定义样式设置**：
```html
<script>
window.ShowNetTransfer = true;
window.FixedTopServerName = true;
window.DisableAnimatedMan = true;
</script>
```

### WARP
```bash
wget -N https://gitlab.com/fscarmen/warp/-/raw/main/menu.sh && bash menu.sh
```

### Aria2
```bash
wget -N git.io/aria2.sh && chmod +x aria2.sh && ./aria2.sh
```

### 宝塔面板
```bash
wget -O install.sh http://v7.hostcli.com/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

### PVE 虚拟化
```bash
bash <(wget -qO- --no-check-certificate https://raw.githubusercontent.com/oneclickvirt/pve/main/scripts/build_backend.sh)
```

### ArgoX
```bash
bash <(wget -qO- https://raw.githubusercontent.com/fscarmen/argox/main/argox.sh)
```

---

## 9、综合功能脚本

### 科技 lion 工具箱
```bash
apt update -y && apt install -y curl
bash <(curl -sL kejilion.sh)
```

### SKY-BOX 工具箱
```bash
wget -O box.sh https://raw.githubusercontent.com/BlueSkyXN/SKY-BOX/main/box.sh && chmod +x box.sh && clear && ./box.sh
```

---

## 10、其它常用资源

- **TG 中文汉化**：https://t.me/setlanguage/classic-zh-cn
- **送中报告地址**：去 Google 的帮助中心，[报告 IP 问题](https://support.google.com/websearch/contact/ip?hl=zh-CN)
- **TCP 迷之调参**：https://omnitt.com
- **awesome_docker**：https://github.com/coracoo/awesome_docker_cn

---

## 11、VPS 常备小命令【非脚本】

参考链接：https://www.nodeseek.com/post-424648-1

---

## 12、杜甫检测脚本

### 硬件及测速检测
```bash
curl -sL https://sick.onl | bash
```

```bash
wget https://github.com/Aniverse/A/raw/i/a && bash a
```

```bash
wget -qO- nws.sh | bash
```

```bash
curl -sL https://raw.githubusercontent.com/Yuri-NagaSaki/SICK/refs/heads/main/hardware_info.sh | bash -s -- -cn
```

### 杜甫高级 DD 重装命令 (leitbogioro 脚本)
```bash
# 1. 下载脚本
wget --no-check-certificate -qO InstallNET.sh 'https://raw.githubusercontent.com/leitbogioro/Tools/master/Linux_reinstall/InstallNET.sh' && chmod a+x InstallNET.sh

# 2. 开始 DD 重装
bash InstallNET.sh -debian 12

# 3. 杜甫指定 RAID 模式 DD（以 RAID 0 为例）
bash InstallNET.sh -debian 12 -raid "0"

# 4. 杜甫指定静态网络参数 DD（适合无 DHCP 的独服）
bash InstallNET.sh -debian 12 --ip-addr 139.162.52.1 --ip-mask 24 --ip-gate 139.162.52.1 --ip6-addr 2a07:e040:2:1d3::1 --ip6-gate 2a07:e040::1 --ip6-mask 32

# 5. 指定 root 密码 DD
bash InstallNET.sh -debian 12 -pwd 'your_password'
```

### 禁用 IPv6
```bash
# 向配置文件写入禁用 IPv6 的规则
echo "net.ipv6.conf.all.disable_ipv6 = 1" >> /etc/sysctl.conf
echo "net.ipv6.conf.default.disable_ipv6 = 1" >> /etc/sysctl.conf
echo "net.ipv6.conf.lo.disable_ipv6 = 1" >> /etc/sysctl.conf

# 让配置立即生效
sysctl -p
```