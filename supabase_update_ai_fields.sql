-- 更新任务表，添加 AI 智能助手字段
-- 在 Supabase SQL Editor 中执行此脚本

-- 添加新字段（如果不存在）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS gold_reward INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON tasks(location);

-- 完成！
SELECT 'AI 智能助手字段已添加到 tasks 表' AS status;

