-- ManifestOS 数据库架构
-- 创建时间: 2026-01-22

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_user_id TEXT UNIQUE NOT NULL,
  sync_code TEXT,
  sync_code_expires_at TIMESTAMP WITH TIME ZONE,
  verification_code TEXT,
  encrypted_data TEXT,
  public_data JSONB DEFAULT '{}',
  device_list JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表索引
CREATE INDEX idx_users_local_user_id ON users(local_user_id);
CREATE INDEX idx_users_sync_code ON users(sync_code) WHERE sync_code IS NOT NULL;

-- ============================================
-- 任务表
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type VARCHAR(20) NOT NULL,
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 4),
  duration_minutes INTEGER,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  
  -- 成长关联
  growth_dimensions JSONB DEFAULT '{}',
  long_term_goals JSONB DEFAULT '{}',
  identity_tags TEXT[] DEFAULT '{}',
  
  -- 防拖延设置
  verification_start JSONB,
  verification_complete JSONB,
  enable_progress_check BOOLEAN DEFAULT FALSE,
  progress_checks JSONB DEFAULT '[]',
  penalty_gold INTEGER DEFAULT 0,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'pending',
  completion_quality INTEGER CHECK (completion_quality BETWEEN 1 AND 5),
  gold_earned INTEGER DEFAULT 0,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_scheduled_time CHECK (scheduled_end > scheduled_start)
);

-- 任务表索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_scheduled_start ON tasks(scheduled_start);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- ============================================
-- 成长维度表
-- ============================================
CREATE TABLE growth_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(20),
  color VARCHAR(7),
  current_value INTEGER DEFAULT 50 CHECK (current_value BETWEEN 0 AND 100),
  target_value INTEGER DEFAULT 100,
  weight FLOAT DEFAULT 1.0 CHECK (weight BETWEEN 0.5 AND 2.0),
  task_types TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 成长维度表索引
CREATE INDEX idx_growth_dimensions_user_id ON growth_dimensions(user_id);
CREATE INDEX idx_growth_dimensions_user_active ON growth_dimensions(user_id, is_active);

-- ============================================
-- 长期目标表
-- ============================================
CREATE TABLE long_term_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('numeric', 'milestone', 'habit')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit VARCHAR(20),
  deadline DATE,
  related_dimensions UUID[] DEFAULT '{}',
  milestones JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 长期目标表索引
CREATE INDEX idx_long_term_goals_user_id ON long_term_goals(user_id);
CREATE INDEX idx_long_term_goals_user_active ON long_term_goals(user_id, is_active);

-- ============================================
-- 身份层级表
-- ============================================
CREATE TABLE identity_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level_order INTEGER NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  required_growth INTEGER NOT NULL,
  unlock_features JSONB DEFAULT '[]',
  theme_settings JSONB DEFAULT '{}',
  icon VARCHAR(20),
  is_current BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, level_order)
);

-- 身份层级表索引
CREATE INDEX idx_identity_levels_user_id ON identity_levels(user_id);
CREATE INDEX idx_identity_levels_user_order ON identity_levels(user_id, level_order);

-- ============================================
-- 坏习惯记录表
-- ============================================
CREATE TABLE bad_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  habit_type VARCHAR(50) NOT NULL,
  custom_name TEXT,
  detection_rules JSONB DEFAULT '{}',
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 10),
  occurrence_count INTEGER DEFAULT 0,
  last_occurred_at TIMESTAMP WITH TIME ZONE,
  improvement_plan JSONB,
  consecutive_success_days INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 坏习惯记录表索引
CREATE INDEX idx_bad_habits_user_id ON bad_habits(user_id);
CREATE INDEX idx_bad_habits_user_active ON bad_habits(user_id, is_active);

