# 任务验证系统使用示例

## 📚 完整使用示例

### 1. 在设置页面添加验证模式选择

```tsx
// src/pages/Settings.tsx 或 src/components/settings/SettingsPage.tsx

import VerificationModeSettings from '@/components/settings/VerificationModeSettings';

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* 其他设置 */}
      
      {/* 验证模式设置 */}
      <VerificationModeSettings />
      
      {/* 其他设置 */}
    </div>
  );
}
```

### 2. 在任务创建/编辑时配置验证规则

```tsx
// src/components/task/TaskForm.tsx

import { useState } from 'react';

export default function TaskForm() {
  const [task, setTask] = useState({
    title: '早晨洗漱',
    // 百度AI识别关键词
    verificationKeywords: ['干净的牙齿', '清爽的脸', '整齐的洗漱用品', '关掉的水龙头'],
    // 实时识别物品类名
    realtimeObjects: ['toothbrush', 'sink', 'toilet'],
  });

  return (
    <form>
      {/* 任务基本信息 */}
      <input 
        value={task.title}
        onChange={(e) => setTask({ ...task, title: e.target.value })}
      />

      {/* 验证关键词设置 */}
      <div>
        <h3>验证关键词（百度AI）</h3>
        <input 
          placeholder="输入关键词，用逗号分隔"
          value={task.verificationKeywords.join(', ')}
          onChange={(e) => setTask({
            ...task,
            verificationKeywords: e.target.value.split(',').map(k => k.trim())
          })}
        />
      </div>

      {/* 实时识别物品设置 */}
      <div>
        <h3>实时识别物品</h3>
        <ObjectSelector
          onConfirm={(objects) => setTask({ ...task, realtimeObjects: objects })}
          preSelected={task.realtimeObjects}
        />
      </div>
    </form>
  );
}
```

### 3. 在任务执行时使用统一验证组件

```tsx
// src/components/calendar/TaskCard.tsx 或任务执行页面

import { useState } from 'react';
import UnifiedTaskVerification from '@/components/calendar/UnifiedTaskVerification';

export default function TaskCard({ task }) {
  const [showVerification, setShowVerification] = useState(false);

  const handleStartTask = () => {
    // 显示验证界面
    setShowVerification(true);
  };

  const handleVerificationSuccess = () => {
    console.log('✅ 验证成功，开始任务');
    setShowVerification(false);
    // 开始任务逻辑
    startTask();
  };

  const handleVerificationFail = () => {
    console.log('❌ 验证失败');
    setShowVerification(false);
    // 验证失败处理
  };

  const handleSkip = () => {
    console.log('⏭️ 跳过验证');
    setShowVerification(false);
    // 跳过验证，扣除金币
  };

  return (
    <div>
      <button onClick={handleStartTask}>
        开始任务
      </button>

      {showVerification && (
        <UnifiedTaskVerification
          task={{
            id: task.id,
            title: task.title,
            verificationType: 'photo',
            requirement: '请拍摄洗漱完成后的照片',
          }}
          verificationType="start"
          keywords={task.verificationKeywords}
          realtimeObjects={task.realtimeObjects}
          onSuccess={handleVerificationSuccess}
          onFail={handleVerificationFail}
          onSkip={handleSkip}
          timeLimit={120}
        />
      )}
    </div>
  );
}
```

## 🎯 常见任务场景配置

### 场景1：早晨洗漱

```tsx
const washTask = {
  title: '早晨洗漱',
  // 百度AI关键词（智能语义匹配）
  verificationKeywords: [
    '干净的牙齿',
    '清爽的脸',
    '整齐的洗漱用品',
    '关掉的水龙头'
  ],
  // 实时识别物品（精确匹配）
  realtimeObjects: [
    'toothbrush',  // 牙刷
    'sink',        // 水槽
    'toilet'       // 马桶
  ]
};
```

### 场景2：办公学习

```tsx
const studyTask = {
  title: '开始学习',
  verificationKeywords: [
    '打开的笔记本电脑',
    '书',
    '笔记本',
    '整洁的书桌'
  ],
  realtimeObjects: [
    'laptop',      // 笔记本电脑
    'book',        // 书
    'keyboard',    // 键盘
    'mouse'        // 鼠标
  ]
};
```

