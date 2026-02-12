import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
const content = fs.readFileSync(filePath, 'utf8');

console.log('修复编码问题...\n');

let fixed = content;

// 修复已知的乱码模式
const fixes = [
  { from: /\?\?\?\?\?\? (.*?) \?\?\?\?\?\?\?\?/g, to: '请拍摄 $1 的开始照片' },
  { from: /\?\?\?\?\?\? (.*?) \?\?\?\?\?\?\?/g, to: '请拍摄 $1 的完成照片' },
  { from: /startPhotoHint=\{`\?\?\?\?\?\? \$\{block\.title\} \?\?\?\?\?\?\?\?`\}/g, to: 'startPhotoHint={`请拍摄 ${block.title} 的开始照片`}' },
  { from: /endPhotoHint=\{`\?\?\?\?\?\? \$\{block\.title\} \?\?\?\?\?\?\?`\}/g, to: 'endPhotoHint={`请拍摄 ${block.title} 的完成照片`}' },
];

fixes.forEach(fix => {
  const before = fixed;
  fixed = fixed.replace(fix.from, fix.to);
  if (before !== fixed) {
    console.log(`✓ 修复了模式: ${fix.from}`);
  }
});

// 写回文件
fs.writeFileSync(filePath, fixed, 'utf8');

console.log('\n✓ 编码修复完成！');

