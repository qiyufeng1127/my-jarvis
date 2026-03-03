# RPG系统交互策略设计文档

## 核心理念
**零手动填写 · 10秒上手 · 无缝融入 · 即时反馈**

---

## 一、数据流转架构

```
时间轴数据 + 标签数据 + 任务数据
         ↓
    AI实时分析引擎
         ↓
    ┌────┴────┐
    ↓         ↓
角色画像    智能任务生成
    ↓         ↓
雷达图更新  正向任务 + 改进任务
    ↓         ↓
经验/等级   一键领取 → 同步时间轴
    ↓         ↓
头像解锁    完成 → 即时奖励动画
    ↓         ↓
成就/目标   未完成 → 轻量警示 → 改进任务
```

---

## 二、核心交互流程

### 2.1 启动阶段（首次使用，10秒完成）

**流程：**
1. 用户打开RPG首页
2. AI自动扫描历史数据（时间轴、标签、任务）
3. 3秒内生成角色画像：
   - 等级：基于历史任务完成数
   - 性格特质：基于标签使用频率
   - 优势能力：基于高完成率的任务类型
   - 待改进行为：基于拖延、低效的任务模式
4. 自动生成今日任务（5个正向 + 2个改进）
5. 展示欢迎动画 + 角色卡片

**技术实现：**
```typescript
// src/services/rpgAIAnalyzer.ts
async function initializeRPGSystem() {
  // 1. 分析历史数据
  const history = await analyzeUserHistory();
  
  // 2. 生成角色画像
  const character = {
    level: calculateLevel(history.completedTasks),
    personality: extractPersonality(history.tags),
    strengths: identifyStrengths(history.highPerformanceTasks),
    improvements: identifyWeaknesses(history.delayedTasks)
  };
  
  // 3. 生成今日任务
  const tasks = await generateSmartTasks(history, character);
  
  // 4. 更新store
  useRPGStore.setState({ character, dailyTasks: tasks });
}
```

---

### 2.2 任务生成（AI驱动，零手动）

**正向任务生成逻辑：**
- 基于用户常用标签（如"工作"、"学习"）
- 基于时间轴中的高频活动
- 基于历史完成率高的任务类型
- 自动匹配合适的时间段

**改进任务生成逻辑：**
- 检测拖延模式：任务推迟次数 > 2
- 检测低效模式：任务耗时 > 预期2倍
- 检测遗漏模式：计划任务未执行
- 生成针对性改进任务

**示例：**
```typescript
// 正向任务示例
{
  title: "完成3个工作任务",
  description: "基于你的工作标签，今天专注完成3个工作相关任务",
  type: "positive",
  expReward: 50,
  goldReward: 30,
  suggestedTime: "09:00-12:00" // AI推荐时间段
}

// 改进任务示例
{
  title: "减少拖延：立即开始第一个任务",
  description: "昨天你推迟了2个任务，今天尝试在计划时间立即开始",
  type: "improvement",
  isImprovement: true,
  expReward: 80, // 改进任务奖励更高
  goldReward: 50,
  linkedBehavior: "拖延" // 关联到雷达图的负向行为
}
```

---

### 2.3 一键领取任务（无缝同步）

**交互流程：**
1. 用户点击"一键领取"按钮
2. AI智能调度：
   - 分析今日时间轴空闲时段
   - 根据任务类型匹配合适时间
   - 自动插入时间轴（避免冲突）
3. 显示同步结果：
   - Toast提示："已将5个任务同步到时间轴"
   - 显示具体时间安排
4. 用户可在时间轴中查看/调整

**技术实现：**
```typescript
// src/services/rpgTaskSyncService.ts
async function smartScheduleTasks(tasks: RPGTask[]) {
  // 1. 获取今日时间轴
  const timeline = useTimelineStore.getState().entries;
  
  // 2. 找出空闲时段
  const freeSlots = findFreeTimeSlots(timeline);
  
  // 3. 智能匹配
  const scheduled = tasks.map(task => {
    const bestSlot = findBestSlot(task, freeSlots);
    return {
      ...task,
      startTime: bestSlot.start,
      endTime: bestSlot.end,
      tags: [task.type, 'RPG任务']
    };
  });
  
  // 4. 同步到时间轴
  scheduled.forEach(task => {
    useTimelineStore.getState().addEntry({
      title: task.title,
      description: task.description,
      startTime: task.startTime,
      endTime: task.endTime,
      tags: task.tags,
      rpgTaskId: task.id // 关联RPG任务
    });
  });
  
  return { success: scheduled.length, failed: 0 };
}
```

---

### 2.4 完成任务（即时反馈）