### 场景3：健身运动

```tsx
const fitnessTask = {
  title: '健身打卡',
  verificationKeywords: [
    '运动服',
    '运动鞋',
    '瑜伽垫',
    '健身器材'
  ],
  realtimeObjects: [
    'sports ball', // 运动球
    'person'       // 人（确保在运动场景）
  ]
};
```

### 场景4：做饭

```tsx
const cookingTask = {
  title: '准备晚餐',
  verificationKeywords: [
    '厨房',
    '食材',
    '锅',
    '灶台'
  ],
  realtimeObjects: [
    'bowl',        // 碗
    'knife',       // 刀
    'spoon',       // 勺子
    'bottle'       // 瓶子
  ]
};
```

### 场景5：整理房间

```tsx
const cleanTask = {
  title: '整理卧室',
  verificationKeywords: [
    '整洁的床',
    '叠好的被子',
    '干净的地面',
    '整齐的书桌'
  ],
  realtimeObjects: [
    'bed',         // 床
    'chair',       // 椅子
    'book'         // 书
  ]
};
```

## 🔄 动态切换验证方式

```tsx
import { useState } from 'react';
import { getVerificationModeSettings } from '@/components/settings/VerificationModeSettings';

export default function TaskExecutionPage() {
  const [verificationMode, setVerificationMode] = useState<'baidu' | 'realtime'>('baidu');

  // 加载用户设置
  useEffect(() => {
    const settings = getVerificationModeSettings();
    setVerificationMode(settings.mode);
  }, []);

  // 允许用户临时切换验证方式
  const switchMode = () => {
    setVerificationMode(prev => prev === 'baidu' ? 'realtime' : 'baidu');
  };

  return (
    <div>
      <button onClick={switchMode}>
        当前模式: {verificationMode === 'baidu' ? '百度AI' : '实时识别'}
        (点击切换)
      </button>

      {/* 使用统一验证组件，会自动根据mode选择 */}
      <UnifiedTaskVerification
        task={task}
        verificationType="start"
        keywords={keywords}
        realtimeObjects={realtimeObjects}
        onSuccess={handleSuccess}
        onFail={handleFail}
        onSkip={handleSkip}
      />
    </div>
  );
}
```

## 📊 验证结果处理

```tsx
const handleVerificationSuccess = () => {
  // 1. 更新任务状态
  updateTaskStatus(task.id, 'in_progress');

  // 2. 记录验证时间
  logVerificationTime(task.id, new Date());

  // 3. 奖励金币
  addGold(10, `完成任务验证: ${task.title}`);

  // 4. 显示成功提示
  toast.success('验证成功！任务已开始');

  // 5. 开始任务计时
  startTaskTimer(task.id);
};

const handleVerificationFail = () => {
  // 1. 扣除金币（已在验证组件内部处理）
  
  // 2. 记录失败次数
  incrementFailCount(task.id);

  // 3. 显示失败提示
  toast.error('验证失败，请重试');

  // 4. 如果失败次数过多，提供帮助
  if (getFailCount(task.id) >= 3) {
    showHelpDialog('验证失败次数过多，需要帮助吗？');
  }
};

const handleSkip = () => {
  // 1. 扣除金币（已在验证组件内部处理）
  
  // 2. 记录跳过行为
  logSkipVerification(task.id);

  // 3. 直接开始任务（降低可信度）
  updateTaskStatus(task.id, 'in_progress', { skippedVerification: true });

  // 4. 显示提示
  toast.warning('已跳过验证，扣除50金币');
};
```

## 🎨 自定义验证UI

```tsx
// 自定义验证成功动画
const CustomSuccessAnimation = () => {
  return (
    <div className="verification-success">
      <Lottie animationData={successAnimation} />
      <p>太棒了！验证通过</p>
    </div>
  );
};

// 自定义验证失败提示
const CustomFailMessage = ({ reason, suggestions }) => {
  return (
    <div className="verification-fail">
      <h3>验证未通过</h3>
      <p>{reason}</p>
      <ul>
        {suggestions.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
      <button onClick={retry}>重新验证</button>
    </div>
  );
};
```

## 🔧 高级配置

### 根据任务类型自动选择验证方式

