---
title: "VanishTrans"
lead: "一个轻量的 Windows AI 翻译工具，让阅读与翻译更自然地衔接。"
description: "VanishTrans 是轻量的 Windows AI 翻译工具，介绍公开仓库记录的桌面翻译能力、技术选择，以及当前适用范围与限制。"
progress: "已公开桌面翻译工具源码；版本与安装入口以仓库为准。"
short: "Windows 翻译工具 · 公开源码"
category: "软件"
status: "公开源码"
stack: ["Tauri 2", "React", "TypeScript", "Rust"]
evidence: "公开仓库 README"
visual: "vanishtrans"
sourceURL: "https://github.com/Wang060919/VanishTrans"
relatedURL: "/blog/ai-assisted-development-best-practices/"
weight: 1
date: 2026-10-17
---
## 从阅读中的一个小问题开始

在阅读外文资料时，翻译不应成为打断思路的额外步骤。VanishTrans 围绕 Windows 桌面的阅读场景，把文本翻译放到更近的地方。

## 围绕桌面的翻译体验

公开仓库记录了划词翻译、截图 OCR、文件翻译与桌面悬浮工作区等能力。自定义翻译服务使用兼容的 Chat Completions 接口，另有 Google 翻译选项；使用时需要对应服务可用。

翻译记忆使用 SQLite 保存，翻译历史与术语表帮助重复内容的处理。具体功能、安装包和当前版本，请以[项目 README 与 Releases](https://github.com/Wang060919/VanishTrans)为准。

## 技术选择与实现记录

界面使用 React 与 TypeScript，Tauri 2 连接桌面能力，Rust 处理后端逻辑。Windows 原生 OCR、快捷键、窗口行为与本地存储，也意味着需要认真处理不同模块之间的边界。

博客中的[AI 辅助开发实践](/blog/ai-assisted-development-best-practices/)记录了这个项目的跨端重构过程，包括分层、类型与协作规则。

## 当前边界

- 面向 Windows；本页不承诺其他系统的兼容性。
- 翻译结果依赖使用的服务、模型与网络条件。
- 本页展示的是为网站重绘的界面意象，非实际运行截图。

项目介绍依据 2026 年 10 月 17 日查阅的公开仓库资料整理，不以概念视觉代替实际功能验证。
