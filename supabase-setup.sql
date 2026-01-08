-- ADHD Focus 云同步数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 创建用户数据表
CREATE TABLE IF NOT EXISTS user_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用行级安全策略 (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 3. 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON user_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON user_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON user_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON user_data
    FOR DELETE USING (auth.uid() = user_id);

-- 4. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_data_updated_at
    BEFORE UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);

-- 完成！现在可以使用云同步功能了

