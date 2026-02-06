# 标签管理组件 V2 - 完整功能说明文档

## 📋 更新概览

本次更新在原有基础上进行了全面优化和功能扩展，遵循 iOS 设计规范，使用系统原生 Emoji，新增财务分析和效率分析等核心功能。

### 🎯 核心更新

1. **iOS 设计规范**：扁平化、留白充足、排版简洁
2. **Emoji 视觉标识**：全量使用系统原生 Emoji 传递信息
3. **财务分析模块**：收支数据自动关联和分析
4. **效率分析模块**：单位时间收益分析和分级警示
5. **数据自动采集**：无需手动录入，智能关联

---

## 一、基础数据关联（自动采集）

### 1. 收支数据自动关联

**功能说明**：
- 在收集箱/AI助手输入收支信息时，系统自动提取并关联标签
- 支持多笔收支自动拆分记录
- 数据双向溯源，可跳转至原事件卡片

**使用方法**：
```typescript
import { useTagStore } from '@/stores/tagStore';

const { addFinanceRecord } = useTagStore();

// 添加收入记录
addFinanceRecord('文创插画', 2000, 'income', '插画项目收入', taskId);

// 添加支出记录
addFinanceRecord('打车', 15, 'expense', '今日打车', taskId);
```

**示例**：
- 输入："今日打车15元" → 自动识别：支出15元，标签#打车
- 输入："文创插画收入2000元" → 自动识别：收入2000元，标签#文创插画

### 2. 时长数据自动同步

**功能说明**：
- 标签关联的事件卡片/任务计时数据自动同步
- 支持标记无效时长（⏳），计算效率时自动剔除
- 实时更新标签时长统计

**使用方法**：
```typescript
const { recordTagUsage, markDurationInvalid } = useTagStore();

// 记录标签使用（任务完成时自动调用）
recordTagUsage('工作', taskId, '完成项目文档', 120, false);

// 标记无效时长
markDurationInvalid(recordId);
```

### 3. 标签类型标记

**功能说明**：
- 支持标记为「业务类」或「生活必需类」
- 生活必需类标签不显示负效警示
- 电脑端右键/手机端长按标签进行标记

**使用方法**：
```typescript
const { setTagType, batchSetTagType } = useTagStore();

// 单个标签标记
setTagType('做家务', 'life_essential');

// 批量标记
batchSetTagType(['做家务', '陪家人', '日常通勤'], 'life_essential');
```

---

## 二、核心分析模块

### 1. ⏱️ 时长分析模块

**功能特性**：
- 显示今日、昨日、本周/本月/自定义周期累计时长
- 时长变化折线图（iOS 系统图表样式）
- 数字+进度条双呈现
- 相关任务列表

**Emoji 标识**：
- ⏱️ 时长统计
- 📊 趋势分析

**数据展示**：
```
⏱️ 今日时长: 2h 30m
⏱️ 昨日时长: 3h 15m
⏱️ 累计时长: 15h 45m
```

### 2. 💰 财务分析模块

**功能特性**：
- 总收入（🟢）、总支出（🔴）、净收支统计
- 收支明细（iOS 毛玻璃样式）
- 收支柱状图（蓝色=收入，红色=支出）
- 收入占比饼图

**Emoji 色彩区分**：
- 🟢 收入（绿色）
- 🔴 支出（红色）
- ⚪ 生活必需（灰色，不显示负数）

**数据展示**：
```
🟢 收入: +2000元
🔴 支出: -500元
📊 净收支: +1500元
```

**生活必需类特殊处理**：
```
#做家务
⚪ 无收支（生活必需）
```

### 3. 📊 效率分析模块（核心新增）

**功能特性**：
- 单位时间收益 = 净收支 ÷ 有效时长（元/小时）
- 效率等级自动分类（5类）
- 效率-时长散点图
- 负效警示和优化建议

**效率等级分类**：

| 等级 | 判定条件 | Emoji | 展示样式 |
|------|---------|-------|---------|
| 高效标签 | ≥100元/h | 💰 | #文创插画 「💰 200元/h」 |
| 中效标签 | 20-100元/h | 📈 | #客户对接 「📈 50元/h」 |
| 低效可优化 | 0-20元/h | ⚠️ | #素材整理 「⚠️ 10元/h」 |
| 负效警示 | <0元/h 或无收支但时长>2h/天 | ❌ | #无效沟通 「❌ -5元/h（警示）」 |
| 生活必需 | 已标记生活必需类 | 🏠 | #做家务 「🏠 0元/h（必需）」 |
| 被动收入 | 无时长有收入 | 🪙 | #版权收入 「∞（🪙 被动收入）」 |

**负效警示弹窗**：
当负效标签累计时长≥本周总时长10%时，自动弹出 iOS 原生样式警示：

```
❌ ⚠️ 本周负效行为警示

#无效沟通 耗时8小时（占比15%），无任何收入，建议优化沟通流程！

[去优化] [我知道了]
```

---

## 三、多维度排序

**排序选项**（iOS 磨砂质感设计）：

