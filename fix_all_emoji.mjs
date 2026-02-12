import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 按行读取并修复
const lines = content.split('\n');
let modified = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 修复第940行 - 启动验证关键词显示
  if (line.includes('<span class="text-2xl">??</span>')) {
    lines[i] = line.replace('<span class="text-2xl">??</span>', '<span class="text-2xl">🔍</span>');
    console.log(`第${i+1}行: 修复启动验证关键词emoji`);
    modified = true;
  }
  
  // 修复第2106行 - 启用/编辑验证按钮
  if (line.includes('text-base\'}`}>??</span>') && line.includes('2106')) {
    lines[i] = line.replace('>??</span>', '>🔐</span>');
    console.log(`第${i+1}行: 修复验证按钮emoji`);
    modified = true;
  }
  
  // 修复所有包含 >??</span> 的行
  if (line.includes('>??</span>')) {
    // 根据上下文判断应该是什么emoji
    if (line.includes('AI') || line.includes('拆解') || line.includes('generatingSubTasks')) {
      lines[i] = line.replace('>??</span>', '>🤖</span>');
      console.log(`第${i+1}行: 修复AI按钮emoji`);
    } else if (line.includes('验证') || line.includes('verification')) {
      lines[i] = line.replace('>??</span>', '>🔐</span>');
      console.log(`第${i+1}行: 修复验证按钮emoji`);
    } else if (line.includes('笔记') || line.includes('附件') || line.includes('note')) {
      lines[i] = line.replace('>??</span>', '>📝</span>');
      console.log(`第${i+1}行: 修复笔记按钮emoji`);
    } else if (line.includes('金币') || line.includes('gold')) {
      lines[i] = line.replace('>??</span>', '>💰</span>');
      console.log(`第${i+1}行: 修复金币emoji`);
    } else {
      lines[i] = line.replace('>??</span>', '>📋</span>');
      console.log(`第${i+1}行: 修复通用emoji`);
    }
    modified = true;
  }
}

if (modified) {
  // 保存文件
  content = lines.join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✓ 所有按钮emoji已修复并保存');
} else {
  console.log('未找到需要替换的emoji');
}

