# 驱动力系统集成指南

## 第一阶段实现完成 ✅

### 已完成的组件和服务

1. **核心Store**: `src/stores/driveStore.ts`
   - 每日生存成本管理
   - 连击系统
   - 连胜系统
   - 拖延税计算

2. **UI组件**:
   - `src/components/drive/CoinExplosion.tsx` - 金币爆炸动画
   - `src/components/drive/ComboStreakIndicator.tsx` - 连击指示器
   - `src/components/drive/BankruptModal.tsx` - 破产模式弹窗
   - `src/components/drive/DailyGoldProgress.tsx` - 每日金币进度条

3. **服务**:
   - `src/services/dailyCostService.ts` - 每日成本检查服务

4. **集成点**:
   - `src/stores/taskStore.ts` - 任务完成逻辑已集成连击和拖延税
   - `src/App.tsx` - 应用启动时自动检查每日成本

---

## 如何在时间轴视图中集成

### 1. 在 NewTimelineView.tsx 中添加状态

```typescript
import { useState } from 'react';
import { useDriveStore } from '@/stores/driveStore';
import CoinExplosion from '@/components/drive/CoinExplosion';
import ComboStreakIndicator from '@/components/drive/ComboStreakIndicator';
import BankruptModal from '@/components/drive/BankruptModal';
import DailyGoldProgress from '@/components/drive/DailyGoldProgress';

// 在组件内部添加状态
const { dailyCost } = useDriveStore();
const [showCoinExplosion, setShowCoinExplosion] = useState(false);
const [explosionData, setExplosionData] = useState({ amount: 0, multiplier: 1.0, position: { x: 0, y: 0 } });
const [showBankruptModal, setShowBankruptModal] = useState(false);

// 检查破产状态
useEffect(() => {
  if (dailyCost.isBankrupt) {
    setShowBankruptModal(true);
  }
}, [dailyCost.isBankrupt]);
```

### 2. 修改任务完成处理函数

```typescript
const handleCompleteTask = async (taskId: string, event?: React.MouseEvent) => {
  try {
    // 获取点击位置（用于金币爆炸动画）
    const position = event ? { x: event.clientX, y: event.clientY } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    // 完成任务（已集成驱动力系统）
    const result = await completeTask(taskId);
    
    // 触发金币爆炸动画
    if (result) {
      setExplosionData({
        amount: result.goldEarned,
        multiplier: result.multiplier,
        position,
      });
      setShowCoinExplosion(true);
      
      // 播放音效
      playSound('coin');
      
      // 2秒后隐藏动画
      setTimeout(() => {
        setShowCoinExplosion(false);
      }, 2000);
    }
  } catch (error) {
    console.error('完成任务失败:', error);
  }
};
```

### 3. 在 JSX 中添加组件

```typescript
return (
  <div className="relative">
    {/* 原有的时间轴内容 */}
    {/* ... */}
    
    {/* 🎯 每日金币进度条 - 显示在顶部 */}
    <div className="fixed top-16 left-4 right-4 z-40 max-w-md">
      <DailyGoldProgress />
    </div>
    
    {/* 🎯 连击指示器 - 显示在右上角 */}
    <ComboStreakIndicator />
    
    {/* 🎯 金币爆炸动画 */}
    {showCoinExplosion && (
      <CoinExplosion
        amount={explosionData.amount}
        multiplier={explosionData.multiplier}
        triggerPosition={explosionData.position}
        onComplete={() => setShowCoinExplosion(false)}
      />
    )}
    
    {/* 🎯 破产模式弹窗 */}
    <BankruptModal
      isOpen={showBankruptModal}
      onClose={() => {
        // 只有在不再破产时才能关闭
        if (!dailyCost.isBankrupt) {
          setShowBankruptModal(false);
        }
      }}
    />
  </div>
);
```

### 4. 添加音效支持（可选）

```typescript
const playSound = (type: 'coin' | 'combo' | 'complete') => {
  const audio = new Audio();
  
  switch (type) {
    case 'coin':
      audio.src = '/sounds/coin.mp3';
      break;
    case 'combo':
      audio.src = '/sounds/combo.mp3';
      break;
    case 'complete':
      audio.src = '/sounds/complete.mp3';
      break;
  }
  
  audio.volume = 0.5;
  audio.play().catch(err => console.log('音效播放失败:', err));
};
```

