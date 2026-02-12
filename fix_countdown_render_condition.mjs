import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('修复倒计时组件的渲染条件...\n');

// 找到并替换渲染条件
const oldCondition = `                {/* 🔥 验证倒计时覆盖层 - 在卡片内部 */}
                {(() => {
                  const now = new Date();
                  const hasScheduledStart = !!block.startTime;
                  const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;
                  const isTimeReached = scheduledStartTime ? now >= scheduledStartTime : false;
                  
                  return hasScheduledStart && isTimeReached;
                })() && (`;

const newCondition = `                {/* 🔥 验证倒计时组件 - 只在任务时间范围内且未完成时显示 */}
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

if (content.includes(oldCondition)) {
  content = content.replace(oldCondition, newCondition);
  console.log('✓ 已更新渲染条件');
  console.log('  - 添加了结束时间检查');
  console.log('  - 添加了完成状态检查');
  console.log('  - 只在时间范围内且未完成时显示');
} else {
  console.log('❌ 未找到旧的渲染条件');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✓ 修复完成！');

