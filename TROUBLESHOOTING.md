# 🔧 ManifestOS 故障排除指南

## 问题：刷新后数据丢失

### 原因分析

1. **Supabase 未配置或配置错误**
   - 如果 Supabase 未正确配置，数据只会保存在本地
   - 但是代码中的 `loadTasks` 逻辑有问题，导致刷新时数据被清空

2. **Zustand Persist 配置问题**
   - Zustand 的 `persist` 中间件会自动保存到 localStorage
   - 但是 `loadTasks` 函数会覆盖本地数据

3. **Service Worker 缓存错误**
   - CacheStorage API 在某些浏览器中可能失败
   - 需要添加错误处理

### 解决方案

#### 方案 1：配置 Supabase（推荐）

1. **创建 Supabase 项目**
   - 访问 https://supabase.com
   - 创建新项目
   - 获取 Project URL 和 anon key

2. **配置环境变量**
   
创建 `.env` 文件：

```env
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的anon密钥
```

3. **创建数据库表**

在 Supabase SQL Editor 中执行：

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_user_id UUID UNIQUE NOT NULL,
  public_data JSONB DEFAULT '{}',
  device_list JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'life',
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
  tags TEXT[] DEFAULT '{}',
  color TEXT,
  location TEXT,
  gold_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_scheduled_start ON tasks(scheduled_start);
CREATE INDEX idx_tasks_status ON tasks(status);

-- 启用 RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许所有操作，因为使用 anon key）
CREATE POLICY "允许所有用户操作" ON users FOR ALL USING (true);
CREATE POLICY "允许所有任务操作" ON tasks FOR ALL USING (true);
```

#### 方案 2：仅使用本地存储（临时方案）

如果暂时不想配置 Supabase，可以使用纯本地存储：

1. **不要配置 Supabase 环境变量**
   - 删除或注释掉 `.env` 中的 Supabase 配置

2. **数据会自动保存到 localStorage**
   - Zustand persist 会自动处理
   - 刷新后数据会保留

3. **注意事项**
   - 数据只在当前浏览器保存
   - 清除浏览器数据会丢失所有内容
   - 不支持多设备同步

### 已修复的问题

✅ **修复了 taskStore 的 loadTasks 逻辑**
- 添加了详细的日志输出
- Supabase 未配置时不会清空本地数据
- Supabase 加载失败时会回退到本地数据

✅ **修复了 Service Worker 缓存错误**
- 添加了错误处理
- 缓存失败不会影响应用运行
- 添加了离线模式支持

✅ **添加了调试工具**
- 创建了 `check-config.html` 用于检查配置
- 可以查看 localStorage 内容
- 可以清除所有本地数据

## 使用调试工具

1. **打开配置检查页面**
   ```
   http://localhost:5173/check-config.html
   ```

2. **检查配置状态**
   - 查看 Supabase 是否配置
   - 查看用户 ID
   - 查看本地任务数量
   - 查看所有 localStorage 数据

3. **清除数据（如果需要）**
   - 点击"清除所有本地数据"按钮
   - 会清除 localStorage 和所有缓存
   - 页面会自动刷新

## 测试步骤

1. **测试数据持久化**
   ```
   1. 添加几个任务
   2. 刷新页面
   3. 检查任务是否还在
   ```

2. **测试 Supabase 同步**（如果已配置）
   ```
   1. 添加任务
   2. 打开浏览器控制台
   3. 查看是否有 "✅ 任务已保存到 Supabase" 日志
   4. 在 Supabase Dashboard 中查看数据
   ```

3. **测试离线模式**
   ```
   1. 断开网络
   2. 添加任务
   3. 刷新页面
   4. 检查任务是否还在（应该在本地）
   5. 恢复网络
   6. 数据应该自动同步到 Supabase
   ```

## 常见问题

### Q: 为什么我的任务刷新后消失了？

A: 可能的原因：
1. Supabase 未配置，且本地存储被清除
2. 浏览器隐私模式（不保存数据）
3. 浏览器扩展清除了 localStorage

**解决方法**：
- 配置 Supabase（推荐）
- 检查浏览器设置
- 使用调试工具查看数据

### Q: Service Worker 错误怎么办？

A: 这个错误不影响功能，但可以这样解决：
1. 打开浏览器开发者工具
2. Application -> Service Workers
3. 点击 "Unregister" 注销 Service Worker
4. 刷新页面

### Q: 如何完全重置应用？

A: 使用调试工具：
1. 访问 `/check-config.html`
2. 点击"清除所有本地数据"
3. 页面会自动刷新

或者手动清除：
1. 打开浏览器开发者工具
2. Application -> Storage
3. 点击 "Clear site data"

## 联系支持

如果问题仍然存在，请提供以下信息：
- 浏览器版本
- 控制台错误信息
- `/check-config.html` 的检查结果
- 是否配置了 Supabase
