// ============================================
// 任务状态标记调试脚本
// 在浏览器控制台（F12）中运行此脚本
// ============================================

console.log('🔍 开始检查任务状态标记...');

// 1. 获取任务存储
const taskStoreKey = 'task-storage';
const taskStoreData = localStorage.getItem(taskStoreKey);

if (!taskStoreData) {
  console.error('❌ 未找到任务存储数据');
} else {
  const taskStore = JSON.parse(taskStoreData);
  console.log('✅ 任务存储数据:', taskStore);
  
  if (taskStore.state && taskStore.state.tasks) {
    const tasks = taskStore.state.tasks;
    console.log(`📋 共有 ${tasks.length} 个任务`);
    
    // 2. 检查已完成的任务
    const completedTasks = tasks.filter(t => t.status === 'completed');
    console.log(`✅ 已完成任务: ${completedTasks.length} 个`);
    
    // 3. 检查哪些任务有超时标记
    const tasksWithTimeout = tasks.filter(t => 
      t.startVerificationTimeout || t.completionTimeout
    );
    console.log(`⚠️ 有超时标记的任务: ${tasksWithTimeout.length} 个`);
    
    if (tasksWithTimeout.length > 0) {
      console.log('超时任务详情:');
      tasksWithTimeout.forEach(t => {
        console.log(`  - ${t.title}:`, {
          启动超时: t.startVerificationTimeout,
          完成超时: t.completionTimeout,
          完成效率: t.completionEfficiency,
          效率等级: t.efficiencyLevel
        });
      });
    }
    
    // 4. 检查哪些任务有效率数据
    const tasksWithEfficiency = tasks.filter(t => 
      t.completionEfficiency !== undefined
    );
    console.log(`📊 有效率数据的任务: ${tasksWithEfficiency.length} 个`);
    
    if (tasksWithEfficiency.length > 0) {
      console.log('效率任务详情:');
      tasksWithEfficiency.forEach(t => {
        console.log(`  - ${t.title}: ${t.completionEfficiency}% (${t.efficiencyLevel || '未设置'})`);
      });
    }
    
    // 5. 如果没有测试数据，提供添加测试数据的代码
    if (tasksWithTimeout.length === 0 && tasksWithEfficiency.length === 0) {
      console.log('\n💡 没有找到超时或效率数据，你可以运行以下代码添加测试数据：\n');
      console.log(`
// 给第一个已完成的任务添加测试标记
const taskStore = JSON.parse(localStorage.getItem('task-storage'));
const completedTask = taskStore.state.tasks.find(t => t.status === 'completed');

if (completedTask) {
  completedTask.startVerificationTimeout = true;  // 启动超时
  completedTask.completionTimeout = false;        // 完成未超时
  completedTask.completionEfficiency = 45;        // 低效率 45%
  completedTask.efficiencyLevel = 'poor';         // 效率等级：差
  
  localStorage.setItem('task-storage', JSON.stringify(taskStore));
  console.log('✅ 已添加测试数据到任务:', completedTask.title);
  console.log('🔄 请刷新页面查看效果');
  location.reload();
} else {
  console.log('❌ 没有找到已完成的任务');
}
      `);
    } else {
      console.log('\n✅ 已找到测试数据，标记应该会显示');
      console.log('🔄 如果看不到标记，请刷新页面');
    }
  }
}

console.log('\n📝 调试完成！');

