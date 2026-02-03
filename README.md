# ManifestOS - 使用指南

## 🎯 这是什么？

ManifestOS 是一个**大女主成长操作系统**，帮助你通过游戏化的方式管理任务、追踪目标、获得金币奖励。

**核心功能：**
- ✅ 任务管理（时间轴视图）
- ✅ 目标追踪
- ✅ 金币奖励系统
- ✅ 邮箱登录 + 多端云同步
- ✅ 移动端完美适配

## 🚀 快速开始

### 1. 访问网站
- **网址**：https://qiyufeng1127.github.io/my-jarvis/
- **支持**：电脑、手机、平板

### 2. 登录
- 输入邮箱和密码（至少6位）
- 首次登录自动注册，无需验证
- 同一邮箱可在多设备登录

### 3. 开始使用
- **创建任务**：点击"+"按钮或使用AI智能输入
- **完成任务**：点击任务卡片，上传验证照片
- **获得金币**：完成任务自动获得金币奖励
- **查看进度**：右上角显示金币余额和GitHub推送次数

## 📱 移动端使用

### 导航栏
- 底部导航栏：时间轴、目标、副业、收集箱等
- 长按可编辑导航栏
- 支持自定义颜色

### 主要功能
- **时间轴**：查看和管理所有任务
- **目标**：设置和追踪长期目标
- **金币**：查看金币余额和交易记录
- **收集箱**：快速记录想法

## 💰 金币系统

### 如何获得金币？
1. 完成任务（根据任务类型和时长计算）
2. 达成目标里程碑
3. 连续完成任务有额外奖励

### 金币用途
- 查看成长进度
- 解锁特殊功能（未来）
- 兑换奖励（未来）

## ☁️ 云端同步

### 自动同步的数据
- ✅ 所有任务
- ✅ 所有目标
- ✅ 金币余额和交易记录
- ✅ 仪表盘配置

### 如何使用多端同步？
1. 电脑端：用邮箱登录 → 创建任务
2. 手机端：用**相同邮箱**登录 → 自动看到所有数据
3. 任一设备操作，其他设备刷新即可同步

## 🎨 个性化设置

### 桌面端
- 拖拽模块调整位置
- 调整模块大小
- 自定义模块颜色
- 右键上传自定义图标

### 移动端
- 长按导航栏编辑
- 自定义导航栏颜色
- 调整导航项顺序

## 🔧 开发者配置

### Supabase设置（必须！）
如果你是开发者，需要配置Supabase才能使用云同步：

1. **执行SQL**：`supabase_schema.sql`
2. **关闭邮箱验证**：Authentication → Email → 取消"Confirm email"
3. **禁用RLS**：Table Editor → 每个表 → 关闭RLS

详见：`SUPABASE_README.md`

### 本地开发
```bash
npm install
npm run dev
```

### 部署
```bash
npm run build
git push origin main
# GitHub Actions 自动部署
```

## 📊 数据说明

### 存储位置
- **本地**：浏览器 localStorage（离线可用）
- **云端**：Supabase（多端同步）

### 数据安全
- 每个用户的数据通过user_id隔离
- 不同用户看不到彼此的数据
- HTTPS加密传输

## 🐛 常见问题

### Q: 白屏打不开？
A: 清除浏览器缓存（Ctrl+Shift+Delete），然后刷新

### Q: 数据不同步？
A: 
1. 确认用的是相同邮箱登录
2. 刷新页面
3. 查看浏览器控制台（F12）是否有错误

### Q: 忘记密码？
A: 目前需要重新注册（未来会添加密码重置功能）

### Q: 如何导出数据？
A: 在Supabase后台的Table Editor中可以导出CSV

## 📞 技术支持

- **GitHub**：https://github.com/qiyufeng1127/my-jarvis
- **Issues**：https://github.com/qiyufeng1127/my-jarvis/issues

## 🎯 核心文件说明

### 前端组件
- `src/components/auth/EmailAuth.tsx` - 邮箱登录
- `src/components/layout/MobileLayout.tsx` - 移动端布局
- `src/components/dashboard/CustomizableDashboard.tsx` - 桌面端布局
- `src/components/calendar/NewTimelineView.tsx` - 时间轴视图

### 数据管理
- `src/stores/goldStore.ts` - 金币系统
- `src/stores/taskStore.ts` - 任务管理
- `src/stores/goalStore.ts` - 目标追踪

### 配置
- `src/lib/supabase.ts` - Supabase客户端
- `vite.config.ts` - Vite配置
- `.github/workflows/deploy.yml` - 自动部署

---

**版本**：v1.5.0  
**最后更新**：2026-02-04  
**推送次数**：681
