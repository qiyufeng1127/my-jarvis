-- ========================================
-- 一键修复所有数据库问题
-- ========================================
-- 这个脚本会：
-- 1. 确保所有表存在
-- 2. 添加所有缺失的字段
-- 3. 创建用户记录
-- 4. 验证配置

-- ========================================
-- 第一部分：添加缺失的字段
-- ========================================

DO $$ 
BEGIN
    -- 添加 color 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='color') THEN
        ALTER TABLE tasks ADD COLUMN color TEXT;
        RAISE NOTICE '✅ 已添加 color 字段';
    END IF;

    -- 添加 tags 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='tags') THEN
        ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE '✅ 已添加 tags 字段';
    END IF;

    -- 添加 location 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='location') THEN
        ALTER TABLE tasks ADD COLUMN location TEXT;
        RAISE NOTICE '✅ 已添加 location 字段';
    END IF;

    -- 添加 gold_reward 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='gold_reward') THEN
        ALTER TABLE tasks ADD COLUMN gold_reward INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 已添加 gold_reward 字段';
    END IF;

    -- 添加 identity_tags 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='identity_tags') THEN
        ALTER TABLE tasks ADD COLUMN identity_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE '✅ 已添加 identity_tags 字段';
    END IF;

    -- 添加 enable_progress_check 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='enable_progress_check') THEN
        ALTER TABLE tasks ADD COLUMN enable_progress_check BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ 已添加 enable_progress_check 字段';
    END IF;

    -- 添加 progress_checks 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='progress_checks') THEN
        ALTER TABLE tasks ADD COLUMN progress_checks JSONB DEFAULT '[]';
        RAISE NOTICE '✅ 已添加 progress_checks 字段';
    END IF;

    -- 添加 penalty_gold 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='penalty_gold') THEN
        ALTER TABLE tasks ADD COLUMN penalty_gold INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 已添加 penalty_gold 字段';
    END IF;

    -- 添加 gold_earned 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='gold_earned') THEN
        ALTER TABLE tasks ADD COLUMN gold_earned INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 已添加 gold_earned 字段';
    END IF;
END $$;

-- ========================================
-- 第二部分：创建索引
-- ========================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_tags') THEN
        CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
        RAISE NOTICE '✅ 已创建 tags 索引';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_location') THEN
        CREATE INDEX idx_tasks_location ON tasks(location);
        RAISE NOTICE '✅ 已创建 location 索引';
    END IF;
END $$;

-- ========================================
-- 第三部分：添加用户（使用你的实际用户ID）
-- ========================================

INSERT INTO users (local_user_id, public_data, device_list, settings, created_at, updated_at)
VALUES (
  'd54f8991-c483-44da-b739-4addfea642b6',
  '{}',
  '[]',
  '{
    "goldRewardMultiplier": 1.0,
    "taskTypeCoefficients": {
      "work": 1.2,
      "learning": 1.5,
      "sport": 1.0,
      "life": 0.8,
      "creative": 1.3,
      "social": 0.9,
      "rest": 0.5
    }
  }',
  NOW(),
  NOW()
)
ON CONFLICT (local_user_id) DO UPDATE SET
  updated_at = NOW();

-- ========================================
-- 第四部分：验证配置
-- ========================================

-- 显示用户信息
SELECT 
  '✅ 用户配置' AS status,
  id,
  local_user_id,
  created_at
FROM users 
WHERE local_user_id = 'd54f8991-c483-44da-b739-4addfea642b6';

-- 显示 tasks 表的所有字段
SELECT 
  '✅ Tasks 表字段' AS status,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'tasks'
AND column_name IN ('color', 'tags', 'location', 'gold_reward', 'identity_tags', 
                    'enable_progress_check', 'progress_checks', 'penalty_gold', 'gold_earned')
ORDER BY column_name;

-- 显示任务数量
SELECT 
  '✅ 任务统计' AS status,
  COUNT(*) AS total_tasks
FROM tasks
WHERE user_id = 'd54f8991-c483-44da-b739-4addfea642b6';