| 排序类型 | Emoji | 说明 |
|---------|-------|------|
| 使用次数 | 🔢 | 按使用频率排序 |
| 累计时长 | ⏱️ | 按总时长排序 |
| 收入 | 🟢 | 从高到低 |
| 支出 | 🔴 | 从高到低 |
| 净收支 | 📊 | 从高到低 |
| 时薪 | 💰 | 从高到低 |
| 负效时长 | ❌ | 从高到低 |

**使用方法**：
```typescript
const { 
  sortTagsByIncome,
  sortTagsByExpense,
  sortTagsByNetIncome,
  sortTagsByHourlyRate,
  sortTagsByNegativeTime,
} = useTagStore();

// 按收入排序
const topIncomeTags = sortTagsByIncome(true); // true=降序

// 按时薪排序
const topEfficiencyTags = sortTagsByHourlyRate(true);
```

---

## 四、视觉设计（iOS 风格）

### 1. 标签卡片展示

**iOS 圆角卡片**（8px 圆角，轻微阴影）：

```
┌─────────────────────────────┐
│ 💼 #文创插画           🏠   │
│ 🔢 使用 3 次                │
│                             │
│ ⏱️ 累计时长: 10h            │
│ 📊 关联任务: 5 个           │
│ 🟢 收入: +2000元            │
│ 🔴 支出: -500元             │
│ 💰 净收支: +1500元          │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💰 +200元/h             │ │
│ └─────────────────────────┘ │
│                             │
│ [📊 查看详细分析]           │
└─────────────────────────────┘
```

### 2. 时间轴事件卡片联动

**Emoji 轻量标识**（无需额外边框）：

```
┌─────────────────────────────┐
│ 完成项目文档                │
│ #文创插画 💰                │  ← 高效标签
│ 14:00 - 16:00 (2h)          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 无效沟通                    │
│ #会议 ❌                    │  ← 负效警示
│ 10:00 - 11:00 (1h)          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 做家务                      │
│ #家务 🏠                    │  ← 生活必需
│ 08:00 - 09:00 (1h)          │
└─────────────────────────────┘
```

### 3. 操作交互

**iOS 原生手势**：

- **电脑端**：右键标签 → iOS 风格菜单（圆角、磨砂背景）
  ```
  ┌─────────────────┐
  │ ✏️ 重命名       │
  │ 🔀 合并         │
  │ 🏠 标记生活必需 │
  │ ─────────────── │
  │ 🗑️ 删除         │
  └─────────────────┘
  ```

- **手机端**：长按标签 → iOS 震动反馈 → 悬浮菜单

### 4. 色彩规范

**iOS 系统配色**：

- 主色：`#007AFF`（iOS 蓝）
- 成功/收入：`#34C759`（绿色）
- 警告/支出：`#FF3B30`（红色）
- 提示：`#FFCC00`（黄色）
- 中性：`#8E8E93`（灰色）
- 文字：`#1D1D1F`（黑色）/ `#FFFFFF`（白色，深色模式）

---

## 五、使用指南

### 1. 访问标签管理

**方式1**：点击底部导航栏"更多" → "🏷️ 标签"

**方式2**：长按导航栏编辑，将"标签"拖到导航栏

### 2. 添加标签

```typescript
import { useTagStore } from '@/stores/tagStore';

const { addTag } = useTagStore();

// 添加业务类标签
addTag('文创插画', '💼', '#A0BBEB', 'business');

// 添加生活必需类标签
addTag('做家务', '🏠', '#6A7334', 'life_essential');
```

### 3. 记录收支

```typescript
const { addFinanceRecord } = useTagStore();

// 记录收入
addFinanceRecord('文创插画', 2000, 'income', '插画项目收入', taskId);

// 记录支出
addFinanceRecord('打车', 15, 'expense', '今日打车费用', taskId);
```

### 4. 查看分析

1. 点击标签卡片上的"📊 查看详细分析"按钮
2. 切换标签页：⏱️ 时长 / 💰 财务 / 📊 效率
3. 选择日期范围：今日/昨日/本周/本月/自定义
4. 查看图表和明细数据

### 5. 批量操作

1. 切换到"批量操作"标签页
2. 选择多个标签
3. 点击"🏠 批量标记生活必需"或"🔀 合并标签"

---

## 六、API 参考

### TagStore 方法

```typescript
// 标签操作
addTag(name, emoji?, color?, tagType?)
updateTag(oldName, newName, emoji?, color?)
deleteTag(name)
setTagType(tagName, tagType)
batchSetTagType(tagNames, tagType)

// 时长记录
recordTagUsage(tagName, taskId, taskTitle, duration, isInvalid?)
markDurationInvalid(recordId)
getValidDuration(tagName, startDate?, endDate?)

// 财务记录
addFinanceRecord(tagName, amount, type, description, relatedTaskId?)
deleteFinanceRecord(recordId)
getFinanceRecords(tagName, startDate?, endDate?)

// 财务分析
getTagIncome(tagName, startDate?, endDate?)
getTagExpense(tagName, startDate?, endDate?)
getTagNetIncome(tagName, startDate?, endDate?)

// 效率分析
getTagHourlyRate(tagName, startDate?, endDate?)
getTagEfficiencyLevel(tagName)
getTagEfficiencyEmoji(level)

// 排序
sortTagsByIncome(desc?)
sortTagsByExpense(desc?)
sortTagsByNetIncome(desc?)
sortTagsByHourlyRate(desc?)
sortTagsByNegativeTime(desc?)
```

