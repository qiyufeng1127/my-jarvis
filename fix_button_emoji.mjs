import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 修复按钮上的问号
const replacements = {
  // AI拆解子任务按钮
  "{generatingSubTasks === block.id ? '?' : '?'}": "{generatingSubTasks === block.id ? '⏳' : '🤖'}",
  
  // 其他可能的问号
  "? '?' : '??'": "? '⏳' : '🔍'",
  "? '?' : '?'": "? '⏳' : '📝'",
};

// 执行替换
let modified = false;
for (const [oldText, newText] of Object.entries(replacements)) {
  if (content.includes(oldText)) {
    const count = content.split(oldText).length - 1;
    content = content.split(oldText).join(newText);
    console.log(`替换 (${count}次): ${oldText}`);
    modified = true;
  }
}

if (modified) {
  // 保存文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✓ 按钮emoji已修复并保存');
} else {
  console.log('未找到需要替换的按钮emoji');
}

