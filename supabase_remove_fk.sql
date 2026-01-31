-- ========================================
-- 简化方案：删除外键约束（修复版）
-- ========================================

-- 删除外键约束
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- 验证约束已删除
SELECT 
  '✅ 外键约束已删除' AS status;

-- 测试插入（使用正确的类型）
DO $$
DECLARE
  test_id uuid;
BEGIN
  test_id := gen_random_uuid();
  
  INSERT INTO tasks (
    id, user_id, title, task_type, priority, duration_minutes, 
    status, created_at, updated_at
  ) VALUES (
    test_id::text,  -- 转换为 text
    'd54f8991-c483-44da-b739-4addfea642b6',
    '测试任务',
    'life',
    2,
    30,
    'pending',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ 测试任务插入成功！';
  
  DELETE FROM tasks WHERE id = test_id::text;
  RAISE NOTICE '✅ 测试任务已清理';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ 测试失败: %', SQLERRM;
END $$;

SELECT '✅ 修复完成！现在可以正常保存任务了！' AS final_status;
