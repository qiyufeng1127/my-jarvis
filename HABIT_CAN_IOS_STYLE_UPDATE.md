# 习惯罐头组件 iOS 风格升级完成

## 📱 设计规范

### 配色方案（复古暖棕系）
- **深棕 Espresso** `#542916` - 导航栏、按钮、标题
- **金棕 Eau Trouble** `#b79858` - 次文本、辅助元素
- **砖红 Terre Cuite** `#a13a1e` - 强调、警告
- **浅蓝 Bleu Porcelaine** `#88b8ce` - 无坏习惯底色
- **奶白 Nuage de Lait** `#fefaf0` - 页面底色、毛玻璃卡片
- **蜜黄 Miel Doré** `#f1c166` - 选中态、奖励

### 罐头颜色分级
- **0个** → 浅蓝 `#88b8ce`
- **1-10个** → 蜜黄 `#f1c166`
- **11-20个** → 金棕 `#b79858`
- **20+个** → 砖红 `#a13a1e`

## ✨ 核心特性

### 1. 毛玻璃效果（Glassmorphism）
- 所有卡片使用 `backdrop-filter: blur(20px)`
- 半透明背景 `rgba(254, 250, 240, 0.8)`
- iOS 原生级别的视觉层次

### 2. SF Pro 字体系统
- 全局使用 `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text"`
- 字重分级：Bold (700) / Semibold (600) / Medium (500) / Regular (400) / Light (300)
- 字号适配移动端：10-24pt

### 3. 圆角规范
- **小元素** 12pt（按钮、小卡片）
- **中元素** 16pt（内容卡片）
- **大弹窗** 24pt（底部 Sheet）

### 4. 交互反馈
- 所有按钮：`active:scale-95` 或 `active:scale-98`
- 最小点击区域：44×44pt
- 间距统一：8/16/24pt

## 📦 更新的组件

### 1. HabitCanCalendar（月视图）
**特性：**
- ✅ 毛玻璃顶部导航栏（sticky）
- ✅ 统计卡片（蜜黄半透明背景）
- ✅ 4列罐头布局（每行4天）
- ✅ 罐头颜色自动分级
- ✅ 毛玻璃 Tooltip
- ✅ 今日预览卡片

**布局：**
```
[毛玻璃导航栏]
  ├─ 月份切换
  ├─ 统计数据（本月坏习惯、最频发）
  └─ 自定义/设置按钮

[颜色图例] 0个 | 1-10个 | 11-20个 | 20+个

[罐头网格] 4列 × N行
  └─ 每个罐头：日期 + Emoji + 次数

[今日预览卡片]
```

### 2. WeekView（周视图）
**特性：**
- ✅ 4列罐头布局
- ✅ 罐头样式替代柱状图
- ✅ 变化指示（绿色↓ / 红色↑）
- ✅ 毛玻璃 Tooltip

**显示逻辑：**
- ≤8个：显示所有 Emoji
- >8个：显示 Top4 + 「×N」

### 3. MonthlyReportModal（月报）
**特性：**
- ✅ iOS 底部弹出 Sheet
- ✅ 顶部拖动条
- ✅ 毛玻璃背景
- ✅ 卡片化信息分层
- ✅ 简约数据可视化

**布局：**
```
[拖动条]
[标题] 2026年2月习惯月报

[核心数据] 3个毛玻璃卡片
  ├─ 坏习惯总次数（蜜黄）
  ├─ 无坏习惯天数（金棕）
  └─ 解锁成就（浅蓝）

[TOP3 坏习惯] 排名 + Emoji + 名称 + 次数
[改善亮点] Emoji + 描述 + 变化百分比
[连续无坏习惯记录]
[解锁成就] 2列网格
[下月建议] 编号列表

[底部按钮] 重新生成 | 导出月报
```

### 4. HabitCanModule（主模块）
**特性：**
- ✅ 毛玻璃视图切换栏
- ✅ 4个视图按钮（月/周/30天趋势/月报）
- ✅ 选中态深棕背景 + 奶白文字
- ✅ 未选中态透明背景 + 金棕文字

## 🎨 视觉细节

### 阴影系统
```css
/* 卡片阴影 */
box-shadow: 0 2px 8px rgba(84, 41, 22, 0.15);

/* 悬浮阴影 */
box-shadow: 0 4px 12px rgba(84, 41, 22, 0.08);

/* 遮罩阴影 */
background: rgba(84, 41, 22, 0.3);
```

### 文字对比度
- 浅色背景（浅蓝/奶白/蜜黄）→ 深棕文字
- 深色背景（金棕/砖红）→ 奶白文字
- 确保对比度 ≥ 4.5:1（WCAG AA 标准）

### 罐头装饰
- 顶部罐头盖：宽度 32-36px，高度 6px，圆角
- 半透明（opacity: 0.2）
- 颜色与文字颜色一致

## 📱 移动端适配

### 响应式布局
- 所有罐头：`aspect-square`（1:1 比例）
- 网格间距：12-16px
- 内边距：8-16pt

### 触摸优化
- 最小点击区域：44×44pt
- 按钮反馈：`active:scale-95`
- 长按显示 Tooltip

### 安全区域
- 底部 Sheet：`padding-bottom: env(safe-area-inset-bottom)`
- 顶部导航：`sticky top-0`

## 🚀 性能优化

### 毛玻璃性能
```css
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
```

### 动画性能
- 使用 `transform` 而非 `width/height`
- 使用 `transition-transform` 而非 `transition-all`
- GPU 加速：`will-change: transform`

## 📝 使用示例

```tsx
import HabitCanModule from '@/components/habits/HabitCanModule';
import { HABIT_CAN_COLORS } from '@/styles/habitCanColors';

<HabitCanModule
  isDark={false}
  cardBg={HABIT_CAN_COLORS.glassmorphism.light}
  textColor={HABIT_CAN_COLORS.espresso}
  accentColor={HABIT_CAN_COLORS.terreCuite}
/>
```

## ✅ 完成清单

- [x] 创建配色常量文件 `habitCanColors.ts`
- [x] 更新 HabitCanCalendar（月视图）
- [x] 更新 WeekView（周视图）
- [x] 更新 MonthlyReportModal（月报）
- [x] 更新 HabitCanModule（主模块）
- [x] 应用 SF Pro 字体
- [x] 应用毛玻璃效果
- [x] 统一圆角规范
- [x] 优化触摸交互
- [x] 移动端适配

## 🎯 下一步优化

1. **TrendView（30天趋势）** - 应用 iOS 风格图表
2. **CanDetailModal（罐头详情）** - 底部 Sheet 风格
3. **CustomizeHabitModal（自定义坏习惯）** - 底部 Sheet + Emoji 选择器
4. **HabitRuleSettings（规则设置）** - iOS 设置页风格

## 📸 视觉效果

### 月视图
- 毛玻璃导航栏 + 统计卡片
- 4列罐头网格，颜色分级清晰
- 悬停显示毛玻璃 Tooltip

### 周视图
- 4列罐头布局
- 变化指示（↑↓）
- 罐头样式统一

### 月报
- 底部弹出 Sheet
- 卡片化信息分层
- 简约数据可视化

---

**设计理念：** iOS 15+ 毛玻璃 + 复古暖棕配色 = 高级质感 + 温暖舒适

**核心价值：** 柔和圆角 + 系统级留白 + 无衬线字体 + 去除冗余装饰 = 信息层级清晰

