## 修改说明

在 `src/components/calendar/NewTimelineView.tsx` 文件中，需要修改任务卡片上SOP按钮和重复按钮的显示逻辑。

### 当前问题：
按钮只在任务进行中或完成后显示

### 修改目标：
让按钮始终显示，不受任务状态限制

### 修改位置：
大约在第 2656-2351 行

### 修改步骤：

1. 找到以下代码块（两处）：
```typescript
{(block.status === 'in_progress' || block.status === 'verifying_start') && (
  <>
    <div ...>进行中</div>
    <SaveToSOPButton ... />
    <button>🔄</button>
  </>
)}

{block.isCompleted && (
  <>
    <SaveToSOPButton ... />
    <button>🔄</button>
  </>
)}
```

2. 修改为：
```typescript
{(block.status === 'in_progress' || block.status === 'verifying_start') && (
  <div ...>进行中</div>
)}

{/* SOP按钮和重复按钮 - 始终显示 */}
<SaveToSOPButton task={block} isDark={isDark} size="small" />

<button
  onClick={() => setRecurrenceDialogTask(allTasks.find(t => t.id === block.id) || null)}
  className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
  style={{ 
    backgroundColor: block.isRecurring ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)',
  }}
  title={block.isRecurring ? '已设置重复' : '设置任务重复'}
>
  <span className="text-sm">🔄</span>
</button>
```

### 关键点：
- 删除第二个 `{block.isCompleted && (` 条件块
- 将两个按钮移到条件判断外面
- 保留"进行中"标签的条件显示

