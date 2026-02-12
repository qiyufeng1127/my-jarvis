import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 调试：查找插入位置 ===\n');

// 搜索多个可能的标记
const markers = [
  'AI正在识别图片内容',
  '验证中遮罩层',
  'verifyingTask === block.id',
];

for (const marker of markers) {
  const index = content.indexOf(marker);
  if (index > 0) {
    console.log(`✓ 找到标记 "${marker}" 在位置: ${index}`);
    
    // 计算行号
    const beforeContent = content.substring(0, index);
    const lineNumber = beforeContent.split('\n').length;
    console.log(`  对应行号: ${lineNumber}`);
  } else {
    console.log(`✗ 未找到标记 "${marker}"`);
  }
}

// 检查是否已经有倒计时代码
const countdownMarkers = [
  '请开始启动',
  '距离任务完成还有',
  '启动倒计时覆盖层',
];

console.log('\n=== 检查倒计时代码是否存在 ===\n');
for (const marker of countdownMarkers) {
  if (content.includes(marker)) {
    console.log(`✓ 找到: ${marker}`);
  } else {
    console.log(`✗ 未找到: ${marker}`);
  }
}

console.log('\n文件总行数:', content.split('\n').length);

