# ManifestOS - 我要变好

> 大女主成长操作系统 - 将高效生产力与个人成长深度整合的AI驱动生活操作系统

## 🌟 项目愿景

ManifestOS 不仅帮助用户完成任务，更通过游戏化机制、显化法则和视觉化成长追踪，将每一个日常行动都转化为通往"理想自我"的坚实步伐，真正实现"通过小任务，完成大蜕变"。

## ✨ 核心特性

- 🎯 **大女主成长系统** - 可定制的成长维度、身份层级和长期目标追踪
- 🎤 **Kiki宝宝语音助手** - 自然语言交互，零学习成本
- ⚡ **智能防拖延** - AI驱动的任务验证和进度检查
- 💰 **动态金币经济** - 即时激励，行为塑造
- 📊 **坏习惯追踪** - 智能识别和改进计划
- 🔄 **多设备同步** - 无缝跨设备体验
- 📈 **成长数据分析** - 深度洞察，持续优化

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **路由**: React Router v6
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **图表**: Recharts
- **动画**: Framer Motion
- **拖拽**: @dnd-kit

### 后端
- **数据库**: Supabase (PostgreSQL)
- **实时同步**: Supabase Realtime
- **存储**: Supabase Storage
- **认证**: 同步码系统

### AI服务
- **NLP**: DeepSeek API
- **图像识别**: 百度云图像识别API
- **语音**: Web Speech API

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API 密钥
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 📁 项目结构

```
manifestos/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── ui/           # 基础UI组件
│   │   ├── layout/       # 布局组件
│   │   ├── task/         # 任务相关组件
│   │   ├── growth/       # 成长相关组件
│   │   └── voice/        # 语音交互组件
│   ├── pages/            # 页面组件
│   ├── stores/           # Zustand状态管理
│   ├── services/         # API服务
│   │   ├── supabase/    # Supabase服务
│   │   ├── ai/          # AI服务
│   │   └── voice/       # 语音服务
│   ├── hooks/            # 自定义Hooks
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript类型定义
│   ├── constants/        # 常量定义
│   └── styles/           # 全局样式
├── public/               # 静态资源
└── supabase/            # Supabase配置和迁移
```

## 🎨 设计系统

### 色彩系统
- **主色调**: 复古高饱和红色 (#991B1B)
- **辅助色**: 紫色 (#7C3AED)
- **成功色**: 绿色 (#047857)
- **警告色**: 橙色 (#d97706)

### 字体系统
- **主字体**: SF Pro Display
- **备用字体**: Inter
- **字号**: 12/14/16/20/24/32/40px

### 间距系统
- **基础单位**: 8px
- **间距尺度**: 8/16/24/32/40/48/64/80/96px

## 📊 数据模型

详见 `supabase/schema.sql` 文件，包含以下核心表：
- `users` - 用户表
- `tasks` - 任务表
- `growth_dimensions` - 成长维度表
- `long_term_goals` - 长期目标表
- `identity_levels` - 身份层级表
- `bad_habits` - 坏习惯记录表
- `gold_transactions` - 金币交易表
- `sync_logs` - 同步日志表

## 🔐 安全与隐私

- 端到端加密的数据同步
- 本地优先的数据存储
- 一次性同步码系统
- 可随时撤销的设备授权
- 符合GDPR和中国网络安全法

## 📝 开发计划

- [x] 项目基础架构
- [ ] Supabase数据库设置
- [ ] 核心状态管理
- [ ] 设计系统和组件库
- [ ] 语音交互系统
- [ ] 成长系统
- [ ] 任务管理系统
- [ ] 金币经济系统
- [ ] 坏习惯追踪
- [ ] 多设备同步

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过 Issue 联系我们。

---

**让每一天都成为成长的一天 🌱**

