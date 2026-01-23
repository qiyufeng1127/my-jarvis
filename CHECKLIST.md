# ✅ ManifestOS 快速启动清单

## 🎯 你需要做的事情（按顺序）

---

## ☑️ 第一步：配置环境变量（2分钟）

### 最简单的方法：
```
找到文件：.env.local
重命名为：.env
```

### 或者手动创建：
1. 创建文件：`.env`
2. 复制内容：
```
VITE_SUPABASE_URL=https://nucvylmszllecoupjfbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o
```

✅ 完成后打勾：[ ]

---

## ☑️ 第二步：安装依赖（3-5分钟）

### 打开命令行：
```powershell
cd w:\001jiaweis\22222
npm install
```

### 等待完成，看到：
```
added xxx packages
```

✅ 完成后打勾：[ ]

---

## ☑️ 第三步：设置数据库（5分钟）

### 访问 Supabase：
```
https://supabase.com/dashboard/project/nucvylmszllecoupjfbh
```

### 执行 SQL：
1. 点击 **SQL Editor**
2. 点击 **New Query**
3. 复制 `supabase/schema.sql` 的内容
4. 粘贴并点击 **Run**
5. 等待完成

### 验证：
在 **Table Editor** 看到 13 个表

✅ 完成后打勾：[ ]

---

## ☑️ 第四步：启动项目（1分钟）

### 运行命令：
```powershell
npm run dev
```

### 看到：
```
➜  Local:   http://localhost:3000/
```

✅ 完成后打勾：[ ]

---

## ☑️ 第五步：访问应用（1分钟）

### 打开浏览器：
```
http://localhost:3000
```

### 应该看到：
- 欢迎页面
- "开始我的成长之旅" 按钮

✅ 完成后打勾：[ ]

---

## ☑️ 第六步：创建第一个任务（2分钟）

1. 点击"开始我的成长之旅"
2. 进入主控面板
3. 点击"添加任务"
4. 填写任务信息
5. 点击"创建任务"

✅ 完成后打勾：[ ]

---

## ☑️ 第七步：测试语音功能（2分钟）

1. 点击右下角 🎤 按钮
2. 允许麦克风权限
3. 说"查看今天的任务"
4. 听到 Kiki 的回应

✅ 完成后打勾：[ ]

---

## 🎉 全部完成！

如果所有步骤都打勾了，恭喜你！

你已经成功启动了 ManifestOS！

---

## 📋 快速命令参考

```powershell
# 进入项目目录
cd w:\001jiaweis\22222

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 🆘 遇到问题？

### 查看详细指南：
- **STEP_BY_STEP_GUIDE.md** - 详细步骤
- **DEPLOYMENT_GUIDE.md** - 部署指南
- **README_FIRST.md** - 快速开始

### 常见问题：
1. **页面空白** → 检查 .env 文件
2. **语音不工作** → 使用 Chrome 浏览器
3. **依赖安装失败** → 运行 `npm cache clean --force`

---

## 📞 重要文档

| 文档 | 用途 |
|------|------|
| **STEP_BY_STEP_GUIDE.md** | 详细步骤说明 ⭐ |
| **README_FIRST.md** | 快速开始 |
| **DEPLOYMENT_GUIDE.md** | 部署指南 |
| **QUICK_REFERENCE.md** | 快速参考 |

---

## 🎯 预计时间

- 配置环境：2 分钟
- 安装依赖：3-5 分钟
- 设置数据库：5 分钟
- 启动测试：5 分钟

**总计：15-20 分钟**

---

**让每一天都成为成长的一天！🌱**