**交互流程：**
1. 用户在时间轴完成任务 OR 在RPG页面勾选任务
2. 触发完成动画序列：
   - ✅ 任务完成动画（0.3s）
   - ⭐ 经验值飘字动画（0.5s）
   - 💰 金币飘字动画（0.5s，延迟0.2s）
   - 🎉 连击提示（如果10秒内连续完成）
3. 检查升级：
   - 如果升级 → 升级动画（1s）+ 新头像解锁提示
4. 更新角色数据：
   - 雷达图实时更新
   - 经验条平滑增长
   - 成就检查（如"连续完成5个任务"）

**iOS风格动画：**
- 使用弹性动画（spring animation）
- 轻量haptic反馈（震动）
- 渐变色彩过渡
- 不遮挡主界面（右上角飘字）

**技术实现：**
```typescript
// src/components/rpg/RPGHomePage.tsx
function handleCompleteTask(taskId: string) {
  const task = dailyTasks.find(t => t.id === taskId);
  
  // 1. 完成任务
  const oldLevel = character.level;
  completeTask(taskId);
  
  // 2. 动画序列
  setShowTaskCompleteAnim(true);
  setTimeout(() => setShowExpGain({ show: true, amount: task.expReward }), 300);
  setTimeout(() => setShowGoldGain({ show: true, amount: task.goldReward }), 500);
  
  // 3. 检查连击
  if (isCombo) {
    setCombo(prev => prev + 1);
  }
  
  // 4. 检查升级
  const newLevel = useRPGStore.getState().character.level;
  if (newLevel > oldLevel) {
    setTimeout(() => {
      setShowLevelUpAnim(true);
      checkAndUnlockAvatars(character.exp);
    }, 1000);
  }
  
  // 5. 更新雷达图
  updateRadarChart(task);
  
  // 6. 检查成就
  checkAchievements();
  
  // 7. iOS haptic反馈
  if (navigator.vibrate) {
    navigator.vibrate([10, 20, 10]);
  }
}
```

---

### 2.5 未完成/低效处理（轻量警示）

**触发条件：**
- 任务超时未完成
- 任务耗时超过预期50%
- 任务被推迟3次以上

**交互流程：**
1. 轻量Toast提示（不打断操作）：
   - "任务「写报告」已超时20分钟，需要帮助吗？"
   - 提供选项：[继续] [标记完成] [生成改进任务]
2. 如果选择"生成改进任务"：
   - AI分析原因（时间不够？难度太高？）
   - 生成针对性改进任务
   - 自动添加到明日任务列表
3. 更新负向雷达图：
   - "拖延"指标 +5
   - 显示轻量提示："拖延行为增加，完成改进任务可降低"

**iOS风格警示：**
- 使用系统级Toast（不遮挡内容）
- 柔和的橙色/黄色（非红色）
- 可滑动关闭
- 不强制操作

**技术实现：**
```typescript
// src/services/rpgTaskMonitor.ts
function monitorTaskProgress() {
  const timeline = useTimelineStore.getState().entries;
  const now = new Date();
  
  timeline.forEach(entry => {
    if (entry.rpgTaskId && entry.endTime < now && !entry.completed) {
      // 任务超时
      const delay = now - entry.endTime;
      
      RPGNotificationService.showWarning(
        `任务「${entry.title}」已超时${Math.floor(delay / 60000)}分钟`,
        {
          actions: [
            { label: '继续', onClick: () => {} },
            { label: '标记完成', onClick: () => completeTask(entry.rpgTaskId) },
            { label: '生成改进任务', onClick: () => generateImprovementTask(entry) }
          ]
        }
      );
      
      // 更新负向雷达图
      updateNegativeBehavior('拖延', +5);
    }
  });
}

// 每5分钟检查一次
setInterval(monitorTaskProgress, 5 * 60 * 1000);
```

---

### 2.6 改进任务完成（正向反馈）

**交互流程：**
1. 用户完成改进任务
2. 触发特殊动画：
   - 🎊 改进成功动画（更华丽）
   - ⬇️ 负向行为降低动画（雷达图收缩）
   - 🎁 额外奖励解锁（金币 x2）
3. 更新雷达图：
   - 负向行为指标 -10
   - 正向能力指标 +5
4. 检查成就：
   - "改过自新"：完成10个改进任务
   - "自律大师"：连续7天完成改进任务

