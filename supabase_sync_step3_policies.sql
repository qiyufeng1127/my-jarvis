-- =============================================
-- 步骤 3: 启用 RLS 和创建策略
-- =============================================

-- 启用 RLS
ALTER TABLE public.sync_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all access to sync_codes" ON public.sync_codes;
DROP POLICY IF EXISTS "Allow all access to sync_logs" ON public.sync_logs;

-- 创建新策略
CREATE POLICY "Allow all access to sync_codes" ON public.sync_codes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sync_logs" ON public.sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 完成
SELECT '✅ RLS 策略创建成功！云同步功能已就绪' as message;

