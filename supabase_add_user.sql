-- ========================================
-- 手动添加用户到 users 表
-- ========================================

-- 插入用户（如果不存在）
INSERT INTO users (id, local_user_id, public_data, device_list, settings, created_at, updated_at)
VALUES (
  gen_random_uuid(),
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
ON CONFLICT (local_user_id) DO NOTHING;

-- 验证用户是否存在
SELECT 
  '✅ 用户已添加到 users 表！' AS status,
  id,
  local_user_id,
  created_at
FROM users 
WHERE local_user_id = 'd54f8991-c483-44da-b739-4addfea642b6';

