-- 完整的清理和重建脚本
-- 先删除所有旧的策略和触发器，然后重新创建

-- 1. 删除所有旧的策略
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all operations on goals" ON long_term_goals;
DROP POLICY IF EXISTS "Allow all operations on memories" ON memories;
DROP POLICY IF EXISTS "Allow all operations on journals" ON journals;
DROP POLICY IF EXISTS "Allow all operations on growth_records" ON growth_records;
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all operations on dashboard_modules" ON dashboard_modules;

-- 2. 删除所有旧的触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_goals_updated_at ON long_term_goals;
DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
DROP TRIGGER IF EXISTS update_journals_updated_at ON journals;

-- 3. 现在执行完整的 supabase_schema.sql 文件
-- 复制 supabase_schema.sql 的全部内容到这里执行