**技术实现：**
```typescript
function handleImprovementTaskComplete(task: RPGTask) {
  // 1. 双倍奖励
  const expReward = task.expReward * 2;
  const goldReward = task.goldReward * 2;
  
  addExp(expReward);
  addGold(goldReward);
  
  // 2. 更新雷达图
  updateNegativeBehavior(task.linkedBehavior, -10);
  updatePositiveBehavior('自律', +5);
  
  // 3. 特殊动画
  setShowImprovementCompleteAnim(true);
  
  // 4. Toast提示
  RPGNotificationService.showSuccess(
    '🎉 改进成功！',
    `${task.linkedBehavior}行为降低10点，获得双倍奖励！`
  );
  
  // 5. 检查成就
  checkImprovementAchievements();
}
```

---

## 三、数据分析与学习

### 3.1 AI学习用户习惯

**学习维度：**
1. **时间偏好**：
   - 工作时段：9:00-12:00, 14:00-18:00
   - 学习时段：20:00-22:00
   - 休息时段：12:00-14:00, 22:00-23:00

2. **任务类型偏好**：
   - 高完成率：工作任务（90%）、学习任务（85%）
   - 低完成率：运动任务（40%）、社交任务（50%）

3. **标签使用习惯**：
   - 高频标签：工作、学习、阅读
   - 低频标签：运动、娱乐

4. **行为模式**：
   - 拖延模式：下午任务容易推迟
   - 高效模式：上午专注力最强
   - 低效模式：晚上容易分心

**技术实现：**
```typescript
// src/services/rpgAIAnalyzer.ts
async function analyzeUserBehavior() {
  const timeline = await getTimelineHistory(30); // 最近30天
  const tasks = await getTaskHistory(30);
  const tags = await getTagUsage(30);
  
  return {
    timePreference: analyzeTimePatterns(timeline),
    taskPreference: analyzeTaskCompletion(tasks),
    tagPreference: analyzeTagFrequency(tags),
    behaviorPatterns: analyzeBehaviorPatterns(timeline, tasks)
  };
}

function analyzeTimePatterns(timeline: TimelineEntry[]) {
  const hourlyProductivity = new Array(24).fill(0);
  
  timeline.forEach(entry => {
    if (entry.completed) {
      const hour = new Date(entry.startTime).getHours();
      hourlyProductivity[hour]++;
    }
  });
  
  return {
    peakHours: findPeakHours(hourlyProductivity),
    lowHours: findLowHours(hourlyProductivity)
  };
}
```

### 3.2 动态任务生成

**生成策略：**
1. **正向任务**：
   - 基于高完成率的任务类型
   - 匹配用户高效时段
   - 难度适中（不超过历史平均耗时）

2. **改进任务**：
   - 针对低完成率的任务类型
   - 分解为更小的子任务
   - 提供具体的改进建议

**示例：**
```typescript
async function generateDailyTasks() {
  const behavior = await analyzeUserBehavior();
  
  // 正向任务
  const positiveTasks = [
    {
      title: `完成${behavior.taskPreference.highCompletionType}任务`,
      suggestedTime: behavior.timePreference.peakHours[0],
      difficulty: 'medium'
    }
  ];
  
  // 改进任务
  const improvementTasks = [
    {
      title: `改进${behavior.behaviorPatterns.weakestArea}`,
      description: `将任务分解为3个小任务，每个15分钟`,
      linkedBehavior: behavior.behaviorPatterns.weakestArea
    }
  ];
  
  return [...positiveTasks, ...improvementTasks];
}
```

---

## 四、iOS风格设计规范

### 4.1 动画规范

**原则：**
- 快速响应（< 300ms）
- 弹性动画（spring）
- 不遮挡内容
- 可中断

**动画时长：**
- Toast提示：2-3秒
- 飘字动画：0.5秒
- 升级动画：1秒
- 页面转场：0.3秒

### 4.2 交互规范

**原则：**
- 单手操作友好
- 滑动优先于点击
- 提供撤销选项
- 避免多步确认

**手势：**
- 下拉刷新：重新生成任务
- 左滑：快速完成任务
- 右滑：推迟任务
- 长按：查看任务详情

### 4.3 通知规范

**原则：**
- 非侵入式
- 可快速关闭
- 提供快捷操作
- 不打断流程

**通知类型：**
- 成功：绿色，2秒自动关闭
- 警告：橙色，3秒自动关闭，可操作
- 错误：红色，需手动关闭
- 信息：蓝色，2秒自动关闭

---

## 五、技术实现清单

### 5.1 需要新增的功能

1. **AI分析引擎增强**：
   - [ ] 历史数据分析（30天）
   - [ ] 时间偏好分析
   - [ ] 任务类型偏好分析
   - [ ] 行为模式识别

2. **智能任务生成**：
   - [ ] 基于用户习惯生成正向任务
   - [ ] 基于弱点生成改进任务
   - [ ] 任务难度评估
   - [ ] 时间段推荐

