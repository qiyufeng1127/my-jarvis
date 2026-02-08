# 🔧 故障排除指南

## 问题：打不开网站 / localStorage 访问被拒绝

### 错误信息
```
Failed to read the 'localStorage' property from 'Window': Access is denied for this document.
Failed to read the 'sessionStorage' property from 'Window': Access is denied for this document.
```

### 原因分析
这些错误通常由以下原因导致：
1. **浏览器扩展冲突**（如搜狗浏览器的扩展）
2. **浏览器隐私设置过严**
3. **使用了非标准浏览器**（如搜狗浏览器）
4. **开发服务器未正常启动**

---

## ✅ 解决方案

### 方案一：使用标准浏览器（强烈推荐）

**推荐使用以下浏览器之一：**
- ✅ Google Chrome
- ✅ Microsoft Edge
- ✅ Firefox
- ✅ Safari（Mac）

**步骤：**
1. 打开上述任一浏览器
2. 访问：`http://localhost:5173`
3. 如果看到项目界面，说明成功！

---

### 方案二：正确启动开发服务器

**Windows PowerShell：**
```powershell
# 1. 进入项目目录
cd w:/001jiaweis/22222

# 2. 启动开发服务器
npm run dev
```

**预期输出：**
```
  VITE v5.0.11  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**然后：**
- 打开浏览器
- 访问：`http://localhost:5173`

---

### 方案三：清除浏览器缓存和扩展

**如果必须使用搜狗浏览器：**

1. **禁用所有浏览器扩展**
   - 打开扩展管理
   - 暂时禁用所有扩展
   - 刷新页面

2. **清除浏览器缓存**
   - 按 `Ctrl + Shift + Delete`
   - 选择"清除缓存"
   - 刷新页面

3. **检查隐私设置**
   - 设置 → 隐私和安全
   - 确保允许网站使用 localStorage
   - 刷新页面

---

### 方案四：使用手机访问（移动端测试）

**启动移动端开发服务器：**
```powershell
cd w:/001jiaweis/22222
npm run dev:mobile
```

**然后：**
1. 查看终端输出的 Network 地址
2. 用手机浏览器访问该地址
3. 点击右上角 💕 按钮测试功能

---

## 🎯 验证功能是否正常

### 1. 检查开发服务器
```powershell
# 应该看到类似输出：
VITE v5.0.11  ready in 500 ms
➜  Local:   http://localhost:5173/
```

### 2. 检查浏览器控制台
- 按 `F12` 打开开发者工具
- 查看 Console 标签
- **正常情况**：应该看到类似这样的日志
  ```
  ✅ 用户画像初始化完成
  📦 使用本地存储的目标
  💾 目标数据已保存到本地存储
  ```

### 3. 测试用户画像功能
- **手机端**：点击右上角 💕 按钮
- **电脑端**：点击顶部"我了解的你"按钮
- **预期**：弹出用户画像弹窗

---

## 🐛 常见问题

### Q1: 端口被占用
**错误信息：**
```
Port 5173 is already in use
```

**解决方案：**
```powershell
# 方法1：关闭占用端口的进程
netstat -ano | findstr :5173
taskkill /PID <进程ID> /F

# 方法2：使用其他端口
npm run dev -- --port 3000
```

### Q2: 依赖未安装
**错误信息：**
```
Cannot find module 'xxx'
```

**解决方案：**
```powershell
# 重新安装依赖
npm install
```

### Q3: TypeScript 编译错误
**解决方案：**
```powershell
# 检查 TypeScript 错误
npm run lint

# 如果有错误，查看具体文件并修复
```

### Q4: 页面空白
**可能原因：**
1. JavaScript 错误
2. 路由配置问题
3. 组件渲染错误

**解决方案：**
1. 打开浏览器控制台（F12）
2. 查看 Console 中的错误信息
3. 查看 Network 标签，确认资源加载正常

---

## 📱 测试用户画像功能

### 手机端测试
1. 启动项目：`npm run dev:mobile`
2. 用手机访问显示的 Network 地址
3. 点击右上角 💕 按钮
4. 应该看到用户画像弹窗

### 电脑端测试
1. 启动项目：`npm run dev`
2. 浏览器访问：`http://localhost:5173`
3. 点击顶部"我了解的你"按钮
4. 应该看到用户画像弹窗

### 预期效果
```
┌────────────────────────────────────────┐
│ 💕 我了解的你                    🔄  ✕ │
│ 了解度: 5% ⭐☆☆☆☆ • 第1天 • 初识阶段   │
├────────────────────────────────────────┤
│                                        │
│ ✨ 📝 基础信息                          │
│ • 你今天创建了这个效率系统...          │
│                                        │
│ 🎯 初步观察                            │
│ • 从你设置的目标来看...                │
│                                        │
└────────────────────────────────────────┘
```

---

## 🆘 仍然无法解决？

### 检查清单
- [ ] 使用的是标准浏览器（Chrome/Edge/Firefox）
- [ ] 开发服务器正常启动
- [ ] 浏览器控制台无严重错误
- [ ] 禁用了所有浏览器扩展
- [ ] 清除了浏览器缓存
- [ ] 网络连接正常

### 获取帮助
1. **查看完整日志**
   - 打开浏览器控制台（F12）
   - 截图所有错误信息
   - 查看 Network 标签

2. **查看文档**
   - `docs/USER_PROFILE_MODULE.md` - 完整功能文档
   - `docs/USER_PROFILE_QUICKSTART.md` - 快速开始指南
   - `README_MODULE_1.md` - 演示说明

3. **检查代码**
   - `src/services/userProfileService.ts` - 核心服务
   - `src/stores/userProfileStore.ts` - 状态管理
   - `src/components/profile/UserProfileModal.tsx` - UI组件

---

## 💡 最佳实践

### 开发环境推荐
- **操作系统**：Windows 10/11, macOS, Linux
- **浏览器**：Chrome 最新版
- **Node.js**：v18+ 或 v20+
- **编辑器**：VS Code + TypeScript 插件

### 避免的问题
- ❌ 不要使用搜狗浏览器、360浏览器等国产浏览器
- ❌ 不要安装过多浏览器扩展
- ❌ 不要在隐私模式下测试 localStorage 功能
- ❌ 不要同时运行多个开发服务器

### 推荐的做法
- ✅ 使用 Chrome 或 Edge 浏览器
- ✅ 定期清理浏览器缓存
- ✅ 使用标准端口（5173）
- ✅ 查看浏览器控制台日志

---

**最后更新**: 2024-02-07  
**适用版本**: v1.0.0

