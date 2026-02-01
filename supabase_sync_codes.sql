-- =============================================
-- 云同步码表 (Sync Codes Table)
-- =============================================
-- 用于生成和管理设备间的云同步码

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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sync_codes_sync_code ON public.sync_codes(sync_code);
CREATE INDEX IF NOT EXISTS idx_sync_codes_user_id ON public.sync_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_codes_created_at ON public.sync_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_codes_is_active ON public.sync_codes(is_active);

-- 创建同步日志表
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code_id UUID REFERENCES public.sync_codes(id) ON DELETE CASCADE,
  sync_code TEXT NOT NULL,
  action TEXT NOT NULL, -- 'upload', 'download', 'conflict'
  device_name TEXT,
  data_type TEXT, -- 'tasks', 'goals', 'habits', 'modules', 'all'
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'partial'
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_code_id ON public.sync_logs(sync_code_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_code ON public.sync_logs(sync_code);
CREATE INDEX IF NOT EXISTS idx_sync_logs_synced_at ON public.sync_logs(synced_at);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.sync_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：允许所有人读写（因为是通过同步码访问，不需要认证）
CREATE POLICY "Allow all access to sync_codes" ON public.sync_codes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sync_logs" ON public.sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 创建函数：自动清理过期的同步码
CREATE OR REPLACE FUNCTION clean_expired_sync_codes()
RETURNS void AS $$
BEGIN
  UPDATE public.sync_codes
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：生成唯一的同步码
CREATE OR REPLACE FUNCTION generate_unique_sync_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- 生成 6 位随机数字码
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- 检查是否已存在
    SELECT EXISTS(SELECT 1 FROM public.sync_codes WHERE sync_code = new_code) INTO code_exists;
    
    -- 如果不存在，返回这个码
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：记录同步日志
CREATE OR REPLACE FUNCTION log_sync_action(
  p_sync_code TEXT,
  p_action TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_data_type TEXT DEFAULT 'all',
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sync_code_record RECORD;
  v_log_id UUID;
BEGIN
  -- 获取 sync_code 记录
  SELECT id INTO v_sync_code_record
  FROM public.sync_codes
  WHERE sync_code = p_sync_code
  LIMIT 1;
  
  -- 插入日志
  INSERT INTO public.sync_logs (
    sync_code_id,
    sync_code,
    action,
    device_name,
    data_type,
    status,
    error_message
  ) VALUES (
    v_sync_code_record.id,
    p_sync_code,
    p_action,
    p_device_name,
    p_data_type,
    p_status,
    p_error_message
  ) RETURNING id INTO v_log_id;
  
  -- 更新同步码的最后同步时间和计数
  IF v_sync_code_record.id IS NOT NULL THEN
    UPDATE public.sync_codes
    SET 
      last_synced_at = NOW(),
      sync_count = sync_count + 1
    WHERE id = v_sync_code_record.id;
  END IF;
  
  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- 如果出错，返回 NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 插入一些说明注释
COMMENT ON TABLE public.sync_codes IS '云同步码表：用于设备间数据同步';
COMMENT ON TABLE public.sync_logs IS '同步日志表：记录所有同步操作';
COMMENT ON FUNCTION generate_unique_sync_code() IS '生成唯一的6位数字同步码';
COMMENT ON FUNCTION log_sync_action(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS '记录同步操作日志';
COMMENT ON FUNCTION clean_expired_sync_codes() IS '清理过期的同步码';

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 云同步码表创建成功！';
  RAISE NOTICE '📋 已创建表：sync_codes, sync_logs';
  RAISE NOTICE '🔧 已创建函数：generate_unique_sync_code(), log_sync_action(), clean_expired_sync_codes()';
  RAISE NOTICE '🔒 已启用 RLS 安全策略';
END $$;

