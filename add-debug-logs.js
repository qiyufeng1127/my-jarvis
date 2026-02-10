// 添加调试日志的脚本
import fs from 'fs';

const filePath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 查找并替换（注意空格数量）
const oldPattern = `{block.scheduledStart && new Date() >= new Date(block.scheduledStart) && (
                <TaskVerificationCountdown`;

const newPattern = `{(() => {
                const now = new Date();
                const hasScheduledStart = !!block.scheduledStart;
                const scheduledStartTime = block.scheduledStart ? new Date(block.scheduledStart) : null;
                const isTimeReached = scheduledStartTime ? now >= scheduledStartTime : false;
                
                console.log('🔍 [条件检查] 任务:', block.title, {
                  hasScheduledStart,
                  scheduledStart: block.scheduledStart,
                  scheduledStartTime: scheduledStartTime?.toLocaleString(),
                  now: now.toLocaleString(),
                  isTimeReached,
                  willRenderComponent: hasScheduledStart && isTimeReached
                });
                
                return hasScheduledStart && isTimeReached;
              })() && (
                <TaskVerificationCountdown`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 调试日志已添加！');
} else {
  // 尝试查找是否存在
  if (content.includes('block.scheduledStart')) {
    console.log('⚠️ 找到 block.scheduledStart，但格式不匹配');
    console.log('让我尝试另一种方式...');
    
    // 尝试更宽松的匹配
    const regex = /\{block\.scheduledStart && new Date\(\) >= new Date\(block\.scheduledStart\) && \(\s*<TaskVerificationCountdown/;
    if (regex.test(content)) {
      content = content.replace(regex, `{(() => {
                const now = new Date();
                const hasScheduledStart = !!block.scheduledStart;
                const scheduledStartTime = block.scheduledStart ? new Date(block.scheduledStart) : null;
                const isTimeReached = scheduledStartTime ? now >= scheduledStartTime : false;
                
                console.log('🔍 [条件检查] 任务:', block.title, {
                  hasScheduledStart,
                  scheduledStart: block.scheduledStart,
                  scheduledStartTime: scheduledStartTime?.toLocaleString(),
                  now: now.toLocaleString(),
                  isTimeReached,
                  willRenderComponent: hasScheduledStart && isTimeReached
                });
                
                return hasScheduledStart && isTimeReached;
              })() && (
                <TaskVerificationCountdown`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ 调试日志已添加（使用正则匹配）！');
    } else {
      console.log('❌ 正则匹配也失败了');
    }
  } else {
    console.log('❌ 完全未找到 block.scheduledStart');
  }
}
