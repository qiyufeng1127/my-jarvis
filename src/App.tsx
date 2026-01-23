import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';

// 页面组件（稍后创建）
import Dashboard from '@/pages/Dashboard';
import Welcome from '@/pages/Welcome';

function App() {
  const { user, initializeUser } = useUserStore();

  useEffect(() => {
    // 初始化用户
    initializeUser();
  }, [initializeUser]);

  return (
    <Router>
      <div className="min-h-screen bg-neutral-50">
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

