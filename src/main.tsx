// frontend/src/main.tsx (升级版)

import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. 从 react-router-dom 导入必要的组件
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import posthog from 'posthog-js';

import App from './App'; // 您的主应用组件
// 2. 导入我们为支付结果创建的新组件
import { PaymentResultPage } from './components/PaymentResultPage'; 


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// PostHog 初始化逻辑 (保持不变)
const posthogKey = (import.meta as any).env?.VITE_POSTHOG_KEY;
const posthogHost = (import.meta as any).env?.VITE_POSTHOG_HOST;

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
  });
}

const root = ReactDOM.createRoot(rootElement);

// 3. 修改 render 部分以使用路由
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 根路径 ("/") 仍然渲染您的主 <App /> 组件 */}
        <Route path="/*" element={<App />} />
        
        {/* 为支付成功和取消创建专门的路由 */}
        <Route path="/payment-success" element={<PaymentResultPage />} />
        <Route path="/payment-canceled" element={<PaymentResultPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);