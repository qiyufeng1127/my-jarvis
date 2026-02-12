import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('删除第23和24行的import语句...\n');

// 删除第23和24行（索引22和23）
const newLines = lines.filter((line, i) => {
  if (i === 22 || i === 23) {
    console.log(`删除第 ${i+1} 行: ${line.trim()}`);
    return false;
  }
  return true;
});

content = newLines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✓ 删除完成！');

