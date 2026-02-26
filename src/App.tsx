import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useThemeStore } from '@/stores/themeStore';
import { migrateStorage, shouldMigrate } from '@/utils/migrateStorage';
import { notificationService } from '@/services/notificationService';

// 页面组件
import Dashboard from '@/pages/Dashboard';
import Welcome from '@/pages/Welcome';
import BaiduAITest from '@/pages/BaiduAITest';
import DesignSystemDemo from '@/pages/DesignSystemDemo';

// 通知系统
import NotificationToast from '@/components/notifications/NotificationToast';

// 新手引导和游戏系统
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import { GameSystemPanel } from '@/components/game/GameSystemPanel';

// 紧急任务系统
import EmergencyTaskTrigger from '@/components/emergency/EmergencyTaskTrigger';

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
      console.log('🚀 应用初始化开始...');
      
      // 执行数据迁移（如果需要）
      if (shouldMigrate()) {
        console.log('🔄 检测到旧数据，开始迁移...');
        migrateStorage();
      }
      
      // 初始化本地用户
      initializeUser();
      
      // 启动标签自动同步服务
      const { tagSyncService } = await import('@/services/tagSyncService');
      tagSyncService.startAutoSync();
      
      // 初始化坏习惯预设
      const { useHabitCanStore } = await import('@/stores/habitCanStore');
      useHabitCanStore.getState().initializePresets();
      console.log('🏺 坏习惯预设已初始化');
      
      // 启动坏习惯监控服务
      const { habitMonitorService } = await import('@/services/habitMonitorService');
      habitMonitorService.initialize();
      console.log('🏺 坏习惯监控服务已启动');
      
      // 启动后台通知服务（PWA 增强）
      const { backgroundNotificationService } = await import('@/services/backgroundNotificationService');
      await backgroundNotificationService.initialize();
      console.log('🔔 后台通知服务已启动');
      
      // 🎯 启动活动监控服务（替代每日成本检查）
      const { activityMonitorService } = await import('@/services/activityMonitorService');
      activityMonitorService.start();
      console.log('🎯 活动监控服务已启动');
      
      // 🔔 启动连胜提醒服务
      const { streakReminderService } = await import('@/services/streakReminderService');
      streakReminderService.start();
      console.log('🔔 连胜提醒服务已启动');
      
      // 🐾 启动宠物状态更新服务
      const { petUpdateService } = await import('@/services/petUpdateService');
      petUpdateService.start();
      console.log('🐾 宠物状态更新服务已启动');
      
      // 🏪 初始化宠物商店
      const { usePetStore } = await import('@/stores/petStore');
      usePetStore.getState().initializeShop();
      console.log('🏪 宠物商店已初始化');
      
      // 🏆 检查成就
      const { useLeaderboardStore } = await import('@/stores/leaderboardStore');
      useLeaderboardStore.getState().checkAchievements();
      console.log('🏆 成就系统已初始化');
      
      console.log('✅ 应用初始化完成（纯本地模式）');
    };

    initialize();
    
    // 清理函数
    return () => {
      import('@/services/habitMonitorService').then(({ habitMonitorService }) => {
        habitMonitorService.destroy();
      });
    };
  }, []);
  
  // 初始化语音播报（需要用户交互）
  useEffect(() => {
    let initialized = false;
    
    const initSpeech = async () => {
      if (initialized) return;
      initialized = true;
      
      try {
        await notificationService.initSpeech();
        console.log('✅ 语音播报已激活');
        // 移除监听器
        document.removeEventListener('click', initSpeech);
        document.removeEventListener('touchstart', initSpeech);
      } catch (error) {
        console.warn('⚠️ 语音播报激活失败:', error);
      }
    };
    
    // 监听用户的第一次点击或触摸
    document.addEventListener('click', initSpeech, { once: true });
    document.addEventListener('touchstart', initSpeech, { once: true });
    
    return () => {
      document.removeEventListener('click', initSpeech);
      document.removeEventListener('touchstart', initSpeech);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-black transition-colors">
        {/* 全局通知系统 */}
        <NotificationToast />
        
        {/* 新手引导 */}
        <OnboardingTutorial />
        
        {/* 游戏系统面板 */}
        <GameSystemPanel />
        
        {/* 紧急任务触发器 */}
        <EmergencyTaskTrigger />
        
        <Routes>
          {/* 主控面板 */}
          <Route path="/" element={<Dashboard />} />
          
          {/* 欢迎页 */}
          <Route path="/welcome" element={<Welcome />} />
          
          {/* 百度AI测试页 */}
          <Route path="/baidu-ai-test" element={<BaiduAITest />} />
          
          {/* 设计系统展示页 */}
          <Route path="/design-demo" element={<DesignSystemDemo />} />
          
          {/* 其他路由 */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

