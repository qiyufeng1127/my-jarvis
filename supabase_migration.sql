-- ============================================
-- Supabase 数据库表结构迁移脚本
-- ============================================

-- 1. 任务历史记录表
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_type TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL,
  actual_duration INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 任务模板表
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  is_built_in BOOLEAN DEFAULT FALSE,
  tasks JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 副业追踪表（如果不存在）
CREATE TABLE IF NOT EXISTS side_hustles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  total_income DECIMAL(10,2) DEFAULT 0,
  total_expense DECIMAL(10,2) DEFAULT 0,
  transactions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 记忆存储表
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  importance INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 成长数据表
CREATE TABLE IF NOT EXISTS growth_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  value DECIMAL(10,2) DEFAULT 0,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI配置表
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  api_endpoint TEXT,
  model TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 8. 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 9. 主题设置表
CREATE TABLE IF NOT EXISTS theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode TEXT DEFAULT 'light',
  accent_color TEXT DEFAULT 'blue',
  custom_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 10. 教程进度表
CREATE TABLE IF NOT EXISTS tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_steps TEXT[] DEFAULT '{}',
  current_step TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- 创建索引以优化查询性能
-- ============================================

-- 任务历史索引
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_completed_at ON task_history(completed_at DESC);

-- 任务模板索引
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);

-- 副业索引
CREATE INDEX IF NOT EXISTS idx_side_hustles_user_id ON side_hustles(user_id);
CREATE INDEX IF NOT EXISTS idx_side_hustles_status ON side_hustles(status);

-- 记忆索引
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);

-- 通知索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 成长数据索引
CREATE INDEX IF NOT EXISTS idx_growth_data_user_id ON growth_data(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_data_dimension ON growth_data(dimension);

-- ============================================
-- 设置 RLS (Row Level Security) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_hustles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view own task_history" ON task_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own task_history" ON task_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task_history" ON task_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task_history" ON task_history FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own task_templates" ON task_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own task_templates" ON task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task_templates" ON task_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task_templates" ON task_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own side_hustles" ON side_hustles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own side_hustles" ON side_hustles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own side_hustles" ON side_hustles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own side_hustles" ON side_hustles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memories" ON memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON memories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own growth_data" ON growth_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own growth_data" ON growth_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own growth_data" ON growth_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own growth_data" ON growth_data FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ai_config" ON ai_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_config" ON ai_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai_config" ON ai_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai_config" ON ai_config FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own user_settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own theme_settings" ON theme_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own theme_settings" ON theme_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own theme_settings" ON theme_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own theme_settings" ON theme_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tutorial_progress" ON tutorial_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tutorial_progress" ON tutorial_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tutorial_progress" ON tutorial_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tutorial_progress" ON tutorial_progress FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 创建自动更新 updated_at 的触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_history_updated_at BEFORE UPDATE ON task_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_side_hustles_updated_at BEFORE UPDATE ON side_hustles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_growth_data_updated_at BEFORE UPDATE ON growth_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_config_updated_at BEFORE UPDATE ON ai_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON theme_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorial_progress_updated_at BEFORE UPDATE ON tutorial_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

