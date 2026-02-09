# 步骤3：添加超时处理函数
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 在第805行后（handleStartTask之前）添加超时处理函数
insert_pos = 805
new_handlers = [
    "  // 启动验证超时处理\n",
    "  const handleStartVerificationTimeout = (taskId: string) => {\n",
    "    setTaskStartTimeouts(prev => ({ ...prev, [taskId]: true }));\n",
    "    console.log(`任务 ${taskId} 启动验证超时，完成时将扣除30%金币`);\n",
    "  };\n",
    "\n",
    "  // 完成验证超时处理\n",
    "  const handleFinishVerificationTimeout = (taskId: string) => {\n",
    "    setTaskFinishTimeouts(prev => ({ ...prev, [taskId]: true }));\n",
    "    console.log(`任务 ${taskId} 完成超时，将无金币奖励`);\n",
    "  };\n",
    "\n",
]

lines = lines[:insert_pos] + new_handlers + lines[insert_pos:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Step 3 completed: Added timeout handlers")

