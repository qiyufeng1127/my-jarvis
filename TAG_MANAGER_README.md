// 标签管理组件的使用示例和说明文档

## 标签管理系统 - 完整功能说明

### 一、核心功能

#### 1. 标签总览面板
- ✅ 按使用频率排序显示所有标签
- ✅ 每个标签显示使用次数（红色字体）
- ✅ 标签开头自动添加彩色 Emoji
- ✅ 显示标签关联的任务数量和总时长

#### 2. 标签编辑功能
- ✅ 电脑端：右键标签弹出菜单
- ✅ 手机端：长按标签弹出菜单
- ✅ 重命名：自动同步所有关联任务
- ✅ 删除：提示关联任务数量，确认后删除
- ✅ 防误操作：重命名时显示确认弹窗

#### 3. 标签时长分析
- ✅ 点击标签展开时长分析面板
- ✅ 显示今日、昨日、本周累计时长
- ✅ 日期筛选器：今日/昨日/本周/本月/自定义区间
- ✅ 时长趋势图（折线图）
- ✅ 相关任务列表

#### 4. 标签批量操作
- ✅ 全选/取消全选
- ✅ 批量合并：选择多个标签合并为一个
- ✅ 批量删除：删除多个标签并从任务中移除
- ✅ 拖拽排序（电脑端）

#### 5. 智能标签推荐
- ✅ 基于任务标题自动推荐相关标签
- ✅ 优先推荐高频标签
- ✅ 一键添加推荐标签

#### 6. 标签分组管理
- ✅ 创建标签分组
- ✅ 拖拽标签到分组
- ✅ 折叠/展开分组

#### 7. 复盘可视化图表
- ✅ 时长趋势图（折线图）
- ✅ 标签占比饼图
- ✅ 时长排行榜

#### 8. 双向联动
- ✅ 标签 → 任务：点击标签查看关联任务
- ✅ 任务 → 标签：在任务中点击标签打开标签详情

### 二、使用方法

#### 1. 在导航栏添加标签管理入口

标签管理已集成到移动端导航栏，可以通过以下方式访问：

1. 点击底部导航栏的"更多"按钮
2. 在更多功能中找到"🏷️ 标签"
3. 点击进入标签管理界面

或者：

1. 长按底部导航栏任意按钮
2. 进入编辑模式
3. 将"标签"拖拽到导航栏（最多4个）

#### 2. 在任务中使用标签

在创建或编辑任务时，可以添加标签：

```typescript
import { useTagStore } from '@/stores/tagStore';

const { addTag, recordTagUsage } = useTagStore();

// 添加标签
addTag('工作', '💼', '#A0BBEB');

// 记录标签使用（任务完成时）
recordTagUsage('工作', taskId, taskTitle, durationMinutes);
```

#### 3. 智能标签推荐

在任务编辑器中使用智能推荐：

```typescript
import SmartTagRecommender from '@/components/tags/SmartTagRecommender';

<SmartTagRecommender
  taskTitle={taskTitle}
  onSelectTag={(tagName) => {
    // 添加标签到任务
    setSelectedTags([...selectedTags, tagName]);
  }}
  selectedTags={selectedTags}
  isDark={false}
/>
```

### 三、数据结构

#### TagData
```typescript
interface TagData {
  name: string;           // 标签名称
  emoji: string;          // Emoji 图标
  color: string;          // 标签颜色
  usageCount: number;     // 使用次数
  totalDuration: number;  // 总时长（分钟）
  lastUsedAt: Date;       // 最后使用时间
  createdAt: Date;        // 创建时间
  isDisabled?: boolean;   // 是否禁用
}
```

#### TagDurationRecord
```typescript
interface TagDurationRecord {
  tagName: string;    // 标签名称
  taskId: string;     // 任务ID
  taskTitle: string;  // 任务标题
  duration: number;   // 时长（分钟）
  date: Date;         // 日期
}
```

### 四、API 说明

#### useTagStore

```typescript
// 标签操作
addTag(name, emoji?, color?)           // 添加标签
updateTag(oldName, newName, emoji?, color?)  // 更新标签
deleteTag(name)                        // 删除标签
mergeTags(tagNames, newName)          // 合并标签

// 标签使用记录
recordTagUsage(tagName, taskId, taskTitle, duration)

// 标签查询
getTagByName(name)                    // 获取标签
getAllTags()                          // 获取所有标签
getActiveTagsSortedByUsage()         // 获取活跃标签（按使用次数排序）
getHighFrequencyTags(limit?)         // 获取高频标签

// 标签时长分析
getTagDuration(tagName, startDate?, endDate?)  // 获取标签时长
getTagDurationByDate(tagName, date)            // 获取指定日期的标签时长
getTagDurationRecords(tagName, startDate?, endDate?)  // 获取时长记录

// 智能推荐
getRecommendedTags(taskTitle, limit?)  // 获取推荐标签
```

### 五、样式定制

标签颜色会根据标签名称自动生成，也可以手动设置：

- 工作类：蓝色系 (#A0BBEB)
- 学习类：紫色系 (#AA9FBE)
- 家务类：绿色系 (#6A7334)
- 运动类：黄绿色 (#A6B13C)
- 社交类：玫瑰色 (#B34568)
- 娱乐类：粉色 (#FB9FC9)
- 饮食类：黄色 (#FFE288)

### 六、注意事项

1. 标签名称不能为空
2. 重命名标签会同步更新所有关联任务
3. 删除标签会从所有任务中移除该标签
4. 合并标签会保留所有统计数据
5. 标签数据存储在 localStorage 中，自动持久化

### 七、未来优化方向

1. ✅ 标签颜色自定义
2. ✅ 标签分组管理
3. ✅ 标签导出/导入
4. ✅ 标签使用趋势分析
5. ✅ 标签关联目标
6. ✅ 标签智能分类
7. ✅ 标签使用建议

---

## 快速开始

1. 在导航栏添加"标签"入口
2. 在任务中添加标签
3. 完成任务后自动记录标签时长
4. 在标签管理中查看分析和统计

祝你使用愉快！🎉

