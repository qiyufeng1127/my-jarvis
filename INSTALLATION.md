# 🚀 ManifestOS 安装和运行指南

## 📋 前置要求

在开始之前，请确保你的系统已安装：

- **Node.js**: >= 18.0.0 ([下载地址](https://nodejs.org/))
- **npm**: >= 9.0.0 (随 Node.js 一起安装)
- **Git**: 用于版本控制 (可选)

检查版本：
```bash
node --version
npm --version
```

---

## 🎯 第一步：安装依赖

在项目根目录下运行：

```bash
npm install
```

这将安装所有必需的依赖包，包括：
- React 18
- TypeScript
- Zustand
- Tailwind CSS
- Supabase
- 等等...

**预计安装时间**: 2-5 分钟（取决于网络速度）

---

## 🔧 第二步：配置环境变量

### 1. 创建 .env 文件

```bash
cp .env.example .env
```

### 2. 获取 Supabase 配置

#### 方法 A：使用现有 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 登录你的账号
3. 选择或创建一个项目
4. 进入 **Settings** → **API**
5. 复制以下信息：
   - **URL**: 项目 URL
   - **anon public**: 匿名公钥

#### 方法 B：创建新的 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 **New Project**
3. 填写项目信息：
   - Name: manifestos
   - Database Password: 设置一个强密码
   - Region: 选择离你最近的区域
4. 等待项目创建完成（约 2 分钟）
5. 进入 **Settings** → **API** 获取配置

### 3. 编辑 .env 文件

打开 `.env` 文件，填入你的配置：

```env
# Supabase 配置（必需）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# DeepSeek API（可选，用于 AI 功能）
VITE_DEEPSEEK_API_KEY=your-deepseek-key
VITE_DEEPSEEK_API_URL=https://api.deepseek.com

# 百度云图像识别（可选，用于验证功能）
VITE_BAIDU_API_KEY=your-baidu-key
VITE_BAIDU_SECRET_KEY=your-baidu-secret
```

**注意**: 只有 Supabase 配置是必需的，其他 API 可以稍后配置。

---

## 🗄️ 第三步：设置数据库

### 方法 A：使用 Supabase 控制台（推荐）

1. 打开你的 Supabase 项目
2. 点击左侧菜单的 **SQL Editor**
3. 点击 **New Query**
4. 打开项目中的 `supabase/schema.sql` 文件
5. 复制所有内容
6. 粘贴到 SQL Editor 中
7. 点击 **Run** 执行

**执行时间**: 约 10-30 秒

### 方法 B：使用 Supabase CLI（高级）

如果你安装了 Supabase CLI：

```bash
supabase db push
```

### 验证数据库设置

执行成功后，你应该能在 **Table Editor** 中看到以下表：
- users
- tasks
- growth_dimensions
- long_term_goals
- identity_levels
- bad_habits
- bad_habit_occurrences
- gold_transactions
- growth_history
- sync_logs
- reward_store
- reward_redemptions
- achievements

---

## 🎨 第四步：启动开发服务器

```bash
npm run dev
```

你应该看到类似的输出：

```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

---

## 🌐 第五步：访问应用

打开浏览器，访问：

```
http://localhost:3000
```

你应该看到 ManifestOS 的欢迎页面！

---

## ✅ 验证安装

### 检查清单

- [ ] 依赖安装成功（无错误）
- [ ] .env 文件已配置
- [ ] 数据库表已创建
- [ ] 开发服务器启动成功
- [ ] 浏览器能访问应用
- [ ] 欢迎页面正常显示

### 常见问题排查

#### 问题 1: 依赖安装失败

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules

# 重新安装
npm install
```

#### 问题 2: Supabase 连接失败

**检查**:
- .env 文件中的 URL 和 Key 是否正确
- Supabase 项目是否正常运行
- 网络连接是否正常

**解决方案**:
```bash
# 重新检查环境变量
cat .env

# 重启开发服务器
npm run dev
```

#### 问题 3: 端口被占用

**解决方案**:
```bash
# 使用其他端口
npm run dev -- --port 3001
```

#### 问题 4: TypeScript 错误

**解决方案**:
```bash
# 重新构建类型
npm run build
```

---

## 🎯 下一步

安装成功后，你可以：

1. **浏览应用**: 点击"开始我的成长之旅"
2. **查看文档**: 阅读 [DEVELOPMENT.md](./DEVELOPMENT.md)
3. **开始开发**: 参考 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
4. **自定义配置**: 修改 `src/constants/index.ts`

---

## 📚 有用的命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit
```

---

## 🆘 需要帮助？

- 📖 查看 [README.md](./README.md)
- 🛠️ 查看 [DEVELOPMENT.md](./DEVELOPMENT.md)
- 📊 查看 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- 🗂️ 查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 🎊 恭喜！

你已经成功安装并运行了 ManifestOS！

现在可以开始你的成长之旅了 🌱

---

*ManifestOS - 大女主成长操作系统*  
*让每一天都成为成长的一天！*

