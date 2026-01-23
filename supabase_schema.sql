-- ManifestOS 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_user_id TEXT UNIQUE NOT NULL,
  public_data JSONB DEFAULT '{}',
  device_list JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  priority INTEGER DEFAULT 2,
  duration_minutes INTEGER DEFAULT 30,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  growth_dimensions JSONB DEFAULT '{}',
  long_term_goals JSONB DEFAULT '{}',
  identity_tags TEXT[] DEFAULT '{}',
  enable_progress_check BOOLEAN DEFAULT false,
  progress_checks JSONB DEFAULT '[]',
  penalty_gold INTEGER DEFAULT 0,
  gold_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 长期目标表
CREATE TABLE IF NOT EXISTS long_term_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  related_dimensions TEXT[] DEFAULT '{}',
  milestones JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 全景记忆表
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  emotion_tags TEXT[] DEFAULT '{}',
  category_tags TEXT[] DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  rewards JSONB DEFAULT '{"gold": 0, "growth": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 日记表
CREATE TABLE IF NOT EXISTS journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[] DEFAULT '{}',
  rewards JSONB DEFAULT '{"gold": 0, "growth": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 成长记录表
CREATE TABLE IF NOT EXISTS growth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  value NUMERIC NOT NULL,
  change NUMERIC NOT NULL,
  source TEXT,
  source_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 仪表盘模块配置表
CREATE TABLE IF NOT EXISTS dashboard_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  modules JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_start ON tasks(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON long_term_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_is_active ON long_term_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON journals(created_at);
CREATE INDEX IF NOT EXISTS idx_growth_records_user_id ON growth_records(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_modules_user_id ON dashboard_modules(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间触发器（先删除旧的，避免重复）
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON long_term_goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON long_term_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journals_updated_at ON journals;
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_modules ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许所有操作，因为使用 local_user_id 而不是 auth.uid()）
-- 注意：这是简化版本，生产环境需要更严格的安全策略

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on goals" ON long_term_goals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on memories" ON memories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on journals" ON journals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on growth_records" ON growth_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on dashboard_modules" ON dashboard_modules
  FOR ALL USING (true) WITH CHECK (true);

