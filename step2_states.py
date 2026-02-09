# 步骤2：添加状态管理
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 在第94行后添加新状态
insert_pos = 94
new_states = [
    "  const [taskStartTimeouts, setTaskStartTimeouts] = useState<Record<string, boolean>>({}); // 启动验证超时标记\n",
    "  const [taskFinishTimeouts, setTaskFinishTimeouts] = useState<Record<string, boolean>>({}); // 完成验证超时标记\n",
    "  const [taskActualStartTimes, setTaskActualStartTimes] = useState<Record<string, Date>>({}); // 任务实际启动时间\n",
]

lines = lines[:insert_pos] + new_states + lines[insert_pos:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Step 2 completed: Added state management")

