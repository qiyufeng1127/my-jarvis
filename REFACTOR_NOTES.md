# ADHD Focus v4.0 重构说明

## 📁 新架构目录结构

```
js/
├── core/                    # 核心模块（新）
│   ├── state.js            # 全局状态管理（单一数据源）
│   └── api.js              # 统一API层
│
├── modules/                 # 功能模块（新）
│   ├── finance.js          # 双账本系统（金币+人民币）
│   └── monitor.js          # 统一监控系统
│
├── assistant/               # 语音助手（新）
│   ├── voice-assistant.js  # 全局语音助手
│   └── command-mapper.js   # 指令-动作映射
│
├── ui/                      # UI组件（新）
│   ├── components.js       # 统一UI组件库
│   └── universal-input.js  # 全能输入框
│
├── app-main.js             # 主入口（新）
│
└── [保留的旧文件]           # 仍在使用的模块
    ├── ai-service.js       # AI服务基础
    ├── ai-copilot.js       # AI副驾驶
    ├── ai-learning.js      # AI学习
    ├── ai-memory.js        # AI记忆
    ├── ai-prediction.js    # AI预测
    ├── ai-report.js        # AI报告
    ├── ai-insights-panel.js
    ├── ai-memory-panel.js
    ├── app.js              # 主应用（已精简）
    ├── storage.js          # 存储
    ├── settings.js         # 设置
    ├── canvas.js           # 画布
    ├── reward-system.js    # 奖励系统
    ├── guidance-system.js  # 引导系统
    ├── celebration-effects.js
    ├── brain-dump.js
    └── ...
```

## ✅ 已删除的旧文件（8个）

以下文件功能已被新模块替代，已删除：

| 已删除文件 | 替代模块 |
|-----------|---------|
| `js/procrastination.js` | `js/modules/monitor.js` |
| `js/inefficiency.js` | `js/modules/monitor.js` |
| `js/procrastination-enhanced.js` | `js/modules/monitor.js` |
| `js/unified-monitor.js` | `js/modules/monitor.js` |
| `js/value-visualizer.js` | `js/modules/finance.js` |
| `js/ai-finance.js` | `js/modules/finance.js` |
| `js/unified-voice-system.js` | `js/assistant/voice-assistant.js` |
| `js/voice-settings-panel.js` | `js/assistant/voice-assistant.js` |

## ✅ 已删除的旧CSS文件（3个）

| 已删除文件 | 替代模块 |
|-----------|---------|
| `styles/procrastination-enhanced.css` | `styles/components.css` |
| `styles/unified-monitor.css` | `styles/components.css` |
| `styles/voice-settings.css` | `styles/components.css` |

## ✅ 新模块功能说明

### 1. GlobalState (js/core/state.js)
- **单一数据源**：所有状态集中管理
- **响应式更新**：订阅/发布模式
- **自动持久化**：localStorage自动同步
- **包含**：用户信息、金币、人民币、任务、时间轴、记忆、设置

### 2. UnifiedAPI (js/core/api.js)
- **统一AI调用**：所有AI服务通过此模块
- **请求队列**：防止并发过多
- **错误处理**：统一错误处理和重试
- **方法**：chat、breakdownTask、parseVoiceCommand、analyzeEmotion等

### 3. FinanceSystem (js/modules/finance.js)
- **双账本分离**：
  - 💰 金币（虚拟激励积分）
  - 💴 人民币（真实财务记录）
- **货币兑换所**：人民币可兑换金币
- **收入分类统计**
- **财务目标追踪**

### 4. MonitorSystem (js/modules/monitor.js)
- **合并监控**：拖延监控 + 效率监控
- **任务状态关联**：任务完成自动终止监控
- **智能提醒**：预警 → 警报 → 递增扣币
- **暂停功能**：付费暂停

### 5. VoiceAssistant (js/assistant/voice-assistant.js)
- **全局语音助手**：可控制所有组件
- **热词唤醒**："嘿助手"
- **自然语言理解**
- **语音播报**

### 6. CommandMapper (js/assistant/command-mapper.js)
- **指令模式库**：本地快速匹配
- **支持指令**：
  - 计时器：开始25分钟专注
  - 任务：3点开会、完成写周报
  - 收入：卖出插画收入1500
  - 查询：我有多少金币
  - 监控：开启/关闭监控

### 7. UIComponents (js/ui/components.js)
- **Toast通知**
- **模态框**
- **加载状态**
- **表单组件**
- **卡片组件**
- **列表组件**
- **标签页**
- **动画效果**

### 8. UniversalInput (js/ui/universal-input.js)
- **全能输入框**：一框搞定所有
- **智能识别**：自动判断任务/收入/指令/聊天
- **模式切换**：手动选择输入类型
- **快捷操作**：一键专注、完成任务等
- **语音输入**

## 🗑️ 可清理的旧文件（功能已合并）

以下文件功能已被新模块替代，可在确认稳定后删除：

### 监控相关（已合并到 monitor.js）
- [ ] `js/procrastination.js` - 旧拖延监控
- [ ] `js/inefficiency.js` - 低效率监控
- [ ] `js/procrastination-enhanced.js` - 增强版拖延监控
- [ ] `js/unified-monitor.js` - 旧统一监控

### 语音相关（已合并到 voice-assistant.js）
- [ ] `js/unified-voice-system.js` - 旧语音系统
- [ ] `js/voice-settings-panel.js` - 语音设置面板

### AI服务相关（已合并到 api.js）
- [ ] `js/ai-service.js` - 可保留作为备用
- [ ] `js/ai-copilot.js` - 部分功能合并
- [ ] `js/ai-finance.js` - 已合并到 finance.js

### 价值相关（已合并到 finance.js）
- [ ] `js/value-visualizer.js` - 旧价值显化器

## 🔄 迁移步骤

1. **测试新模块**：确保所有新功能正常工作
2. **数据迁移**：旧数据格式自动兼容
3. **逐步禁用旧模块**：注释掉旧脚本引用
4. **删除旧文件**：确认无问题后删除

## 📝 兼容性说明

新模块提供了旧版API的兼容层：
- `window.ProcrastinationMonitor` → `MonitorSystem`
- `window.ValueVisualizer` → `FinanceSystem`
- `window.Storage` → `GlobalState`
- `Settings.showToast` → `UIComponents.toast`

## 🎯 后续优化建议

1. **性能优化**：懒加载非核心模块
2. **离线支持**：增强PWA功能
3. **数据同步**：云端备份
4. **主题系统**：更多主题选择
5. **插件系统**：支持扩展

---

*重构完成日期：2026-01-16*
*版本：v4.0.0*

