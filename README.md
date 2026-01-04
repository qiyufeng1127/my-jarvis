# J.A.R.V.I.S. 智能管理系统 - 云端同步版

## 项目概述

这是一个集成了Supabase后端服务的智能个人管理系统，支持用户登录、实时数据同步、离线模式等功能。

## 功能特性

- ✅ 用户注册/登录系统
- ✅ 实时数据同步
- ✅ 离线模式支持
- ✅ 任务管理
- ✅ 智能对话
- ✅ 数据安全存储
- ✅ 自动部署到Vercel

## 配置步骤

### 第一步：创建Supabase项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 注册账户
3. 创建新项目：
   - 项目名称：`jarvis-smart-system`
   - 数据库密码：设置一个强密码（请记住）
   - 区域：选择离你最近的区域

### 第二步：配置数据库

1. 在Supabase控制台，进入 "SQL Editor"
2. 复制 `database-schema.sql` 文件的全部内容
3. 粘贴到SQL编辑器中并执行
4. 确认所有表都创建成功

### 第三步：获取API密钥

1. 在Supabase控制台，进入 "Settings" > "API"
2. 复制以下信息：
   - Project URL（项目URL）
   - anon public key（匿名公钥）

### 第四步：配置项目

1. 打开 `supabase-config.js` 文件
2. 替换配置信息：
```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // 替换为你的项目URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY', // 替换为你的匿名公钥
    // ... 其他配置保持不变
};
```

### 第五步：部署到Vercel

#### 方法一：通过GitHub自动部署（推荐）

1. 将项目上传到GitHub：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/jarvis-system.git
git push -u origin main
```

2. 访问 [https://vercel.com](https://vercel.com)
3. 使用GitHub账户登录
4. 点击 "New Project"
5. 选择你的GitHub仓库
6. 点击 "Deploy"

#### 方法二：直接上传部署

1. 访问 [https://vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 选择 "Browse All Templates"
4. 上传项目文件夹
5. 点击 "Deploy"

### 第六步：测试功能

1. 访问部署后的网站
2. 点击 "登录" 按钮
3. 注册新账户或登录现有账户
4. 测试任务管理功能
5. 验证数据同步是否正常

## 文件结构

```
jarvis-system/
├── index-supabase.html      # 主页面文件
├── supabase-config.js       # Supabase配置文件
├── auth-component.html      # 登录组件
├── database-schema.sql      # 数据库表结构
├── vercel.json             # Vercel部署配置
└── README.md               # 项目说明文档
```

## 主要功能说明

### 1. 用户认证系统
- 支持邮箱注册/登录
- 密码强度验证
- 忘记密码重置
- 自动登录状态保持

### 2. 数据同步机制
- 实时数据同步
- 离线数据缓存
- 网络恢复后自动同步
- 冲突解决机制

### 3. 任务管理
- 创建、编辑、删除任务
- 任务状态管理
- 实时同步到云端
- 离线模式支持

### 4. 智能对话
- AI助手对话
- 任务创建建议
- 智能提醒功能

## 安全特性

- 行级安全策略（RLS）
- 用户数据隔离
- API密钥安全存储
- HTTPS加密传输

## 故障排除

### 常见问题

1. **登录失败**
   - 检查Supabase配置是否正确
   - 确认邮箱验证是否完成
   - 检查网络连接

2. **数据不同步**
   - 检查网络状态指示器
   - 确认用户已登录
   - 查看浏览器控制台错误信息

3. **部署失败**
   - 检查vercel.json配置
   - 确认所有文件都已上传
   - 查看Vercel部署日志

### 调试模式

在浏览器控制台中输入以下命令开启调试：
```javascript
localStorage.setItem('debug', 'true');
```

## 扩展功能

系统支持以下扩展：
- 更多数据类型（记忆、金币记录等）
- 实时协作功能
- 移动端适配
- 第三方集成

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Supabase (PostgreSQL + 实时API)
- **部署**: Vercel
- **认证**: Supabase Auth
- **数据库**: PostgreSQL with RLS

## 支持与反馈

如果遇到问题或有改进建议，请：
1. 检查本文档的故障排除部分
2. 查看浏览器控制台的错误信息
3. 确认所有配置步骤都已正确完成

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基础用户认证功能
- 任务管理系统
- 实时数据同步
- Vercel自动部署

---

**注意**: 请确保妥善保管你的Supabase API密钥，不要将其提交到公共代码仓库中。