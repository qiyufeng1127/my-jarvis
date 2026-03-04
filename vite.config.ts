import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/my-jarvis/', // 与 service worker 路径保持一致
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
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
    proxy: {
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

