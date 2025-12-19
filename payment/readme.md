# Flask + Stripe 支付系统测试 - 快速启动指南

这是一个独立的Web应用，用于测试基于Flask后端的Stripe支付流程。它包含用户注册、登录、点数管理和支付功能。

## 先决条件

1.  **Conda**: 用于管理Python环境。
2.  **Stripe CLI**: 用于在本地测试Webhook。
3.  **API密钥**: 确保已在 `backend/.env` 文件中配置好所有必需的密钥 (`SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`)。

---

## 🚀 启动流程

您需要**两个**终端窗口来并行运行后端服务和Stripe Webhook转发。

### **终端 1: 启动后端服务器**

后端服务同时处理API逻辑并托管前端HTML页面。

```bash
# 1. (首次运行) 创建并激活Conda环境
# conda create --name stripe_test python=3.10
# conda activate stripe_test

# 2. 进入后端目录
cd backend

# 3. (首次运行) 安装Python依赖
pip install -r requirements.txt

# 4. (首次运行) 初始化数据库
# macOS / Linux: export FLASK_APP=server.py
# Windows: set FLASK_APP=server.py
# flask db upgrade

# 5. 启动后端服务器
python server.py
```
> 👉 **保持此终端窗口运行。** 服务器将启动在 `http://localhost:5001`。

---

### **终端 2: 启动Stripe Webhook转发**

此步骤对于测试支付成功后自动增加用户点数至关重要。

```bash
# (请打开一个新的终端窗口)

# 1. 登录Stripe (如果需要)
# stripe login

# 2. 开始转发Webhook事件到您的后端服务
stripe listen --forward-to localhost:5001/webhook/stripe
```
> 👉 **保持此终端窗口运行。**

---

## 访问与测试

1.  **访问应用**: 在您的浏览器中打开后端服务器提供的地址：
    **`http://localhost:5001`**

2.  **测试流程**:
    *   **注册**一个新账户 (新用户默认有10点数)。
    *   **登录**您的账户。
    *   点击 **“生成内容”** 按钮来测试点数扣除。
    *   点击 **“购买点数”** 按钮，使用Stripe的[测试信用卡号](https://stripe.com/docs/testing)完成支付。
    *   支付成功后，刷新页面或重新登录，您的点数应该已经增加了。