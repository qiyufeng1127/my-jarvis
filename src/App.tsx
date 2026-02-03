import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // 初始化应用
    const initialize = async () => {
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
          setIsCheckingAuth(false); // 先显示界面
          
          // 3. 后台异步加载云端数据（不阻塞界面显示）
          Promise.all([
            loadFromCloud(),
            loadTasks(),
            loadGoals(),
          ]).then(() => {
            console.log('✅ 云端数据加载完成');
          }).catch((error) => {
            console.error('❌ 云端数据加载失败:', error);
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
      console.log('🔐 认证状态变化:', event);
      if (session) {
        setIsAuthenticated(true);
        // 登录成功后加载所有云端数据
        Promise.all([
          loadFromCloud(),
          loadTasks(),
          loadGoals(),
        ]).then(() => {
          console.log('✅ 云端数据同步完成');
        });
      } else {
        setIsAuthenticated(false);
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

