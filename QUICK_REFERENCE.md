# 🚀 ManifestOS 快速参考

## 📦 快速启动

```bash
npm install              # 安装依赖
cp .env.example .env     # 配置环境变量
npm run dev              # 启动开发服务器
```

访问: http://localhost:3000

---

## 📁 关键文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 数据库架构 | `supabase/schema.sql` | 13个表的完整定义 |
| 类型定义 | `src/types/index.ts` | 所有 TypeScript 类型 |
| 常量配置 | `src/constants/index.ts` | 系统常量和默认值 |
| 用户状态 | `src/stores/userStore.ts` | 用户状态管理 |
| 任务状态 | `src/stores/taskStore.ts` | 任务状态管理 |
| 成长状态 | `src/stores/growthStore.ts` | 成长状态管理 |
| 主页面 | `src/pages/Dashboard.tsx` | 主控面板 |
| 全局样式 | `src/styles/globals.css` | CSS 变量和动画 |

---

## 🎨 设计系统速查

### 颜色
```css
--color-primary: #991B1B    /* 主色（红色） */
--color-secondary: #7C3AED  /* 辅助色（紫色） */
--color-success: #047857    /* 成功色（绿色） */
--color-warning: #d97706    /* 警告色（橙色） */
```

### 间距
```
8px, 16px, 24px, 32px, 40px, 48px, 64px, 80px, 96px
```

### 圆角
```
sm: 4px, md: 8px, lg: 16px
```

### 动画时长
```
fast: 150ms, normal: 250ms, slow: 400ms
```

---

## 🔧 常用命令

```bash
npm run dev       # 开发模式
npm run build     # 构建生产版本
npm run preview   # 预览生产构建
npm run lint      # 代码检查
```

---

## 📊 数据库表

1. `users` - 用户表
2. `tasks` - 任务表
3. `growth_dimensions` - 成长维度表
4. `long_term_goals` - 长期目标表
5. `identity_levels` - 身份层级表
6. `bad_habits` - 坏习惯表
7. `bad_habit_occurrences` - 坏习惯记录
8. `gold_transactions` - 金币交易表
9. `growth_history` - 成长历史表
10. `sync_logs` - 同步日志表
11. `reward_store` - 奖励商店表
12. `reward_redemptions` - 奖励兑换记录
13. `achievements` - 成就表

---

## 🎯 核心组件

### UI 组件
- `Button` - 按钮（5种变体）
- `Input` - 输入框
- `Card` - 卡片
- `Modal` - 模态框
- `Progress` - 进度条
- `Badge` - 徽章

### 业务组件
- `TaskCard` - 任务卡片
- `TaskForm` - 任务表单
- `TaskTimeline` - 任务时间轴
- `GrowthPanel` - 成长面板
- `GoalsPanel` - 目标面板

---

## 🔌 API 服务

### 用户 API (`src/services/supabase/users.ts`)
```typescript
createUser(localUserId)
getUserByLocalId(localUserId)
updateUser(userId, updates)
generateSyncCode(userId)
```

### 任务 API (`src/services/supabase/tasks.ts`)
```typescript
createTask(task)
getUserTasks(userId)
getTasksByDate(userId, date)
updateTask(taskId, updates)
deleteTask(taskId)
```

### 成长 API (`src/services/supabase/growth.ts`)
```typescript
getGrowthDimensions(userId)
updateDimensionValue(dimensionId, value)
getLongTermGoals(userId)
getIdentityLevels(userId)
```

### 金币 API (`src/services/supabase/gold.ts`)
```typescript
getGoldBalance(userId)
createGoldTransaction(userId, amount, type)
getGoldTransactions(userId)
```

---

## 🛠️ 工具函数

### 日期时间 (`src/utils/index.ts`)
```typescript
formatDate(date, format)
formatTime(date)
formatRelativeTime(date)
minutesToHours(minutes)
```

### 数字格式化
```typescript
formatNumber(num, decimals)
formatPercent(value, total)
formatGold(amount)
```

### 金币计算 (`src/utils/goldCalculator.ts`)
```typescript
calculateTaskGold(task)
calculateStreakBonus(days)
calculateDelayPenalty(minutes)
```

---

## 📝 环境变量

```env
# 必需
VITE_SUPABASE_URL=你的_supabase_url
VITE_SUPABASE_ANON_KEY=你的_supabase_key

# 可选
VITE_DEEPSEEK_API_KEY=你的_deepseek_key
VITE_BAIDU_API_KEY=你的_baidu_key
```

---

## 🎯 默认配置

### 成长维度（5个）
1. ⚡ 执行力
2. 🎯 专注力
3. ❤️ 健康力
4. 💰 财富力
5. ✨ 魅力值

### 身份层级（5个）
1. 🌱 成长探索者 (0-200)
2. 🎯 自律实践者 (201-500)
3. ⚡ 效率掌控者 (501-1000)
4. ⚖️ 平衡大师 (1001-2000)
5. 👑 人生设计师 (2000+)

### 任务类型（7种）
- 💼 工作
- 📚 学习
- 🏃 健康
- 🏠 生活
- 💰 财务
- 🎨 创意
- 😴 休息

---

## 🐛 常见问题

### Q: 依赖安装失败？
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Q: Supabase 连接失败？
检查 `.env` 文件中的配置是否正确

### Q: 端口被占用？
```bash
npm run dev -- --port 3001
```

### Q: TypeScript 错误？
```bash
npm run build
```

---

## 📚 文档索引

- 📖 [README.md](./README.md) - 项目概述
- ⚡ [START_HERE.md](./START_HERE.md) - 新手入门
- 🛠️ [INSTALLATION.md](./INSTALLATION.md) - 安装指南
- 📊 [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发指南
- 🎯 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 完成总结
- 🗂️ [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 项目结构
- ✅ [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) - 完成报告

---

## 🎊 快速提示

- 💡 所有配置都在 `src/constants/index.ts`
- 🎨 设计系统在 `tailwind.config.js`
- 🗄️ 数据库架构在 `supabase/schema.sql`
- 📝 类型定义在 `src/types/index.ts`
- 🔧 工具函数在 `src/utils/index.ts`

---

**让每一天都成为成长的一天！🌱**

*ManifestOS - 大女主成长操作系统*

