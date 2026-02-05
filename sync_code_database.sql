-- ============================================
-- 超级简单的同步码方案 - 数据库表
-- ============================================

-- 1. 同步组表（存储同步码和组信息）
CREATE TABLE IF NOT EXISTS sync_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code TEXT UNIQUE NOT NULL,  -- 6位数字同步码
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 设备表（记录加入同步组的设备）
CREATE TABLE IF NOT EXISTS sync_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_group_id UUID NOT NULL REFERENCES sync_groups(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,  -- 设备唯一标识
  device_name TEXT,  -- 设备名称（如：iPhone 13、Chrome浏览器）
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id)
);

-- 3. 同步数据表（存储所有同步的数据）
CREATE TABLE IF NOT EXISTS sync_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_group_id UUID NOT NULL REFERENCES sync_groups(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,  -- 数据类型：tasks, goals, gold, settings 等
  data_id TEXT NOT NULL,  -- 数据的唯一ID
  data_content JSONB NOT NULL,  -- 数据内容
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sync_group_id, data_type, data_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sync_groups_code ON sync_groups(sync_code);
CREATE INDEX IF NOT EXISTS idx_sync_devices_group ON sync_devices(sync_group_id);
CREATE INDEX IF NOT EXISTS idx_sync_devices_device ON sync_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_data_group ON sync_data(sync_group_id);
CREATE INDEX IF NOT EXISTS idx_sync_data_type ON sync_data(data_type);
CREATE INDEX IF NOT EXISTS idx_sync_data_updated ON sync_data(updated_at DESC);

-- 自动更新时间戳
CREATE OR REPLACE FUNCTION update_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_data_timestamp
  BEFORE UPDATE ON sync_data
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_timestamp();

-- ============================================
-- RLS 策略（允许所有人访问，因为不需要登录）
-- ============================================

ALTER TABLE sync_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;

-- 允许所有人读写（因为使用同步码验证）
CREATE POLICY "Allow all access to sync_groups" ON sync_groups
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sync_devices" ON sync_devices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sync_data" ON sync_data
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 辅助函数：生成6位数字同步码
-- ============================================

CREATE OR REPLACE FUNCTION generate_sync_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- 生成6位随机数字
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- 检查是否已存在
    SELECT EXISTS(SELECT 1 FROM sync_groups WHERE sync_code = new_code) INTO code_exists;
    
    -- 如果不存在，返回这个码
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 完成提示
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 同步码方案数据库已创建！';
  RAISE NOTICE '';
  RAISE NOTICE '📊 创建了3个表：';
  RAISE NOTICE '  1. sync_groups - 同步组（存储同步码）';
  RAISE NOTICE '  2. sync_devices - 设备列表';
  RAISE NOTICE '  3. sync_data - 同步数据';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 创建了辅助函数：';
  RAISE NOTICE '  - generate_sync_code() - 生成6位数字同步码';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 现在可以开始实现同步码功能了！';
END $$;

