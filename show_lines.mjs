import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== 显示第1950-2010行的代码 ===\n');

for (let i = 1950; i < 2010; i++) {
  const line = lines[i];
  const lineNum = (i + 1).toString().padStart(4, ' ');
  console.log(`${lineNum}: ${line}`);
}

