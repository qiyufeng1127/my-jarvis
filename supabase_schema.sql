-- ============================================
-- 金币数据表
-- ============================================
CREATE TABLE IF NOT EXISTS gold_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,  -- Supabase Auth 用户ID
  balance INTEGER DEFAULT 0,
  today_earned INTEGER DEFAULT 0,
  today_spent INTEGER DEFAULT 0,
  transactions JSONB DEFAULT '[]'::jsonb,
  last_reset_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为 user_id 创建索引
CREATE INDEX IF NOT EXISTS idx_gold_data_user_id ON gold_data(user_id);

-- 禁用行级安全策略（因为已在Supabase后台关闭认证验证）
ALTER TABLE gold_data DISABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "Users can view their own gold data" ON gold_data;
DROP POLICY IF EXISTS "Users can insert their own gold data" ON gold_data;
DROP POLICY IF EXISTS "Users can update their own gold data" ON gold_data;

-- ============================================
-- 任务数据表
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  -- Supabase Auth 用户ID
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 为 user_id 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- 禁用行级安全策略
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- ============================================
-- 目标数据表
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  target_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;

-- ============================================
-- 日记数据表
-- ============================================
CREATE TABLE IF NOT EXISTS journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  content TEXT,
  mood TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON journals(date);
ALTER TABLE journals DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own journals" ON journals;
DROP POLICY IF EXISTS "Users can insert their own journals" ON journals;
DROP POLICY IF EXISTS "Users can update their own journals" ON journals;
DROP POLICY IF EXISTS "Users can delete their own journals" ON journals;

-- ============================================
-- 记忆数据表
-- ============================================
CREATE TABLE IF NOT EXISTS memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'note',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own memories" ON memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON memories;

-- ============================================
-- 仪表盘模块配置表
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_modules_user_id ON dashboard_modules(user_id);
ALTER TABLE dashboard_modules DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own dashboard modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Users can insert their own dashboard modules" ON dashboard_modules;
DROP POLICY IF EXISTS "Users can update their own dashboard modules" ON dashboard_modules;
