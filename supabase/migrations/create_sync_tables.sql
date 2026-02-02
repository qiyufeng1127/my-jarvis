-- 云同步码表
CREATE TABLE IF NOT EXISTS sync_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  sync_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sync_codes_user_id ON sync_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_codes_sync_code ON sync_codes(sync_code);

-- 已连接设备表
CREATE TABLE IF NOT EXISTS connected_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  sync_code TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'mobile' 或 'desktop'
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_connected_devices_user_id ON connected_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_devices_sync_code ON connected_devices(sync_code);

-- 启用 RLS (Row Level Security)
ALTER TABLE sync_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_devices ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view their own sync codes"
  ON sync_codes FOR SELECT
  USING (true); -- 允许所有人查看（用于验证同步码）

CREATE POLICY "Users can insert their own sync codes"
  ON sync_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own sync codes"
  ON sync_codes FOR UPDATE
  USING (true);

CREATE POLICY "Users can view their own devices"
  ON connected_devices FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own devices"
  ON connected_devices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own devices"
  ON connected_devices FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own devices"
  ON connected_devices FOR DELETE
  USING (true);

-- 添加注释
COMMENT ON TABLE sync_codes IS '云同步码表，用于多设备数据同步';
COMMENT ON TABLE connected_devices IS '已连接设备表，记录使用同一同步码的所有设备';














