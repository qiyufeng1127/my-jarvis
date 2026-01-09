-- ADHD Focus 云同步数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- ⚠️ 如果你之前已经创建过表，先执行这个来删除旧表
-- DROP TABLE IF EXISTS user_data;

-- 1. 创建用户数据表（包含 data_type 字段）
CREATE TABLE IF NOT EXISTS user_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    data_type VARCHAR(50) DEFAULT 'full_sync',  -- 数据类型标识
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 如果表已存在但缺少 data_type 字段，添加它
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_data' AND column_name = 'data_type'
    ) THEN
        ALTER TABLE user_data ADD COLUMN data_type VARCHAR(50) DEFAULT 'full_sync';
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

-- 完成！现在可以使用云同步功能了
-- 如果之前同步失败，请刷新网页重新登录云账号
