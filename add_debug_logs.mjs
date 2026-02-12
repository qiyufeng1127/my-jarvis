import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 添加调试日志到倒计时代码 ===\n');

// 在倒计时代码中添加console.log
const oldCode = `{/* 启动倒计时覆盖层 */}
                {(() => {
                  if (block.isCompleted || block.status === 'in_progress') return null;
                  
                  const now = new Date();
                  const startTime = new Date(block.startTime);
                  const timeDiff = now.getTime() - startTime.getTime();
                  
                  if (timeDiff < -1000 || timeDiff >= 120000) return null;`;

const newCode = `{/* 启动倒计时覆盖层 */}
                {(() => {
                  console.log('🔍 检查倒计时:', {
                    taskId: block.id,
                    title: block.title,
                    isCompleted: block.isCompleted,
                    status: block.status,
                    startTime: block.startTime,
                  });
                  
                  if (block.isCompleted || block.status === 'in_progress') {
                    console.log('❌ 倒计时不显示: 任务已完成或进行中');
                    return null;
                  }
                  
                  const now = new Date();
                  const startTime = new Date(block.startTime);
                  const timeDiff = now.getTime() - startTime.getTime();
                  
                  console.log('⏰ 时间差:', Math.floor(timeDiff/1000), '秒');
                  
                  if (timeDiff < -1000 || timeDiff >= 120000) {
                    console.log('❌ 倒计时不显示: 时间差不在范围内');
                    return null;
                  }
                  
                  console.log('✅ 显示启动倒计时!');`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('✓ 已添加调试日志');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ 文件已保存');
  console.log('\n刷新浏览器并打开控制台，查看调试日志');
} else {
  console.log('❌ 未找到要替换的代码');
}

