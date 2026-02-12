import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 修复编辑任务弹窗中的乱码
const replacements = {
  '?? 金币奖励': '💰 金币奖励',
  '??? 标签': '🏷️ 标签',
  '?? 分钟个': '📋 分钟个',
  '?? 位置': '📍 位置',
  '?? 照片': '📷 照片',
  '?? 关联目标': '🎯 关联目标',
  '个�请分钟分钟个�个�...': '例如：月入5w、坚持100天...',
  '分钟分钟': '任务',
  '分钟�·���ť���ӵ�һ分钟��': '点击下方按钮添加第一个任务',
};

let modified = false;
for (const [oldText, newText] of Object.entries(replacements)) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    console.log(`替换: ${oldText} -> ${newText}`);
    modified = true;
  }
}

if (modified) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✓ 编辑弹窗乱码已修复');
} else {
  console.log('未找到需要替换的乱码');
}

