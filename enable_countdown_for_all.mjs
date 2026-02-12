import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 修改自动触发逻辑：移除验证启用的限制 ===\n');

// 1. 修改自动触发逻辑，移除 verification.enabled 的检查
const oldAutoTrigger = `allTasks.forEach(task => {
        // 只处理已启用验证且未开始的任务
        const verification = taskVerifications[task.id];
        if (!verification || !verification.enabled || verification.status !== 'pending') {
          return;
        }`;

const newAutoTrigger = `allTasks.forEach(task => {
        // 处理所有未开始的任务（无论是否启用验证）
        const verification = taskVerifications[task.id];
        
        // 跳过已经开始或完成的任务
        if (task.status === 'in_progress' || task.status === 'completed' || task.isCompleted) {
          return;
        }
        
        // 如果有验证配置且状态不是 pending，也跳过
        if (verification && verification.status !== 'pending') {
          return;
        }`;

if (content.includes(oldAutoTrigger)) {
  content = content.replace(oldAutoTrigger, newAutoTrigger);
  console.log('✓ 已修改自动触发逻辑，现在所有任务都会自动启动倒计时');
} else {
  console.log('⚠ 未找到旧的自动触发逻辑，可能已经被修改过');
}

// 2. 修改倒计时显示逻辑，移除 verification.enabled 的检查
const oldCountdownDisplay1 = `{/* 自动启动验证倒计时 */}
                    {taskVerifications[block.id]?.enabled && 
                     taskVerifications[block.id]?.status === 'waiting_start' && (`;

const newCountdownDisplay1 = `{/* 自动启动倒计时 - 所有任务都显示 */}
                    {(taskVerifications[block.id]?.status === 'waiting_start' || 
                      (!block.isCompleted && block.status !== 'in_progress' && new Date(block.startTime) <= new Date())) && (`;

if (content.includes(oldCountdownDisplay1)) {
  content = content.replace(oldCountdownDisplay1, newCountdownDisplay1);
  console.log('✓ 已修改启动倒计时显示逻辑');
}

const oldCountdownDisplay2 = `{/* 完成验证倒计时 */}
                    {taskVerifications[block.id]?.enabled && 
                     taskVerifications[block.id]?.status === 'started' && 
                     !block.isCompleted && (`;

const newCountdownDisplay2 = `{/* 任务剩余时间倒计时 - 所有进行中的任务都显示 */}
                    {block.status === 'in_progress' && !block.isCompleted && (`;

if (content.includes(oldCountdownDisplay2)) {
  content = content.replace(oldCountdownDisplay2, newCountdownDisplay2);
  console.log('✓ 已修改完成倒计时显示逻辑');
}

// 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n=== 修改完成 ===\n');
console.log('现在的功能：');
console.log('✅ 所有任务到达设定时间后都会自动显示2分钟启动倒计时');
console.log('✅ 所有进行中的任务都会显示剩余时间倒计时');
console.log('✅ 可以随时点击 Start 按钮提前启动任务');
console.log('✅ 可以随时点击完成按钮提前完成任务');
console.log('✅ 真实的开始和结束时间会被记录');
console.log('\n刷新浏览器即可看到效果！');

