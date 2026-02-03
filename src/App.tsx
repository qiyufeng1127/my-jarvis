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
    // 检查用户是否已登录
    const checkAuth = async () => {
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase 未配置');
        setIsCheckingAuth(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ 用户已登录:', session.user.email);
          setIsAuthenticated(true);
          // 从云端加载所有数据
          await Promise.all([
            loadFromCloud(),
            loadTasks(),
            loadGoals(),
          ]);
          console.log('✅ 所有数据已从云端加载');
        } else {
          console.log('ℹ️ 用户未登录');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ 检查登录状态失败:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    initializeUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 认证状态变化:', event);
      if (session) {
        setIsAuthenticated(true);
        // 登录成功后加载所有云端数据
        await Promise.all([
          loadFromCloud(),
          loadTasks(),
          loadGoals(),
        ]);
        console.log('✅ 所有数据已从云端加载');
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeUser, loadFromCloud, loadTasks, loadGoals]);

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
          {/* 如果没有登录，显示欢迎页 */}
          {!isAuthenticated ? (
            <Route path="*" element={<Welcome />} />
          ) : (
            <>
              {/* 主控面板 */}
              <Route path="/" element={<Dashboard />} />
              
              {/* 其他路由稍后添加 */}
              <Route path="*" element={<Dashboard />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

