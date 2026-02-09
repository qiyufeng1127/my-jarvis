# 步骤5：在完成验证通过后添加时间轴调整
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 在第1104行后添加
insert_pos = 1104
new_code = [
    "          \n",
    "          // 调整任务结束时间\n",
    "          adjustTaskEndTime(taskId, now, allTasks, onTaskUpdate);\n",
]

lines = lines[:insert_pos] + new_code + lines[insert_pos:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Step 5 completed: Added complete time adjustment")

