-- =============================================
-- 添加缺失的 updated_at 列
-- =============================================

-- 为 sync_codes 表添加 updated_at 列
ALTER TABLE public.sync_codes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 为 sync_logs 表添加 updated_at 列
ALTER TABLE public.sync_logs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 sync_codes 表创建触发器
DROP TRIGGER IF EXISTS update_sync_codes_updated_at ON public.sync_codes;
CREATE TRIGGER update_sync_codes_updated_at
    BEFORE UPDATE ON public.sync_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 sync_logs 表创建触发器
DROP TRIGGER IF EXISTS update_sync_logs_updated_at ON public.sync_logs;
CREATE TRIGGER update_sync_logs_updated_at
    BEFORE UPDATE ON public.sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 完成
SELECT '✅ updated_at 列添加成功！' as message;

