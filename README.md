# StoryBoarder AI 🚀

一个Web应用，可将文本故事快速转化为连环画或故事板。本项目使用React (Vite) 作为前端，Supabase进行用户认证和数据存储。

## 代码结构

所有前端源代码都位于 `/src` 目录中，遵循标准的Vite + React项目结构。

```
storyboarder/
├── public/                 # 静态资源
├── src/                    # 所有前端源代码
│   ├── components/         # 可复用的React组件
│   ├── services/           # 用于调用外部API的服务 (Supabase, AI模型等)
│   ├── App.tsx             # 应用主组件
│   └── main.tsx            # 应用入口文件
├── .env.local              # 本地环境变量 (!!不在Git中!!)
├── index.html              # HTML根页面
├── package.json
└── vite.config.ts
```

## 🚀 本地开发指南

### 1. 安装依赖

在项目根目录 (`storyboarder/`) 的终端中，运行以下命令安装所有Node.js依赖：

```bash
npm install
```

### 2. 配置本地环境变量

为了让应用能在您的本地机器上连接到Supabase和其他服务，您需要在项目根目录 (`storyboarder/`) 下创建一个名为 `.env.local` 的文件。

**`/.env.local` 文件内容示例:**

```env
# Supabase 项目信息
# 从你的 Supabase 项目设置 -> API 中获取
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_KEY="your-public-anon-key"

# AI 模型 API 密钥 (如果前端直接调用)
# 如果你的 geminiService.ts 需要一个密钥
VITE_GEMINI_API_KEY="your-gemini-api-key"

# 支付微服务的后端地址 (用于后续集成)
VITE_PAYMENT_API_URL="http://localhost:5001/api"
```

> **重要**:
> *   请务必将占位符 (`your-...`) 替换为您自己的真实密钥和URL。
> *   `.env.local` 文件已被 `.gitignore` 忽略，不会被提交到代码仓库。

### 3. 运行开发服务器

完成上述配置后，在项目根目录 (`storyboarder/`) 的终端中运行：

```bash
npm run dev
```

Vite开发服务器将会启动，并在终端中提供一个本地访问地址 (通常是 `http://localhost:5173`)。在浏览器中打开此地址即可访问和测试您的应用。

---

### (可选) 运行独立的支付微服务

本项目包含一个独立的支付功能模块，位于 `/payment` 目录下。如需在本地同时测试支付功能，请参考 `payment/readme.md` 中的指南来独立运行其后端服务。