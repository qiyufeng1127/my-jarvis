-- ============================================
-- ManifestOS 数据库表结构
-- 用途：邮箱登录 + 多端云同步
-- ============================================

-- 1. 金币数据表
CREATE TABLE IF NOT EXISTS gold_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0,
  today_earned INTEGER DEFAULT 0,
  today_spent INTEGER DEFAULT 0,
  transactions JSONB DEFAULT '[]'::jsonb,
  last_reset_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gold_data_user_id ON gold_data(user_id);
ALTER TABLE gold_data DISABLE ROW LEVEL SECURITY;

-- 2. 任务数据表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'work',
  priority INTEGER DEFAULT 2,
  duration_minutes INTEGER DEFAULT 30,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  growth_dimensions JSONB DEFAULT '{}'::jsonb,
  long_term_goals JSONB DEFAULT '{}'::jsonb,
  identity_tags TEXT[] DEFAULT '{}',
  enable_progress_check BOOLEAN DEFAULT false,
  progress_checks JSONB DEFAULT '[]'::jsonb,
  penalty_gold INTEGER DEFAULT 0,
  gold_earned INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  color TEXT,
  location TEXT,
  gold_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 3. 目标数据表
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal_type TEXT DEFAULT 'numeric',
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  related_dimensions TEXT[] DEFAULT '{}',
  milestones JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;

-- 4. 仪表盘配置表
CREATE TABLE IF NOT EXISTS dashboard_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_modules_user_id ON dashboard_modules(user_id);
ALTER TABLE dashboard_modules DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 完成！现在可以使用邮箱登录和多端同步了
-- ============================================
