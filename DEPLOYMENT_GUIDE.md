# 🎉 ManifestOS 最终部署指南

## ✅ Supabase 已配置

你的 Supabase 项目信息：
- **Project URL**: https://nucvylmszllecoupjfbh.supabase.co
- **Anon Key**: 已配置到 `.env` 文件
- **状态**: ✅ 已就绪

---

## 🚀 立即启动项目

### 1. 安装依赖（首次运行）

```bash
npm install
```

**预计时间**: 2-5 分钟

### 2. 设置数据库

#### 方法 A：使用 Supabase 控制台（推荐）

1. 访问你的 Supabase 项目：
   ```
   https://supabase.com/dashboard/project/nucvylmszllecoupjfbh
   ```

2. 点击左侧菜单的 **SQL Editor**

3. 点击 **New Query**

4. 复制 `supabase/schema.sql` 的全部内容

5. 粘贴到编辑器中

6. 点击 **Run** 执行

7. 等待执行完成（约 10-30 秒）

#### 验证数据库

执行成功后，在 **Table Editor** 中应该能看到 13 个表：
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

### 3. 启动开发服务器

```bash
npm run dev
```

你应该看到：
```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 4. 访问应用

打开浏览器访问：
```
http://localhost:3000
```

---

## 🎯 首次使用指南

### 欢迎页面

1. 你会看到精美的欢迎页面
2. 点击 **"开始我的成长之旅"** 按钮
3. 系统会自动创建用户并初始化数据

### 主控面板

进入后你会看到：

#### 左侧 - 成长面板
- 📊 成长进度环（显示总体进度）
- 📈 5 个成长维度（执行力、专注力、健康力、财富力、魅力值）
- 🎯 每个维度都有进度条

#### 中间 - 任务时间轴
- ➕ 点击"添加任务"创建第一个任务
- 📝 填写任务信息（标题、类型、时长等）
- ✅ 任务会显示在时间轴上

#### 右侧 - 目标和金币
- 💰 金币余额（初始 1000 金币）
- 🎯 长期目标列表
- 📊 目标进度追踪

#### 右下角 - Kiki 宝宝
- 🎤 点击语音按钮
- 🗣️ 说"查看今天的任务"或"我的成长进度"
- 🔊 Kiki 会语音回应

---

## 🎨 功能演示

### 1. 创建任务

```
1. 点击"添加任务"按钮
2. 填写任务信息：
   - 标题：写项目报告
   - 类型：工作
   - 优先级：高
   - 时长：120 分钟
   - 开始时间：选择时间
3. 点击"创建任务"
4. 任务出现在时间轴上
```

### 2. 使用语音助手

```
1. 点击右下角 🎤 按钮
2. 听到"我在，请说"
3. 说出指令：
   - "查看今天的任务"
   - "我的成长进度"
   - "给我一点鼓励"
4. Kiki 会语音回应并执行操作
```

### 3. 查看成长进度

```
1. 左侧面板显示实时进度
2. 点击维度查看详情
3. 完成任务后自动增长
4. 达到阈值自动升级
```

---

## 🔧 常见问题

### Q1: 依赖安装失败？

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules

# 重新安装
npm install
```

### Q2: 数据库连接失败？

**检查**:
1. `.env` 文件是否存在
2. Supabase URL 和 Key 是否正确
3. 网络连接是否正常

**解决**:
```bash
# 查看环境变量
cat .env

# 重启开发服务器
npm run dev
```

### Q3: 语音功能不工作？

**原因**: 浏览器可能不支持或需要 HTTPS

**解决**:
1. 使用 Chrome 或 Edge 浏览器
2. 允许麦克风权限
3. 在 localhost 上测试（已支持）

### Q4: 页面空白或报错？

**检查**:
1. 浏览器控制台是否有错误
2. 数据库表是否创建成功
3. 环境变量是否配置正确

**解决**:
```bash
# 重新构建
npm run build

# 清除浏览器缓存
Ctrl + Shift + Delete
```

---

## 📊 数据库状态检查

### 在 Supabase 控制台检查

1. 访问 **Table Editor**
2. 确认所有表都已创建
3. 点击 `users` 表，应该是空的（首次）
4. 创建第一个用户后，会自动生成数据

### 初始化数据

首次创建用户时，系统会自动：
- ✅ 创建 5 个默认成长维度
- ✅ 创建 5 个身份层级
- ✅ 创建 4 个默认坏习惯追踪
- ✅ 初始化 1000 金币

---

## 🎯 下一步操作

### 立即可做

1. ✅ **创建第一个任务**
   - 点击"添加任务"
   - 填写信息并保存
   - 查看任务卡片

2. ✅ **测试语音功能**
   - 点击 🎤 按钮
   - 说"查看今天的任务"
   - 听 Kiki 的回应

3. ✅ **查看成长面板**
   - 观察 5 个维度
   - 查看进度条
   - 了解当前等级

4. ✅ **体验通知系统**
   - 完成任务时会弹出通知
   - 自动消失或手动关闭

### 开发建议

1. **自定义成长维度**
   - 编辑 `src/constants/index.ts`
   - 修改 `DEFAULT_GROWTH_DIMENSIONS`
   - 重新初始化用户

2. **添加自定义任务类型**
   - 编辑 `TASK_TYPE_CONFIG`
   - 添加新的类型和图标

3. **调整金币规则**
   - 编辑 `GOLD_CONFIG`
   - 修改奖励和惩罚系数

4. **扩展语音指令**
   - 编辑 `src/hooks/useVoice.ts`
   - 在 `parseVoiceCommand` 中添加新指令

---

## 📚 重要文档

- 📖 **START_HERE.md** - 新手入门指南
- 🛠️ **INSTALLATION.md** - 详细安装步骤
- ⚡ **QUICK_REFERENCE.md** - 快速参考卡片
- 📊 **DEVELOPMENT.md** - 开发指南
- 🎯 **FINAL_STATUS.md** - 项目最终状态

---

## 🎊 恭喜！

你的 ManifestOS 已经完全配置好了！

### 现在可以：
- ✅ 创建和管理任务
- ✅ 追踪成长进度
- ✅ 使用语音助手
- ✅ 记录坏习惯
- ✅ 赚取和使用金币

### 项目特点：
- 🎨 精美的 UI 设计
- ⚡ 流畅的动画效果
- 🎤 智能语音交互
- 📊 实时数据同步
- 💰 完整的金币系统
- 🎯 成长可视化

---

## 🚀 开始你的成长之旅

```bash
npm run dev
```

访问 http://localhost:3000

**让每一天都成为成长的一天！🌱**

---

*ManifestOS - 大女主成长操作系统*  
*通过小任务，完成大蜕变*

---

**配置完成时间**: 2026年1月22日  
**项目状态**: ✅ 已就绪，可立即使用  
**Supabase**: ✅ 已连接  
**完成度**: 75%

