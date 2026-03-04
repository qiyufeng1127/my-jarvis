// ============================================
// 测试脚本：给任务添加超时次数数据
// 在浏览器控制台（F12）中运行此脚本
// ============================================

console.log('🔍 开始添加测试数据...');

// 获取任务存储
const taskStore = JSON.parse(localStorage.getItem('task-storage'));

if (!taskStore || !taskStore.state || !taskStore.state.tasks) {
  console.error('❌ 未找到任务数据');
} else {
  // 找到一个已完成的任务
  const completedTask = taskStore.state.tasks.find(t => t.status === 'completed');
  
  if (!completedTask) {
    console.error('❌ 没有找到已完成的任务，请先完成一个任务');
  } else {
    console.log('✅ 找到已完成的任务:', completedTask.title);
    
    // 添加超时数据
    completedTask.startVerificationTimeout = true;
    completedTask.startTimeoutCount = 3; // 启动超时3次
    completedTask.completionTimeout = true;
    completedTask.completeTimeoutCount = 2; // 完成超时2次
    completedTask.completionEfficiency = 45; // 效率45%
    completedTask.efficiencyLevel = 'poor'; // 效率等级：差
    
    // 保存
    localStorage.setItem('task-storage', JSON.stringify(taskStore));
    
    console.log('✅ 已添加测试数据:');
    console.log('  - 启动超时: 3次');
    console.log('  - 完成超时: 2次');
    console.log('  - 完成效率: 45%');
    console.log('  - 总计超时: 5次');
    console.log('');
    console.log('🔄 正在刷新页面...');
    
    // 刷新页面
    setTimeout(() => {
      location.reload();
    }, 1000);
  }
}

