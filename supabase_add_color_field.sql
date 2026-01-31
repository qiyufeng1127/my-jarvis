-- ========================================
-- 添加 color 字段到 tasks 表
-- ========================================

DO $$ 
BEGIN
    -- 添加 color 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='color') THEN
        ALTER TABLE tasks ADD COLUMN color TEXT;
        RAISE NOTICE '✅ 已添加 color 字段';
    ELSE
        RAISE NOTICE '⏭️ color 字段已存在';
    END IF;
END $$;

-- 验证字段
SELECT 
    '✅ color 字段已添加到 tasks 表！' AS status,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'color';

