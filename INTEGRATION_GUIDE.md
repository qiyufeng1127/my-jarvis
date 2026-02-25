# 第三阶段快速集成指南

## 🚀 如何在主界面中使用新功能

### 1. 在 Dashboard 中集成所有组件

```tsx
// src/pages/Dashboard.tsx
import { PetWidget } from '@/components/pet/PetWidget';
import { PetShop } from '@/components/pet/PetShop';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { FocusStatsPanel } from '@/components/focus/FocusStatsPanel';
import { BadHabitTracker } from '@/components/habit/BadHabitTracker';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';

function Dashboard() {
  return (
    <div className="dashboard-layout">
      {/* 顶部栏 */}
      <header className="dashboard-header">
        {/* 你的现有头部内容 */}
      </header>

      <div className="dashboard-content">
        {/* 左侧边栏 - 宠物和专注 */}
        <aside className="left-sidebar">
          <PetWidget />
          <div style={{ marginTop: '1rem' }}>
            <FocusTimer />
          </div>
        </aside>

        {/* 主内容区 - 任务列表 */}
        <main className="main-content">
          {/* 你的现有任务列表组件 */}
        </main>

        {/* 右侧边栏 - 统计和排行榜 */}
        <aside className="right-sidebar">
          <FocusStatsPanel />
          <div style={{ marginTop: '1rem' }}>
            <BadHabitTracker />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <LeaderboardPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}

// CSS 样式
const styles = `
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-content {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 350px;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 1920px;
  margin: 0 auto;
}

.left-sidebar,
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-content {
  min-height: 600px;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .dashboard-content {
    grid-template-columns: 280px 1fr 320px;
  }
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .left-sidebar,
  .right-sidebar {
    display: none; /* 或者改为折叠面板 */
  }
}
`;
```

### 2. 添加宠物商店入口

```tsx
// 在导航栏或设置中添加宠物商店按钮
import { useState } from 'react';
import { PetShop } from '@/components/pet/PetShop';

function Navigation() {
  const [showPetShop, setShowPetShop] = useState(false);

  return (
    <>
      <nav>
        <button onClick={() => setShowPetShop(true)}>
          🏪 宠物商店
        </button>
      </nav>

      {/* 模态框 */}
      {showPetShop && (
        <div className="modal-overlay" onClick={() => setShowPetShop(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowPetShop(false)}
            >
              ✕
            </button>
            <PetShop />
          </div>
        </div>
      )}
    </>
  );
}
```

### 3. 在任务完成时触发宠物经验

```tsx
// src/stores/taskStore.ts
import { usePetStore } from '@/stores/petStore';
import { useBadHabitStore } from '@/stores/badHabitStore';

// 在任务完成的方法中添加
completeTask(taskId: string) {
  // ... 原有的完成逻辑
  
  // 宠物获得经验（每个任务20经验）
  const petStore = usePetStore.getState();
  if (petStore.currentPet) {
    petStore.gainExp(20);
  }
  
  // 检测坏习惯
  const badHabitStore = useBadHabitStore.getState();
  badHabitStore.detectLateNight(); // 检测熬夜
  
  // 检测过度承诺
  const todoCount = this.tasks.filter(t => !t.completed).length;
  badHabitStore.detectOvercommit(todoCount);
}
```

### 4. 在专注模式中关联任务

```tsx
// 在任务列表中添加"开始专注"按钮
import { useFocusStore } from '@/stores/focusStore';

function TaskItem({ task }) {
  const { startFocus } = useFocusStore();

  const handleStartFocus = () => {
    // 开始番茄钟，关联当前任务
    startFocus('pomodoro', task.id, task.title);
  };

  return (
    <div className="task-item">
      <span>{task.title}</span>
      <button onClick={handleStartFocus}>
        🍅 开始专注
      </button>
    </div>
  );
}
```

### 5. 自动检测拖延

```tsx
// src/stores/taskStore.ts
import { useBadHabitStore } from '@/stores/badHabitStore';

// 定期检查超期任务
checkOverdueTasks() {
  const now = new Date();
  const badHabitStore = useBadHabitStore.getState();
  
  this.tasks.forEach(task => {
    if (task.dueDate && !task.completed) {
      const dueDate = new Date(task.dueDate);
      if (dueDate < now) {
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysOverdue > 0) {
          badHabitStore.detectProcrastination(
            task.id,
            task.title,
            daysOverdue
          );
        }
      }
    }
  });
}

// 在应用启动时调用
useEffect(() => {
  const interval = setInterval(() => {
    taskStore.checkOverdueTasks();
  }, 60 * 60 * 1000); // 每小时检查一次
  
  return () => clearInterval(interval);
}, []);
```

