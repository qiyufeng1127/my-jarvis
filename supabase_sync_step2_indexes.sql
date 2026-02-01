-- =============================================
-- 步骤 2: 创建索引
-- =============================================

-- 为 sync_codes 表创建索引
CREATE INDEX IF NOT EXISTS idx_sync_codes_sync_code ON public.sync_codes(sync_code);
CREATE INDEX IF NOT EXISTS idx_sync_codes_user_id ON public.sync_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_codes_is_active ON public.sync_codes(is_active);

-- 为 sync_logs 表创建索引
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_code_id ON public.sync_logs(sync_code_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_code ON public.sync_logs(sync_code);

-- 完成
SELECT '✅ 索引创建成功！请继续执行步骤3' as message;

