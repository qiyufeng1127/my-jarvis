import { useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import EmailAuth from '@/components/auth/EmailAuth';

interface AuthPanelProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function AuthPanel({ isDark = false, bgColor = '#ffffff' }: AuthPanelProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 检查登录状态
  useEffect(() => {
    checkUser();
    
    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 检查当前用户
  const checkUser = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('❌ 检查用户状态失败：', error);
    }
  };

  // 登出
  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('登出失败，请重试');
      } else {
        setUser(null);
        alert('✅ 已退出登录');
      }
    } catch (error) {
      alert('登出失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 如果已登录，显示用户信息
  if (user) {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-base" style={{ color: textColor }}>👤 账号信息</h4>

        {/* 用户信息卡片 */}
        <div className="rounded-lg p-6" style={{ backgroundColor: cardBg }}>
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: buttonBg }}
            >
              <User className="w-8 h-8" style={{ color: textColor }} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium mb-1" style={{ color: textColor }}>
                {user.email}
              </div>
              <div className="text-xs" style={{ color: accentColor }}>
                用户 ID: {user.id.slice(0, 8)}...
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs" style={{ color: accentColor }}>
            <div className="flex justify-between">
              <span>注册时间</span>
              <span>{new Date(user.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex justify-between">
              <span>最后登录</span>
              <span>{new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <div className="text-sm mb-2" style={{ color: textColor }}>✅ 云同步已启用</div>
          <div className="text-xs leading-relaxed" style={{ color: accentColor }}>
            您的所有数据将自动同步到云端。使用相同的邮箱在其他设备登录，即可访问您的所有数据。
          </div>
        </div>

        {/* 登出按钮 */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
          style={{ 
            backgroundColor: buttonBg, 
            color: textColor,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoading ? '退出中...' : '退出登录'}</span>
        </button>
      </div>
    );
  }

  // 未登录，使用EmailAuth组件
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-base" style={{ color: textColor }}>🔐 邮箱登录</h4>
      
      <div style={{ 
        backgroundColor: cardBg,
        borderRadius: '0.5rem',
        padding: '1rem'
      }}>
        <EmailAuth onSuccess={() => window.location.reload()} />
      </div>
    </div>
  );
}
