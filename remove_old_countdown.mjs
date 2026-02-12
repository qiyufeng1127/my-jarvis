import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('清理旧的倒计时组件引用...\n');

// 1. 删除 import 语句
const oldImports = [
  "import StartVerificationCountdown from '@/components/countdown/StartVerificationCountdown';",
  "import FinishVerificationCountdown from '@/components/countdown/FinishVerificationCountdown';"
];

oldImports.forEach(imp => {
  if (content.includes(imp)) {
    content = content.replace(imp + '\n', '');
    console.log('✓ 删除 import:', imp.split(' ')[1]);
  }
});

// 2. 查找并删除这些组件的使用
const lines = content.split('\n');
let newLines = [];
let skipUntil = -1;

for (let i = 0; i < lines.length; i++) {
  if (i < skipUntil) continue;
  
  const line = lines[i];
  
  // 检查是否是旧倒计时组件的开始
  if (line.includes('<StartVerificationCountdown') || line.includes('<FinishVerificationCountdown')) {
    console.log(`✓ 删除组件使用在第 ${i+1} 行`);
    
    // 找到组件的结束位置
    let depth = 0;
    let foundEnd = false;
    
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('<StartVerificationCountdown') || lines[j].includes('<FinishVerificationCountdown')) {
        depth++;
      }
      if (lines[j].includes('/>') || lines[j].includes('</StartVerificationCountdown>') || lines[j].includes('</FinishVerificationCountdown>')) {
        depth--;
        if (depth === 0) {
          skipUntil = j + 1;
          foundEnd = true;
          break;
        }
      }
    }
    
    if (!foundEnd) {
      // 单行组件
      skipUntil = i + 1;
    }
    
    continue;
  }
  
  newLines.push(line);
}

content = newLines.join('\n');

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✓ 清理完成！');
console.log('已删除所有旧的倒计时组件引用');

