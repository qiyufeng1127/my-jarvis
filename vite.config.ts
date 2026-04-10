import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Vercel 部署使用根路径
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true, // 允许局域网访问
    open: true,
    strictPort: false, // 如果端口被占用，自动尝试下一个端口
    hmr: false, // 彻底关闭开发环境自动热更新/自动刷新，避免页面状态被重置
    proxy: {
      // 代理 DeepSeek AI 请求，解决本地开发 CORS 问题
      '/ai-api': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: () => '/v1/chat/completions',
        secure: false,
      },
      // 代理百度AI API请求，解决CORS跨域问题
      '/baidu-api': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/baidu-api/, ''),
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
