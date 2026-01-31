-- ========================================
-- 最终修复：删除并重建外键约束
-- ========================================

-- 1. 删除旧的外键约束
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- 2. 重新创建外键约束，引用 local_user_id
ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(local_user_id) 
ON DELETE CASCADE;

-- 3. 验证用户存在
SELECT 
  '✅ 用户记录' AS status,
  id,
  local_user_id
FROM users 
WHERE local_user_id = 'd54f8991-c483-44da-b739-4addfea642b6';

-- 4. 测试插入（这应该成功）
DO $$
BEGIN
  -- 尝试插入一个测试任务
  INSERT INTO tasks (
    id, user_id, title, task_type, priority, duration_minutes, 
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid()::text,
    'd54f8991-c483-44da-b739-4addfea642b6',
    '测试任务',
    'life',
    2,
    30,
    'pending',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ 测试任务插入成功！外键约束已修复！';
  
  -- 删除测试任务
  DELETE FROM tasks WHERE title = '测试任务';
  RAISE NOTICE '✅ 测试任务已清理';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ 测试失败: %', SQLERRM;
END $$;

-- 5. 显示外键约束信息
SELECT
  '✅ 外键约束信息' AS status,
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
AND c.conrelid = 'tasks'::regclass
AND c.conname = 'tasks_user_id_fkey';

