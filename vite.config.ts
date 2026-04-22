import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const host = '127.0.0.1'
const port = 3000

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
    port,
    host,
    open: true,
    strictPort: true, // 锁定 3000 端口，避免页面和 websocket 端口漂移
    hmr: {
      protocol: 'ws',
      host,
      port,
      overlay: false,
    },
    proxy: {
      '/api/deepseek-chat': {
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