-- ============================================
-- 坏习惯发生记录表
-- ============================================
CREATE TABLE bad_habit_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bad_habit_id UUID REFERENCES bad_habits(id) ON DELETE CASCADE,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity INTEGER,
  context JSONB DEFAULT '{}',
  related_task_id UUID REFERENCES tasks(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 坏习惯发生记录表索引
CREATE INDEX idx_bad_habit_occurrences_user_id ON bad_habit_occurrences(user_id);
CREATE INDEX idx_bad_habit_occurrences_habit_id ON bad_habit_occurrences(bad_habit_id);
CREATE INDEX idx_bad_habit_occurrences_occurred_at ON bad_habit_occurrences(occurred_at);

-- ============================================
-- 金币交易表
-- ============================================
CREATE TABLE gold_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'penalty', 'bonus')),
  category VARCHAR(50),
  description TEXT,
  balance_after INTEGER NOT NULL,
  related_task_id UUID REFERENCES tasks(id),
  related_habit_id UUID REFERENCES bad_habits(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 金币交易表索引
CREATE INDEX idx_gold_transactions_user_id ON gold_transactions(user_id);
CREATE INDEX idx_gold_transactions_created_at ON gold_transactions(created_at);
CREATE INDEX idx_gold_transactions_user_created ON gold_transactions(user_id, created_at DESC);

-- ============================================
-- 成长历史记录表
-- ============================================
CREATE TABLE growth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dimension_id UUID REFERENCES growth_dimensions(id) ON DELETE CASCADE,
  old_value INTEGER NOT NULL,
  new_value INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  reason VARCHAR(50),
  related_task_id UUID REFERENCES tasks(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 成长历史记录表索引
CREATE INDEX idx_growth_history_user_id ON growth_history(user_id);
CREATE INDEX idx_growth_history_dimension_id ON growth_history(dimension_id);
CREATE INDEX idx_growth_history_created_at ON growth_history(created_at);

-- ============================================
-- 同步日志表
-- ============================================
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  operation VARCHAR(20) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  data_before JSONB,
  data_after JSONB,
  sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_conflict BOOLEAN DEFAULT FALSE,
  conflict_resolution JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 同步日志表索引
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_device_id ON sync_logs(device_id);
CREATE INDEX idx_sync_logs_sync_timestamp ON sync_logs(sync_timestamp);

-- ============================================
-- 奖励商店表
-- ============================================
CREATE TABLE reward_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  gold_cost INTEGER NOT NULL CHECK (gold_cost > 0),
  icon VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  redemption_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 奖励商店表索引
CREATE INDEX idx_reward_store_user_id ON reward_store(user_id);
CREATE INDEX idx_reward_store_user_active ON reward_store(user_id, is_active);

-- ============================================
-- 奖励兑换记录表
-- ============================================
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES reward_store(id) ON DELETE SET NULL,
  reward_name VARCHAR(100) NOT NULL,
  gold_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 奖励兑换记录表索引
CREATE INDEX idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX idx_reward_redemptions_redeemed_at ON reward_redemptions(redeemed_at);

-- ============================================
-- 成就表
-- ============================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(20),
  rarity VARCHAR(20) DEFAULT 'common',
  gold_reward INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  is_unlocked BOOLEAN DEFAULT FALSE,
  progress JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 成就表索引
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_user_unlocked ON achievements(user_id, is_unlocked);

-- ============================================
-- 自动更新 updated_at 触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_dimensions_updated_at BEFORE UPDATE ON growth_dimensions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_long_term_goals_updated_at BEFORE UPDATE ON long_term_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_identity_levels_updated_at BEFORE UPDATE ON identity_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bad_habits_updated_at BEFORE UPDATE ON bad_habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_store_updated_at BEFORE UPDATE ON reward_store
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bad_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bad_habit_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (true);

CREATE POLICY "Users can view own dimensions" ON growth_dimensions FOR SELECT USING (true);
CREATE POLICY "Users can insert own dimensions" ON growth_dimensions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own dimensions" ON growth_dimensions FOR UPDATE USING (true);
CREATE POLICY "Users can delete own dimensions" ON growth_dimensions FOR DELETE USING (true);

CREATE POLICY "Users can view own goals" ON long_term_goals FOR SELECT USING (true);
CREATE POLICY "Users can insert own goals" ON long_term_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own goals" ON long_term_goals FOR UPDATE USING (true);
CREATE POLICY "Users can delete own goals" ON long_term_goals FOR DELETE USING (true);

CREATE POLICY "Users can view own levels" ON identity_levels FOR SELECT USING (true);
CREATE POLICY "Users can insert own levels" ON identity_levels FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own levels" ON identity_levels FOR UPDATE USING (true);
CREATE POLICY "Users can delete own levels" ON identity_levels FOR DELETE USING (true);

CREATE POLICY "Users can view own habits" ON bad_habits FOR SELECT USING (true);
CREATE POLICY "Users can insert own habits" ON bad_habits FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own habits" ON bad_habits FOR UPDATE USING (true);
CREATE POLICY "Users can delete own habits" ON bad_habits FOR DELETE USING (true);

CREATE POLICY "Users can view own habit occurrences" ON bad_habit_occurrences FOR SELECT USING (true);
CREATE POLICY "Users can insert own habit occurrences" ON bad_habit_occurrences FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own transactions" ON gold_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own transactions" ON gold_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own growth history" ON growth_history FOR SELECT USING (true);
CREATE POLICY "Users can insert own growth history" ON growth_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own sync logs" ON sync_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own sync logs" ON sync_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own rewards" ON reward_store FOR SELECT USING (true);
CREATE POLICY "Users can insert own rewards" ON reward_store FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own rewards" ON reward_store FOR UPDATE USING (true);
CREATE POLICY "Users can delete own rewards" ON reward_store FOR DELETE USING (true);

CREATE POLICY "Users can view own redemptions" ON reward_redemptions FOR SELECT USING (true);
CREATE POLICY "Users can insert own redemptions" ON reward_redemptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can insert own achievements" ON achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own achievements" ON achievements FOR UPDATE USING (true);

-- ============================================
-- 初始化函数：为新用户创建默认数据
-- ============================================
CREATE OR REPLACE FUNCTION initialize_user_data(p_user_id UUID, p_local_user_id TEXT)
RETURNS void AS $$
BEGIN
  -- 创建默认成长维度
  INSERT INTO growth_dimensions (user_id, name, description, icon, color, display_order) VALUES
    (p_user_id, '执行力', '按时完成任务的能力', '⚡', '#991B1B', 1),
    (p_user_id, '专注力', '保持注意力集中的能力', '🎯', '#7C3AED', 2),
    (p_user_id, '健康力', '身体和心理健康状态', '❤️', '#047857', 3),
    (p_user_id, '财富力', '财务管理与创造能力', '💰', '#d97706', 4),
    (p_user_id, '魅力值', '个人形象与社交能力', '✨', '#ec4899', 5);

  -- 创建默认身份层级
  INSERT INTO identity_levels (user_id, level_order, name, description, required_growth, is_current) VALUES
    (p_user_id, 1, '成长探索者', '开始自我成长之旅', 0, true),
    (p_user_id, 2, '自律实践者', '建立自律习惯', 200, false),
    (p_user_id, 3, '效率掌控者', '高效管理时间和任务', 500, false),
    (p_user_id, 4, '平衡大师', '实现工作生活平衡', 1000, false),
    (p_user_id, 5, '人生设计师', '掌控人生方向', 2000, false);

  -- 创建默认坏习惯追踪
  INSERT INTO bad_habits (user_id, habit_type, custom_name, detection_rules) VALUES
    (p_user_id, 'procrastination', '拖延', '{"delay_threshold": 5}'::jsonb),
    (p_user_id, 'stay_up_late', '熬夜', '{"bedtime": "23:00"}'::jsonb),
    (p_user_id, 'wake_up_late', '起床晚', '{"wake_time": "08:00"}'::jsonb),
    (p_user_id, 'low_efficiency', '低效率', '{"efficiency_threshold": 0.5}'::jsonb);

  -- 初始化金币余额（通过交易记录）
  INSERT INTO gold_transactions (user_id, amount, transaction_type, category, description, balance_after)
  VALUES (p_user_id, 1000, 'bonus', 'welcome', '欢迎奖励', 1000);

END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 视图：用户总览
-- ============================================
CREATE OR REPLACE VIEW user_overview AS
SELECT 
  u.id,
  u.local_user_id,
  u.created_at,
  (SELECT COUNT(*) FROM tasks WHERE user_id = u.id) as total_tasks,
  (SELECT COUNT(*) FROM tasks WHERE user_id = u.id AND status = 'completed') as completed_tasks,
  (SELECT COALESCE(SUM(current_value), 0) FROM growth_dimensions WHERE user_id = u.id) as total_growth,
  (SELECT balance_after FROM gold_transactions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as gold_balance,
  (SELECT COUNT(*) FROM achievements WHERE user_id = u.id AND is_unlocked = true) as unlocked_achievements
FROM users u;

-- ============================================
-- 注释
-- ============================================
COMMENT ON TABLE users IS '用户表，存储用户基本信息和同步配置';
COMMENT ON TABLE tasks IS '任务表，存储所有任务信息';
COMMENT ON TABLE growth_dimensions IS '成长维度表，用户可自定义的成长属性';
COMMENT ON TABLE long_term_goals IS '长期目标表，追踪用户的长期目标';
COMMENT ON TABLE identity_levels IS '身份层级表，用户的成长阶段';
COMMENT ON TABLE bad_habits IS '坏习惯定义表';
COMMENT ON TABLE bad_habit_occurrences IS '坏习惯发生记录表';
COMMENT ON TABLE gold_transactions IS '金币交易记录表';
COMMENT ON TABLE growth_history IS '成长历史记录表';
COMMENT ON TABLE sync_logs IS '设备同步日志表';
COMMENT ON TABLE reward_store IS '奖励商店表';
COMMENT ON TABLE reward_redemptions IS '奖励兑换记录表';
COMMENT ON TABLE achievements IS '成就表';

