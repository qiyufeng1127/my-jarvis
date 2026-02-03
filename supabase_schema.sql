-- 金币数据表
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

-- 为 user_id 创建索引
CREATE INDEX IF NOT EXISTS idx_gold_data_user_id ON gold_data(user_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE gold_data ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view their own gold data"
  ON gold_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gold data"
  ON gold_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gold data"
  ON gold_data FOR UPDATE
  USING (auth.uid() = user_id);

-- 任务数据表（如果还没有）
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
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

-- 启用行级安全策略
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的任务
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 目标数据表
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

-- 为 user_id 创建索引
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- 启用行级安全策略
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的目标
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- 日记数据表
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

-- 为 user_id 和 date 创建索引
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON journals(date);

-- 启用行级安全策略
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的日记
CREATE POLICY "Users can view their own journals"
  ON journals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journals"
  ON journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journals"
  ON journals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journals"
  ON journals FOR DELETE
  USING (auth.uid() = user_id);

-- 记忆数据表
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

-- 为 user_id 创建索引
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);

-- 启用行级安全策略
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的记忆
CREATE POLICY "Users can view their own memories"
  ON memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
  ON memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON memories FOR DELETE
  USING (auth.uid() = user_id);

-- 仪表盘模块配置表
CREATE TABLE IF NOT EXISTS dashboard_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为 user_id 创建索引
CREATE INDEX IF NOT EXISTS idx_dashboard_modules_user_id ON dashboard_modules(user_id);

-- 启用行级安全策略
ALTER TABLE dashboard_modules ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的仪表盘配置
CREATE POLICY "Users can view their own dashboard modules"
  ON dashboard_modules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard modules"
  ON dashboard_modules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard modules"
  ON dashboard_modules FOR UPDATE
  USING (auth.uid() = user_id);
