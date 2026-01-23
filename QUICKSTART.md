# ManifestOS 快速启动指南

## 🎉 项目已创建成功！

ManifestOS 的基础架构已经搭建完成。以下是快速启动和继续开发的步骤。

## 📦 已完成的工作

### ✅ 项目结构
```
manifestos/
├── src/
│   ├── components/       # 组件目录（待扩展）
│   ├── pages/           # 页面组件
│   │   ├── Welcome.tsx  # ✅ 欢迎页
│   │   └── Dashboard.tsx # ✅ 主控面板
│   ├── stores/          # 状态管理
│   │   ├── userStore.ts    # ✅ 用户状态
│   │   ├── taskStore.ts    # ✅ 任务管理
│   │   └── growthStore.ts  # ✅ 成长系统
│   ├── services/        # API 服务
│   │   └── supabase/
│   │       └── client.ts   # ✅ Supabase 客户端
│   ├── types/           # TypeScript 类型
│   │   └── index.ts     # ✅ 完整类型定义
│   ├── constants/       # 常量配置
│   │   └── index.ts     # ✅ 所有系统常量
│   ├── utils/           # 工具函数
│   │   └── index.ts     # ✅ 完整工具集
│   ├── styles/          # 样式文件
│   │   └── globals.css  # ✅ 全局样式
│   ├── App.tsx          # ✅ 主应用组件
│   └── main.tsx         # ✅ 入口文件
├── supabase/
│   └── schema.sql       # ✅ 完整数据库架构
├── public/              # 静态资源
├── package.json         # ✅ 依赖配置
├── tsconfig.json        # ✅ TypeScript 配置
├── tailwind.config.js   # ✅ Tailwind 配置
├── vite.config.ts       # ✅ Vite 配置
├── README.md            # ✅ 项目说明
└── DEVELOPMENT.md       # ✅ 开发指南
```

### ✅ 核心功能
- 完整的数据库架构设计（13 个表）
- 类型安全的 TypeScript 定义
- Zustand 状态管理
- Tailwind CSS 设计系统
- 响应式布局和暗色模式支持
- 欢迎页和主控面板基础界面

## 🚀 立即开始

### 步骤 1: 安装依赖

```bash
npm install
```

### 步骤 2: 配置环境变量

1. 创建 `.env` 文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的配置：

```env
# Supabase 配置（必需）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# DeepSeek API（可选，用于 AI 功能）
VITE_DEEPSEEK_API_KEY=your-deepseek-key
VITE_DEEPSEEK_API_URL=https://api.deepseek.com

# 百度云图像识别（可选，用于验证功能）
VITE_BAIDU_API_KEY=your-baidu-key
VITE_BAIDU_SECRET_KEY=your-baidu-secret
```

#### 如何获取 Supabase 配置：

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目或使用现有项目
3. 进入项目设置 → API
4. 复制 `URL` 和 `anon public` key

### 步骤 3: 设置数据库

在 Supabase 控制台执行数据库架构：

1. 打开 Supabase 项目
2. 进入 SQL Editor
3. 复制 `supabase/schema.sql` 的内容
4. 粘贴并执行

或使用 Supabase CLI：
```bash
supabase db push
```

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用！

## 🎨 当前界面预览

### 欢迎页
- 精美的渐变背景
- 核心特性展示
- 一键开始按钮

### 主控面板
- 左侧：成长维度面板
- 中间：今日任务时间轴
- 右侧：长期目标和金币余额
- 右下角：Kiki 宝宝语音助手浮窗

## 📝 下一步开发建议

### 优先级 1：完善 Supabase 集成

创建 API 服务文件：

```bash
# 创建服务文件
mkdir -p src/services/supabase
touch src/services/supabase/users.ts
touch src/services/supabase/tasks.ts
touch src/services/supabase/growth.ts
```

在这些文件中实现 CRUD 操作，连接 Supabase 数据库。

### 优先级 2：实现任务创建功能

创建任务表单组件：

```bash
mkdir -p src/components/task
touch src/components/task/TaskForm.tsx
touch src/components/task/TaskCard.tsx
```

### 优先级 3：添加 UI 组件库

创建基础 UI 组件：

```bash
mkdir -p src/components/ui
touch src/components/ui/Button.tsx
touch src/components/ui/Input.tsx
touch src/components/ui/Modal.tsx
touch src/components/ui/Card.tsx
```

### 优先级 4：实现语音交互

创建语音服务：

```bash
mkdir -p src/services/voice
touch src/services/voice/recognition.ts
touch src/services/voice/synthesis.ts
touch src/hooks/useVoice.ts
```

## 🛠️ 可用的脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 📚 技术文档

- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Vite 文档](https://vitejs.dev)

## 🎯 核心功能实现路线图

### 第一阶段：基础功能（1-2周）
- [x] 项目架构搭建
- [x] 数据库设计
- [x] 基础页面
- [ ] Supabase 集成
- [ ] 任务 CRUD
- [ ] 成长系统基础

### 第二阶段：核心功能（2-3周）
- [ ] 语音交互（Kiki 宝宝）
- [ ] 防拖延验证
- [ ] 金币经济系统
- [ ] 坏习惯追踪
- [ ] 数据可视化

### 第三阶段：高级功能（3-4周）
- [ ] AI 任务建议
- [ ] 多设备同步
- [ ] 数据报告
- [ ] 奖励商店
- [ ] 成就系统

### 第四阶段：优化和发布（1-2周）
- [ ] 性能优化
- [ ] 测试覆盖
- [ ] 文档完善
- [ ] 部署上线

## 💡 开发技巧

### 1. 使用 TypeScript 类型提示
所有类型都在 `src/types/index.ts` 中定义，充分利用 IDE 的自动补全。

### 2. 使用 Zustand DevTools
安装浏览器扩展查看状态变化：
```bash
npm install -D @redux-devtools/extension
```

### 3. 使用 Tailwind CSS IntelliSense
安装 VS Code 扩展获得 CSS 类名提示。

### 4. 热重载
Vite 提供快速的热模块替换（HMR），修改代码后立即看到效果。

## 🐛 常见问题

### Q: 启动时报错找不到模块？
A: 运行 `npm install` 确保所有依赖已安装。

### Q: Supabase 连接失败？
A: 检查 `.env` 文件中的配置是否正确，确保 URL 和 Key 有效。

### Q: 样式不生效？
A: 确保 `tailwind.config.js` 的 content 路径正确，重启开发服务器。

### Q: TypeScript 报错？
A: 运行 `npm run build` 查看详细错误信息，检查类型定义。

## 🤝 需要帮助？

- 查看 `DEVELOPMENT.md` 了解详细开发指南
- 查看 `README.md` 了解项目概述
- 查看代码注释了解具体实现

## 🎊 恭喜！

你已经成功创建了 ManifestOS 项目的基础架构！

现在可以开始：
1. 启动开发服务器：`npm run dev`
2. 打开浏览器访问：http://localhost:3000
3. 开始开发你的第一个功能

**让每一天都成为成长的一天！🌱**

---

*ManifestOS - 大女主成长操作系统*