```tsx
const getOptimalVerificationMode = (taskType: string) => {
  // 洗漱、健身等需要拍摄人物的任务，推荐百度AI（更智能）
  if (['wash', 'fitness', 'selfcare'].includes(taskType)) {
    return 'baidu';
  }

  // 整理物品、办公学习等，推荐实时识别（更快）
  if (['organize', 'study', 'work'].includes(taskType)) {
    return 'realtime';
  }

  // 默认使用用户设置
  return getVerificationModeSettings().mode;
};
```

### 验证历史记录

```tsx
interface VerificationHistory {
  taskId: string;
  timestamp: Date;
  mode: 'baidu' | 'realtime';
  success: boolean;
  recognizedItems: string[];
  matchedKeywords: string[];
  duration: number; // 验证耗时（秒）
}

const saveVerificationHistory = (history: VerificationHistory) => {
  const histories = JSON.parse(localStorage.getItem('verification_history') || '[]');
  histories.push(history);
  localStorage.setItem('verification_history', JSON.stringify(histories));
};

const getVerificationStats = () => {
  const histories: VerificationHistory[] = JSON.parse(
    localStorage.getItem('verification_history') || '[]'
  );

  return {
    totalVerifications: histories.length,
    successRate: histories.filter(h => h.success).length / histories.length,
    averageDuration: histories.reduce((sum, h) => sum + h.duration, 0) / histories.length,
    mostUsedMode: histories.reduce((acc, h) => {
      acc[h.mode] = (acc[h.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};
```

## 📱 移动端优化

```tsx
// 检测设备类型
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// 移动端推荐使用实时识别（更流畅）
const getMobileOptimizedMode = () => {
  if (isMobile) {
    return 'realtime'; // 移动端推荐实时识别
  }
  return getVerificationModeSettings().mode;
};

// 移动端相机配置
const mobileCamera Config = {
  video: {
    facingMode: 'environment', // 使用后置摄像头
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }
};
```

## 🎯 完整集成示例

```tsx
// src/pages/TaskExecutionPage.tsx

import { useState, useEffect } from 'react';
import UnifiedTaskVerification from '@/components/calendar/UnifiedTaskVerification';
import { getVerificationModeSettings } from '@/components/settings/VerificationModeSettings';

export default function TaskExecutionPage({ task }) {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'baidu' | 'realtime'>('baidu');

  useEffect(() => {
    const settings = getVerificationModeSettings();
    setVerificationMode(settings.mode);
  }, []);

  const startTask = () => {
    if (task.requireVerification) {
      setShowVerification(true);
    } else {
      // 直接开始任务
      executeTask();
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerification(false);
    executeTask();
    
    // 记录验证历史
    saveVerificationHistory({
      taskId: task.id,
      timestamp: new Date(),
      mode: verificationMode,
      success: true,
      recognizedItems: [],
      matchedKeywords: [],
      duration: 0,
    });
  };

  const handleVerificationFail = () => {
    setShowVerification(false);
    
    // 记录失败
    saveVerificationHistory({
      taskId: task.id,
      timestamp: new Date(),
      mode: verificationMode,
      success: false,
      recognizedItems: [],
      matchedKeywords: [],
      duration: 0,
    });
  };

  return (
    <div>
      <h1>{task.title}</h1>
      <button onClick={startTask}>开始任务</button>

      {showVerification && (
        <UnifiedTaskVerification
          task={{
            id: task.id,
            title: task.title,
            verificationType: 'photo',
            requirement: task.verificationRequirement,
          }}
          verificationType="start"
          keywords={task.verificationKeywords}
          realtimeObjects={task.realtimeObjects}
          onSuccess={handleVerificationSuccess}
          onFail={handleVerificationFail}
          onSkip={() => setShowVerification(false)}
          timeLimit={120}
        />
      )}
    </div>
  );
}
```

## 📝 总结

通过以上示例，你可以：

1. ✅ 在设置页面让用户选择验证模式
2. ✅ 在任务创建时配置验证规则
3. ✅ 在任务执行时使用统一验证组件
4. ✅ 根据任务类型自动选择最优验证方式
5. ✅ 记录和分析验证历史数据
6. ✅ 针对移动端进行优化

系统会自动根据用户设置选择使用百度AI识别或实时物品识别，提供最佳的用户体验！

