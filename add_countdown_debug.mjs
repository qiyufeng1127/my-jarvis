import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('添加调试日志...\n');

const oldCode = `                {/* 🔥 验证倒计时组件 - 只在任务时间范围内且未完成时显示 */}
                {(() => {
                  const now = new Date();
                  const hasScheduledStart = !!block.startTime;
                  const hasScheduledEnd = !!block.endTime;
                  const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;
                  const scheduledEndTime = block.endTime ? new Date(block.endTime) : null;
                  const isInTimeRange = scheduledStartTime && scheduledEndTime && 
                                       now >= scheduledStartTime && 
                                       now < scheduledEndTime;
                  const isNotCompleted = !block.isCompleted;
                  
                  return hasScheduledStart && hasScheduledEnd && isInTimeRange && isNotCompleted;
                })() && (`;

const newCode = `                {/* 🔥 验证倒计时组件 - 只在任务时间范围内且未完成时显示 */}
                {(() => {
                  const now = new Date();
                  const hasScheduledStart = !!block.startTime;
                  const hasScheduledEnd = !!block.endTime;
                  const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;
                  const scheduledEndTime = block.endTime ? new Date(block.endTime) : null;
                  const isInTimeRange = scheduledStartTime && scheduledEndTime && 
                                       now >= scheduledStartTime && 
                                       now < scheduledEndTime;
                  const isNotCompleted = !block.isCompleted;
                  
                  // 调试日志
                  if (block.title === '洗漱') {
                    console.log('🔍 倒计时渲染检查:', {
                      title: block.title,
                      now: now.toLocaleTimeString(),
                      startTime: scheduledStartTime?.toLocaleTimeString(),
                      endTime: scheduledEndTime?.toLocaleTimeString(),
                      hasScheduledStart,
                      hasScheduledEnd,
                      isInTimeRange,
                      isNotCompleted,
                      shouldRender: hasScheduledStart && hasScheduledEnd && isInTimeRange && isNotCompleted
                    });
                  }
                  
                  return hasScheduledStart && hasScheduledEnd && isInTimeRange && isNotCompleted;
                })() && (`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('✓ 已添加调试日志');
} else {
  console.log('❌ 未找到目标代码');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✓ 完成！');

