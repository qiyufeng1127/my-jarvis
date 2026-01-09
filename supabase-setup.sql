-- ADHD Focus 云同步数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 方案：简单同步码同步（无需账号密码）
-- ============================================

-- 1. 创建同步数据表
CREATE TABLE IF NOT EXISTS sync_data (
    sync_code VARCHAR(6) PRIMARY KEY,           -- 6位同步码作为主键
    data JSONB DEFAULT '{}',                    -- 同步的数据
    device_id VARCHAR(100),                     -- 最后更新的设备ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_sync_data_updated_at ON sync_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_data_device_id ON sync_data(device_id);

-- 3. 禁用 RLS（允许匿名访问）
-- 因为我们使用同步码而不是用户认证
ALTER TABLE sync_data DISABLE ROW LEVEL SECURITY;

-- 4. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_sync_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sync_data_timestamp ON sync_data;
CREATE TRIGGER update_sync_data_timestamp
    BEFORE UPDATE ON sync_data
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_data_updated_at();

-- 5. 自动清理30天未更新的数据
CREATE OR REPLACE FUNCTION cleanup_old_sync_data()
RETURNS void AS $$
BEGIN
    DELETE FROM sync_data WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- 6. 启用 Realtime（可选，用于实时同步）
-- ALTER PUBLICATION supabase_realtime ADD TABLE sync_data;

-- ============================================
-- 完成！
-- 
-- 使用方法：
-- 1. 在电脑上点击云同步，创建一个6位同步码
-- 2. 在手机上点击云同步，输入同一个同步码
-- 3. 两个设备就会自动同步数据了
-- ============================================

-- 如果之前有 user_data 表，可以保留它（兼容旧版本）
-- 或者删除它：DROP TABLE IF EXISTS user_data;
