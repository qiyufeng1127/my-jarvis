# 🎯 语音和 AI 组件使用指南

## 📂 最终文件结构

```
src/
├── components/
│   ├── voice/
│   │   ├── VoiceAssistant.tsx    ✅ Kiki 语音助手（整合后）
│   │   ├── VoiceTutorial.tsx     ✅ 语音教程
│   │   └── index.ts
│   └── ai/
│       ├── AISmartInput.tsx      ✅ AI 智能输入框
│       ├── AIChat.tsx            ✅ AI 对话助手
│       └── index.ts
└── services/
    ├── voiceWakeService.ts       ✅ 语音服务核心
    ├── voiceCommandService.ts    ✅ 语音指令解析
    └── aiSmartService.ts         ✅ AI 智能处理
```

## 🎤 组件说明

### 1️⃣ VoiceAssistant - Kiki 语音助手
**文件**: `src/components/voice/VoiceAssistant.tsx`

**功能**:
- 🎯 语音唤醒（"Kiki宝宝"）
- 🎙️ 8秒倒计时监听
- 🔊 语音反馈和提示音
- 📳 设备震动
- 🌊 声波动画
- 💬 实时语音识别显示

**使用方式**:
```tsx
import { VoiceAssistant } from '@/components/voice';

// 浮动按钮模式（右下角）
<VoiceAssistant mode="float" />

// 内联模式（嵌入其他组件）
<VoiceAssistant 
  mode="inline" 
  isDark={true}
  onCommand={(cmd) => console.log(cmd)}
/>
```

---

### 2️⃣ AISmartInput - AI 智能输入框
**文件**: `src/components/ai/AISmartInput.tsx`

**功能**:
- 📝 文字输入
- 🎤 语音输入（可切换）
- 🤖 AI 任务分解
- ⏰ 智能时间安排
- 💰 金币自动计算
- 🏷️ 标签自动生成

**使用方式**:
```tsx
import { AISmartInput } from '@/components/ai';

<AISmartInput 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  isDark={isDark}
/>
```

---

## 🔧 如何修改

### 修改 Kiki 语音助手
👉 **只需修改**: `src/components/voice/VoiceAssistant.tsx`

包含所有语音相关功能：
- 唤醒逻辑
- 监听倒计时
- 语音识别
- 反馈动画
- UI 显示

### 修改 AI 智能输入
👉 **只需修改**: `src/components/ai/AISmartInput.tsx`

包含所有 AI 输入功能：
- 输入界面
- 语音/文字切换
- AI 对话
- 任务处理

---

## ✅ 整合成果

### 删除的文件（已整合）
- ❌ VoiceButton.tsx
- ❌ VoiceWakeButton.tsx  
- ❌ VoiceFeedbackAnimation.tsx

### 保留的核心文件
- ✅ **VoiceAssistant.tsx** - Kiki 语音助手
- ✅ **AISmartInput.tsx** - AI 智能输入
- ✅ **VoiceTutorial.tsx** - 语音教程
- ✅ **AIChat.tsx** - AI 对话

---

## 🎨 两个组件的区别

| 特性 | VoiceAssistant | AISmartInput |
|------|----------------|--------------|
| **定位** | 快速语音助手 | 智能输入框 |
| **显示方式** | 浮动按钮 | 模态对话框 |
| **输入方式** | 仅语音 | 语音+文字 |
| **主要功能** | 语音指令 | 任务分解 |
| **使用场景** | 随时唤醒 | 复杂任务 |

---

## 💡 使用建议

1. **日常快速操作** → 使用 VoiceAssistant（说"Kiki宝宝"唤醒）
2. **复杂任务规划** → 使用 AISmartInput（点击模块打开）
3. **查看语音指令** → 使用 VoiceTutorial（查看教程）
4. **AI 对话咨询** → 使用 AIChat（深度对话）

---

## 📝 修改示例

### 例子1: 修改唤醒词
打开 `VoiceAssistant.tsx`，找到：
```tsx
wakeWord = 'kiki宝宝'
```
改为你想要的唤醒词。

### 例子2: 修改监听时长
打开 `VoiceAssistant.tsx`，找到：
```tsx
setListeningTimer(8);  // 改为你想要的秒数
```

### 例子3: 修改 AI 输入框样式
打开 `AISmartInput.tsx`，修改样式相关代码。

---

**整合完成** ✅  
现在你只需要关注两个主要文件即可！

