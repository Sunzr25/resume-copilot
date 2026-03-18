# 🚀 快速开始指南 - Resume Copilot

> 5分钟快速上手！选择适合你的方式

---

## 📋 前置条件

- ✅ Node.js v18+ 已安装 ([下载](https://nodejs.org/))
- ✅ KIMI API 密钥（免费）([申请](https://platform.moonshot.cn/))

---

## ⚡ 方式一：一键自动配置（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/resume-copilot.git
cd resume-copilot

# 2. 运行自动配置脚本
bash setup.sh

# 3. 启动应用
npm run dev
```

✨ **完成！** 打开 http://localhost:3000

---

## 🔧 方式二：手动配置

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/resume-copilot.git
cd resume-copilot

# 2. 安装依赖
npm install

# 3. 创建环境文件
cp .env.example .env.local

# 4. 编辑 .env.local，填入你的 KIMI API 密钥
# OPENAI_API_KEY=your_kimi_api_key_here

# 5. 初始化数据库
npm run db:generate
npm run db:push

# 6. 启动应用
npm run dev
```

✨ **完成！** 打开 http://localhost:3000

---

## 🔐 获取 KIMI API 密钥

1. 访问 [KIMI 平台](https://platform.moonshot.cn/)
2. 注册/登录账户
3. 进入 `API 密钥管理`
4. 点击 `创建新密钥`
5. 复制密钥到 `.env.local`：

```dotenv
OPENAI_API_KEY=sk-xxx...  # 你的KIMI密钥
```

---

## 📝 3个使用场景

### 场景1️⃣：创建简历库

1. 点击左侧 **「履历库」**
2. 输入个人信息和工作经历
3. 保存

### 场景2️⃣：定制投递简历

1. 点击 **「定制工作台」**
2. 在左侧粘贴职位描述（JD）
3. 在右侧粘贴你的简历或输入内容
4. 点击 **「生成定制简历」**
5. 复制或下载生成的简历

### 场景3️⃣：导出 LaTeX 简历

1. 完成定制简历生成
2. 点击 **「下载 LaTeX」**
3. 用 LaTeX 编辑器打开 `.tex` 文件
4. 编译为 PDF 输出

---

## ❌ 常见问题排查

### Q: Node.js 版本不对？
```bash
node --version  # 需要 v18+
```

### Q: 运行 setup.sh 出错？

尝试手动配置（方式二），或检查：
1. Node.js 版本 >= v18
2. npm 版本 >= v9
3. 网络连接正常

### Q: npm install 失败？

```bash
# 清除缓存重试
rm -rf node_modules package-lock.json
npm install
```

### Q: KIMI API 无法连接？

1. 检查 API 密钥是否正确复制到 `.env.local`
2. 检查账户是否有额度或充值
3. 查看 [KIMI 平台状态](https://platform.moonshot.cn/)

### Q: 数据库错误？

```bash
# 重置数据库
rm prisma/dev.db
npm run db:push
```

---

## 📚 更多信息

- 📖 完整文档：[README.md](./README.md)
- 🐛 问题报告：[GitHub Issues](https://github.com/yourusername/resume-copilot/issues)
- 💬 讨论区：[GitHub Discussions](https://github.com/yourusername/resume-copilot/discussions)

---

**祝你求职顺利！🎯**
