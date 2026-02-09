# 步骤4：在启动验证通过后添加时间轴调整
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 在第1022行后添加
insert_pos = 1022
new_code = [
    "            \n",
    "          // 记录实际启动时间并调整时间轴位置\n",
    "          setTaskActualStartTimes(prev => ({ ...prev, [taskId]: now }));\n",
    "          adjustTaskStartTime(taskId, now, allTasks, onTaskUpdate);\n",
]

lines = lines[:insert_pos] + new_code + lines[insert_pos:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Step 4 completed: Added start time adjustment")

