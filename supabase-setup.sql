-- ADHD Focus 云同步数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- ⚠️ 如果你之前已经创建过表，先执行这个来删除旧表
-- DROP TABLE IF EXISTS user_data;

-- 1. 创建用户数据表（包含 data_type, device_id, version 字段）
CREATE TABLE IF NOT EXISTS user_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    data_type VARCHAR(50) DEFAULT 'full_sync',  -- 数据类型标识
    device_id VARCHAR(100),                      -- 设备唯一标识
    version INTEGER DEFAULT 0,                   -- 数据版本号
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 如果表已存在但缺少字段，添加它们
DO $$ 
BEGIN
    -- 添加 data_type 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_data' AND column_name = 'data_type'
    ) THEN
        ALTER TABLE user_data ADD COLUMN data_type VARCHAR(50) DEFAULT 'full_sync';
    END IF;
    
    -- 添加 device_id 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_data' AND column_name = 'device_id'
    ) THEN
        ALTER TABLE user_data ADD COLUMN device_id VARCHAR(100);
    END IF;
    
    -- 添加 version 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_data' AND column_name = 'version'
    ) THEN
        ALTER TABLE user_data ADD COLUMN version INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. 启用行级安全策略 (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 4. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own data" ON user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON user_data;
DROP POLICY IF EXISTS "Users can update own data" ON user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON user_data;

-- 5. 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON user_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON user_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON user_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON user_data
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;

CREATE TRIGGER update_user_data_updated_at
    BEFORE UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_data_device_id ON user_data(device_id);
CREATE INDEX IF NOT EXISTS idx_user_data_version ON user_data(version);

-- 8. 启用 Realtime 实时同步（重要！）
-- 这允许多设备实时接收数据变化通知
ALTER PUBLICATION supabase_realtime ADD TABLE user_data;

-- 完成！现在可以使用云同步功能了
-- 如果之前同步失败，请刷新网页重新登录云账号

-- ============================================
-- 如果 Realtime 不工作，请在 Supabase Dashboard 中：
-- 1. 进入 Database -> Replication
-- 2. 确保 user_data 表已添加到 supabase_realtime publication
-- 3. 或者在 SQL Editor 中执行：
--    ALTER PUBLICATION supabase_realtime ADD TABLE user_data;
-- ============================================
