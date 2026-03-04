# 任务状态标记功能测试指南

## 问题诊断

从你提供的HTML代码来看，任务卡片上没有显示超时标记。可能的原因：

1. **任务没有超时记录** - 这个任务可能没有经历过启动超时或完成超时
2. **任务数据未保存超时状态** - 旧任务可能没有这些字段

## 如何测试功能

### 测试步骤1：创建一个新任务并故意超时

1. **创建新任务**
   - 点击时间轴上的"+"按钮
   - 设置任务标题，例如："测试超时任务"
   - 设置任务时长：30分钟
   - 设置开始时间：当前时间（例如现在是01:40，就设置01:40）
   - 启用验证（点击⏱️按钮）

2. **等待任务到时间**
   - 等待任务到达预设时间
   - 会出现倒计时界面

3. **故意延迟启动（制造启动超时）**
   - 不要立即点击"启动验证"
   - 等待超过2分钟
   - 这时应该会触发启动超时

4. **启动任务**
   - 点击"启动验证"
   - 拍照或上传图片
   - 任务开始进行

5. **完成任务**
   - 点击"完成验证"
   - 填写效率评估
   - 完成任务

6. **检查标记**
   - 任务完成后，右上角应该显示黄色三角感叹号⚠️（启动超时标记）

### 测试步骤2：检查现有任务

如果你之前有任务经历过超时，但现在看不到标记，可能是因为：

1. **数据未迁移** - 旧任务没有 `startVerificationTimeout` 和 `completionTimeout` 字段
2. **需要手动添加** - 可以通过浏览器控制台手动添加这些字段进行测试

### 手动测试方法（通过浏览器控制台）

打开浏览器控制台（F12），执行以下代码来给现有任务添加超时标记：

```javascript
// 获取任务存储
const taskStore = JSON.parse(localStorage.getItem('task-storage') || '{}');

// 找到你想测试的任务（替换为实际的任务ID）
const taskId = '93b7ccb3-3f38-4829-afbc-1ff7dc1a6a3b'; // 你的任务ID

// 找到任务并添加超时标记
if (taskStore.state && taskStore.state.tasks) {
  const task = taskStore.state.tasks.find(t => t.id === taskId);
  if (task) {
    task.startVerificationTimeout = true; // 添加启动超时标记
    task.completionTimeout = false; // 添加完成超时标记（可选）
    task.completionEfficiency = 45; // 添加低效率（可选）
    
    // 保存回localStorage
    localStorage.setItem('task-storage', JSON.stringify(taskStore));
    
    console.log('✅ 已添加超时标记，请刷新页面查看效果');
  }
}
```

执行后刷新页面，应该能看到黄色三角感叹号⚠️和乌龟🐢图标。

## 标记说明

### 黄色三角感叹号 ⚠️
- **含义**：启动超时
- **触发条件**：任务到达预设时间后，超过2分钟才启动
- **显示位置**：任务卡片右上角

### 红色三角感叹号 ⚠️
- **含义**：完成超时
- **触发条件**：任务超过预计时长才完成
- **显示位置**：任务卡片右上角

### 乌龟图标 🐢
- **含义**：低效率
- **触发条件**：完成效率 < 60%
- **显示位置**：任务卡片右上角

## 调试方法

如果标记仍然不显示，请检查：

1. **打开浏览器控制台**（F12）
2. **查看是否有错误信息**
3. **检查任务数据**：
```javascript
// 查看任务数据
const taskStore = JSON.parse(localStorage.getItem('task-storage') || '{}');
console.log('所有任务:', taskStore.state.tasks);

// 查看特定任务
const task = taskStore.state.tasks.find(t => t.title === '工作');
console.log('任务详情:', task);
console.log('启动超时:', task.startVerificationTimeout);
console.log('完成超时:', task.completionTimeout);
console.log('完成效率:', task.completionEfficiency);
```

4. **检查组件是否正确渲染**：
   - 在控制台的 Elements 标签中
   - 搜索 `TaskStatusBadge`
   - 看看组件是否存在于DOM中

## 预期效果

正确配置后，任务卡片应该是这样的：

```
┌─────────────────────────────────┐
│  ⚠️🐢                    (右上角) │
│                                 │
│  📷  工作 ✅                     │
│      @完成目标                   │
│                                 │
│  💰 1200  *30 min               │
└─────────────────────────────────┘
```

如果还是看不到标记，请告诉我控制台的错误信息！

