#!/bin/bash

# ============================================================
# Resume Copilot 一键环境配置脚本
# 
# 用法: bash setup.sh
# 
# 该脚本会自动：
# 1. 检查 Node.js 和 npm 是否已安装
# 2. 安装项目依赖
# 3. 配置环境变量
# 4. 初始化数据库
# 5. 构建项目
# ============================================================

set -e  # 任何命令失败都会停止执行

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色消息
print_step() {
    echo -e "${BLUE}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

# ============================================================
# 第一步：检查系统要求
# ============================================================
print_section "检查系统要求"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装"
    echo "请从 https://nodejs.org/ 下载并安装 Node.js (v18+)"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js 已安装: $NODE_VERSION"

# 检查 npm
if ! command -v npm &> /dev/null; then
    print_error "npm 未安装"
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm 已安装: $NPM_VERSION"

# ============================================================
# 第二步：安装依赖
# ============================================================
print_section "安装项目依赖"

print_step "运行 npm install..."
npm install
print_success "依赖安装完成"

# ============================================================
# 第三步：配置环境变量
# ============================================================
print_section "配置环境变量"

if [ ! -f .env.local ]; then
    print_step "创建 .env.local 文件..."
    cp .env.example .env.local
    print_success "已从 .env.example 创建 .env.local"
    
    print_warning "请编辑 .env.local 文件，填入你的 API 密钥"
    print_warning "特别是: OPENAI_API_KEY (KIMI API 密钥)"
    echo ""
    echo "获取 KIMI API 密钥:"
    echo "  1. 访问 https://platform.moonshot.cn/"
    echo "  2. 注册/登录账户"
    echo "  3. 在 API 密钥管理中创建新密钥"
    echo "  4. 复制密钥到 .env.local 中的 OPENAI_API_KEY"
    echo ""
    read -p "按 Enter 继续（确认你已配置 .env.local）..."
else
    print_success ".env.local 已存在，跳过创建"
fi

# ============================================================
# 第四步：初始化数据库
# ============================================================
print_section "初始化数据库"

print_step "生成 Prisma 客户端..."
npm run db:generate
print_success "Prisma 客户端已生成"

print_step "同步数据库模式..."
npm run db:push
print_success "数据库初始化完成"

# ============================================================
# 第五步：构建项目
# ============================================================
print_section "构建项目"

print_step "编译 TypeScript 和优化资源..."
npm run build
print_success "项目构建完成"

# ============================================================
# 完成
# ============================================================
print_section "✅ 环境配置完成！"

echo ""
echo "启动应用："
echo "  npm run dev      # 开发服务器 (http://localhost:3000)"
echo ""
echo "其他命令："
echo "  npm run build    # 生产构建"
echo "  npm start        # 启动生产服务器"
echo "  npm run lint     # 代码检查"
echo "  npm run db:studio # 打开 Prisma Studio (数据库管理界面)"
echo ""
echo "文档："
echo "  README.md        # 项目介绍"
echo "  QUICKSTART.md    # 快速开始指南"
echo ""
