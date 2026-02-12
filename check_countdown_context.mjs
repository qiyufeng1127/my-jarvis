import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== 检查倒计时代码的上下文 ===\n');

// 从1993行往前看，找到它所在的父级结构
for (let i = 1993; i >= Math.max(0, 1993-50); i--) {
  const line = lines[i-1];
  if (line.includes('任务卡片主体') || 
      line.includes('data-task-id') ||
      line.includes('className=') && line.includes('rounded-2xl')) {
    console.log(`第 ${i} 行: ${line.trim().substring(0, 80)}`);
  }
}

console.log('\n=== 检查倒计时是否在卡片内部 ===\n');

// 检查1993行前后的结构
for (let i = 1980; i < 2000; i++) {
  const line = lines[i-1];
  if (line.includes('div') || line.includes('验证') || line.includes('遮罩')) {
    console.log(`第 ${i} 行: ${line.trim().substring(0, 100)}`);
  }
}

