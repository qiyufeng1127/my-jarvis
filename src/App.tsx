import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { migrateStorage, shouldMigrate } from '@/utils/migrateStorage';

// 页面组件
import Dashboard from '@/pages/Dashboard';
import Welcome from '@/pages/Welcome';
import BaiduAITest from '@/pages/BaiduAITest';
import DesignSystemDemo from '@/pages/DesignSystemDemo';
import DiarySystemTest from '@/pages/DiarySystemTest';
import MemoryTestPage from '@/pages/MemoryTestPage';
import SOPLibrary from '@/components/sop/SOPLibrary';
import HabitPage from '@/pages/HabitPage';

// 通知系统

// 新手引导已移除

// 紧急任务系统弹窗已移除

// 错误边界
import ErrorBoundary from '@/components/shared/ErrorBoundary';

function App() {
  const { initializeUser } = useUserStore();
  const { effectiveTheme, updateEffectiveTheme } = useThemeStore();

  // 初始化主题
  useEffect(() => {
    updateEffectiveTheme();
  }, [updateEffectiveTheme]);

  // 应用暗色主题到 HTML 根元素
  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveTheme]);

  useEffect(() => {
    // 初始化应用
    const initialize = async () => {
      try {
        console.log('🚀 应用初始化开始...');
        
        // 执行数据迁移（如果需要）
        if (shouldMigrate()) {
          console.log('🔄 检测到旧数据，开始迁移...');
          migrateStorage();
        }
        
        // 初始化本地用户
        initializeUser();
        
        // 启动标签自动同步服务
        try {
          const { tagSyncService } = await import('@/services/tagSyncService');
          tagSyncService.startAutoSync();
        } catch (err) {
          console.warn('⚠️ 标签同步服务启动失败:', err);
        }
        
        // 初始化坏习惯预设
        try {
          const { useHabitCanStore } = await import('@/stores/habitCanStore');
          useHabitCanStore.getState().initializePresets();
          console.log('🏺 坏习惯预设已初始化');
        } catch (err) {
          console.warn('⚠️ 坏习惯预设初始化失败:', err);
        }
        
        // 启动坏习惯监控服务
        try {
          const { habitMonitorService } = await import('@/services/habitMonitorService');
          habitMonitorService.initialize();
          console.log('🏺 坏习惯监控服务已启动');
        } catch (err) {
          console.warn('⚠️ 坏习惯监控服务启动失败:', err);
        }
        
        // 🚀 启动后台任务调度服务（真正的后台运行）
        try {
          const { backgroundTaskScheduler } = await import('@/services/backgroundTaskScheduler');
          await backgroundTaskScheduler.init();
          console.log('🚀 后台任务调度服务已启动');
        } catch (err) {
          console.warn('⚠️ 后台任务调度服务启动失败:', err);
        }
        
        // 🎯 活动监控服务已停用，避免自动触发界面弹窗
        
        // 🔔 启动连胜提醒服务
        try {
          const { streakReminderService } = await import('@/services/streakReminderService');
          streakReminderService.start();
          console.log('🔔 连胜提醒服务已启动');
        } catch (err) {
          console.warn('⚠️ 连胜提醒服务启动失败:', err);
        }
        
        // 🐾 启动宠物状态更新服务
        try {
          const { petUpdateService } = await import('@/services/petUpdateService');
          petUpdateService.start();
          console.log('🐾 宠物状态更新服务已启动');
        } catch (err) {
          console.warn('⚠️ 宠物状态更新服务启动失败:', err);
        }
        
        // 🏪 初始化宠物商店
        try {
          const { usePetStore } = await import('@/stores/petStore');
          usePetStore.getState().initializeShop();
          console.log('🏪 宠物商店已初始化');
        } catch (err) {
          console.warn('⚠️ 宠物商店初始化失败:', err);
        }
        
        // 🏆 检查成就
        try {
          const { useLeaderboardStore } = await import('@/stores/leaderboardStore');
          useLeaderboardStore.getState().checkAchievements();
          console.log('🏆 成就系统已初始化');
        } catch (err) {
          console.warn('⚠️ 成就系统初始化失败:', err);
        }
        
        // 🎯 初始化习惯追踪系统
        try {
          const { useHabitStore } = await import('@/stores/habitStore');
          useHabitStore.getState().initialize();
          console.log('🎯 习惯追踪系统已初始化');
        } catch (err) {
          console.warn('⚠️ 习惯追踪系统初始化失败:', err);
        }
        
        // 🤖 启动习惯识别服务
        try {
          const { habitRecognitionService } = await import('@/services/habitRecognitionService');
          habitRecognitionService.start();
          console.log('🤖 习惯识别服务已启动');
        } catch (err) {
          console.warn('⚠️ 习惯识别服务启动失败:', err);
        }
        
        // 🌙 启动反向检测服务
        try {
          const { habitReverseDetectionService } = await import('@/services/habitReverseDetectionService');
          habitReverseDetectionService.start();
          console.log('🌙 反向检测服务已启动');
        } catch (err) {
          console.warn('⚠️ 反向检测服务启动失败:', err);
        }
        
        console.log('✅ 应用初始化完成（纯本地模式）');
      } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        // 不抛出错误，让应用继续运行
      }
    };

    initialize();
    
    // 清理函数
    return () => {
      import('@/services/habitMonitorService').then(({ habitMonitorService }) => {
        habitMonitorService.destroy();
      }).catch(err => {
        console.error('❌ 清理服务失败:', err);
      });
    };
  }, []);

  // 全局错误处理器 - 防止白屏
  useEffect(() => {
    // 捕获未处理的 Promise 错误
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ [全局错误] 未处理的 Promise 错误:', event.reason);
      event.preventDefault(); // 阻止默认行为（白屏）
      
      // 记录错误但不让错误日志本身导致崩溃
      try {
        const errorLog = {
          timestamp: new Date().toISOString(),
          type: 'unhandledRejection',
          reason: event.reason?.toString() || 'Unknown error',
          stack: event.reason?.stack || '',
        };
        
        const existingLogs = localStorage.getItem('error_logs');
        const logs = existingLogs ? JSON.parse(existingLogs) : [];
        logs.push(errorLog);
        
        // 只保留最近 20 条错误日志
        if (logs.length > 20) logs.shift();
        localStorage.setItem('error_logs', JSON.stringify(logs));
      } catch (logError) {
        console.error('❌ 保存错误日志失败:', logError);
      }
      
      // 尝试恢复应用状态
      try {
        // 如果是存储相关错误，尝试清理
        if (event.reason?.message?.includes('localStorage') || 
            event.reason?.message?.includes('QuotaExceededError')) {
          console.warn('⚠️ 检测到存储错误，尝试清理...');
          // 清理旧的错误日志
          localStorage.removeItem('error_logs');
        }
      } catch (recoveryError) {
        console.error('❌ 恢复失败:', recoveryError);
      }
    };

    // 捕获全局 JavaScript 错误
    const handleError = (event: ErrorEvent) => {
      console.error('❌ [全局错误] JavaScript 错误:', event.error);
      event.preventDefault(); // 阻止默认行为（白屏）
      
      // 记录错误
      try {
        const errorLog = {
          timestamp: new Date().toISOString(),
          type: 'error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack || '',
        };
        
        const existingLogs = localStorage.getItem('error_logs');
        const logs = existingLogs ? JSON.parse(existingLogs) : [];
        logs.push(errorLog);
        
        // 只保留最近 20 条错误日志
        if (logs.length > 20) logs.shift();
        localStorage.setItem('error_logs', JSON.stringify(logs));
      } catch (logError) {
        console.error('❌ 保存错误日志失败:', logError);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    console.log('✅ 全局错误处理器已启动');

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-white dark:bg-black transition-colors">
          <Routes>
            {/* 主控面板 */}
            <Route path="/" element={<Dashboard />} />
            
            {/* SOP 任务库 */}
            <Route path="/sop" element={<SOPLibrary />} />
            
            {/* 习惯追踪 */}
            <Route path="/habit" element={<HabitPage />} />
            
            {/* 欢迎页 */}
            <Route path="/welcome" element={<Welcome />} />
            
            {/* 百度AI测试页 */}
            <Route path="/baidu-ai-test" element={<BaiduAITest />} />
            
            {/* 设计系统展示页 */}
            <Route path="/design-demo" element={<DesignSystemDemo />} />
            
            {/* 日记系统测试页 */}
            <Route path="/diary-test" element={<DiarySystemTest />} />
            
            {/* 记忆测试页 */}
            <Route path="/memory-test" element={<MemoryTestPage />} />
            
            {/* 其他路由 */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