---

## 七、数据结构

### TagData

```typescript
interface TagData {
  name: string;              // 标签名称
  emoji: string;             // Emoji 图标
  color: string;             // 标签颜色
  usageCount: number;        // 使用次数
  totalDuration: number;     // 总时长（分钟）
  lastUsedAt: Date;          // 最后使用时间
  createdAt: Date;           // 创建时间
  isDisabled?: boolean;      // 是否禁用
  tagType?: TagType;         // 标签类型
  
  // 财务数据
  totalIncome: number;       // 总收入
  totalExpense: number;      // 总支出
  netIncome: number;         // 净收支
  
  // 效率数据
  hourlyRate: number;        // 单位时间收益（元/小时）
  invalidDuration: number;   // 无效时长（分钟）
}
```

### TagFinanceRecord

```typescript
interface TagFinanceRecord {
  id: string;
  tagName: string;
  amount: number;            // 金额
  type: 'income' | 'expense'; // 收支类型
  description: string;       // 事由
  date: Date;
  relatedTaskId?: string;    // 关联任务ID
}
```

### TagEfficiencyLevel

```typescript
type TagEfficiencyLevel = 
  | 'high'           // 高效标签 ≥100元/h
  | 'medium'         // 中效标签 20-100元/h
  | 'low'            // 低效可优化 0-20元/h
  | 'negative'       // 负效警示 <0元/h
  | 'life_essential' // 生活必需
  | 'passive';       // 被动收入
```

---

## 八、核心价值

### 1. 业务决策
- 通过「❌ 负效标签 Emoji 警示」精准定位低效行为
- 优化时间分配，聚焦高价值业务
- 数据驱动决策，提升整体效率

### 2. 生活平衡
- 通过「🏠 生活必需标签 Emoji 标识」区分工作与生活
- 避免无收入生活行为产生负面提示
- 实现工作生活双重复盘

### 3. 视觉体验
- 全 Emoji 替代自定义图标，贴合 iOS 风格
- 减少设计开发成本
- 保证界面简洁美观，提升用户体验

---

## 九、更新日志

### V2.0.0 (2024-02-06)

**新增功能**：
- ✅ 财务分析模块（收支统计、趋势图、明细）
- ✅ 效率分析模块（单位时间收益、效率分级、警示）
- ✅ 标签类型标记（业务类/生活必需类）
- ✅ 无效时长标记和排除
- ✅ 多维度排序（收入、支出、净收支、时薪、负效时长）
- ✅ iOS 风格设计（扁平化、留白、Emoji 标识）
- ✅ 负效警示弹窗
- ✅ 效率-时长散点图
- ✅ 收支占比饼图和柱状图

**优化改进**：
- ✅ 全面采用 iOS 系统原生 Emoji
- ✅ 优化卡片样式（圆角、阴影、毛玻璃）
- ✅ 优化交互体验（右键菜单、长按震动）
- ✅ 优化数据展示（进度条、趋势图）
- ✅ 优化色彩规范（iOS 系统配色）

**兼容性**：
- ✅ 保留 V1 组件，向后兼容
- ✅ 数据结构扩展，自动迁移
- ✅ API 向后兼容

---

## 十、常见问题

### Q1: 如何标记生活必需类标签？
**A**: 右键（电脑）或长按（手机）标签，选择"🏠 标记生活必需"。

### Q2: 负效警示标签如何优化？
**A**: 
1. 分析时间投入是否合理
2. 标记无效时长（⏳）
3. 提升收入或降低成本
4. 如果是必要活动，标记为"生活必需"

### Q3: 如何添加收支记录？
**A**: 在收集箱或 AI 助手输入收支信息，系统自动识别并关联标签。例如："今日打车15元"、"文创插画收入2000元"。

### Q4: 被动收入如何显示？
**A**: 无时长但有收入的标签自动识别为被动收入，显示"∞（🪙 被动收入）"。

### Q5: 如何查看详细分析？
**A**: 点击标签卡片上的"📊 查看详细分析"按钮，可查看时长、财务、效率三个维度的详细数据。

---

## 十一、技术栈

- **框架**: React + TypeScript
- **状态管理**: Zustand + localStorage
- **图表库**: Chart.js + react-chartjs-2
- **图标库**: Lucide React
- **样式**: Tailwind CSS + iOS 设计规范

---

## 十二、未来规划

- [ ] 标签复盘报告自动生成（PDF/图片）
- [ ] 标签数据导出/导入
- [ ] 标签关联长期目标
- [ ] 标签智能分类和推荐
- [ ] 标签使用建议和优化提示
- [ ] 标签数据可视化大屏
- [ ] 标签对比分析
- [ ] 标签预测和趋势分析

---

## 🎉 完成状态

所有核心功能已完成，可以直接使用！

如需技术支持或功能建议，请参考项目文档或联系开发团队。

