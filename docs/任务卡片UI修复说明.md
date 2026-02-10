# 任务卡片UI和验证逻辑修复说明

## 修复日期
2026-02-09

## 问题总结

### 1. 倒计时显示太丑 ✅ 已修复
**问题：** 倒计时显示为独立的黄色横条，不美观
**修复：** 已将倒计时整合到卡片内，显示为简洁的文字提示

### 2. 重复启动验证bug ⚠️ 需要手动修复
**问题：** 提前启动并完成验证后，到原定时间还要再次验证
**原因：** 启动按钮的显示条件没有检查验证状态

### 3. 图片无法删除 ✅ 已修复
**问题：** 附件图片无法删除
**修复：** 已添加删除按钮（hover显示）

---

## 需要手动修复的代码

### 修复位置：NewTimelineView.tsx 第1981-2009行

**查找这段代码：**
```typescript
{!block.isCompleted && block.status !== 'in_progress' && (
  <button
    onClick={() => handleStartTask(block.id)}
    disabled={startingTask === block.id}
    className={`${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-bold transition-all hover:scale-105 disabled:opacity-50`}
    style={{ 
      backgroundColor: taskVerifications[block.id]?.status === 'started' 
        ? 'rgba(34,197,94,0.3)' 
        : 'rgba(255,255,255,0.95)',
      color: taskVerifications[block.id]?.status === 'started'
        ? 'rgba(255,255,255,0.95)'
        : block.color,
    }}
    title={
      taskVerifications[block.id]?.status === 'started'
        ? '已完成启动验证'
        : taskVerifications[block.id]?.enabled 
        ? '点击启动验证' 
        : '开始任务'
    }
  >
    {startingTask === block.id 
      ? '⏳' 
      : taskVerifications[block.id]?.status === 'started'
      ? '✅已启动'
      : '*start'}
  </button>
)}
```

**替换为：**
```typescript
{!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
  <button
    onClick={() => handleStartTask(block.id)}
    disabled={startingTask === block.id}
    className={`${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-bold transition-all hover:scale-105 disabled:opacity-50`}
    style={{ 
      backgroundColor: 'rgba(255,255,255,0.95)',
      color: block.color,
    }}
    title={
      taskVerifications[block.id]?.enabled 
        ? '点击启动验证' 
        : '开始任务'
    }
  >
    {startingTask === block.id ? '⏳' : '*start'}
  </button>
)}

{/* 已启动标识 */}
{taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (
  <div 
    className={`${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-bold`}
    style={{ 
      backgroundColor: 'rgba(34,197,94,0.3)',
      color: 'rgba(255,255,255,0.95)',
    }}
  >
    ✅已启动
  </div>
)}
```

### 关键修改点

1. **添加验证状态检查**
   ```typescript
   // 原来
   {!block.isCompleted && block.status !== 'in_progress' && (
   
   // 修改为
   {!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
   ```

2. **分离已启动标识**
   - 将"✅已启动"从按钮中分离出来
   - 作为独立的div显示
   - 只在验证状态为'started'时显示

3. **简化按钮逻辑**
   - 移除按钮内的验证状态判断
   - 按钮只在未启动时显示
   - 已启动时显示独立的标识

---

## 同样需要修复的第二处

### 修复位置：NewTimelineView.tsx 第2304-2332行（展开卡片中的启动按钮）

**查找类似的代码：**
```typescript
{!block.isCompleted && block.status !== 'in_progress' && (
  <button
    onClick={() => handleStartTask(block.id)}
    disabled={startingTask === block.id}
    className="px-4 py-1.5 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
    style={{ 
      backgroundColor: 'rgba(255,255,255,0.95)',
      color: block.color,
    }}
  >
    {startingTask === block.id ? '⏳ 启动中...' : '*start'}
  </button>
)}
```

**替换为：**
```typescript
{!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
  <button
    onClick={() => handleStartTask(block.id)}
    disabled={startingTask === block.id}
    className="px-4 py-1.5 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
    style={{ 
      backgroundColor: 'rgba(255,255,255,0.95)',
      color: block.color,
    }}
  >
    {startingTask === block.id ? '⏳ 启动中...' : '*start'}
  </button>
)}

{/* 已启动标识 */}
{taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (
  <div 
    className="px-4 py-1.5 rounded-full font-bold text-sm"
    style={{ 
      backgroundColor: 'rgba(34,197,94,0.3)',
      color: 'rgba(255,255,255,0.95)',
    }}
  >
    ✅ 已启动
  </div>
)}
```

---

## 已自动修复的内容

### 1. 倒计时显示优化 ✅

**修改位置：** 第2217-2260行

**原来的代码：**
```typescript
{taskVerifications[block.id]?.enabled && (
  <>
    {taskVerifications[block.id]?.status === 'pending' && (
      <StartVerificationCountdown
        taskId={block.id}
        onTimeout={handleStartVerificationTimeout}
        onComplete={() => {}}
        keywords={taskVerifications[block.id]?.startKeywords || []}
        isStarted={taskVerifications[block.id]?.status === 'started'}
      />
    )}
    
    {taskVerifications[block.id]?.status === 'started' && (
      <FinishVerificationCountdown
        taskId={block.id}
        estimatedMinutes={block.duration || block.durationMinutes || 30}
        onTimeout={handleFinishVerificationTimeout}
        keywords={taskVerifications[block.id]?.completionKeywords || []}
        isCompleted={block.isCompleted || block.status === 'completed'}
        startTime={taskActualStartTimes[block.id] || taskVerifications[block.id]?.actualStartTime || new Date(block.startTime)}
      />
    )}
  </>
)}
```

**已修改为：**
```typescript
{taskVerifications[block.id]?.enabled && (
  <>
    {/* 启动验证倒计时 - 仅在等待启动时显示 */}
    {taskVerifications[block.id]?.status === 'waiting_start' && (() => {
      const now = new Date();
      const scheduledStart = new Date(block.scheduledStart || block.startTime);
      const diffMs = scheduledStart.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);
      
      if (diffMs <= 0) {
        // 时间到了，显示启动提示
        return (
          <div className="mt-2 text-center">
            <div className="text-lg font-bold mb-1">⏰ 马上进行启动验证</div>
            <div className="text-xs opacity-80 mb-2">
              请拍摄包含【{taskVerifications[block.id]?.startKeywords?.join('、')}】的照片
            </div>
          </div>
        );
      }
      return null;
    })()}
    
    {/* 完成验证倒计时 - 仅在已启动未完成时显示 */}
    {taskVerifications[block.id]?.status === 'started' && (() => {
      const startTime = taskActualStartTimes[block.id] || taskVerifications[block.id]?.actualStartTime || new Date(block.startTime);
      const estimatedMinutes = block.duration || block.durationMinutes || 30;
      const endTime = new Date(startTime.getTime() + estimatedMinutes * 60000);
      const now = new Date();
      const remainingMs = endTime.getTime() - now.getTime();
      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
      
      return (
        <div className="mt-2 text-center">
          <div className="text-lg font-bold mb-1">
            ⏱️ 距离任务完成还有 {remainingMinutes}分{remainingSeconds}秒
          </div>
          <div className="text-xs opacity-80">
            完成后请拍摄包含【{taskVerifications[block.id]?.completionKeywords?.join('、')}】的照片
          </div>
        </div>
      );
    })()}
  </>
)}
```

**改进点：**
- 移除了独立的倒计时组件
- 直接在卡片内显示倒计时文字
- 保持卡片原有颜色
- 显示更简洁美观

### 2. 图片删除功能 ✅

**修改位置：** 第2503-2530行

**已添加删除按钮：**
```typescript
{/* 删除按钮 - hover显示 */}
<button
  onClick={(e) => {
    e.stopPropagation();
    if (confirm('确定要删除这张图片吗？')) {
      setTaskImages(prev => ({
        ...prev,
        [block.id]: prev[block.id].filter(img => img.id !== image.id)
      }));
    }
  }}
  className="absolute bottom-1 right-1 p-1.5 bg-red-500/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
  title="删除图片"
>
  <X className="w-3 h-3 text-white" />
</button>
```

**功能：**
- 鼠标悬停时显示删除按钮
- 点击后弹出确认对话框
- 确认后删除图片

---

## 测试步骤

### 测试1：倒计时显示
1. 创建一个任务并启用验证
2. 查看任务卡片
3. ✅ 确认倒计时显示在卡片内，不是独立的横条
4. ✅ 确认卡片保持原有颜色

### 测试2：重复启动验证bug
1. 创建一个任务，计划时间为14:00
2. 在13:50提前启动任务
3. 完成启动验证
4. ✅ 确认显示"✅已启动"标识
5. ✅ 确认启动按钮消失
6. 等到14:00
7. ✅ 确认不会再次要求启动验证
8. ✅ 确认仍然显示"✅已启动"

### 测试3：图片删除
1. 上传几张图片到任务
2. 展开任务卡片
3. 鼠标悬停在图片上
4. ✅ 确认显示红色删除按钮
5. 点击删除按钮
6. ✅ 确认弹出确认对话框
7. 确认删除
8. ✅ 确认图片被删除

---

## 修复优先级

1. **高优先级** - 重复启动验证bug（需要手动修复）
2. **已完成** - 倒计时显示优化
3. **已完成** - 图片删除功能

---

## 注意事项

1. **备份文件**：修改前请备份 NewTimelineView.tsx
2. **搜索定位**：使用编辑器的搜索功能找到需要修改的代码
3. **仔细对比**：确保修改的代码位置正确
4. **测试验证**：修改后务必测试所有场景

---

## 完成后的效果

### 倒计时显示
- ✅ 整合到卡片内
- ✅ 保持卡片原色
- ✅ 显示简洁文字
- ✅ 不再是独立横条

### 启动验证
- ✅ 启动后显示"✅已启动"
- ✅ 不再显示启动按钮
- ✅ 不会重复验证
- ✅ 状态持久保持

### 图片管理
- ✅ 可以删除图片
- ✅ hover显示删除按钮
- ✅ 确认后删除
- ✅ 界面友好

---

**修复完成后，请重新测试所有功能！**

