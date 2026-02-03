# Supabase 云端同步配置指南

## 🚀 快速开始（5分钟完成）

### 第1步：创建Supabase项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project"
4. 填写：
   - Name: `manifestos`
   - Database Password: 设置密码（记住它）
   - Region: 选择 `Northeast Asia (Tokyo)` 或离你最近的区域
5. 点击 "Create new project"，等待1-2分钟

### 第2步：获取API密钥

1. 在项目页面，点击左侧 "Settings" → "API"
2. 复制两个值：
   - `Project URL`（例如：https://xxxxx.supabase.co）
   - `anon public` key（一长串字符）

### 第3步：配置环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_SUPABASE_URL=你的Project_URL
VITE_SUPABASE_ANON_KEY=你的anon_public_key
```

**示例：**
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTk5NTU3NjAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 第4步：关闭邮箱验证（重要！）

1. 在Supabase项目中，点击左侧 "Authentication" → "Providers"
2. 找到 "Email" 提供商，点击编辑
3. **关闭 "Confirm email"**（取消勾选）
4. 保存设置

这样用户注册后可以直接登录，无需验证邮箱。

### 第5步：创建数据库表

1. 在Supabase项目中，点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase_schema.sql` 文件的全部内容
4. 粘贴到编辑器中
5. 点击 "Run" 执行

**重要：** 确保所有表都创建成功，没有错误提示。

### 第6步：禁用RLS（行级安全）

由于我们已经在SQL中禁用了RLS，但为了确保，请检查：

1. 点击左侧 "Table Editor"
2. 对于每个表（gold_data, tasks, goals等），点击表名
3. 点击右上角的 "..." → "Edit table"
4. 确保 "Enable Row Level Security (RLS)" 是**关闭**状态

### 第7步：测试

1. 重启开发服务器：`npm run dev`
2. 打开网站，使用邮箱注册/登录
3. 完成一些操作（如获得金币）
4. 在Supabase的 "Table Editor" 中查看 `gold_data` 表，应该能看到数据

## ✅ 验证云同步是否工作

### 测试方法：

1. **电脑端**：
   - 打开网站，用邮箱登录
   - 完成一个任务，获得金币
   - 查看金币余额（例如：100）

2. **手机端**：
   - 在手机浏览器打开网站
   - 用**相同邮箱**登录
   - 应该能看到相同的金币余额（100）

3. **查看控制台**：
   - 按F12打开开发者工具
   - 查看Console，应该看到：
     ```
     ✅ 用户已登录: your@email.com
     ✅ 从云端加载金币数据
     ✅ 金币数据已同步到云端
     ```

## 🐛 常见问题

### 问题1：网站白屏

**原因**：Vite配置的base路径问题

**解决**：
1. 检查 `vite.config.ts` 中的 `base` 是否正确
2. 如果部署到GitHub Pages，应该是 `/my-jarvis/`
3. 如果本地开发，应该是 `/`

### 问题2：登录后没有数据同步

**检查清单**：
1. `.env` 文件是否正确配置
2. Supabase表是否创建成功
3. RLS是否已禁用
4. 邮箱验证是否已关闭
5. 浏览器控制台是否有错误

### 问题3：提示"Supabase未配置"

**解决**：
1. 确认 `.env` 文件在项目根目录
2. 确认环境变量名称正确（必须以 `VITE_` 开头）
3. 重启开发服务器

### 问题4：数据库操作失败

**可能原因**：
1. RLS未正确禁用
2. 表结构不正确
3. user_id类型不匹配

**解决**：
1. 重新执行 `supabase_schema.sql`
2. 确保所有表的RLS都是禁用状态

## 📊 数据表说明

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| gold_data | 金币系统 | balance, transactions |
| tasks | 任务管理 | title, status, due_date |
| goals | 目标追踪 | title, progress |
| journals | 日记记录 | date, content |
| memories | 记忆存储 | title, content |
| dashboard_modules | 仪表盘配置 | modules |

## 🔐 安全说明

- 虽然禁用了RLS，但每个用户的数据通过 `user_id` 隔离
- 用户只能通过登录获取自己的 `user_id`
- 不同用户的数据不会互相干扰
- 建议在生产环境中启用RLS并配置正确的策略

## 💡 提示

- 首次登录会自动注册
- 同一邮箱可在多设备登录
- 数据自动同步，无需手动操作
- 离线时数据保存在本地，联网后自动同步

## 📞 需要帮助？

如果遇到问题：
1. 查看浏览器控制台的错误信息
2. 查看Supabase项目的Logs（左侧菜单）
3. 确认所有配置步骤都已完成

