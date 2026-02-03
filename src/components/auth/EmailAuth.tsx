import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';

interface EmailAuthProps {
  onSuccess: () => void;
}

export default function EmailAuth({ onSuccess }: EmailAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError('Supabase 未配置，请联系管理员');
      setLoading(false);
      return;
    }

    try {
      // 先尝试登录
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 如果登录失败，尝试注册
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

          if (signUpError) {
            setError(`注册失败: ${signUpError.message}`);
            setLoading(false);
            return;
          }

          if (signUpData.user) {
            // 检查是否需要邮箱验证
            if (signUpData.user.identities && signUpData.user.identities.length === 0) {
              setMessage('该邮箱已注册，请使用正确的密码登录');
            } else {
              setMessage('注册成功！请检查邮箱验证链接（如果需要）');
              // 如果不需要邮箱验证，直接登录成功
              if (signUpData.session) {
                console.log('✅ 注册并登录成功');
                onSuccess();
              }
            }
          }
        } else {
          setError(`登录失败: ${signInError.message}`);
        }
      } else if (signInData.user) {
        console.log('✅ 登录成功');
        onSuccess();
      }
    } catch (err: any) {
      setError(`操作失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-800 mb-2">欢迎回来</h2>
        <p className="text-neutral-600">使用邮箱登录或注册</p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6">
        {/* 邮箱输入 */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            邮箱地址
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 密码输入 */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            密码
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">密码至少6个字符</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 成功提示 */}
        {message && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>处理中...</span>
            </>
          ) : (
            <span>登录 / 注册</span>
          )}
        </button>
      </form>

      {/* 说明文字 */}
      <div className="mt-6 text-center text-sm text-neutral-500">
        <p>首次使用将自动注册</p>
        <p className="mt-1">同一邮箱可在多设备同步数据</p>
      </div>
    </div>
  );
}

