-- =============================================
-- 完全重置并重新创建同步表
-- =============================================

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS public.sync_logs CASCADE;
DROP TABLE IF EXISTS public.sync_codes CASCADE;

-- 重新创建 sync_codes 表
CREATE TABLE public.sync_codes (
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

-- 重新创建 sync_logs 表
CREATE TABLE public.sync_logs (
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

-- 创建索引
CREATE INDEX idx_sync_codes_sync_code ON public.sync_codes(sync_code);
CREATE INDEX idx_sync_codes_user_id ON public.sync_codes(user_id);
CREATE INDEX idx_sync_codes_is_active ON public.sync_codes(is_active);
CREATE INDEX idx_sync_logs_sync_code_id ON public.sync_logs(sync_code_id);
CREATE INDEX idx_sync_logs_sync_code ON public.sync_logs(sync_code);

-- 启用 RLS
ALTER TABLE public.sync_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Allow all access to sync_codes" ON public.sync_codes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sync_logs" ON public.sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 完成
SELECT '✅ 同步表重置并创建成功！' as message;

