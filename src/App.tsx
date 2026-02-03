import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGoldStore } from '@/stores/goldStore';

// 页面组件（稍后创建）
import Dashboard from '@/pages/Dashboard';
import Welcome from '@/pages/Welcome';

// 通知系统
import NotificationToast from '@/components/notifications/NotificationToast';

function App() {
  const { user, initializeUser } = useUserStore();
  const { loadFromCloud } = useGoldStore();

  useEffect(() => {
    // 初始化用户
    initializeUser();
    
    // 从云端加载金币数据
    loadFromCloud();
  }, [initializeUser, loadFromCloud]);

  return (
    <Router>
      <div className="min-h-screen bg-neutral-50">
        {/* 全局通知系统 */}
        <NotificationToast />
        
        <Routes>
          {/* 如果没有用户，显示欢迎页 */}
          {!user ? (
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

