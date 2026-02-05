import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useThemeStore } from '@/stores/themeStore';
import { useTaskHistoryStore } from '@/stores/taskHistoryStore';
import { useTaskTemplateStore } from '@/stores/taskTemplateStore';
import { useSyncStore } from '@/stores/syncStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { migrateStorage, shouldMigrate } from '@/utils/migrateStorage';
import { cloudSyncService } from '@/services/cloudSyncService';

// 页面组件（稍后创建）
import Dashboard from '@/pages/Dashboard';
import Welcome from '@/pages/Welcome';
import BaiduAITest from '@/pages/BaiduAITest';

// 通知系统
import NotificationToast from '@/components/notifications/NotificationToast';

function App() {
  const { user, initializeUser } = useUserStore();
  const { loadFromCloud: loadGoldFromCloud } = useGoldStore();
  const { loadTasks } = useTaskStore();
  const { loadGoals } = useGoalStore();
  const { loadFromCloud: loadTaskHistoryFromCloud } = useTaskHistoryStore();
  const { loadFromCloud: loadTaskTemplatesFromCloud } = useTaskTemplateStore();
  const { updateEffectiveTheme } = useThemeStore();
  const { isInSyncGroup, startAutoSync, syncNow } = useSyncStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');

  // 初始化主题
  useEffect(() => {
    updateEffectiveTheme();
  }, [updateEffectiveTheme]);

  // 🔥 启动同步码自动同步（后台运行，不阻塞界面）
  useEffect(() => {
    if (isInSyncGroup) {
      console.log('🔄 启动同步码后台自动同步');
      startAutoSync();
      
      // 立即同步一次
      setTimeout(() => {
        syncNow();
      }, 1000);
    }
  }, [isInSyncGroup]);

  useEffect(() => {
    let mounted = true;
    
    // 初始化应用
    const initialize = async () => {
      console.log('🚀 应用初始化开始...');
      
      // 0. 首先执行数据迁移（如果需要）
      if (shouldMigrate()) {
        console.log('🔄 检测到旧数据，开始迁移...');
        migrateStorage();
      }
      
      // 1. 初始化本地用户（快速，不阻塞）
      initializeUser();
      
      // 🔥 立即显示界面，不等待云端同步
      setIsCheckingAuth(false);
      
      // 2. 在后台静默同步云端数据（不阻塞界面）
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase 未配置，使用本地模式');
        return;
      }

      // 后台异步执行，不阻塞界面
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!mounted) return;
          
          if (session) {
            console.log('✅ 用户已登录，后台同步数据:', session.user.email);
            setIsAuthenticated(true);
            
            // 后台静默同步，不显示进度
            try {
              await loadGoldFromCloud();
              await loadTasks();
              await loadGoals();
              await loadTaskHistoryFromCloud();
              await loadTaskTemplatesFromCloud();
              
              console.log('✅ 后台数据同步完成');
            } catch (error) {
              console.error('❌ 后台数据同步失败:', error);
            }
          } else {
            console.log('👤 游客模式：数据保存在本地');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('❌ 检查登录状态失败:', error);
          if (mounted) {
            setIsAuthenticated(false);
          }
        }
      })();
    };

    initialize();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 认证状态变化:', event, session ? '已登录' : '未登录');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ 用户登录成功，后台同步数据:', session.user.email);
        setIsAuthenticated(true);
        
        // 后台静默同步
        (async () => {
          try {
            await loadGoldFromCloud();
            await loadTasks();
            await loadGoals();
            await loadTaskHistoryFromCloud();
            await loadTaskTemplatesFromCloud();
            
            console.log('✅ 登录后数据同步完成');
          } catch (error) {
            console.error('❌ 登录后数据同步失败:', error);
          }
        })();
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 用户已登出，保留本地数据');
        setIsAuthenticated(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 不再显示加载界面，直接显示应用
  // 数据在后台静默加载
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50">
        {/* 全局通知系统 */}
        <NotificationToast />
        
        <Routes>
          {/* 主控面板 - 游客和登录用户都可以访问 */}
          <Route path="/" element={<Dashboard />} />
          
          {/* 欢迎页 */}
          <Route path="/welcome" element={<Welcome />} />
          
          {/* 百度AI测试页 */}
          <Route path="/baidu-ai-test" element={<BaiduAITest />} />
          
          {/* 其他路由 */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

