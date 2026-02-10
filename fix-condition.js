// 修复条件判断 - 使用 startTime 而不是 scheduledStart
import fs from 'fs';

const filePath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 替换所有 block.scheduledStart 为 block.startTime（在条件检查部分）
content = content.replace(
  /const hasScheduledStart = !!block\.scheduledStart;/g,
  'const hasScheduledStart = !!block.startTime;'
);

content = content.replace(
  /const scheduledStartTime = block\.scheduledStart \? new Date\(block\.scheduledStart\) : null;/g,
  'const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;'
);

content = content.replace(
  /scheduledStart: block\.scheduledStart,/g,
  'scheduledStart: block.startTime,'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 所有 block.scheduledStart 已替换为 block.startTime！');
