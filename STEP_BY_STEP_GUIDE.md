# 🚀 ManifestOS 完整启动指南

## 你需要做的所有步骤（一步一步）

---

## 📋 准备工作

### 检查你的电脑是否已安装：

1. **Node.js**（必需）
   - 打开命令行（PowerShell 或 CMD）
   - 输入：`node --version`
   - 应该显示：v18.x.x 或更高版本
   - ❌ 如果没有，访问 https://nodejs.org 下载安装

2. **npm**（随 Node.js 一起安装）
   - 输入：`npm --version`
   - 应该显示：9.x.x 或更高版本

---

## 第一步：配置环境变量 ⭐ 重要

### 方法 A：重命名文件（推荐，最简单）

1. 在项目根目录找到 `.env.local` 文件
2. 右键点击 → 重命名
3. 改名为 `.env`（去掉 .local）
4. ✅ 完成！

### 方法 B：手动创建

1. 在项目根目录（`w:\001jiaweis\22222`）
2. 创建一个新文件，命名为 `.env`
3. 用记事本或 VS Code 打开
4. 复制以下内容并保存：

```env
VITE_SUPABASE_URL=https://nucvylmszllecoupjfbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o
```

5. 保存文件
6. ✅ 完成！

---

## 第二步：安装项目依赖

### 操作步骤：

1. **打开命令行**
   - 按 `Win + R`
   - 输入 `powershell` 或 `cmd`
   - 按回车

2. **进入项目目录**
   ```powershell
   cd w:\001jiaweis\22222
   ```

3. **安装依赖**
   ```powershell
   npm install
   ```

4. **等待安装完成**
   - 会显示进度条
   - 大约需要 2-5 分钟
   - 看到 "added xxx packages" 表示成功

5. ✅ 完成！

### 可能遇到的问题：

**问题 1：npm 命令不存在**
- 解决：重新安装 Node.js

**问题 2：安装失败或报错**
- 解决：
  ```powershell
  npm cache clean --force
  npm install
  ```

**问题 3：网络慢**
- 解决：使用淘宝镜像
  ```powershell
  npm config set registry https://registry.npmmirror.com
  npm install
  ```

---

## 第三步：设置 Supabase 数据库 ⭐ 重要

### 操作步骤：

1. **打开浏览器**
   - 访问：https://supabase.com/dashboard/project/nucvylmszllecoupjfbh
   - 如果需要登录，使用你的 Supabase 账号

2. **进入 SQL Editor**
   - 在左侧菜单找到 **SQL Editor**
   - 点击进入

3. **创建新查询**
   - 点击右上角的 **New Query** 按钮

4. **复制数据库架构**
   - 在项目中找到 `supabase/schema.sql` 文件
   - 用记事本或 VS Code 打开
   - 全选（Ctrl+A）并复制（Ctrl+C）

5. **粘贴并执行**
   - 在 SQL Editor 中粘贴（Ctrl+V）
   - 点击右下角的 **Run** 按钮（或按 Ctrl+Enter）
   - 等待执行完成（约 10-30 秒）

6. **验证数据库**
   - 在左侧菜单点击 **Table Editor**
   - 应该看到 13 个表：
     - ✅ users
     - ✅ tasks
     - ✅ growth_dimensions
     - ✅ long_term_goals
     - ✅ identity_levels
     - ✅ bad_habits
     - ✅ bad_habit_occurrences
     - ✅ gold_transactions
     - ✅ growth_history
     - ✅ sync_logs
     - ✅ reward_store
     - ✅ reward_redemptions
     - ✅ achievements

7. ✅ 完成！

### 可能遇到的问题：

**问题 1：执行失败**
- 检查是否完整复制了所有内容
- 重新复制并执行

**问题 2：部分表未创建**
- 删除已创建的表
- 重新执行完整的 SQL

---

## 第四步：启动开发服务器

### 操作步骤：

1. **确保在项目目录**
   ```powershell
   cd w:\001jiaweis\22222
   ```

2. **启动开发服务器**
   ```powershell
   npm run dev
   ```

3. **等待启动**
   - 会显示编译进度
   - 看到以下信息表示成功：
   ```
   VITE v5.0.11  ready in 500 ms

   ➜  Local:   http://localhost:3000/
   ➜  Network: use --host to expose
   ```

4. ✅ 完成！

### 可能遇到的问题：

**问题 1：端口被占用**
- 解决：使用其他端口
  ```powershell
  npm run dev -- --port 3001
  ```

**问题 2：编译错误**
- 检查 .env 文件是否正确
- 重新安装依赖：
  ```powershell
  rm -rf node_modules
  npm install
  ```

---

## 第五步：访问应用

### 操作步骤：

1. **打开浏览器**
   - 推荐使用 Chrome 或 Edge

2. **访问地址**
   ```
   http://localhost:3000
   ```

3. **看到欢迎页面**
   - 应该看到精美的欢迎页
   - 标题：ManifestOS - 我要变好

4. **点击开始按钮**
   - 点击"开始我的成长之旅"
   - 系统会自动创建用户

