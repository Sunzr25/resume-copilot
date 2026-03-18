<div align="center">

# Resume Copilot

**你的私人 AI 求职助理：粘贴 JD，一键生成定制简历、面试预测题与 LaTeX 导出**

本地优先，隐私优先，BYOK（自带 API Key）

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

[发版更新](#-v101-2026-03-18) • [核心亮点](#核心亮点) • [产品展示](#产品展示) • [快速开始](#快速开始)

</div>

---

## 📢 v1.0.1 (2026-03-18)

**从 v1.0.0 升级** ✨

### ✅ 新增功能
- 🎯 **一键配置脚本** (setup.sh) - 完全自动化环境部署
- 📝 **快速开始指南** - 5分钟快速上手（QUICKSTART-CN.md）
- 🔐 优化 **KIMI/Moonshot AI** 集成，开箱即用

### 🐛 Bug 修复
- 修复 PDF 上传兼容性问题 → 使用更稳定的文本粘贴方案
- 优化数据库初始化流程
- 改进 UI 交互和错误提示

### 📚 文档
- 添加中文快速开始指南
- 补充部署清单和示例配置
- 详化 API 配置文档

---

## ✨ 核心亮点

- 一份全量履历，多份定制简历：不需要为每个岗位重复改简历。
- 反幻觉生成：AI 只做选择、裁剪、重组和包装，不会编造不存在的经历。
- STAR 法则重写：自动把项目描述改写得更像面试官爱看的版本。
- 面试预测：同时给出高频问题和薄弱点压力问题。
- 本地存储：简历和投递记录保存在本地 SQLite，不依赖第三方后端。
- LaTeX 导出：在网页中直接下载 `.tex` 文件，方便继续排版或导出 PDF。

## 产品展示

### 履历素材库

维护你的全量经历、技能、项目、简介，作为 AI 定制的素材源。

![Profile](https://raw.githubusercontent.com/wanqin2003/resume-copilot/main/public/demo-profile1.png)

### AI 定制工作台

输入目标岗位 JD，自动输出：

- 定制个人优势总结
- 精准匹配技能关键词
- 最相关的 3 个项目
- 面试预测问题
- LaTeX 简历源码导出

![Tailor](https://raw.githubusercontent.com/wanqin2003/resume-copilot/main/public/demo-tailor1.png)

### 投递看板

用清晰的看板方式追踪每一条机会，从准备到结束。

![Tracker](https://raw.githubusercontent.com/wanqin2003/resume-copilot/main/public/demo-tracker.png)

### 招聘信息

智能爬取招聘网站信息，基于你的信息推荐匹配职位。

![Recruitment](https://raw.githubusercontent.com/wanqin2003/resume-copilot/main/public/demo-recruitment.png)

---

## 🚀 快速开始

👉 **[📖 点击查看详细的快速开始指南](./QUICKSTART-CN.md)**

5分钟快速上手，包括：
- ✅ 一键自动配置脚本
- ✅ 手动配置步骤  
- ✅ API 密钥获取方法
- ✅ 常见问题排查

---

## 📝 License

MIT

