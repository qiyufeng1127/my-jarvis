import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 修复所有找到的问号
const replacements = {
  // 第310行 - 创作相关
  "if (lowerTitle.includes('�Ĵ�')) return '?';": "if (lowerTitle.includes('创作')) return '✍️';",
  
  // 第319行 - 任务相关
  "if (lowerTitle.includes('分钟')) return '?';": "if (lowerTitle.includes('任务')) return '📋';",
  
  // 第332行 - 默认emoji
  "return '?';": "return '📋';",
  
  // 第2149行 - 按钮状态
  "? '?'": "? '⏳'",
  
  // 第2477行 - 启动按钮
  "{startingTask === block.id ? '?' : '*start'}": "{startingTask === block.id ? '⏳' : '*start'}",
};

// 执行替换
let modified = false;
for (const [oldText, newText] of Object.entries(replacements)) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    console.log(`替换: ${oldText.substring(0, 50)}...`);
    modified = true;
  }
}

if (modified) {
  // 保存文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✓ 所有问号已修复并保存');
} else {
  console.log('未找到需要替换的问号');
}

