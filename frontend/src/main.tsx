import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // 我们需要一个CSS文件

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);