---

## 破产模式的工作流程

1. **每天早上6点自动扣除50金币**
   - 如果余额不足，进入破产模式
   - 所有功能锁定（通过 `dailyCost.isBankrupt` 判断）

2. **破产模式下的限制**
   ```typescript
   // 在创建任务、编辑任务等操作前检查
   if (dailyCost.isBankrupt) {
     alert('⚠️ 破产模式：请先完成紧急任务赚取金币');
     return;
   }
   ```

3. **解除破产**
   - 用户选择并完成紧急任务
   - 获得50金币
   - 自动解除破产状态

---

## 连击系统的工作原理

1. **连击触发**：
   - 连续完成任务（30分钟内）
   - 自动增加连击数

2. **连击倍率**：
   - 2连击：1.2x
   - 3连击：1.5x
   - 5连击：2.0x
   - 10连击：3.0x

3. **连击中断**：
   - 超过30分钟未完成任务
   - 自动重置连击数

4. **视觉反馈**：
   - 右上角显示连击指示器
   - 完成任务时显示连击提示
   - 金币爆炸动画显示倍率

---

## 拖延税的工作原理

1. **自动计算**：
   - 任务超时1小时：扣10金币
   - 任务超时3小时：扣30金币
   - 任务超时6小时：扣60金币
   - 任务超时24小时：扣100金币

2. **扣除时机**：
   - 完成任务时自动计算并扣除
   - 记录到拖延税历史

3. **查看历史**：
   ```typescript
   const { getDelayTaxHistory } = useDriveStore();
   const history = getDelayTaxHistory(7); // 最近7天
   ```

---

## 测试建议

### 1. 测试破产模式
```typescript
// 在浏览器控制台执行
import { useGoldStore } from '@/stores/goldStore';
import { useDriveStore } from '@/stores/driveStore';

// 设置金币为0
useGoldStore.getState().balance = 0;

// 触发每日成本检查
useDriveStore.getState().checkAndDeductDailyCost();
```

### 2. 测试连击系统
```typescript
// 快速完成多个任务，观察连击倍率变化
// 等待30分钟后再完成任务，观察连击重置
```

### 3. 测试拖延税
```typescript
// 创建一个任务，设置结束时间为1小时前
// 完成任务，观察是否扣除拖延税
```

---

## 下一步优化建议

1. **添加音效**：
   - 金币获得音效
   - 连击触发音效
   - 破产警告音效

2. **添加震动反馈**（移动端）：
   ```typescript
   if (navigator.vibrate) {
     navigator.vibrate(200); // 震动200ms
   }
   ```

3. **添加本地通知**：
   - 连击即将失效提醒
   - 每日成本扣除提醒
   - 任务即将超时提醒

4. **数据统计**：
   - 每日金币收入趋势图
   - 连击历史记录
   - 拖延税统计

---

## 常见问题

### Q: 如何禁用破产模式（测试用）？
```typescript
useDriveStore.getState().setBankruptStatus(false);
```

### Q: 如何重置连击？
```typescript
useDriveStore.getState().resetCombo();
```

### Q: 如何手动触发每日成本检查？
```typescript
import { dailyCostService } from '@/services/dailyCostService';
dailyCostService.resetCheckStatus();
dailyCostService.checkDailyCost();
```

### Q: 如何查看当前驱动力数据？
```typescript
console.log(useDriveStore.getState());
```

---

## 总结

第一阶段的核心功能已经完成：

✅ 每日生存成本（50金币/天）
✅ 破产模式（金币不足时锁定功能）
✅ 连击系统（连续完成任务获得倍率加成）
✅ 拖延税（任务超时自动扣金币）
✅ 金币爆炸动画（视觉反馈）
✅ 连击指示器（实时显示连击状态）
✅ 每日金币进度条（目标可视化）

这些功能已经能够显著提升用户的自律驱动力，让金币变得"有价值"，让用户"主动想完成任务"。

下一步可以实施第二阶段：连胜系统和成就系统。

