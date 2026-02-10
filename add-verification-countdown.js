// 自动添加验证倒计时组件的脚本
import fs from 'fs';

const filePath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 查找插入位置：<div key={block.id}>
const searchPattern = '<div key={block.id}>';
const insertCode = `<div key={block.id}>
              {/* 🔧 零侵入添加：验证倒计时组件（独立模块，高优先级显示） */}
              {block.scheduledStart && new Date() >= new Date(block.scheduledStart) && (
                <TaskVerificationCountdown
                  taskId={block.id}
                  taskTitle={block.title}
                  scheduledStart={block.startTime}
                  scheduledEnd={block.endTime}
                  startPhotoHint={\`请拍摄 \${block.title} 开始的照片\`}
                  endPhotoHint={\`请拍摄 \${block.title} 完成的照片\`}
                />
              )}
              `;

// 替换
if (content.includes(searchPattern)) {
  content = content.replace(searchPattern, insertCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 验证倒计时组件已成功添加！');
  console.log('📍 插入位置：<div key={block.id}>');
} else {
  console.log('❌ 未找到插入位置：<div key={block.id}>');
  console.log('请手动在 NewTimelineView.tsx 中搜索 "<div key={block.id}>" 并在下一行添加组件');
}
