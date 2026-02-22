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
    const initialize = () => {
      console.log('🚀 应用初始化开始...');
      
      // 执行数据迁移（如果需要）
      if (shouldMigrate()) {
        console.log('🔄 检测到旧数据，开始迁移...');
        migrateStorage();
      }
      
      // 初始化本地用户
      initializeUser();
      
      console.log('✅ 应用初始化完成（纯本地模式）');
    };

    initialize();
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

