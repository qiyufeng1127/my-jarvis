-- =============================================
-- 云同步码表 - 简化版（分步执行）
-- =============================================

-- 步骤 1: 创建 sync_codes 表
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

-- 步骤 2: 创建 sync_logs 表
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

-- 步骤 3: 创建索引
CREATE INDEX IF NOT EXISTS idx_sync_codes_sync_code ON public.sync_codes(sync_code);
CREATE INDEX IF NOT EXISTS idx_sync_codes_user_id ON public.sync_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_codes_is_active ON public.sync_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_code_id ON public.sync_logs(sync_code_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_code ON public.sync_logs(sync_code);

-- 步骤 4: 启用 RLS
ALTER TABLE public.sync_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- 步骤 5: 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all access to sync_codes" ON public.sync_codes;
DROP POLICY IF EXISTS "Allow all access to sync_logs" ON public.sync_logs;

-- 步骤 6: 创建新策略
CREATE POLICY "Allow all access to sync_codes" ON public.sync_codes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sync_logs" ON public.sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 完成
SELECT '✅ 云同步码表创建成功！' as message;

