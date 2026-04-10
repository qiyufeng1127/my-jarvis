import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useGoldStore } from '@/stores/goldStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useTaskHistoryStore } from '@/stores/taskHistoryStore';
import { useTaskTemplateStore } from '@/stores/taskTemplateStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAIStore } from '@/stores/aiStore';

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    tasks: any;
    goals: any;
    gold: any;
    growth: any;
    taskHistory: any;
    taskTemplates: any;
    sideHustles: any;
    memories: any;
    user: any;
    theme: any;
    notifications: any;
    ai: any;
  };
}

/**
 * 导出所有数据到 JSON 文件
 */
export const exportAllData = () => {
  try {
    const backupData: BackupData = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      data: {
        tasks: useTaskStore.getState(),
        goals: useGoalStore.getState(),
        gold: useGoldStore.getState(),
        growth: useGrowthStore.getState(),
        taskHistory: useTaskHistoryStore.getState(),
        taskTemplates: useTaskTemplateStore.getState(),
        sideHustles: useSideHustleStore.getState(),
        memories: useMemoryStore.getState(),
        user: useUserStore.getState(),
        theme: useThemeStore.getState(),
        notifications: useNotificationStore.getState(),
        ai: useAIStore.getState(),
      },
    };

    // 转换为 JSON 字符串
    const jsonString = JSON.stringify(backupData, null, 2);
    
    // 创建 Blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 生成文件名：ManifestOS_备份_2026-02-05_14-30-00.json
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    link.download = `ManifestOS_备份_${dateStr}_${timeStr}.json`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放 URL
    URL.revokeObjectURL(url);
    
    console.log('✅ 数据导出成功');
    return true;
  } catch (error) {
    console.error('❌ 数据导出失败:', error);
    return false;
  }
};

/**
 * 从 JSON 文件导入数据
 */
export const importAllData = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const backupData: BackupData = JSON.parse(jsonString);
        
        // 验证数据格式
        if (!backupData.version || !backupData.data) {
          throw new Error('无效的备份文件格式');
        }
        
        console.log('📥 开始导入数据，版本:', backupData.version);
        console.log('📅 备份时间:', backupData.timestamp);
        
        // 恢复所有数据到各个 Store
        if (backupData.data.tasks) {
          useTaskStore.setState(backupData.data.tasks);
        }
        if (backupData.data.goals) {
          useGoalStore.setState(backupData.data.goals);
        }
        if (backupData.data.gold) {
          useGoldStore.setState(backupData.data.gold);
        }
        if (backupData.data.growth) {
          useGrowthStore.setState(backupData.data.growth);
        }
        if (backupData.data.taskHistory) {
          useTaskHistoryStore.setState(backupData.data.taskHistory);
        }
        if (backupData.data.taskTemplates) {
          useTaskTemplateStore.setState(backupData.data.taskTemplates);
        }
        if (backupData.data.sideHustles) {
          useSideHustleStore.setState(backupData.data.sideHustles);
        }
        if (backupData.data.memories) {
          useMemoryStore.setState(backupData.data.memories);
        }
        if (backupData.data.user) {
          useUserStore.setState(backupData.data.user);
        }
        if (backupData.data.theme) {
          useThemeStore.setState(backupData.data.theme);
        }
        if (backupData.data.notifications) {
          useNotificationStore.setState(backupData.data.notifications);
        }
        if (backupData.data.ai) {
          useAIStore.setState(backupData.data.ai);
        }
        
        console.log('✅ 数据导入成功');
        resolve(true);
      } catch (error) {
        console.error('❌ 数据导入失败:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      console.error('❌ 文件读取失败');
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * 清空所有数据（慎用！）
 */
export const clearAllData = () => {
  try {
    // 清空所有 localStorage
    localStorage.clear();
    
    // 刷新页面以重新初始化
    window.location.reload();
    
    console.log('✅ 所有数据已清空');
    return true;
  } catch (error) {
    console.error('❌ 清空数据失败:', error);
    return false;
  }
};

