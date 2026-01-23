# 📊 数据报告系统完整文档

## 📋 目录
1. [系统概述](#系统概述)
2. [组件说明](#组件说明)
3. [自动生成机制](#自动生成机制)
4. [使用示例](#使用示例)

---

## 🎯 系统概述

数据报告系统提供自动化的成长数据分析和报告生成功能，包括：

### 核心功能
1. **日报生成** - 每日自动生成，免费查看
2. **周报分析** - 深度分析，需金币解锁（100💰）
3. **月报分析** - 全面分析，需金币解锁（300💰）
4. **报告分享** - 生成精美图片分享

---

## 📦 组件说明

### 1️⃣ DailyReport - 日报组件
**文件**: `src/components/reports/DailyReport.tsx`

**自动生成时间**: 每晚 21:00

**数据收集**:
```typescript
{
  date: Date,                    // 报告日期
  tasks: {
    completed: number,           // 完成任务数
    total: number,               // 总任务数
    completionRate: number,      // 完成率
  },
  gold: {
    earned: number,              // 收入金币
    spent: number,               // 支出金币
    balance: number,             // 净收支
  },
  growth: [                      // 成长值变化
    {
      dimension: string,         // 维度名称
      change: number,            // 变化值
      icon: string,              // 图标
    }
  ],
  badHabits: [                   // 坏习惯记录
    {
      name: string,              // 习惯名称
      count: number,             // 发生次数
    }
  ],
  highlights: string[],          // 今日亮点
  improvements: string[],        // 待改进点
  suggestions: string[],         // 明日建议
}
```

**评级系统**:
| 完成率 | 评级 | 图标 | 颜色 |
|--------|------|------|------|
| ≥90% | 完美 | 🌟 | 金色 |
| ≥75% | 优秀 | ⭐ | 绿色 |
| ≥60% | 良好 | 👍 | 蓝色 |
| ≥40% | 加油 | 💪 | 橙色 |
| <40% | 需努力 | 🔥 | 红色 |

**亮点识别算法**:
```typescript
// 自动识别以下亮点
- 任务完成率 > 80%
- 单日金币收入 > 500
- 成长值增长 > 50
- 连续完成天数达到里程碑
- 首次完成某类型任务
```

**界面元素**:
- 📊 评级卡片（渐变背景）
- 📈 统计卡片（金币/成长/坏习惯）
- ✨ 亮点列表（黄色卡片）
- 💡 待改进列表（橙色卡片）
- 🎯 明日建议（蓝紫渐变卡片）
- ◀️▶️ 日期切换按钮
- 📤 分享按钮

---

### 2️⃣ PeriodReport - 周报/月报组件
**文件**: `src/components/reports/PeriodReport.tsx`

**解锁价格**:
- 周报: 100 💰
- 月报: 300 💰

**报告内容**:

#### 📈 效率趋势分析
```typescript
{
  trend: [                       // 趋势数据
    { date: string, value: number }
  ],
  average: number,               // 平均效率
  peak: number,                  // 峰值效率
}
```

**趋势图**:
- 使用 Chart.js Line 图表
- 平滑曲线动画
- 交互式提示
- 显示平均线

#### 🌱 成长维度分析
```typescript
{
  dimensions: [
    {
      name: string,              // 维度名称
      icon: string,              // 图标
      change: number,            // 变化值
      tasks: number,             // 完成任务数
    }
  ]
}
```

**可视化**:
- 🍩 Doughnut 图 - 维度分布
- 📊 Bar 图 - 任务完成数
- 📋 详细列表 - 每个维度的统计

#### 🔄 坏习惯模式识别
```typescript
{
  badHabits: [
    {
      name: string,              // 习惯名称
      pattern: string,           // 模式描述
      frequency: number,         // 频率
    }
  ]
}
```

**模式识别算法**:
```typescript
// 识别以下模式
- 时间段集中（如：晚上容易拖延）
- 周期性重复（如：每周一易焦虑）
- 触发条件（如：压力大时易暴饮暴食）
```

#### 💡 个性化建议
```typescript
{
  suggestions: string[]          // AI 生成的建议
}
```

**建议生成逻辑**:
- 基于效率趋势
- 基于成长维度分布
- 基于坏习惯模式
- 基于目标进度

---

### 3️⃣ ShareReport - 分享组件
**文件**: `src/components/reports/ShareReport.tsx`

**功能**:
- 📸 生成精美分享图片
- 💾 下载为 PNG 格式
- 📋 复制到剪贴板
- 🎨 自动适配主题色

**分享卡片内容**:
```
┌─────────────────────────────┐
│  [渐变背景]                  │
│  🌟 完美                     │
│  2026年1月23日               │
├─────────────────────────────┤
│  [统计数据]                  │
│  8/10    +520💰   +85📈     │
│  任务     金币     成长      │
├─────────────────────────────┤
│  ✨ 今日亮点                 │
│  • 完成率达到80%             │
│  • 连续完成7天               │
│  • 执行力提升15点            │
├─────────────────────────────┤
│  ManifestOS - manifestos.app│
└─────────────────────────────┘
```

**技术实现**:
- 使用 `html2canvas` 生成图片
- 支持高清输出（scale: 2）
- 自动添加水印
- 优化文件大小

---

## 🤖 自动生成机制

### 日报自动生成流程

```
每晚 21:00 触发
    ↓
1. 收集当日数据
   - 从 taskStore 获取任务数据
   - 从 userStore 获取金币数据
   - 从 growthStore 获取成长数据
   - 从 habitStore 获取坏习惯数据
    ↓
2. 数据分析
   - 计算完成率
   - 计算金币收支
   - 计算成长值变化
   - 统计坏习惯次数
    ↓
3. 亮点识别
   - 运行亮点识别算法
   - 提取前3个亮点
    ↓
4. 待改进识别
   - 分析低效时段
   - 识别问题模式
   - 提取前3个改进点
    ↓
5. 建议生成
   - 基于数据生成建议
   - 调用 AI API（可选）
   - 提取前5个建议
    ↓
6. 存储报告
   - 保存到数据库
   - 生成报告 ID
    ↓
7. 推送通知
   - 发送系统通知
   - 显示红点提示
```

**代码示例**:
```typescript
// 定时任务
const scheduleReportGeneration = () => {
  const now = new Date();
  const target = new Date();
  target.setHours(21, 0, 0, 0);
  
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }
  
  const delay = target.getTime() - now.getTime();
  
  setTimeout(() => {
    generateDailyReport();
    scheduleReportGeneration(); // 递归调度
  }, delay);
};
```

---

### 周报/月报生成流程

```
用户点击"解锁周报/月报"
    ↓
1. 检查金币余额
   - 余额不足 → 提示充值
   - 余额充足 → 继续
    ↓
2. 扣除金币
   - 周报: -100💰
   - 月报: -300💰
    ↓
3. 收集时间段数据
   - 获取所有任务
   - 获取所有成长记录
   - 获取所有坏习惯记录
    ↓
4. 深度分析
   - 效率趋势分析
   - 成长维度关联分析
   - 坏习惯模式识别
   - 个性化建议生成
    ↓
5. 生成报告
   - 创建报告对象
   - 生成图表数据
    ↓
6. 显示报告
   - 渲染交互式界面
   - 支持标签页切换
```

---

## 💡 使用示例

### 示例 1: 查看日报

```typescript
import { DailyReport } from '@/components/reports';

function ReportsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState(null);

  useEffect(() => {
    // 加载报告数据
    const loadReport = async () => {
      const data = await fetchDailyReport(currentDate);
      setReport(data);
    };
    loadReport();
  }, [currentDate]);

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  if (!report) return <div>加载中...</div>;

  return (
    <DailyReport
      report={report}
      onShare={handleShare}
      onPrevDay={handlePrevDay}
      onNextDay={handleNextDay}
      hasNextDay={currentDate < new Date()}
    />
  );
}
```

---

### 示例 2: 解锁周报

```typescript
import { PeriodReport } from '@/components/reports';

function WeeklyReportPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [reportData, setReportData] = useState(null);
  const currentGold = useUserStore(state => state.gold);

  const handleUnlock = async () => {
    // 扣除金币
    await deductGold(100);
    
    // 生成报告
    const data = await generateWeeklyReport();
    setReportData(data);
    setIsUnlocked(true);
  };

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      await exportToPDF(reportData);
    } else {
      await exportToExcel(reportData);
    }
  };

  return (
    <PeriodReport
      type="week"
      isUnlocked={isUnlocked}
      unlockPrice={100}
      currentGold={currentGold}
      reportData={reportData}
      onUnlock={handleUnlock}
      onDownload={handleDownload}
      onShare={() => setShowShareDialog(true)}
    />
  );
}
```

---

### 示例 3: 分享报告

```typescript
import { ShareReport } from '@/components/reports';

function ShareDialog({ report, onClose }) {
  const shareData = {
    title: '今日报告',
    date: report.date.toLocaleDateString('zh-CN'),
    rating: getRating(report.tasks.completionRate),
    stats: [
      {
        label: '任务完成',
        value: `${report.tasks.completed}/${report.tasks.total}`,
        color: '#3B82F6',
      },
      {
        label: '金币收支',
        value: `+${report.gold.balance}`,
        color: '#F59E0B',
      },
      {
        label: '成长值',
        value: `+${report.growth.reduce((sum, g) => sum + g.change, 0)}`,
        color: '#10B981',
      },
    ],
    highlights: report.highlights,
  };

  return (
    <ShareReport
      reportData={shareData}
      onClose={onClose}
    />
  );
}
```

---

## 📁 文件结构

```
src/components/reports/
├── DailyReport.tsx            ✅ 日报组件
├── PeriodReport.tsx           ✅ 周报/月报组件
├── ShareReport.tsx            ✅ 分享组件
└── index.ts                   ✅ 导出文件
```

---

## 🎨 视觉设计

### 评级颜色
- 🌟 完美: `#FFD700` (金色)
- ⭐ 优秀: `#10B981` (绿色)
- 👍 良好: `#3B82F6` (蓝色)
- 💪 加油: `#F59E0B` (橙色)
- 🔥 需努力: `#EF4444` (红色)

### 卡片样式
- 📊 统计卡片: 白色背景 + 阴影
- ✨ 亮点卡片: 黄色背景 + 黄色边框
- 💡 改进卡片: 橙色背景 + 橙色边框
- 🎯 建议卡片: 蓝紫渐变背景

### 动画效果
- 📈 数字动画: CountUp 效果
- 🎬 入场动画: slideInRight
- 📊 图表动画: 平滑过渡
- ✨ 亮点动画: 依次出现

---

## 🔧 技术栈

### 图表库
- **Chart.js** - 图表绘制
- **react-chartjs-2** - React 封装

### 图片生成
- **html2canvas** - HTML 转图片
- **Canvas API** - 图片处理

### 数据处理
- **date-fns** - 日期处理
- **lodash** - 数据处理

---

## ✅ 功能清单

### 日报
- [x] 自动生成（每晚21:00）
- [x] 评级系统
- [x] 统计卡片
- [x] 亮点识别
- [x] 待改进识别
- [x] 明日建议
- [x] 日期切换
- [x] 分享功能

### 周报/月报
- [x] 金币解锁机制
- [x] 解锁确认对话框
- [x] 效率趋势图
- [x] 成长维度分析
- [x] 坏习惯模式识别
- [x] 个性化建议
- [x] 标签页切换
- [x] PDF/Excel 导出
- [x] 分享功能

### 分享
- [x] 精美卡片设计
- [x] 图片生成
- [x] 下载功能
- [x] 复制到剪贴板
- [x] 自动水印

---

## 📊 数据统计

### 日报数据量
- 任务数据: ~10-50 条/天
- 金币记录: ~5-20 条/天
- 成长记录: ~5-15 条/天
- 坏习惯: ~0-5 条/天

### 周报数据量
- 任务数据: ~70-350 条/周
- 金币记录: ~35-140 条/周
- 成长记录: ~35-105 条/周
- 坏习惯: ~0-35 条/周

### 月报数据量
- 任务数据: ~300-1500 条/月
- 金币记录: ~150-600 条/月
- 成长记录: ~150-450 条/月
- 坏习惯: ~0-150 条/月

---

## 🚀 性能优化

### 数据缓存
```typescript
// 缓存报告数据
const reportCache = new Map<string, ReportData>();

const getCachedReport = (date: Date) => {
  const key = date.toISOString().split('T')[0];
  return reportCache.get(key);
};
```

### 懒加载
```typescript
// 按需加载图表库
const ChartComponent = lazy(() => import('./ChartComponent'));
```

### 图片压缩
```typescript
// 压缩分享图片
canvas.toBlob((blob) => {
  // 压缩逻辑
}, 'image/jpeg', 0.8);
```

---

**文档版本**: v1.0  
**更新时间**: 2026-01-23  
**作者**: AI Assistant

