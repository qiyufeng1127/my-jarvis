import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== 检查倒计时代码的位置 ===\n');

// 找到倒计时代码
let countdownLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('启动倒计时覆盖层')) {
    countdownLine = i + 1;
    break;
  }
}

console.log(`倒计时代码在第 ${countdownLine} 行`);

// 往前找，看它是否在 timeBlocks.map 内
let inMap = false;
let mapLine = -1;
for (let i = countdownLine - 1; i >= Math.max(0, countdownLine - 200); i--) {
  if (lines[i].includes('timeBlocks.map') || lines[i].includes('{timeBlocks.map')) {
    inMap = true;
    mapLine = i + 1;
    break;
  }
}

if (inMap) {
  console.log(`✓ 倒计时代码在 timeBlocks.map 内（map在第 ${mapLine} 行）`);
} else {
  console.log(`❌ 倒计时代码不在 timeBlocks.map 内！`);
}

// 检查倒计时代码是否在卡片div内
let inCardDiv = false;
for (let i = countdownLine - 1; i >= Math.max(0, countdownLine - 50); i--) {
  if (lines[i].includes('data-task-id={block.id}')) {
    inCardDiv = true;
    console.log(`✓ 倒计时代码在卡片div内（data-task-id在第 ${i+1} 行）`);
    break;
  }
}

if (!inCardDiv) {
  console.log(`❌ 倒计时代码不在卡片div内！`);
}

// 显示倒计时代码前后的结构
console.log('\n=== 倒计时代码前后的结构 ===\n');
for (let i = Math.max(0, countdownLine - 10); i < Math.min(lines.length, countdownLine + 5); i++) {
  const line = lines[i];
  const indent = line.match(/^\s*/)[0].length;
  console.log(`${i+1} (缩进${indent}): ${line.trim().substring(0, 80)}`);
}

