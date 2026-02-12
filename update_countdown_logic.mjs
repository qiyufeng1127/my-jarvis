import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('开始修改 NewTimelineView.tsx...\n');

// 1. 修改 import 语句，使用优化后的组件
content = content.replace(
  "import TaskVerificationCountdown from './TaskVerificationCountdown';",
  "import TaskVerificationCountdownContent from './TaskVerificationCountdownContent';"
);

// 2. 找到 TaskVerificationCountdown 的使用位置并添加 onComplete 回调
const oldUsage = `<TaskVerificationCountdown
                     taskId={block.id}
                     taskTitle={block.title}
                     scheduledStart={block.startTime}
                     scheduledEnd={block.endTime}
                     startPhotoHint={\`请拍摄 \${block.title} 的开始照片\`}
                     endPhotoHint={\`请拍摄 \${block.title} 的完成照片\`}
                     cardColor={block.color}
                     hasVerification={!!taskVerifications[block.id]?.enabled}
                     startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
                     completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
                   />`;

const newUsage = `<TaskVerificationCountdownContent
                     taskId={block.id}
                     taskTitle={block.title}
                     scheduledStart={block.startTime}
                     scheduledEnd={block.endTime}
                     onComplete={(actualEndTime) => {
                       // 更新任务的实际结束时间
                       console.log('✅ 任务完成，更新结束时间:', actualEndTime);
                       onTaskUpdate(block.id, {
                         endTime: actualEndTime,
                         isCompleted: true,
                         status: 'completed'
                       });
                     }}
                     hasVerification={!!taskVerifications[block.id]?.enabled}
                     startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
                     completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
                   />`;

// 由于可能有编码问题，我们用更灵活的方式替换
const lines = content.split('\n');
let inCountdown = false;
let countdownStart = -1;
let countdownEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<TaskVerificationCountdown')) {
    inCountdown = true;
    countdownStart = i;
  }
  if (inCountdown && lines[i].includes('/>')) {
    countdownEnd = i;
    break;
  }
}

if (countdownStart !== -1 && countdownEnd !== -1) {
  console.log(`找到 TaskVerificationCountdown 在第 ${countdownStart + 1} 到 ${countdownEnd + 1} 行`);
  
  // 替换这些行
  const newLines = [
    '                  <TaskVerificationCountdownContent',
    '                     taskId={block.id}',
    '                     taskTitle={block.title}',
    '                     scheduledStart={block.startTime}',
    '                     scheduledEnd={block.endTime}',
    '                     onComplete={(actualEndTime) => {',
    '                       // 更新任务的实际结束时间',
    '                       console.log(\'✅ 任务完成，更新结束时间:\', actualEndTime);',
    '                       onTaskUpdate(block.id, {',
    '                         endTime: actualEndTime,',
    '                         isCompleted: true,',
    '                         status: \'completed\'',
    '                       });',
    '                     }}',
    '                     hasVerification={!!taskVerifications[block.id]?.enabled}',
    '                     startKeywords={taskVerifications[block.id]?.startKeywords || [\'启动\', \'开始\']}',
    '                     completeKeywords={taskVerifications[block.id]?.completionKeywords || [\'完成\', \'结束\']}',
    '                   />'
  ];
  
  lines.splice(countdownStart, countdownEnd - countdownStart + 1, ...newLines);
  content = lines.join('\n');
  
  console.log('✓ 已替换 TaskVerificationCountdown 为 TaskVerificationCountdownContent');
  console.log('✓ 已添加 onComplete 回调来更新任务结束时间');
} else {
  console.log('❌ 未找到 TaskVerificationCountdown 组件');
}

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✓ 修改完成！');

