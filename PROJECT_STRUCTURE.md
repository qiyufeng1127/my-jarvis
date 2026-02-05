# ManifestOS - 项目结构说明

## 📋 项目概述
**ManifestOS** - 纯本地个人成长管理系统
- ✅ 所有数据保存在浏览器 localStorage
- ✅ 无需服务器，无需登录
- ✅ 隐私安全，数据完全本地化

---

## 🏗️ 核心架构

### 技术栈
- React 18 + TypeScript
- Zustand (状态管理) + Persist (持久化)
- Tailwind CSS (样式)
- Vite (构建工具)
- 百度 AI API (智能功能)

### 数据流
```
用户操作 → 组件 → Zustand Store → localStorage → 持久化
```

---

## 📁 目录结构

```
src/
├── pages/                    # 页面
│   ├── Dashboard.tsx        # 主控面板 ✅
│   ├── Welcome.tsx          # 欢迎页 ✅
│   └── BaiduAITest.tsx      # AI测试页 ✅
│
├── stores/                   # 状态管理（所有数据存储）
│   ├── taskStore.ts         # 任务管理 ✅ 核心
│   ├── goalStore.ts         # 目标管理 ✅
│   ├── goldStore.ts         # 金币系统 ✅
│   ├── growthStore.ts       # 成长系统 ✅
│   ├── taskHistoryStore.ts  # 任务历史 ✅
│   ├── taskTemplateStore.ts # 任务模板 ✅
│   ├── sideHustleStore.ts   # 副业管理 ✅
│   ├── memoryStore.ts       # 记忆/日记 ✅
│   ├── userStore.ts         # 用户设置 ✅
│   ├── themeStore.ts        # 主题设置 ✅
│   ├── notificationStore.ts # 通知管理 ✅
│   ├── tutorialStore.ts     # 教程进度 ✅
│   └── aiStore.ts           # AI配置 ✅
│
├── components/               # UI组件
│   ├── ai/                  # AI相关
│   │   ├── AISmartInput.tsx # 智能输入 ✅ 核心
│   │   ├── AIChat.tsx       # AI对话 ✅
│   │   └── FloatingAIChat.tsx # 浮动助手 ✅
│   │
│   ├── calendar/            # 日历/时间轴
│   │   ├── TimelineCalendar.tsx # 时间轴 ✅ 核心
│   │   ├── TaskDetailPanel.tsx  # 任务详情 ✅
│   │   └── TaskVerification.tsx # 任务验证 ✅
│   │
│   ├── inbox/               # 收集箱
│   │   └── InboxPanel.tsx   # 收集箱面板 ✅
│   │
│   ├── growth/              # 成长系统
│   │   ├── GrowthPanel.tsx  # 成长面板 ✅
│   │   └── GoalsModule.tsx  # 目标模块 ✅
│   │
│   ├── money/               # 财务管理
│   │   └── MoneyTracker.tsx # 金钱追踪 ✅
│   │
│   ├── shared/              # 共享组件
│   │   └── UnifiedTaskEditor.tsx # 统一任务编辑器 ✅ 核心
│   │
│   ├── dashboard/           # 仪表板
│   │   ├── CustomizableDashboard.tsx # 可定制仪表板 ✅
│   │   └── ModuleComponents.tsx      # 模块组件 ✅
│   │
│   └── ui/                  # 基础UI组件
│       ├── Button.tsx       # 按钮 ✅
│       ├── Input.tsx        # 输入框 ✅
│       ├── Modal.tsx        # 弹窗 ✅
│       └── Card.tsx         # 卡片 ✅
│
├── services/                # 业务服务
│   ├── aiSmartService.ts    # AI智能服务 ✅ 核心
│   ├── aiService.ts         # AI基础服务 ✅
│   ├── baiduImageRecognition.ts # 图像识别 ✅
│   ├── taskVerificationService.ts # 任务验证 ✅
│   ├── voiceCommandService.ts # 语音命令 ✅
│   └── notificationService.ts # 通知服务 ✅
│
├── hooks/                   # 自定义Hooks
│   ├── useLocalStorage.ts   # 本地存储 ✅
│   ├── useTaskEditor.ts     # 任务编辑器 ✅
│   ├── useVoice.ts          # 语音识别 ✅
│   └── useColorTheme.ts     # 主题切换 ✅
│
├── utils/                   # 工具函数
│   ├── taskUtils.ts         # 任务工具 ✅
│   ├── goldCalculator.ts    # 金币计算 ✅
│   └── migrateStorage.ts    # 数据迁移 ✅
│
├── types/                   # 类型定义
│   └── index.ts             # 所有类型 ✅
│
├── App.tsx                  # 根组件 ✅
└── main.tsx                 # 入口文件 ✅
```