3. **任务同步服务**：
   - [ ] 空闲时段检测
   - [ ] 智能时间匹配
   - [ ] 冲突避免
   - [ ] 批量同步

4. **实时监控服务**：
   - [ ] 任务进度监控
   - [ ] 超时检测
   - [ ] 低效检测
   - [ ] 自动警示

5. **雷达图实时更新**：
   - [ ] 任务完成 → 正向能力 +5
   - [ ] 改进任务完成 → 负向行为 -10
   - [ ] 超时/低效 → 负向行为 +5
   - [ ] 平滑动画过渡

6. **成就系统联动**：
   - [ ] 任务完成 → 检查成就
   - [ ] 升级 → 解锁成就
   - [ ] 连击 → 特殊成就
   - [ ] 改进 → 改进类成就

### 5.2 需要优化的功能

1. **动画系统**：
   - [ ] 统一动画时长
   - [ ] 添加弹性效果
   - [ ] 优化性能
   - [ ] 支持中断

2. **通知系统**：
   - [ ] 统一Toast样式
   - [ ] 添加快捷操作
   - [ ] 支持滑动关闭
   - [ ] 队列管理

3. **数据持久化**：
   - [ ] 历史数据存储
   - [ ] 分析结果缓存
   - [ ] 增量更新
   - [ ] 数据迁移

---

## 六、开发优先级

### P0（核心功能，必须实现）
1. AI历史数据分析
2. 智能任务生成
3. 一键同步到时间轴
4. 任务完成即时反馈
5. 雷达图实时更新

### P1（重要功能，尽快实现）
1. 任务进度监控
2. 超时/低效警示
3. 改进任务生成
4. 成就系统联动
5. 升级动画优化

### P2（优化功能，逐步实现）
1. 手势操作支持
2. Haptic反馈
3. 动画性能优化
4. 数据分析报告
5. 个性化推荐

---

## 七、用户体验目标

### 7.1 核心指标
- **上手时间**：< 10秒
- **任务生成时间**：< 3秒
- **同步时间**：< 2秒
- **动画响应时间**：< 300ms
- **通知关闭时间**：< 2秒

### 7.2 用户满意度
- **零学习成本**：无需阅读教程
- **零手动输入**：全自动生成
- **即时反馈**：每个操作都有反馈
- **无打断感**：警示不影响操作
- **成就感强**：频繁的正向反馈

---

## 八、实现路线图

### Week 1: 数据分析与任务生成
- Day 1-2: AI历史数据分析
- Day 3-4: 智能任务生成算法
- Day 5: 测试与优化

### Week 2: 同步与监控
- Day 1-2: 一键同步到时间轴
- Day 3-4: 任务进度监控
- Day 5: 超时/低效警示

### Week 3: 反馈与动画
- Day 1-2: 任务完成即时反馈
- Day 3-4: 雷达图实时更新
- Day 5: 动画系统优化

### Week 4: 联动与优化
- Day 1-2: 成就系统联动
- Day 3-4: 改进任务流程
- Day 5: 整体测试与优化

---

## 九、成功案例模拟

### 场景1：新用户首次使用
1. 打开RPG页面
2. AI扫描历史数据（3秒）
3. 显示角色卡片：Lv.5 自律新手
4. 自动生成7个任务
5. 点击"一键领取"
6. 任务同步到时间轴
7. 开始第一个任务
8. 完成 → 动画 → 升级 → 解锁头像
9. 总耗时：< 1分钟

### 场景2：老用户日常使用
1. 早上打开APP
2. 查看今日任务（已自动生成）
3. 点击"一键领取"
4. 按时间轴完成任务
5. 每完成一个 → 即时反馈
6. 下午某任务超时 → 轻量提示
7. 选择"生成改进任务"
8. 明天完成改进任务 → 双倍奖励
9. 总操作次数：< 5次

### 场景3：改进行为
1. AI检测到"拖延"行为增加
2. 自动生成改进任务："立即开始第一个任务"
3. 用户完成改进任务
4. 触发特殊动画
5. "拖延"指标降低
6. 解锁成就："改过自新"
7. 获得双倍奖励
8. 正向反馈强化

---

## 十、总结

这套交互策略的核心是：
1. **零手动**：AI全自动分析和生成
2. **即时反馈**：每个操作都有动画和提示
3. **无缝融入**：警示不打断操作流程
4. **正向循环**：完成 → 奖励 → 升级 → 解锁 → 继续完成

通过这套策略，用户可以：
- 10秒上手，无需学习
- 0次手动填写，全自动运行
- 持续获得正向反馈，保持动力
- 在不知不觉中改进行为，提升效率

最终实现：**让时间管理变成一场有趣的RPG游戏**。

