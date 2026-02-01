# 数据重置指南

## 📋 概述

本指南将帮助您将网站的所有数据重置为初始状态，包括：
- ✅ 任务数据
- ✅ 成长系统数据
- ✅ 金币经济数据
- ✅ 坏习惯数据
- ✅ 副业追踪数据
- ✅ 记忆/日记数据
- ✅ 通知数据

## ⚠️ 重要警告

**此操作将永久删除所有数据，无法恢复！请确保：**
1. 已备份重要数据
2. 确认要清空所有数据
3. 了解此操作的后果

## 🔄 重置方法

### 方法一：完全重置（推荐）

#### 步骤 1：重置云端数据（Supabase）

1. 打开 Supabase 控制台
2. 进入 SQL Editor
3. 复制 `supabase_reset_all_data.sql` 的内容
4. 粘贴到 SQL Editor
5. 点击 "Run" 执行

**或者使用命令行：**
```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase_reset_all_data.sql
```

#### 步骤 2：重置本地数据（localStorage）

1. 打开网站
2. 按 F12 打开浏览器控制台
3. 复制 `reset_local_storage.js` 的内容
4. 粘贴到控制台
5. 按回车执行
6. 点击"确定"刷新页面

#### 步骤 3：验证重置

刷新页面后，检查以下内容：
- [ ] 任务列表为空
- [ ] 金币余额为 0
- [ ] 成长值为 0
- [ ] 长期目标列表为空
- [ ] 副业列表为空
- [ ] 坏习惯列表为空

### 方法二：仅重置本地数据

如果您只想重置本地数据（不影响云端）：

1. 打开浏览器控制台（F12）
2. 执行 `reset_local_storage.js` 脚本
3. 刷新页面

### 方法三：仅重置云端数据

如果您只想重置云端数据（不影响本地）：

1. 在 Supabase 执行 `supabase_reset_all_data.sql`
2. 刷新页面（会自动同步）

### 方法四：手动清空浏览器数据

1. 打开浏览器设置
2. 进入"隐私和安全"
3. 点击"清除浏览数据"
4. 选择：
   - ✅ Cookie 和其他网站数据
   - ✅ 缓存的图片和文件
   - ✅ 网站设置
5. 时间范围选择"全部时间"
6. 点击"清除数据"

## 📝 重置脚本说明

### supabase_reset_all_data.sql

此脚本将清空以下数据库表：

```sql
-- 任务相关
DELETE FROM tasks;
DELETE FROM task_inbox;

-- 成长系统
DELETE FROM growth_dimensions;
DELETE FROM long_term_goals;
DELETE FROM growth_records;

-- 金币经济
DELETE FROM gold_transactions;
DELETE FROM reward_items;
UPDATE users SET gold_balance = 0;

-- 坏习惯
DELETE FROM bad_habits;
DELETE FROM bad_habit_occurrences;

-- 副业追踪
DELETE FROM side_hustles;
DELETE FROM income_records;
DELETE FROM expense_records;
DELETE FROM time_records;
DELETE FROM debt_records;

-- 其他
DELETE FROM memories;
DELETE FROM journals;
DELETE FROM notifications;
DELETE FROM sync_logs;
```

### reset_local_storage.js

此脚本将清空以下本地存储：

```javascript
// localStorage keys
- task-storage
- growth-storage
- goal-storage
- gold-storage
- side-hustle-storage
- memory-storage
- journal-storage
- habit-storage
- notification-storage
- ai-storage

// sessionStorage
- 全部清空

// IndexedDB
- 全部清空
```

## 🎯 分组件重置

如果您只想重置特定组件的数据：

### 仅重置金币经济

**Supabase:**
```sql
DELETE FROM gold_transactions;
DELETE FROM reward_items;
DELETE FROM reward_redemptions;
UPDATE users SET gold_balance = 0;
```

**localStorage:**
```javascript
localStorage.removeItem('gold-storage');
localStorage.removeItem('user-storage');
```

### 仅重置坏习惯

**Supabase:**
```sql
DELETE FROM bad_habits;
DELETE FROM bad_habit_occurrences;
```

**localStorage:**
```javascript
localStorage.removeItem('habit-storage');
```

### 仅重置副业追踪

**Supabase:**
```sql
DELETE FROM side_hustles;
DELETE FROM income_records;
DELETE FROM expense_records;
DELETE FROM time_records;
DELETE FROM debt_records;
```

