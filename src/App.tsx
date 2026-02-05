import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { migrateStorage, shouldMigrate } from '@/utils/migrateStorage';

// 页面组件（稍后创建）
import Dashboard from '@/pages/Dashboard';
import Welcome from '@/pages/Welcome';
import BaiduAITest from '@/pages/BaiduAITest';

// 通知系统
import NotificationToast from '@/components/notifications/NotificationToast';

function App() {
  const { user, initializeUser } = useUserStore();
  const { loadFromCloud } = useGoldStore();
  const { loadTasks } = useTaskStore();
  const { loadGoals } = useGoalStore();
  const { updateEffectiveTheme } = useThemeStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化主题
  useEffect(() => {
    updateEffectiveTheme();
  }, [updateEffectiveTheme]);

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
      
      // 2. 检查登录状态
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase 未配置，使用本地模式');
        if (mounted) {
          setIsCheckingAuth(false);
          setIsAuthenticated(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session) {
          console.log('✅ 用户已登录:', session.user.email);
          setIsAuthenticated(true);
          
          // 3. 加载云端数据（智能合并，不覆盖本地数据）
          console.log('📥 开始同步云端数据...');
          Promise.all([
            loadFromCloud(),
            loadTasks(),
            loadGoals(),
          ]).then(() => {
            console.log('✅ 云端数据同步完成');
            if (mounted) {
              setIsCheckingAuth(false);
            }
          }).catch((error) => {
            console.error('❌ 云端数据同步失败，继续使用本地数据:', error);
            if (mounted) {
              setIsCheckingAuth(false);
            }
          });
        } else {
          console.log('👤 游客模式：数据保存在本地');
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('❌ 检查登录状态失败:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
      }
    };

    initialize();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 认证状态变化:', event, session ? '已登录' : '未登录');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ 用户登录成功:', session.user.email);
        setIsAuthenticated(true);
        
        // 登录成功后同步云端数据（智能合并）
        console.log('📥 登录后同步云端数据...');
        Promise.all([
          loadFromCloud(),
          loadTasks(),
          loadGoals(),
        ]).then(() => {
          console.log('✅ 登录后数据同步完成');
        }).catch((error) => {
          console.error('❌ 登录后数据同步失败:', error);
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 用户已登出，保留本地数据');
        setIsAuthenticated(false);
        // 注意：不清除本地数据，用户下次登录时会自动同步
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 加载中状态
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">加载中...</p>
        </div>
      </div>
    );
  }

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

