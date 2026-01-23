-- 清理脚本：删除所有已存在的触发器和策略
-- 如果遇到"already exists"错误，先执行这个脚本

-- 删除触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_goals_updated_at ON long_term_goals;
DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
DROP TRIGGER IF EXISTS update_journals_updated_at ON journals;

-- 删除策略
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on goals" ON long_term_goals;
DROP POLICY IF EXISTS "Allow all operations on memories" ON memories;
DROP POLICY IF EXISTS "Allow all operations on journals" ON journals;
DROP POLICY IF EXISTS "Allow all operations on growth_records" ON growth_records;
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;

-- 现在可以重新执行 supabase_schema.sql 了

