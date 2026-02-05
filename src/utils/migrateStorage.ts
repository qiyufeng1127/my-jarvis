/**
 * 数据迁移工具
 * 将旧的存储 key 迁移到新的存储 key，防止数据丢失
 */

interface MigrationMap {
  oldKey: string;
  newKey: string;
  description: string;
}

const MIGRATIONS: MigrationMap[] = [
  {
    oldKey: 'tasks-storage',
    newKey: 'manifestos-tasks-storage',
    description: '任务数据',
  },
  {
    oldKey: 'gold-storage',
    newKey: 'manifestos-gold-storage',
    description: '金币数据',
  },
  {
    oldKey: 'goals-storage',
    newKey: 'manifestos-goals-storage',
    description: '目标数据',
  },
  {
    oldKey: 'ai-config-storage',
    newKey: 'manifestos-ai-config-storage',
    description: 'AI 配置',
  },
  {
    oldKey: 'user-storage',
    newKey: 'manifestos-user-storage',
    description: '用户数据',
  },
  {
    oldKey: 'supabase.auth.token',
    newKey: 'manifestos-auth-token',
    description: '登录凭证',
  },
];

/**
 * 执行数据迁移
 */
export function migrateStorage(): void {
  console.log('🔄 开始数据迁移...');
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  MIGRATIONS.forEach(({ oldKey, newKey, description }) => {
    try {
      // 检查新 key 是否已存在
      const newData = localStorage.getItem(newKey);
      if (newData) {
        console.log(`⏭️ 跳过 ${description}：新数据已存在`);
        skippedCount++;
        return;
      }
      
      // 检查旧 key 是否存在
      const oldData = localStorage.getItem(oldKey);
      if (!oldData) {
        console.log(`⏭️ 跳过 ${description}：旧数据不存在`);
        skippedCount++;
        return;
      }
      
      // 迁移数据
      localStorage.setItem(newKey, oldData);
      console.log(`✅ 已迁移 ${description}: ${oldKey} → ${newKey}`);
      migratedCount++;
      
      // 可选：删除旧数据（暂时保留，以防万一）
      // localStorage.removeItem(oldKey);
    } catch (error) {
      console.error(`❌ 迁移 ${description} 失败:`, error);
    }
  });
  
  console.log(`🎉 数据迁移完成！迁移 ${migratedCount} 项，跳过 ${skippedCount} 项`);
  
  // 标记迁移已完成
  localStorage.setItem('manifestos-migration-completed', 'true');
}

/**
 * 检查是否需要迁移
 */
export function shouldMigrate(): boolean {
  const migrationCompleted = localStorage.getItem('manifestos-migration-completed');
  return migrationCompleted !== 'true';
}

/**
 * 清理旧数据（在确认新数据正常后调用）
 */
export function cleanupOldStorage(): void {
  console.log('🧹 清理旧数据...');
  
  let cleanedCount = 0;
  
  MIGRATIONS.forEach(({ oldKey, description }) => {
    try {
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        localStorage.removeItem(oldKey);
        console.log(`🗑️ 已删除旧数据: ${description} (${oldKey})`);
        cleanedCount++;
      }
    } catch (error) {
      console.error(`❌ 删除旧数据失败: ${description}`, error);
    }
  });
  
  console.log(`✅ 清理完成！删除 ${cleanedCount} 项旧数据`);
}

