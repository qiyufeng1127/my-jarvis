import fs from 'fs';
import path from 'path';

// 搜索所有 .tsx 和 .ts 文件
function searchInDirectory(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      results.push(...searchInDirectory(filePath, pattern));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(pattern)) {
        results.push(filePath);
      }
    }
  }
  
  return results;
}

console.log('搜索 TaskCountdown 的使用...\n');
const results = searchInDirectory('src', 'TaskCountdown');

if (results.length === 0) {
  console.log('✓ TaskCountdown 未被使用，可以删除');
} else {
  console.log('TaskCountdown 被以下文件使用:');
  results.forEach(f => console.log('  -', f));
}