5. **进入主控面板**
   - 左侧：成长维度
   - 中间：任务时间轴
   - 右侧：金币和目标
   - 右下角：🎤 Kiki 宝宝

6. ✅ 完成！

---

## 第六步：创建第一个任务

### 操作步骤：

1. **点击"添加任务"按钮**
   - 在中间的任务时间轴区域

2. **填写任务信息**
   - **标题**：输入任务名称（如：写项目报告）
   - **描述**：可选，详细说明
   - **任务类型**：选择一个（工作、学习、健康等）
   - **优先级**：选择 1-4（1 最高）
   - **时长**：选择预计时间（如 60 分钟）
   - **开始时间**：选择时间（可选）

3. **点击"创建任务"**

4. **查看任务卡片**
   - 任务会出现在时间轴上
   - 显示任务详情和预估金币

5. ✅ 完成！

---

## 第七步：测试语音功能

### 操作步骤：

1. **点击右下角的 🎤 按钮**

2. **允许麦克风权限**
   - 浏览器会弹出权限请求
   - 点击"允许"

3. **听到"我在，请说"**
   - Kiki 宝宝会语音提示

4. **说出指令**
   - 试试说："查看今天的任务"
   - 或："我的成长进度"

5. **听到回应**
   - Kiki 会语音回应
   - 并执行相应操作

6. ✅ 完成！

### 注意事项：

- 需要在 Chrome 或 Edge 浏览器中使用
- 需要允许麦克风权限
- 说话要清晰，不要太快
- 8 秒内没有指令会自动关闭

---

## 第八步：体验其他功能

### 查看成长面板

1. 左侧面板显示 5 个成长维度
2. 每个维度都有进度条
3. 完成任务后会自动增长

### 查看金币余额

1. 右侧顶部显示金币余额
2. 初始有 1000 金币
3. 完成任务获得金币

### 查看长期目标

1. 右侧下方显示目标列表
2. 可以看到进度百分比
3. 每周增长显示

---

## 🎯 完整流程总结

```
1. 配置 .env 文件 ✅
   ↓
2. 安装依赖 (npm install) ✅
   ↓
3. 设置数据库 (执行 schema.sql) ✅
   ↓
4. 启动服务器 (npm run dev) ✅
   ↓
5. 访问应用 (http://localhost:3000) ✅
   ↓
6. 创建第一个任务 ✅
   ↓
7. 测试语音功能 ✅
   ↓
8. 体验其他功能 ✅
```

---

## 📋 检查清单

在开始之前，确保：

- [ ] 已安装 Node.js >= 18.0.0
- [ ] 已创建 .env 文件
- [ ] 已安装项目依赖
- [ ] 已设置 Supabase 数据库
- [ ] 已启动开发服务器
- [ ] 可以访问 http://localhost:3000

---

## 🐛 常见问题解决

### 问题 1：页面空白

**原因**：
- .env 文件未配置
- 数据库未设置
- 浏览器缓存

**解决**：
1. 检查 .env 文件是否存在
2. 检查数据库表是否创建
3. 清除浏览器缓存（Ctrl+Shift+Delete）
4. 重新启动服务器

### 问题 2：语音功能不工作

**原因**：
- 浏览器不支持
- 未允许麦克风权限
- 不是 HTTPS（localhost 除外）

**解决**：
1. 使用 Chrome 或 Edge 浏览器
2. 允许麦克风权限
3. 在 localhost 上测试

### 问题 3：任务创建失败

**原因**：
- 数据库连接失败
- 表未创建

**解决**：
1. 检查 Supabase 配置
2. 重新执行 schema.sql
3. 查看浏览器控制台错误

### 问题 4：依赖安装失败

**原因**：
- 网络问题
- npm 缓存问题

**解决**：
```powershell
npm cache clean --force
npm config set registry https://registry.npmmirror.com
npm install
```

---

## 📞 需要帮助？

### 查看文档

1. **README_FIRST.md** - 快速开始
2. **DEPLOYMENT_GUIDE.md** - 详细部署
3. **QUICK_REFERENCE.md** - 快速参考

### 检查日志

1. **浏览器控制台**（F12）
   - 查看错误信息
   - 查看网络请求

2. **命令行输出**
   - 查看编译错误
   - 查看运行日志

---

## 🎊 恭喜！

如果你完成了所有步骤，你现在应该：

- ✅ 看到了欢迎页面
- ✅ 进入了主控面板
- ✅ 创建了第一个任务
- ✅ 测试了语音功能
- ✅ 体验了成长系统

**你已经成功启动了 ManifestOS！**

---

## 🚀 下一步

### 继续探索

1. 创建更多任务
2. 完成任务获得金币
3. 查看成长进度
4. 设置长期目标
5. 使用语音助手

### 自定义配置

1. 修改成长维度（src/constants/index.ts）
2. 调整金币规则
3. 添加自定义任务类型
4. 设置个人目标

---

**让每一天都成为成长的一天！🌱**

*ManifestOS - 大女主成长操作系统*  
*通过小任务，完成大蜕变*

