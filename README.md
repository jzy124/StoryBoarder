# StoryBoarder

**StoryBoarder AI** 是一个创新的Web应用程序，旨在将枯燥的文本（如用户研究报告、故事摘要、日常流程）快速转化为引人入вершен的连环画或故事板。借助阿里云通义千问（Qwen）系列强大的AIGC模型，用户无需任何绘画技能，即可生成具有一致性角色和风格多样的视觉叙事作品。

![Storyboarder AI 示例图](https://i.imgur.com/3BXBqCR.png) <!-- 您可以替换为您最喜欢的项目截图URL -->

---

## 🌟 核心功能

*   **智能故事拆分**: 粘贴长篇文本，AI会自动将其分解为适合单个画格的独立场景。
*   **多模态角色定义**:
    *   **文字描述**: 通过文字详细定义角色的外观、衣着和气质。
    *   **视觉参考**: 上传一张图片作为角色的视觉基准，AI会分析其特征以保证后续生成的一致性。
    *   **混合模式**: 结合图片和文字，实现最高精度的角色控制。
*   **多样化艺术风格**: 提供多种预设的艺术风格（如水彩、线稿、企业风等），一键应用到整个故事板。
*   **动态模型切换 (实验性)**: 内置模型切换功能，方便开发者和用户比较不同版本AI模型（如 `qwen3-vl-plus` vs `qwen-vl-plus`）的效果。
*   **一键生成与微调**: 快速生成所有场景的图像，并支持对不满意的单个画格进行重新生成。
*   **便捷导出**: 轻松下载单个画格或打包下载整个故事板。

---

## 🛠️ 技术栈

本项目采用前后端分离的现代化架构，确保了安全性、可维护性和高性能。

### **前端 (Frontend)**

*   **框架**: [React](https://react.dev/) (使用 Vite 作为构建工具)
*   **语言**: TypeScript, JavaScript
*   **UI组件**: 使用 [Lucide React](https://lucide.dev/) 提供清晰的图标
*   **样式**: [Tailwind CSS](https://tailwindcss.com/) (实用优先的CSS框架)

### **后端 (Backend)**

*   **框架**: [Flask](https://flask.palletsprojects.com/) (轻量级的Python Web框架)
*   **语言**: Python
*   **AI模型服务**: [阿里云百炼大模型 (Dashscope)](https://help.aliyun.com/zh/model-studio)
    *   **故事拆分 (LLM)**: `qwen-plus` (通过OpenAI兼容模式API)
    *   **角色分析 (VLM)**: `qwen3-vl-plus` / `qwen-vl-plus` (通过原生Dashscope SDK)
    *   **图像生成 (Text-to-Image)**: `qwen-image-plus` / `qwen-image-edit-plus` (通过原生Dashscope SDK)

---

## 🚀 本地部署指南

请按照以下步骤在您的本地机器上运行本项目。

### **先决条件**

*   [Node.js](https://nodejs.org/) (版本 **v18.x** 或更高)
*   [Python](https://www.python.org/) (版本 **3.8** 或更高)
*   一个有效的**阿里云百炼API Key**。您可以从[这里](https://help.aliyun.com/zh/model-studio/get-api-key)获取。

### **1. 克隆仓库**

```bash
git clone <你的仓库URL>
cd storyboarder-qwen
```

### **2. 配置后端**

后端负责安全地调用AI模型API。

a. **进入后端目录并创建虚拟环境**:
```bash
cd backend
python -m venv venv
```

b. **激活虚拟环境**:
   *   在 macOS / Linux 上:
       ```bash
       source venv/bin/activate
       ```
   *   在 Windows 上:
       ```cmd
       venv\Scripts\activate
       ```

c. **安装Python依赖**:
```bash
pip install Flask Flask-Cors dashscope openai
```

d. **设置API Key**:
   这是最关键的一步。我们推荐使用环境变量来设置您的API Key。
   *   在 macOS / Linux 上:
       ```bash
       export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"
       ```
       (将 `sk-xxx...` 替换为您真实的Key)
   *   在 Windows (CMD) 上:
       ```cmd
       set DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"
       ```
   **重要**: 确保您设置Key的终端窗口，就是您即将用来启动服务器的那个窗口。

### **3. 配置前端**

前端是用户与之交互的界面。

a. **进入前端目录**:
   (请打开一个新的终端窗口)
   ```bash

   cd ../frontend
   ```
   (确保您是从项目根目录进入的)

b. **安装Node.js依赖**:
```bash
npm install
```

### **4. 启动应用！**

现在，您需要保持两个终端窗口同时运行。

a. **启动后端服务器**:
   在您的**后端终端**窗口中 (确保虚拟环境已激活且API Key已设置)，运行:
   ```bash
   python server.py
   ```
   您应该会看到服务器在 `http://127.0.0.1:5001` 上成功启动的日志。

b. **启动前端开发服务器**:
   在您的**前端终端**窗口中，运行:
   ```bash
   npm run dev
   ```
   您应该会看到Vite服务器成功启动，并提供一个本地访问地址 (通常是 `http://localhost:5173`)。

c. **访问应用**:
   在您的浏览器中打开Vite提供的前端地址。现在，您可以开始创作您的故事板了！

---

## 📝 未来展望

*   [ ] 引入用户认证系统，支持保存和管理历史项目。
*   [ ] 增加更多可控的图像生成参数，如镜头角度、人物表情等。
*   [ ] 支持更丰富的导出格式，如PDF或GIF动图。
*   [ ] 探索更多AI模型的集成，提供更多样的艺术风格和功能。

---

*这个项目由 [你的名字/团队名] 创建，旨在探索AIGC技术在创意工作流中的应用潜力。*