import { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, LogOut, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthPanelProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function AuthPanel({ isDark = false, bgColor = '#ffffff' }: AuthPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(true);

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
      // 先检查 session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        console.log('✅ 已登录用户:', session.user.email, 'ID:', session.user.id);
      } else {
        console.log('ℹ️ 未登录');
      }
    } catch (error) {
      console.error('❌ 检查用户状态失败：', error);
    }
  };

  // 登录或注册
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      alert('请输入邮箱和密码');
      return;
    }

    if (password.trim().length < 6) {
      alert('密码至少需要6位字符');
      return;
    }

    if (!isSupabaseConfigured()) {
      alert('❌ Supabase 未配置');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 尝试登录:', email.trim());
      
      // 先尝试登录
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (signInError) {
        console.log('⚠️ 登录失败:', signInError.message);
        
        // 只有在用户不存在时才注册
        if (signInError.message.includes('Invalid login credentials') || 
            signInError.message.includes('Email not confirmed')) {
          
          console.log('📝 尝试注册新用户...');
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            options: {
              emailRedirectTo: window.location.origin,
              data: {
                email: email.trim().toLowerCase(),
              }
            }
          });

          if (signUpError) {
            console.error('❌ 注册失败：', signUpError);
            
            // 如果是因为用户已存在而失败，提示用户检查密码
            if (signUpError.message.includes('already registered')) {
              alert('该邮箱已注册，请检查密码是否正确');
            } else {
              alert(`注册失败：${signUpError.message}`);
            }
          } else if (signUpData.user) {
            console.log('✅ 注册成功! 用户ID:', signUpData.user.id);
            setUser(signUpData.user);
            alert('✅ 注册成功！已自动登录\n您的数据将自动同步到云端');
            setEmail('');
            setPassword('');
          }
        } else {
          alert(`登录失败：${signInError.message}`);
        }
      } else if (signInData.user) {
        console.log('✅ 登录成功! 用户ID:', signInData.user.id);
        setUser(signInData.user);
        alert('✅ 登录成功！');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('❌ 认证时发生异常：', error);
      alert('认证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ 登出失败：', error);
        alert('登出失败，请重试');
      } else {
        setUser(null);
        alert('✅ 已退出登录');
      }
    } catch (error) {
      console.error('❌ 登出时发生异常：', error);
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

  // 未登录，显示登录表单
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-base" style={{ color: textColor }}>🔐 邮箱登录</h4>

      {/* 说明卡片 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="text-sm mb-2" style={{ color: textColor }}>💡 为什么要登录？</div>
        <div className="text-xs leading-relaxed" style={{ color: accentColor }}>
          登录后，您的数据将自动同步到云端，并在所有设备间保持同步。首次使用的邮箱会自动注册，无需额外验证。
        </div>
      </div>

      {/* 登录表单 */}
      <div className="rounded-lg p-6" style={{ backgroundColor: cardBg }}>
        <div className="space-y-4">
          {/* 邮箱输入 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              <Mail className="w-4 h-4 inline mr-1" />
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                color: textColor,
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            />
          </div>

          {/* 密码输入 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              <Lock className="w-4 h-4 inline mr-1" />
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6位字符"
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                color: textColor,
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            />
            <div className="text-xs mt-2" style={{ color: accentColor }}>
              💡 首次使用的邮箱会自动注册
            </div>
          </div>

          {/* 登录按钮 */}
          <button
            onClick={handleAuth}
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
            style={{ 
              backgroundColor: buttonBg, 
              color: textColor,
              opacity: (isLoading || !email.trim() || !password.trim()) ? 0.5 : 1,
            }}
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? '处理中...' : '登录 / 注册'}</span>
          </button>
        </div>
      </div>

      {/* 安全提示 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="text-xs leading-relaxed" style={{ color: accentColor }}>
          🔒 您的密码经过加密存储，我们无法查看您的密码。请妥善保管您的登录信息。
        </div>
      </div>
    </div>
  );
}

