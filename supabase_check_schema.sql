-- ========================================
-- 检查并修复表结构
-- ========================================

-- 1. 查看 users 表结构
SELECT 
  '📋 users 表结构' AS info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 查看 tasks 表的 user_id 字段
SELECT 
  '📋 tasks.user_id 字段' AS info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'user_id';

-- 3. 查看当前的外键约束
SELECT
  '📋 当前外键约束' AS info,
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE c.contype = 'f' 
AND c.conrelid = 'tasks'::regclass
AND c.conname LIKE '%user%';

