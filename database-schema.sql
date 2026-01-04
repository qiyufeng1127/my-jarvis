-- JARVIS智能管理系统 - Supabase数据库表结构
-- 请在Supabase SQL编辑器中执行这些SQL语句

-- 1. 用户扩展信息表
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    total_coins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 任务表
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    priority TEXT DEFAULT 'medium', -- low, medium, high
    category TEXT DEFAULT 'general',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- 预估时长（分钟）
    actual_duration INTEGER, -- 实际时长（分钟）
    progress INTEGER DEFAULT 0, -- 进度百分比
    tags TEXT[], -- 标签数组
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 记忆库表
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'thought', -- thought, idea, task, mood, note
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 金币交易记录表
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- 正数为获得，负数为消费
    type TEXT NOT NULL, -- earn, spend
    category TEXT NOT NULL, -- task_complete, procrastination, purchase, reward
    description TEXT,
    related_id UUID, -- 关联的任务或其他记录ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 用户设置表
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 6. 拖延记录表
CREATE TABLE IF NOT EXISTS public.procrastination_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    delay_minutes INTEGER NOT NULL,
    cost_coins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 低效率记录表
CREATE TABLE IF NOT EXISTS public.inefficiency_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    inefficiency_hours DECIMAL(4,2) NOT NULL,
    cost_coins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 专注会话记录表
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    planned_duration INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    interruptions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 分析报告表
CREATE TABLE IF NOT EXISTS public.analysis_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- daily, weekly, monthly, yearly
    report_date DATE NOT NULL,
    content JSONB NOT NULL,
    word_count INTEGER DEFAULT 0,
    cost_coins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, report_type, report_date)
);

-- 10. 中转站项目表
CREATE TABLE IF NOT EXISTS public.inbox_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    item_type TEXT DEFAULT 'text', -- text, file, link, image, idea, task
    status TEXT DEFAULT 'pending', -- pending, processed, archived
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON public.memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON public.memories(created_at);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON public.coin_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_procrastination_user_id ON public.procrastination_records(user_id);
CREATE INDEX IF NOT EXISTS idx_inefficiency_user_id ON public.inefficiency_records(user_id);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON public.analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_items_user_id ON public.inbox_items(user_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procrastination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inefficiency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 用户只能访问自己的数据
-- 用户表策略
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 任务表策略
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 记忆表策略
CREATE POLICY "Users can view own memories" ON public.memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON public.memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON public.memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON public.memories
    FOR DELETE USING (auth.uid() = user_id);

-- 金币交易策略
CREATE POLICY "Users can view own transactions" ON public.coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.coin_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户设置策略
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- 拖延记录策略
CREATE POLICY "Users can view own procrastination" ON public.procrastination_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own procrastination" ON public.procrastination_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 低效率记录策略
CREATE POLICY "Users can view own inefficiency" ON public.inefficiency_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inefficiency" ON public.inefficiency_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 专注会话策略
CREATE POLICY "Users can view own focus sessions" ON public.focus_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions" ON public.focus_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions" ON public.focus_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- 分析报告策略
CREATE POLICY "Users can view own reports" ON public.analysis_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.analysis_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 中转站策略
CREATE POLICY "Users can view own inbox" ON public.inbox_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inbox" ON public.inbox_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox" ON public.inbox_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inbox" ON public.inbox_items
    FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inbox_items_updated_at BEFORE UPDATE ON public.inbox_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建函数来计算用户总金币
CREATE OR REPLACE FUNCTION get_user_total_coins(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM public.coin_transactions
    WHERE user_id = user_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数来更新用户总金币（在用户表中）
CREATE OR REPLACE FUNCTION update_user_total_coins()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET total_coins = get_user_total_coins(NEW.user_id)
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器来自动更新用户总金币
CREATE TRIGGER update_user_coins_on_transaction 
    AFTER INSERT ON public.coin_transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_total_coins();

-- 插入一些示例数据（可选）
-- 注意：这些数据只有在用户注册后才会有效

-- 创建视图来简化查询
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.level,
    u.total_coins,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT m.id) as total_memories,
    COUNT(DISTINCT f.id) as total_focus_sessions,
    COALESCE(AVG(f.duration_minutes), 0) as avg_focus_duration
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.user_id
LEFT JOIN public.memories m ON u.id = m.user_id
LEFT JOIN public.focus_sessions f ON u.id = f.user_id
GROUP BY u.id, u.full_name, u.level, u.total_coins;

-- 授予必要的权限
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 完成！
-- 执行完这些SQL语句后，你的Supabase数据库就准备好了