# 🚀 Supabase 云同步配置指南

## 📋 当前状态

✅ **已完成**：
- ✅ Supabase SDK 已安装
- ✅ 所有 Store 已实现云同步功能
- ✅ 支持离线模式（localStorage 作为后备）
- ✅ 自动双向同步（本地 ↔️ 云端）

❌ **待完成**：
- ❌ 创建 `.env` 文件
- ❌ 在 Supabase 中创建数据库表
- ❌ 配置 Vercel 环境变量

---

## 🔧 第一步：创建 `.env` 文件

在项目根目录创建 `.env` 文件（与 `package.json` 同级），内容如下：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://nucvylmszllecoupjfbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o
```

**注意**：
- `.env` 文件已被 `.gitignore` 忽略，不会上传到 GitHub（安全）
- 本地开发时使用这个文件
- 生产环境需要在 Vercel 中配置环境变量

---

## 🗄️ 第二步：创建数据库表

1. 打开 Supabase Dashboard：https://supabase.com/dashboard/project/nucvylmszllecoupjfbh
2. 点击左侧菜单 **SQL Editor**
3. 点击 **New Query**
4. 复制 `supabase_schema.sql` 文件的全部内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 按钮执行

**或者直接复制以下 SQL**：

```sql
-- ManifestOS 数据库表结构

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
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON long_term_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);

-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许所有操作）
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on goals" ON long_term_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on memories" ON memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on journals" ON journals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on growth_records" ON growth_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
```

执行成功后，你会看到所有表都创建好了。

---

## ☁️ 第三步：配置 Vercel 环境变量

1. 打开 Vercel Dashboard：https://vercel.com/dashboard
2. 选择你的项目 `my-jarvis`
3. 点击 **Settings** → **Environment Variables**
4. 添加以下两个环境变量：

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://nucvylmszllecoupjfbh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o` |

5. 选择应用到所有环境（Production, Preview, Development）
6. 点击 **Save**
7. 重新部署项目（Vercel 会自动触发）

---

## 🧪 第四步：测试云同步

### 本地测试

1. 确保 `.env` 文件已创建
2. 重启开发服务器：
   ```bash
   npm run dev
   ```
3. 打开浏览器控制台（F12）
4. 创建一个任务或记录
5. 检查 Supabase Dashboard → Table Editor，看数据是否已同步

### 生产环境测试

1. 等待 Vercel 部署完成
2. 访问你的网站
3. 创建任务或记录
4. 在另一个设备或浏览器打开网站
5. 刷新页面，数据应该自动同步

---

## 🔄 工作原理

### 双向同步机制

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  浏览器 A   │ ◄─────► │  Supabase   │ ◄─────► │  浏览器 B   │
│ localStorage│         │   云数据库   │         │ localStorage│
└─────────────┘         └─────────────┘         └─────────────┘
```

### 数据流程

1. **创建数据**：
   - 先保存到 localStorage（立即生效）
   - 同时上传到 Supabase（后台同步）

2. **读取数据**：
   - 优先从 Supabase 加载（如果已配置）
   - 如果 Supabase 未配置或失败，从 localStorage 加载

3. **更新数据**：
   - 同时更新 localStorage 和 Supabase

4. **删除数据**：
   - 同时从 localStorage 和 Supabase 删除

### 离线模式

- 如果没有配置 Supabase，系统自动使用 localStorage
- 数据只保存在本地浏览器
- 刷新页面数据不会丢失
- 但无法跨设备同步

---

## 📊 已实现的功能

### ✅ 任务管理（taskStore）
- ✅ 创建任务 → 自动同步到云端
- ✅ 更新任务 → 自动同步到云端
- ✅ 删除任务 → 自动从云端删除
- ✅ 加载任务 → 从云端加载

### ✅ 长期目标（goalStore）
- ✅ 创建目标 → 自动同步到云端
- ✅ 更新目标 → 自动同步到云端
- ✅ 删除目标 → 自动从云端删除
- ✅ 更新进度 → 自动同步到云端
- ✅ 加载目标 → 从云端加载

### ✅ 全景记忆（memoryStore）
- ✅ 添加记忆 → 自动同步到云端
- ✅ 删除记忆 → 自动从云端删除
- ✅ 添加日记 → 自动同步到云端
- ✅ 删除日记 → 自动从云端删除

### ✅ 用户数据（userStore）
- ✅ 创建用户 → 自动同步到云端
- ✅ 更新用户 → 自动同步到云端
- ✅ 更新设置 → 自动同步到云端
- ✅ 初始化用户 → 从云端加载

---

## 🔍 调试技巧

### 检查是否已配置 Supabase

打开浏览器控制台，输入：

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

如果显示 `undefined`，说明环境变量没有配置成功。

### 查看同步日志

所有同步操作都会在控制台输出日志：
- ✅ 成功：无日志
- ❌ 失败：会输出错误信息

### 查看 Supabase 数据

1. 打开 Supabase Dashboard
2. 点击 **Table Editor**
3. 选择对应的表查看数据

---

## ⚠️ 注意事项

### 安全性

- ✅ `.env` 文件已被 `.gitignore` 忽略，不会上传到 GitHub
- ✅ 使用 `anon key`（公开密钥），安全
- ⚠️ **不要**在代码中使用 `service_role` 密钥（超级管理员权限）

### 数据迁移

如果你之前已经有本地数据：
1. 配置好 Supabase 后
2. 第一次加载时，系统会从 localStorage 读取数据
3. 创建新任务/目标时，会自动同步到云端
4. 旧数据需要手动重新创建（或编写迁移脚本）

### 性能优化

- ✅ 使用 localStorage 作为缓存，减少网络请求
- ✅ 异步上传，不阻塞 UI
- ✅ 批量操作时自动合并请求

---

## 🎉 完成后的效果

配置完成后，你将拥有：

1. ✅ **跨设备同步**：在手机、电脑、平板上数据实时同步
2. ✅ **数据持久化**：刷新页面、清除缓存都不会丢失数据
3. ✅ **云端备份**：数据安全存储在 Supabase 云端
4. ✅ **离线支持**：没有网络时也能正常使用
5. ✅ **自动同步**：联网后自动同步数据

---

## 📞 遇到问题？

### 常见问题

**Q: 数据没有同步到云端？**
- 检查 `.env` 文件是否创建
- 检查环境变量是否正确
- 检查浏览器控制台是否有错误
- 检查 Supabase 表是否创建成功

**Q: Vercel 部署后无法同步？**
- 检查 Vercel 环境变量是否配置
- 重新部署项目
- 检查 Vercel 部署日志

**Q: 如何清空所有数据？**
- 在 Supabase Dashboard → Table Editor 中删除表数据
- 清除浏览器 localStorage：`localStorage.clear()`

---

## 🚀 下一步

配置完成后，你可以：

1. 测试云同步功能
2. 在多个设备上登录测试
3. 查看 Supabase Dashboard 中的数据
4. 根据需要调整 RLS 策略（行级安全）

祝你使用愉快！🎊

