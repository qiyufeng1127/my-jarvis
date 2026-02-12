import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// Emoji相关的乱码映射
const replacements = {
  // 根据搜索结果修复emoji
  "if (lowerTitle.includes('����')) return '???';": "if (lowerTitle.includes('拍照')) return '📷';",
  "if (lowerTitle.includes('����')) return '???';": "if (lowerTitle.includes('摄影')) return '📸';",
  "if (lowerTitle.includes('��?') || lowerTitle.includes('����')) return '??';": "if (lowerTitle.includes('视频') || lowerTitle.includes('剪辑')) return '🎬';",
  "if (lowerTitle.includes('?��')) return '???';": "if (lowerTitle.includes('相机')) return '📷';",
  "if (lowerTitle.includes('����') || lowerTitle.includes('����')) return '??';": "if (lowerTitle.includes('运动') || lowerTitle.includes('健身')) return '💪';",
  "if (lowerTitle.includes('����')) return '???';": "if (lowerTitle.includes('跑步')) return '🏃';",
  "if (lowerTitle.includes('����') || lowerTitle.includes('��?')) return '??';": "if (lowerTitle.includes('学习') || lowerTitle.includes('读书')) return '📚';",
  "if (lowerTitle.includes('����') || lowerTitle.includes('��?')) return '??';": "if (lowerTitle.includes('工作') || lowerTitle.includes('办公')) return '💼';",
  "if (lowerTitle.includes('������')) return '??';": "if (lowerTitle.includes('会议')) return '👥';",
  "if (lowerTitle.includes('����')) return '??';": "if (lowerTitle.includes('编程')) return '💻';",
  "if (lowerTitle.includes('����')) return '??';": "if (lowerTitle.includes('写作')) return '✍️';",
  "if (lowerTitle.includes('??') || lowerTitle.includes('����')) return '??';": "if (lowerTitle.includes('吃饭') || lowerTitle.includes('用餐')) return '🍽️';",
  "if (lowerTitle.includes('?��?')) return '??';": "if (lowerTitle.includes('做饭')) return '🍳';",
  "if (lowerTitle.includes('�ո�')) return '??';": "if (lowerTitle.includes('瑜伽')) return '🧘';",
  "if (lowerTitle.includes('?��?') || lowerTitle.includes('����')) return '??';": "if (lowerTitle.includes('冥想') || lowerTitle.includes('打坐')) return '🧘';",
  "if (lowerTitle.includes('???') || lowerTitle.includes('����')) return '??';": "if (lowerTitle.includes('睡觉') || lowerTitle.includes('休息')) return '😴';",
  "if (lowerTitle.includes('???')) return '???';": "if (lowerTitle.includes('购物')) return '🛍️';",
  "if (lowerTitle.includes('?��')) return '??';": "if (lowerTitle.includes('旅行')) return '✈️';",
  "if (lowerTitle.includes('ins')) return '??';": "if (lowerTitle.includes('ins')) return '📱';",
  "if (lowerTitle.includes('��?')) return '??';": "if (lowerTitle.includes('社交')) return '👥';",
  
  // 修复其他可能的emoji显示
  "'???'": "'📷'",
  "'??'": "'💼'",
};

// 执行替换
let modified = false;
for (const [oldText, newText] of Object.entries(replacements)) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    console.log(`替换: ${oldText.substring(0, 40)}...`);
    modified = true;
  }
}

if (modified) {
  // 保存文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✓ Emoji乱码已修复并保存');
} else {
  console.log('未找到需要替换的emoji乱码');
}

