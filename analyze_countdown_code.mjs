import fs from 'fs';
import path from 'path';

console.log('=== 分析倒计时相关代码 ===\n');

// 1. 检查所有倒计时组件文件
const calendarDir = 'src/components/calendar';
const files = fs.readdirSync(calendarDir);
const countdownFiles = files.filter(f => f.toLowerCase().includes('countdown'));

console.log('1. 倒计时组件文件：');
countdownFiles.forEach(f => {
  console.log(`   - ${f}`);
});

// 2. 检查 NewTimelineView.tsx 中的倒计时相关代码
console.log('\n2. 检查 NewTimelineView.tsx 中的倒计时代码：');
const timelineContent = fs.readFileSync('src/components/calendar/NewTimelineView.tsx', 'utf8');
const lines = timelineContent.split('\n');

// 查找 import 语句
console.log('\n   Import 语句：');
lines.forEach((line, i) => {
  if (line.match(/import.*countdown/i)) {
    console.log(`   ${i+1}: ${line.trim()}`);
  }
});

// 查找使用倒计时的地方
console.log('\n   使用倒计时组件的地方：');
let inCountdownUsage = false;
let startLine = -1;
lines.forEach((line, i) => {
  if (line.match(/<.*Countdown/i)) {
    inCountdownUsage = true;
    startLine = i;
  }
  if (inCountdownUsage) {
    console.log(`   ${i+1}: ${line.trim()}`);
    if (line.includes('/>') || line.includes('</')) {
      inCountdownUsage = false;
    }
  }
});

// 查找内联的倒计时逻辑（状态、函数等）
console.log('\n   倒计时相关的状态和函数：');
lines.forEach((line, i) => {
  if (line.match(/countdown|倒计时/i) && !line.includes('import') && !line.includes('<')) {
    console.log(`   ${i+1}: ${line.trim()}`);
  }
});

console.log('\n=== 分析完成 ===');

