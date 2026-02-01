-- =============================================
-- 步骤 1: 仅创建表（不包含策略）
-- =============================================

-- 创建 sync_codes 表
CREATE TABLE IF NOT EXISTS public.sync_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code TEXT UNIQUE NOT NULL,
  user_id UUID,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  sync_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建 sync_logs 表
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code_id UUID REFERENCES public.sync_codes(id) ON DELETE CASCADE,
  sync_code TEXT NOT NULL,
  action TEXT NOT NULL,
  device_name TEXT,
  data_type TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 完成
SELECT '✅ 表创建成功！请继续执行步骤2' as message;