### 6. 添加成就通知

```tsx
// 监听成就解锁事件
import { useEffect } from 'react';
import { useLeaderboardStore } from '@/stores/leaderboardStore';

function AchievementNotification() {
  const { achievements } = useLeaderboardStore();

  useEffect(() => {
    // 定期检查成就
    const interval = setInterval(() => {
      useLeaderboardStore.getState().checkAchievements();
    }, 30000); // 每30秒检查一次

    return () => clearInterval(interval);
  }, []);

  return null;
}

// 在 App.tsx 中添加
<AchievementNotification />
```

---

## 🎮 使用示例

### 完整的任务完成流程

```tsx
// 当用户完成任务时
const handleCompleteTask = async (taskId: string) => {
  const task = taskStore.getTask(taskId);
  
  // 1. 标记任务完成
  taskStore.completeTask(taskId);
  
  // 2. 获得金币（已在 taskStore 中处理）
  // goldStore.addGold(amount, reason);
  
  // 3. 宠物获得经验
  const petStore = usePetStore.getState();
  if (petStore.currentPet) {
    petStore.gainExp(20);
  }
  
  // 4. 更新连胜
  const driveStore = useDriveStore.getState();
  driveStore.updateWinStreak();
  
  // 5. 检查成就
  const leaderboardStore = useLeaderboardStore.getState();
  leaderboardStore.checkAchievements();
  
  // 6. 显示完成动画
  showCompletionAnimation();
};
```

### 专注模式完整流程

```tsx
// 1. 用户点击"开始专注"
const handleStartFocus = (taskId: string, taskName: string) => {
  const focusStore = useFocusStore.getState();
  
  // 开始25分钟番茄钟
  focusStore.startFocus('pomodoro', taskId, taskName);
};

// 2. 专注完成后自动触发
// - 获得金币（在 focusStore.stopFocus 中处理）
// - 宠物获得经验（在 focusStore.stopFocus 中处理）
// - 更新统计数据

// 3. 如果中途退出
const handleInterruptFocus = () => {
  const focusStore = useFocusStore.getState();
  const badHabitStore = useBadHabitStore.getState();
  
  // 停止专注（标记为未完成）
  focusStore.stopFocus(false);
  
  // 记录分心坏习惯
  badHabitStore.detectDistraction('专注模式中途退出');
};
```

---

## 📱 移动端适配建议

```tsx
// 移动端使用抽屉式布局
import { useState } from 'react';

function MobileDashboard() {
  const [activeDrawer, setActiveDrawer] = useState<'pet' | 'focus' | 'stats' | null>(null);

  return (
    <div className="mobile-dashboard">
      {/* 底部导航栏 */}
      <nav className="bottom-nav">
        <button onClick={() => setActiveDrawer('pet')}>
          🐾 宠物
        </button>
        <button onClick={() => setActiveDrawer('focus')}>
          🎯 专注
        </button>
        <button onClick={() => setActiveDrawer('stats')}>
          📊 统计
        </button>
      </nav>

      {/* 抽屉 */}
      {activeDrawer === 'pet' && (
        <Drawer onClose={() => setActiveDrawer(null)}>
          <PetWidget />
          <PetShop />
        </Drawer>
      )}

      {activeDrawer === 'focus' && (
        <Drawer onClose={() => setActiveDrawer(null)}>
          <FocusTimer />
          <FocusStatsPanel />
        </Drawer>
      )}

      {activeDrawer === 'stats' && (
        <Drawer onClose={() => setActiveDrawer(null)}>
          <BadHabitTracker />
          <LeaderboardPanel />
        </Drawer>
      )}
    </div>
  );
}
```

---

## ⚡ 性能优化提示

1. **懒加载组件**
```tsx
import { lazy, Suspense } from 'react';

const PetShop = lazy(() => import('@/components/pet/PetShop'));
const LeaderboardPanel = lazy(() => import('@/components/leaderboard/LeaderboardPanel'));

// 使用时
<Suspense fallback={<div>加载中...</div>}>
  <PetShop />
</Suspense>
```

2. **防抖更新**
```tsx
import { debounce } from 'lodash';

const updatePetStatus = debounce(() => {
  usePetStore.getState().updatePetStatus();
}, 5000);
```

3. **条件渲染**
```tsx
// 只在有宠物时渲染宠物组件
const { currentPet } = usePetStore();

{currentPet && <PetWidget />}
```

---

## 🎉 完成！

现在你的应用已经集成了完整的第三阶段功能：
- ✅ 虚拟宠物系统
- ✅ 专注模式 + 番茄钟
- ✅ 坏习惯矫正系统
- ✅ 排行榜系统

开始测试并享受新功能吧！🚀

