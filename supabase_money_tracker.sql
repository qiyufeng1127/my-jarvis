-- ============================================
-- 副业追踪系统数据库表
-- ============================================

-- 副业表
CREATE TABLE IF NOT EXISTS side_hustles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '💼',
  color TEXT DEFAULT '#3b82f6',
  start_date TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC DEFAULT 0,
  total_income NUMERIC DEFAULT 0,
  total_expense NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  goal_id UUID,
  ai_analysis JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idea')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 收入记录表
CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  side_hustle_id UUID NOT NULL REFERENCES side_hustles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支出记录表
CREATE TABLE IF NOT EXISTS expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  side_hustle_id UUID NOT NULL REFERENCES side_hustles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 时间记录表
CREATE TABLE IF NOT EXISTS time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  side_hustle_id UUID NOT NULL REFERENCES side_hustles(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- 分钟
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  task_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 负债记录表
CREATE TABLE IF NOT EXISTS debt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_side_hustles_user_id ON side_hustles(user_id);
CREATE INDEX IF NOT EXISTS idx_side_hustles_status ON side_hustles(status);
CREATE INDEX IF NOT EXISTS idx_income_records_user_id ON income_records(user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_side_hustle_id ON income_records(side_hustle_id);
CREATE INDEX IF NOT EXISTS idx_income_records_date ON income_records(date);
CREATE INDEX IF NOT EXISTS idx_expense_records_user_id ON expense_records(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_side_hustle_id ON expense_records(side_hustle_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_date ON expense_records(date);
CREATE INDEX IF NOT EXISTS idx_time_records_user_id ON time_records(user_id);
CREATE INDEX IF NOT EXISTS idx_time_records_side_hustle_id ON time_records(side_hustle_id);
CREATE INDEX IF NOT EXISTS idx_time_records_task_id ON time_records(task_id);
CREATE INDEX IF NOT EXISTS idx_debt_records_user_id ON debt_records(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_records_is_paid ON debt_records(is_paid);

-- 添加 side_hustle_id 字段到 tasks 表
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS side_hustle_id UUID REFERENCES side_hustles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_side_hustle_id ON tasks(side_hustle_id);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为副业表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_side_hustles_updated_at ON side_hustles;
CREATE TRIGGER update_side_hustles_updated_at
  BEFORE UPDATE ON side_hustles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为负债表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_debt_records_updated_at ON debt_records;
CREATE TRIGGER update_debt_records_updated_at
  BEFORE UPDATE ON debt_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE side_hustles ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_records ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许所有操作，实际项目中应该根据用户权限设置）
CREATE POLICY "Allow all operations on side_hustles" ON side_hustles FOR ALL USING (true);
CREATE POLICY "Allow all operations on income_records" ON income_records FOR ALL USING (true);
CREATE POLICY "Allow all operations on expense_records" ON expense_records FOR ALL USING (true);
CREATE POLICY "Allow all operations on time_records" ON time_records FOR ALL USING (true);
CREATE POLICY "Allow all operations on debt_records" ON debt_records FOR ALL USING (true);

