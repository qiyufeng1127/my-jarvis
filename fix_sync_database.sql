-- ============================================
-- 修复同步码数据库 - 先删除旧表再重建
-- ============================================

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS sync_data CASCADE;
DROP TABLE IF EXISTS sync_devices CASCADE;
DROP TABLE IF EXISTS sync_groups CASCADE;

-- 删除旧函数
DROP FUNCTION IF EXISTS generate_sync_code();
DROP FUNCTION IF EXISTS update_sync_timestamp();

-- ============================================
-- 重新创建表
-- ============================================

-- 1. 同步组表（存储同步码和组信息）
CREATE TABLE sync_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 设备表（记录加入同步组的设备）
CREATE TABLE sync_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_group_id UUID NOT NULL REFERENCES sync_groups(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id)
);

-- 3. 同步数据表（存储所有同步的数据）
CREATE TABLE sync_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_group_id UUID NOT NULL REFERENCES sync_groups(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data_id TEXT NOT NULL,
  data_content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sync_group_id, data_type, data_id)
);

-- 创建索引
CREATE INDEX idx_sync_groups_code ON sync_groups(sync_code);
CREATE INDEX idx_sync_devices_group ON sync_devices(sync_group_id);
CREATE INDEX idx_sync_devices_device ON sync_devices(device_id);
CREATE INDEX idx_sync_data_group ON sync_data(sync_group_id);
CREATE INDEX idx_sync_data_type ON sync_data(data_type);
CREATE INDEX idx_sync_data_updated ON sync_data(updated_at DESC);

-- ============================================
-- 创建函数
-- ============================================

-- 自动更新时间戳
CREATE OR REPLACE FUNCTION update_sync_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_sync_data_timestamp
  BEFORE UPDATE ON sync_data
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_timestamp();

-- 生成6位数字同步码
CREATE OR REPLACE FUNCTION generate_sync_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM sync_groups WHERE sync_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 配置 RLS
-- ============================================

ALTER TABLE sync_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户访问（因为不需要登录）
CREATE POLICY "Allow anon access to sync_groups" ON sync_groups
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to sync_devices" ON sync_devices
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to sync_data" ON sync_data
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 也允许认证用户访问
CREATE POLICY "Allow auth access to sync_groups" ON sync_groups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow auth access to sync_devices" ON sync_devices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow auth access to sync_data" ON sync_data
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 验证创建结果
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
BEGIN
  -- 检查表是否创建成功
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('sync_groups', 'sync_devices', 'sync_data');
  
  -- 检查函数是否创建成功
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN ('generate_sync_code', 'update_sync_timestamp');
  
  RAISE NOTICE '✅ 同步码数据库创建完成！';
  RAISE NOTICE '';
  RAISE NOTICE '📊 表创建结果: %/3 个表', table_count;
  RAISE NOTICE '  - sync_groups (同步组)';
  RAISE NOTICE '  - sync_devices (设备列表)';
  RAISE NOTICE '  - sync_data (同步数据)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 函数创建结果: %/2 个函数', function_count;
  RAISE NOTICE '  - generate_sync_code()';
  RAISE NOTICE '  - update_sync_timestamp()';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS 策略: 已启用（允许匿名和认证用户访问）';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 现在可以测试同步码功能了！';
END $$;

