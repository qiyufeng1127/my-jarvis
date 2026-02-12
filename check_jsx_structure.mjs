import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== 检查倒计时代码是否在正确的JSX结构中 ===\n');

// 从1993行往前看，找到它的父级JSX元素
for (let i = 1992; i >= 1950; i--) {
  const line = lines[i];
  if (line.includes('<div') || line.includes('</div>') || line.includes('>')) {
    console.log(`${i+1}: ${line.trim().substring(0, 100)}`);
  }
}

console.log('\n=== 关键问题：倒计时是否在卡片主体div内？ ===\n');

// 找到卡片主体div
let cardDivLine = -1;
for (let i = 1950; i < 1970; i++) {
  if (lines[i].includes('data-task-id={block.id}')) {
    cardDivLine = i;
    console.log(`卡片主体div在第 ${i+1} 行`);
    break;
  }
}

// 找到这个div的结束
let braceCount = 0;
let foundStart = false;
for (let i = cardDivLine; i < Math.min(lines.length, cardDivLine + 500); i++) {
  const line = lines[i];
  
  if (line.includes('<div') || line.includes('<button') || line.includes('</')) {
    braceCount += (line.match(/<[^/]/g) || []).length;
    braceCount -= (line.match(/<\//g) || []).length;
  }
  
  if (i === cardDivLine) foundStart = true;
  
  if (foundStart && i > cardDivLine + 10 && line.trim() === '</div>') {
    // 检查这是否是卡片主体div的结束
    const indent = line.match(/^\s*/)[0].length;
    const cardIndent = lines[cardDivLine].match(/^\s*/)[0].length;
    
    if (indent === cardIndent) {
      console.log(`卡片主体div结束在第 ${i+1} 行`);
      console.log(`倒计时代码在第 1993 行`);
      
      if (i + 1 >= 1993) {
        console.log('✓ 倒计时代码在卡片主体div内');
      } else {
        console.log('❌ 倒计时代码在卡片主体div外！');
      }
      break;
    }
  }
}

