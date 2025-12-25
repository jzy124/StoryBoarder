# StoryBoarder AI Pro 🚀 (Supabase Auth + AI Engine + Stripe Payments)

**StoryBoarder AI Pro** 是一款集成了用户认证、AI内容生成和在线支付功能的全栈Web应用程序。它旨在为用户提供一个从注册、购买创作点数到将文本创意转化为视觉故事的一站式无缝体验。

![Storyboarder AI 示例图](https://i.imgur.com/3BXBqCR.png) <!-- 您可以替换为您最喜欢的项目截图URL -->

---

## 📖 用户使用指南

欢迎使用 StoryBoarder AI Pro！按照以下步骤，轻松将您的创意变为现实。

### 1. 注册与登录
*   **创建账户**: 首次访问时，请使用您的电子邮箱和密码注册一个新账户。认证过程由安全的Supabase服务处理。
*   **初始点数**: 作为新用户，您的账户会自动获赠 **10个** 免费的“生成点数”。
*   **登录**: 使用您注册的凭证登录，进入您的个人创作空间。

### 2. 核心创作流程
*   **定义角色**: 通过**文字描述**和上传**参考图片**来定义故事的主角。
*   **输入故事**: 将您的故事或流程大纲粘贴到文本框中，AI会智能地将其拆分为多个场景。
*   **选择风格**: 从多种预设的艺术风格中选择一种，以应用于整个故事板。

### 3. 生成与消耗
*   完成创作步骤后，点击 **“Generate Comics”** 按钮。
*   系统会为每个场景调用AI进行图像生成，每次生成会消耗您账户中的**10个**点数。
*   请在生成过程中耐心等待，避免重复点击。

### 4. 购买点数 (充值)
*   如果点数不足，您可以点击右上角用户菜单中的 **“Buy Credits (购买点数)”**。
*   **安全支付**: 您将被重定向到 **Stripe** 支付页面完成购买。我们不存储您的任何信用卡信息。
*   **点数到账**: 支付成功后，系统会自动为您的账户充值 **100个** 点数。刷新页面后，您就可以看到更新后的点数余额。

---

## 🛠️ 开发者操作指南

本部分面向需要对项目进行本地部署、开发和测试的开发者。

### 1. 代码结构

```
<项目根目录>/
├── payment/
│   └── backend/             # Flask 后端 (支付与业务逻辑)
│       ├── migrations/
│       ├── instance/
│       ├── .env             # **必需** 后端环境变量
│       ├── config.py
│       ├── models.py
│       ├── server.py
│       └── requirements.txt
│
├── src/                     # React 前端源代码
│   ├── components/
│   ├── services/
│   └── ...
│
├── .env.local               # **必需** 前端环境变量
└── package.json             # 前端依赖与启动脚本
```

### 2. 环境变量配置 (关键步骤)

您需要在**两个不同位置**创建并配置环境变量文件。

#### a. 前端环境变量

在**项目根目录**下，创建一个名为 **`.env.local`** 的文件，并填入以下内容：

```
# <项目根目录>/.env.local

# Supabase 项目凭证
VITE_SUPABASE_URL="https://<你的Supabase项目ID>.supabase.co"
VITE_SUPABASE_KEY="your_supabase_anon_key"

# Google Gemini API Key (或其他前端需要直接调用的AI Key)
VITE_GOOGLE_API_KEY="your_google_gemini_api_key"

# 指向你的Flask后端的API地址
VITE_PAYMENT_API_URL="http://localhost:5001/api"
```

#### b. 后端环境变量

在 **`payment/backend/`** 目录下，创建一个名为 **`.env`** 的文件，并填入以下内容：

```
# payment/backend/.env

# 用于保护Flask的密钥
SECRET_KEY='your_random_flask_secret_key'

# Stripe API Keys (请使用你的Stripe测试密钥)
STRIPE_SECRET_KEY='sk_test_xxxxxxxxxx'
STRIPE_WEBHOOK_SECRET='whsec_xxxxxxxxxx' # 从 Stripe CLI 获取
STRIPE_PRICE_ID='price_xxxxxxxxxx'      # 你在Stripe中创建的产品的价格ID
```

### 3. 本地运行流程 (更新版)

您需要同时运行 **三个** 独立的终端进程。

#### **终端 1: Stripe Webhook 转发**

*此进程确保支付成功后，您的后端能收到通知并给用户充值。*

```bash
# (需要先安装 Stripe CLI 并登录: stripe login)
stripe listen --forward-to localhost:5001/webhook/stripe
```
*让这个终端保持运行。*

#### **终端 2: 启动后端服务器**

*此进程负责处理支付、点数管理等核心业务逻辑。*

```bash
# 1. 导航到后端目录
cd payment/backend

# 2. (首次) 创建并激活Conda虚拟环境
#    a. 创建一个名为 'storyboarder' 的新环境 (可自定义名称和Python版本)
       conda create --name storyboarder python=3.10
#    b. 激活环境
       conda activate storyboarder
#    c. 安装Python依赖
       pip install -r requirements.txt

# 3. (首次) 初始化数据库 (完整流程)
#    a. 确保conda环境已激活
#    b. 设置Flask应用入口:
       export FLASK_APP=server.py  (macOS/Linux)
       set FLASK_APP=server.py    (Windows)
#    c. 初始化migrations文件夹 (仅在项目完全没有migrations文件夹时运行一次):
       flask db init
#    d. 创建迁移脚本:
      flask db migrate -m "Initial database setup"
#    e. 应用迁移到数据库:
      flask db upgrade

# 4. 启动Flask服务器 (确保conda环境已激活)
python server.py
```
*服务器将在 `http://127.0.0.1:5001` 上运行。让它保持运行。*

#### **终端 3: 启动前端开发服务器**

*这个进程为用户提供React交互界面。*

```bash
# 1. 导航到项目根目录 (这是你的前端运行路径)
cd <项目根目录>

# 2. (首次) 安装Node.js依赖
npm install

# 3. 启动Vite开发服务器
npm run dev
```
*Vite服务器将启动，并提供一个本地访问地址 (例如 `http://localhost:3000`)。*

**最后，在浏览器中打开前端Vite服务器提供的地址 (例如 `http://localhost:3000`) 即可开始使用和测试。**

---

## 📝 TODO List

以下是目前已知需要改进和完善的功能点：

*   **[fix 251225] 支付流程优化**:
    *   创建独立的支付 **成功** (`/payment-success`) 和 **失败/取消** (`/payment-canceled`) 的前端路由和页面，为用户提供清晰的支付结果反馈，而不是简单地返回首页。
*   **[fix 251225] 防止重复点击**:
    *   在点击“Generate”按钮后，应立即**禁用该按钮**并显示一个明确的加载状态（如 Loading Spinner），直到所有图像生成完成或失败。这可以防止用户因不耐烦而重复点击，导致不必要的点数扣除和API调用。
*   **[fix 251225] 前端性能问题**:
    *   诊断并修复在某些操作（如登录后）导致前端向后端API（如 `/api/user/profile`）发起**无限次重复请求**的bug。这很可能与React `useEffect` 的不当使用或组件的反复挂载/卸载有关。

---

## 📝 Question List

1. 点数的判断在哪个环节进行？
2. 目前是一张图一个点数
