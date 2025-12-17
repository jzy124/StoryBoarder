import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 新增的部分：设置代理
    proxy: {
      // 关键：当有请求以 /api 开头时
      '/api': {
        // 目标是你的后端服务器
        target: 'http://localhost:5001',
        // 允许跨域
        changeOrigin: true,
      }
    }
  }
})