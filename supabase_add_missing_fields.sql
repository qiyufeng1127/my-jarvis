-- ========================================
-- 添加缺失的 AI 字段到现有表
-- ========================================
-- 如果表已经存在，这个脚本会安全地添加缺失的字段

-- 1. 为 tasks 表添加缺失字段
DO $$ 
BEGIN
    -- 添加 tags 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='tags') THEN
        ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE '✅ 已添加 tags 字段';
    ELSE
        RAISE NOTICE '⏭️ tags 字段已存在';
    END IF;

    -- 添加 location 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='location') THEN
        ALTER TABLE tasks ADD COLUMN location TEXT;
        RAISE NOTICE '✅ 已添加 location 字段';
    ELSE
        RAISE NOTICE '⏭️ location 字段已存在';
    END IF;

    -- 添加 gold_reward 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='gold_reward') THEN
        ALTER TABLE tasks ADD COLUMN gold_reward INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 已添加 gold_reward 字段';
    ELSE
        RAISE NOTICE '⏭️ gold_reward 字段已存在';
    END IF;

    -- 添加 identity_tags 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='identity_tags') THEN
        ALTER TABLE tasks ADD COLUMN identity_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE '✅ 已添加 identity_tags 字段';
    ELSE
        RAISE NOTICE '⏭️ identity_tags 字段已存在';
    END IF;

    -- 添加 enable_progress_check 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='enable_progress_check') THEN
        ALTER TABLE tasks ADD COLUMN enable_progress_check BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ 已添加 enable_progress_check 字段';
    ELSE
        RAISE NOTICE '⏭️ enable_progress_check 字段已存在';
    END IF;

    -- 添加 progress_checks 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='progress_checks') THEN
        ALTER TABLE tasks ADD COLUMN progress_checks JSONB DEFAULT '[]';
        RAISE NOTICE '✅ 已添加 progress_checks 字段';
    ELSE
        RAISE NOTICE '⏭️ progress_checks 字段已存在';
    END IF;

    -- 添加 penalty_gold 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='penalty_gold') THEN
        ALTER TABLE tasks ADD COLUMN penalty_gold INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 已添加 penalty_gold 字段';
    ELSE
        RAISE NOTICE '⏭️ penalty_gold 字段已存在';
    END IF;

    -- 添加 gold_earned 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='gold_earned') THEN
        ALTER TABLE tasks ADD COLUMN gold_earned INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 已添加 gold_earned 字段';
    ELSE
        RAISE NOTICE '⏭️ gold_earned 字段已存在';
    END IF;
END $$;

-- 2. 创建索引（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_tags') THEN
        CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
        RAISE NOTICE '✅ 已创建 tags 索引';
    ELSE
        RAISE NOTICE '⏭️ tags 索引已存在';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_location') THEN
        CREATE INDEX idx_tasks_location ON tasks(location);
        RAISE NOTICE '✅ 已创建 location 索引';
    ELSE
        RAISE NOTICE '⏭️ location 索引已存在';
    END IF;
END $$;

-- 3. 验证所有字段
SELECT 
    '✅ AI 智能助手字段更新完成！' AS status,
    COUNT(*) AS total_fields
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('tags', 'location', 'gold_reward', 'identity_tags', 
                    'enable_progress_check', 'progress_checks', 'penalty_gold', 'gold_earned');

-- 4. 显示 tasks 表的所有字段
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

