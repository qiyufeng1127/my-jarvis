import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('修复 NewTimelineView.tsx 中的乱码...\n');

// 修复 TaskVerificationCountdownContent 使用处的乱码
const oldCode = `                   <TaskVerificationCountdownContent
                     taskId={block.id}
                     taskTitle={block.title}
                     scheduledStart={block.startTime}
                     scheduledEnd={block.endTime}
                     onComplete={(actualEndTime) => {
                       // ���������ʵ�ʽ���ʱ��
                       console.log('? ������ɣ����½���ʱ��:', actualEndTime);
                       onTaskUpdate(block.id, {
                         endTime: actualEndTime,
                         isCompleted: true,
                         status: 'completed'
                       });
                     }}
                     hasVerification={!!taskVerifications[block.id]?.enabled}
                     startKeywords={taskVerifications[block.id]?.startKeywords || ['����', '��ʼ']}
                     completeKeywords={taskVerifications[block.id]?.completionKeywords || ['���', '����']}
                   />`;

const newCode = `                   <TaskVerificationCountdownContent
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

if (content.includes('TaskVerificationCountdownContent')) {
  // 使用行替换方式
  const lines = content.split('\n');
  let startLine = -1;
  let endLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<TaskVerificationCountdownContent')) {
      startLine = i;
    }
    if (startLine !== -1 && lines[i].includes('/>')) {
      endLine = i;
      break;
    }
  }
  
  if (startLine !== -1 && endLine !== -1) {
    console.log(`找到组件使用在第 ${startLine + 1} 到 ${endLine + 1} 行`);
    
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
    
    lines.splice(startLine, endLine - startLine + 1, ...newLines);
    content = lines.join('\n');
    
    console.log('✓ 已修复乱码');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✓ 修复完成！');

