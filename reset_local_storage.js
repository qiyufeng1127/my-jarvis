/**
 * 本地存储数据重置脚本
 * 清空所有组件的本地存储数据
 * 
 * 使用方法：
 * 1. 打开浏览器控制台（F12）
 * 2. 复制此脚本并粘贴到控制台
 * 3. 按回车执行
 */

(function resetAllLocalData() {
  console.log('🔄 开始重置所有本地数据...');

  // 需要清空的 localStorage keys
  const keysToReset = [
    // 任务相关
    'task-storage',
    'task_inbox',
    
    // 成长系统
    'growth-storage',
    'goal-storage',
    
    // 金币经济
    'gold-storage',
    'user-storage',
    
    // 副业追踪
    'side-hustle-storage',
    
    // 记忆/日记
    'memory-storage',
    'journal-storage',
    
    // AI 相关
    'ai-storage',
    'conversation_history',
    
    // 通知
    'notification-storage',
    
    // 其他
    'habit-storage',
    'statistics-storage',
  ];

  // 清空指定的 keys
  let clearedCount = 0;
  keysToReset.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log(`✅ 已清空: ${key}`);
    }
  });

  console.log(`\n📊 总计清空 ${clearedCount} 个存储项`);

  // 可选：清空所有 localStorage（谨慎使用）
  // localStorage.clear();
  // console.log('⚠️ 已清空所有 localStorage');

  // 清空 sessionStorage
  sessionStorage.clear();
  console.log('✅ 已清空 sessionStorage');

  // 清空 IndexedDB（如果使用）
  if (window.indexedDB) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log(`✅ 已清空 IndexedDB: ${db.name}`);
        }
      });
    });
  }

  console.log('\n✨ 数据重置完成！请刷新页面查看效果。');
  console.log('💡 提示：如果数据仍然存在，请尝试清空浏览器缓存。');

  // 询问是否刷新页面
  if (confirm('数据已重置！是否立即刷新页面？')) {
    window.location.reload();
  }
})();

