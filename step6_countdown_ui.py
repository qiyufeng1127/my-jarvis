# 步骤6：在任务卡片中添加倒计时组件
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 在第2207行后添加倒计时组件
insert_pos = 2207
new_code = [
    "\n",
    "                      {/* 倒计时组件 - 仅在启用验证时显示 */}\n",
    "                      {taskVerifications[block.id]?.enabled && (\n",
    "                        <>\n",
    "                          {/* 启动验证倒计时 - 仅在未启动时显示 */}\n",
    "                          {taskVerifications[block.id]?.status === 'pending' && (\n",
    "                            <StartVerificationCountdown\n",
    "                              taskId={block.id}\n",
    "                              onTimeout={handleStartVerificationTimeout}\n",
    "                              onComplete={() => {}}\n",
    "                              keywords={taskVerifications[block.id]?.startKeywords || []}\n",
    "                              isStarted={taskVerifications[block.id]?.status === 'started'}\n",
    "                            />\n",
    "                          )}\n",
    "                          \n",
    "                          {/* 完成验证倒计时 - 仅在已启动未完成时显示 */}\n",
    "                          {taskVerifications[block.id]?.status === 'started' && (\n",
    "                            <FinishVerificationCountdown\n",
    "                              taskId={block.id}\n",
    "                              estimatedMinutes={block.duration || block.durationMinutes || 30}\n",
    "                              onTimeout={handleFinishVerificationTimeout}\n",
    "                              keywords={taskVerifications[block.id]?.completionKeywords || []}\n",
    "                              isCompleted={block.isCompleted || block.status === 'completed'}\n",
    "                              startTime={taskActualStartTimes[block.id] || taskVerifications[block.id]?.actualStartTime || new Date(block.startTime)}\n",
    "                            />\n",
    "                          )}\n",
    "                        </>\n",
    "                      )}\n",
]

lines = lines[:insert_pos] + new_code + lines[insert_pos:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Step 6 completed: Added countdown components to task cards")

