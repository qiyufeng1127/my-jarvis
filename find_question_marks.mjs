import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 查找所有包含单个问号的地方
const lines = content.split('\n');
let foundLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 查找包含 '?' 的行（排除注释和已经是emoji的）
  if (line.includes("'?'") && !line.includes('//') && !line.includes('⏳') && !line.includes('🤖')) {
    foundLines.push({
      lineNum: i + 1,
      content: line.trim()
    });
  }
}

console.log('找到包含单个问号的行：');
foundLines.forEach(item => {
  console.log(`第${item.lineNum}行: ${item.content.substring(0, 100)}`);
});

console.log(`\n共找到 ${foundLines.length} 处需要修复的问号`);

