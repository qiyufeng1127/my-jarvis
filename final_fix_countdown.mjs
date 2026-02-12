import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 最终修复：确保倒计时正确触发 ===\n');

// 问题分析：
// 1. 自动触发逻辑可能没有正确更新状态
// 2. 倒计时覆盖层的显示条件可能太严格

// 修复1：简化倒计时显示条件
const oldStartCountdown = `{/* 启动倒计时覆盖层 - 到达时间后自动显示2分钟倒计时 */}
                {(() => {
                  // 条件1：任务未完成且未进行中
                  if (block.isCompleted || block.status === 'in_progress') return null;
                  
                  const now = new Date();
                  const startTime = new Date(block.startTime);
                  const timeDiff = now.getTime() - startTime.getTime();
                  
                  // 条件2：已到达开始时间且在2分钟内
                  if (timeDiff < 0 || timeDiff >= 120000) return null;`;

const newStartCountdown = `{/* 启动倒计时覆盖层 - 到达时间后自动显示2分钟倒计时 */}
                {(() => {
                  // 简化条件：只要未完成且未进行中，就检查时间
                  if (block.isCompleted || block.status === 'in_progress') return null;
                  
                  const now = new Date();
                  const startTime = new Date(block.startTime);
                  const timeDiff = now.getTime() - startTime.getTime();
                  
                  // 已到达开始时间且在2分钟内（允许负1秒的误差）
                  if (timeDiff < -1000 || timeDiff >= 120000) return null;
                  
                  console.log('🎯 显示启动倒计时:', block.title, '时间差:', Math.floor(timeDiff/1000), '秒');`;

if (content.includes(oldStartCountdown)) {
  content = content.replace(oldStartCountdown, newStartCountdown);
  console.log('✓ 已简化启动倒计时显示条件');
} else {
  console.log('⚠ 未找到启动倒计时代码，尝试其他方法...');
}

// 修复2：确保自动触发逻辑正确更新状态
const oldAutoTrigger = `// 如果到达或超过开始时间（允许1秒误差），自动启动倒计时
        if (timeDiff >= -1000 && timeDiff < 60000) { // 1分钟内
          console.log(\`⏰ 任务 "\${task.title}" 到达设定时间，自动启动倒计时\`);
          
          // 更新验证状态为等待启动
          setTaskVerifications(prev => ({
            ...prev,
            [task.id]: {
              ...prev[task.id],
              status: 'waiting_start',
            },
          }));
        }`;

const newAutoTrigger = `// 如果到达或超过开始时间，自动启动倒计时
        if (timeDiff >= -1000 && timeDiff < 120000) { // 2分钟内
          console.log(\`⏰ 任务 "\${task.title}" 到达设定时间，时间差: \${Math.floor(timeDiff/1000)}秒\`);
          
          // 注意：不需要更新状态，倒计时覆盖层会自动显示
          // 因为覆盖层的显示条件只依赖时间判断
        }`;

if (content.includes(oldAutoTrigger)) {
  content = content.replace(oldAutoTrigger, newAutoTrigger);
  console.log('✓ 已优化自动触发逻辑');
}

// 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n=== 修复完成 ===\n');
console.log('修复内容：');
console.log('1. 简化了倒计时显示条件，更容易触发');
console.log('2. 添加了调试日志，方便查看触发情况');
console.log('3. 移除了不必要的状态更新');
console.log('\n请刷新浏览器，打开控制台查看日志');
console.log('如果看到 "🎯 显示启动倒计时" 日志，说明倒计时已触发');