---

## 🎯 核心功能模块

### 1. 任务管理系统 ⭐⭐⭐⭐⭐
- **文件**: `taskStore.ts`, `UnifiedTaskEditor.tsx`, `TimelineCalendar.tsx`
- **功能**: 创建、编辑、完成、验证任务
- **特色**: AI智能解析、时间轴视图、图片验证

### 2. AI智能助手 ⭐⭐⭐⭐⭐
- **文件**: `AISmartInput.tsx`, `aiSmartService.ts`
- **功能**: 自然语言创建任务、AI对话
- **特色**: 百度AI集成、智能解析

### 3. 成长系统 ⭐⭐⭐⭐
- **文件**: `growthStore.ts`, `GrowthPanel.tsx`
- **功能**: 8大维度、等级系统、长期目标
- **特色**: 可视化成长追踪

### 4. 金币奖励系统 ⭐⭐⭐⭐
- **文件**: `goldStore.ts`, `goldCalculator.ts`
- **功能**: 任务奖励、金币管理
- **特色**: 游戏化激励

### 5. 副业管理 ⭐⭐⭐
- **文件**: `sideHustleStore.ts`, `MoneyTracker.tsx`
- **功能**: 副业项目、收支管理、时薪计算
- **特色**: ROI分析、效率排名

---

## 🔄 数据持久化

所有数据通过 Zustand Persist 自动保存到 localStorage：

```typescript
// 示例：taskStore
export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      createTask: (task) => {
        // 创建任务逻辑
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        // 自动保存到 localStorage
      },
    }),
    {
      name: 'manifestos-tasks-storage', // localStorage key
    }
  )
);
```

---

## 🚀 快速开始

### 开发
```bash
npm install
npm run dev
```

### 构建
```bash
npm run build
```

### 部署
- 自动部署到 Vercel
- 每次 push 到 main 分支自动触发

---

## ✅ 代码质量保证

### 已清理的内容
- ❌ 所有 Supabase 云同步代码
- ❌ 所有认证相关代码
- ❌ 所有文档文件
- ❌ 所有临时文件

### 保留的内容
- ✅ 核心功能代码
- ✅ 本地存储逻辑
- ✅ AI智能功能
- ✅ UI组件

---

## 📊 代码统计

- **总文件数**: ~100个
- **有效代码**: ~15,000行
- **Store文件**: 13个
- **组件**: ~80个
- **服务**: 11个
- **Hooks**: 10个

---

## 🎨 特色功能

1. **AI智能输入** - 自然语言创建任务
2. **时间轴视图** - 可视化任务时间线
3. **图片验证** - 防止拖延的任务验证
4. **金币系统** - 游戏化激励机制
5. **成长追踪** - 8大维度可视化
6. **副业管理** - ROI和效率分析
7. **语音助手** - 语音交互控制
8. **主题切换** - 多种主题选择

---

## 🔒 隐私安全

- ✅ 所有数据存储在本地浏览器
- ✅ 无需注册登录
- ✅ 无数据上传到服务器
- ✅ 完全离线可用（除AI功能）

---

## 📝 维护建议

1. **定期备份**: 导出 localStorage 数据
2. **清理缓存**: 定期清理旧数据
3. **更新依赖**: 保持依赖包最新
4. **代码审查**: 定期检查无用代码

---

**最后更新**: 2026-02-05
**版本**: 2.0.0 (纯本地版)

