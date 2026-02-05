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
          
          // 3. 全量加载云端数据（智能合并，不覆盖本地数据）
          console.log('📥 开始全量同步云端数据...');
          setSyncProgress('正在同步数据...');
          
          const syncAllData = async () => {
            try {
              // 按优先级顺序同步各个模块
              setSyncProgress('同步金币数据...');
              await loadGoldFromCloud();
              
              setSyncProgress('同步任务数据...');
              await loadTasks();
              
              setSyncProgress('同步目标数据...');
              await loadGoals();
              
              setSyncProgress('同步任务历史...');
              await loadTaskHistoryFromCloud();
              
              setSyncProgress('同步任务模板...');
              await loadTaskTemplatesFromCloud();
              
              // TODO: 添加其他store的同步
              // await loadSideHustlesFromCloud();
              // await loadMemoriesFromCloud();
              // await loadNotificationsFromCloud();
              // await loadGrowthDataFromCloud();
              
              console.log('✅ 全量云端数据同步完成');
              setSyncProgress('');
            } catch (error) {
              console.error('❌ 云端数据同步失败，继续使用本地数据:', error);
              setSyncProgress('');
            } finally {
              if (mounted) {
                setIsCheckingAuth(false);
              }
            }
          };
          
          syncAllData();
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
        
        // 登录成功后全量同步云端数据（智能合并）
        console.log('📥 登录后全量同步云端数据...');
        setSyncProgress('正在同步数据...');
        
        const syncAllData = async () => {
          try {
            setSyncProgress('同步金币数据...');
            await loadGoldFromCloud();
            
            setSyncProgress('同步任务数据...');
            await loadTasks();
            
            setSyncProgress('同步目标数据...');
            await loadGoals();
            
            setSyncProgress('同步任务历史...');
            await loadTaskHistoryFromCloud();
            
            setSyncProgress('同步任务模板...');
            await loadTaskTemplatesFromCloud();
            
            console.log('✅ 登录后全量数据同步完成');
            setSyncProgress('');
          } catch (error) {
            console.error('❌ 登录后数据同步失败:', error);
            setSyncProgress('');
          }
        };
        
        syncAllData();
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 用户已登出，保留本地数据');
        setIsAuthenticated(false);
        setSyncProgress('');
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
          <p className="text-neutral-600">{syncProgress || '加载中...'}</p>
          {syncProgress && (
            <p className="text-sm text-neutral-400 mt-2">正在从云端恢复您的数据</p>
          )}
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

