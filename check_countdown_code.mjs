import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== 查找倒计时代码的具体位置 ===\n');

// 查找启动倒计时
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('启动倒计时覆盖层')) {
    console.log(`找到启动倒计时在第 ${i+1} 行`);
    console.log('前后代码：');
    for (let j = Math.max(0, i-2); j < Math.min(lines.length, i+10); j++) {
      console.log(`${j+1}: ${lines[j].substring(0, 100)}`);
    }
    break;
  }
}

console.log('\n=== 检查倒计时显示条件 ===\n');

// 查找条件判断
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('if (block.isCompleted || block.status')) {
    console.log(`找到条件判断在第 ${i+1} 行:`);
    console.log(lines[i]);
    console.log(lines[i+1]);
    console.log(lines[i+2]);
    break;
  }
}

console.log('\n=== 检查时间判断 ===\n');

// 查找时间判断
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('timeDiff < -1000 || timeDiff >= 120000')) {
    console.log(`找到时间判断在第 ${i+1} 行:`);
    console.log(lines[i]);
    break;
  }
}

