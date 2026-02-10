// 在 timeBlocks.map 前添加日志
import fs from 'fs';

const filePath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldPattern = `{timeBlocks.map((block, index) => {`;

const newPattern = `{console.log('📊 [timeBlocks] 总数:', timeBlocks.length, '任务:', timeBlocks.map(b => b.title))}
        {timeBlocks.map((block, index) => {`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ timeBlocks 日志已添加！');
} else {
  console.log('❌ 未找到 timeBlocks.map');
}

