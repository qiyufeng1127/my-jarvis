# 🎉 ManifestOS 快速配置脚本

## 自动配置环境变量

### Windows (PowerShell)

```powershell
# 创建 .env 文件
@"
# Supabase 配置（必需）
VITE_SUPABASE_URL=https://nucvylmszllecoupjfbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o

# DeepSeek API（可选，用于 AI 功能）
# VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
# VITE_DEEPSEEK_API_URL=https://api.deepseek.com

# 百度云图像识别（可选，用于验证功能）
# VITE_BAIDU_API_KEY=your_baidu_api_key
# VITE_BAIDU_SECRET_KEY=your_baidu_secret_key
"@ | Out-File -FilePath .env -Encoding UTF8

Write-Host "✅ .env 文件创建成功！" -ForegroundColor Green
```

### Linux / macOS (Bash)

```bash
# 创建 .env 文件
cat > .env << 'EOF'
# Supabase 配置（必需）
VITE_SUPABASE_URL=https://nucvylmszllecoupjfbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o

# DeepSeek API（可选，用于 AI 功能）
# VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
# VITE_DEEPSEEK_API_URL=https://api.deepseek.com

# 百度云图像识别（可选，用于验证功能）
# VITE_BAIDU_API_KEY=your_baidu_api_key
# VITE_BAIDU_SECRET_KEY=your_baidu_secret_key
EOF

echo "✅ .env 文件创建成功！"
```

---

## 🚀 完整启动流程

### 步骤 1: 创建 .env 文件

**选择你的操作系统，运行上面的脚本**

或者**手动创建**：

1. 在项目根目录创建 `.env` 文件
2. 复制以下内容：

```env
VITE_SUPABASE_URL=https://nucvylmszllecoupjfbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 设置数据库

1. 访问 Supabase 控制台：
   ```
   https://supabase.com/dashboard/project/nucvylmszllecoupjfbh
   ```

2. 点击 **SQL Editor** → **New Query**

3. 复制 `supabase/schema.sql` 的内容并执行

### 步骤 4: 启动项目

```bash
npm run dev
```

### 步骤 5: 访问应用

```
http://localhost:3000
```

---

## ✅ 验证配置

### 检查 .env 文件

```bash
# Windows
type .env

# Linux/macOS
cat .env
```

应该看到 Supabase URL 和 Key

### 检查依赖安装

```bash
npm list react
```

应该看到 React 18.x.x

### 检查数据库

在 Supabase 控制台的 **Table Editor** 中应该看到 13 个表

---

## 🎯 快速测试

启动后，你应该能：

1. ✅ 看到欢迎页面
2. ✅ 点击"开始我的成长之旅"
3. ✅ 进入主控面板
4. ✅ 看到成长维度和金币余额
5. ✅ 点击语音按钮（🎤）
6. ✅ 创建第一个任务

---

## 🐛 故障排除

### 问题 1: .env 文件不生效

**解决**:
```bash
# 重启开发服务器
# 按 Ctrl+C 停止
npm run dev
```

### 问题 2: Supabase 连接失败

**检查**:
1. URL 是否正确
2. Key 是否完整（没有换行）
3. 网络连接是否正常

### 问题 3: 数据库表未创建

**解决**:
1. 重新执行 schema.sql
2. 检查 SQL 执行是否有错误
3. 查看 Supabase 日志

---

## 📞 需要帮助？

查看详细文档：
- 📖 **DEPLOYMENT_GUIDE.md** - 完整部署指南
- 🛠️ **INSTALLATION.md** - 安装说明
- ⚡ **QUICK_REFERENCE.md** - 快速参考

---

**让每一天都成为成长的一天！🌱**