**localStorage:**
```javascript
localStorage.removeItem('side-hustle-storage');
```

### 仅重置任务

**Supabase:**
```sql
DELETE FROM tasks;
DELETE FROM task_inbox;
```

**localStorage:**
```javascript
localStorage.removeItem('task-storage');
localStorage.removeItem('task_inbox');
```

### 仅重置成长系统

**Supabase:**
```sql
DELETE FROM growth_dimensions;
DELETE FROM long_term_goals;
DELETE FROM growth_records;
DELETE FROM growth_history;
```

**localStorage:**
```javascript
localStorage.removeItem('growth-storage');
localStorage.removeItem('goal-storage');
```

## 🔧 快速重置命令

### 浏览器控制台一键重置

复制以下代码到浏览器控制台：

```javascript
// 快速重置所有本地数据
['task-storage', 'growth-storage', 'goal-storage', 'gold-storage', 'side-hustle-storage', 'memory-storage', 'journal-storage', 'habit-storage', 'notification-storage', 'ai-storage', 'user-storage'].forEach(key => localStorage.removeItem(key));
sessionStorage.clear();
alert('本地数据已重置！');
location.reload();
```

### 仅重置金币和坏习惯

```javascript
// 仅重置金币和坏习惯
['gold-storage', 'habit-storage', 'user-storage'].forEach(key => localStorage.removeItem(key));
alert('金币和坏习惯数据已重置！');
location.reload();
```

## 📊 重置后的初始状态

重置完成后，各组件将恢复到以下状态：

### 金币经济
- 金币余额：0
- 交易记录：空
- 奖励商品：空

### 坏习惯
- 习惯列表：空
- 发生记录：空
- 连续天数：0

### 副业追踪
- 副业列表：空
- 收入记录：空
- 支出记录：空
- 时间记录：空
- 负债记录：空

### 任务管理
- 任务列表：空
- 收集箱：空

### 成长系统
- 成长维度：空
- 长期目标：空
- 成长记录：空
- 等级：1

### 记忆/日记
- 记忆列表：空
- 日记列表：空

## 🛡️ 数据备份建议

在重置之前，建议先备份数据：

### 方法 1：导出 Supabase 数据

```bash
# 导出所有表
pg_dump -h your-project.supabase.co -U postgres -d postgres > backup.sql
```

### 方法 2：导出 localStorage

```javascript
// 导出所有 localStorage 数据
const backup = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  backup[key] = localStorage.getItem(key);
}
console.log(JSON.stringify(backup));
// 复制输出的 JSON 保存到文件
```

### 方法 3：使用浏览器开发者工具

1. F12 打开开发者工具
2. Application → Storage
3. 右键 → Export

## ❓ 常见问题

### Q1: 重置后数据还在？

**A:** 可能的原因：
1. 只重置了本地数据，没有重置云端数据
2. 浏览器缓存未清空
3. 需要强制刷新（Ctrl+Shift+R）

**解决方法：**
1. 同时执行 SQL 脚本和 JS 脚本
2. 清空浏览器缓存
3. 强制刷新页面

### Q2: 可以恢复重置的数据吗？

**A:** 不可以。数据一旦删除无法恢复，除非您提前做了备份。

### Q3: 重置会影响用户账号吗？

**A:** 不会。重置只删除数据，不会删除用户账号。

### Q4: 可以只重置部分数据吗？

**A:** 可以。参考"分组件重置"部分，选择性执行对应的 SQL 和 JS 代码。

### Q5: 重置后需要重新配置吗？

**A:** 部分设置可能需要重新配置：
- API Key
- 用户偏好设置
- 主题颜色
- 通知设置

## 📞 需要帮助？

如果遇到问题：
1. 检查浏览器控制台是否有错误
2. 确认 Supabase 连接正常
3. 尝试清空浏览器缓存
4. 重启浏览器

## ✅ 重置检查清单

完成重置后，请检查：

- [ ] 打开网站，所有数据为空
- [ ] 金币余额显示为 0
- [ ] 任务列表为空
- [ ] 副业列表为空
- [ ] 成长值为 0
- [ ] 长期目标为空
- [ ] 坏习惯列表为空
- [ ] 记忆/日记为空
- [ ] 通知列表为空

如果以上都确认无误，说明重置成功！

---

**重置完成后，您可以重新开始使用网站，所有数据都是全新的！🎉**

