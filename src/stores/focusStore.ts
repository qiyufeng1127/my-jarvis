import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 专注模式类型
export type FocusMode = 'pomodoro' | 'deep' | 'flow';

// 番茄钟阶段
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

// 专注会话记录
export interface FocusSession {
  id: string;
  mode: FocusMode;
  taskId?: string;
  taskName?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // 实际专注时长（秒）
  targetDuration: number; // 目标时长（秒）
  completed: boolean;
  interrupted: boolean;
  goldEarned: number;
  expEarned: number;
}

// 专注统计
export interface FocusStats {
  totalSessions: number;
  totalFocusTime: number; // 总专注时长（秒）
  completedSessions: number;
  interruptedSessions: number;
  todayFocusTime: number;
  weekFocusTime: number;
  longestStreak: number;
  currentStreak: number;
}

interface FocusState {
  // 当前专注状态
  isActive: boolean;
  currentMode: FocusMode | null;
  currentSession: FocusSession | null;
  
  // 番茄钟特有
  pomodoroPhase: PomodoroPhase;
  pomodoroCount: number; // 当前完成的番茄钟数量
  
  // 计时器
  elapsedTime: number; // 已经过的时间（秒）
  targetTime: number; // 目标时间（秒）
  
  // 历史记录
  sessions: FocusSession[];
  stats: FocusStats;
  
  // 设置
  settings: {
    pomodoroDuration: number; // 番茄钟工作时长（分钟）
    shortBreakDuration: number; // 短休息时长（分钟）
    longBreakDuration: number; // 长休息时长（分钟）
    pomodorosBeforeLongBreak: number; // 几个番茄钟后长休息
    autoStartBreak: boolean; // 自动开始休息
    autoStartPomodoro: boolean; // 自动开始下一个番茄钟
    soundEnabled: boolean; // 声音提醒
    notificationEnabled: boolean; // 通知提醒
    strictMode: boolean; // 严格模式（不允许中途退出）
  };
  
  // Actions
  startFocus: (mode: FocusMode, taskId?: string, taskName?: string, duration?: number) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: (completed: boolean) => void;
  tick: () => void; // 每秒调用一次
  
  // 番茄钟特有
  nextPomodoroPhase: () => void;
  skipBreak: () => void;
  
  // 统计
  updateStats: () => void;
  getTodayStats: () => { sessions: number; focusTime: number };
  
  // 设置
  updateSettings: (settings: Partial<FocusState['settings']>) => void;
}

const DEFAULT_SETTINGS = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosBeforeLongBreak: 4,
  autoStartBreak: false,
  autoStartPomodoro: false,
  soundEnabled: true,
  notificationEnabled: true,
  strictMode: false,
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentMode: null,
      currentSession: null,
      pomodoroPhase: 'work',
      pomodoroCount: 0,
      elapsedTime: 0,
      targetTime: 0,
      sessions: [],
      stats: {
        totalSessions: 0,
        totalFocusTime: 0,
        completedSessions: 0,
        interruptedSessions: 0,
        todayFocusTime: 0,
        weekFocusTime: 0,
        longestStreak: 0,
        currentStreak: 0,
      },
      settings: DEFAULT_SETTINGS,
      
      // 开始专注
      startFocus: (mode, taskId, taskName, duration) => {
        const { settings } = get();
        
        let targetDuration: number;
        if (duration) {
          targetDuration = duration * 60; // 转换为秒
        } else if (mode === 'pomodoro') {
          targetDuration = settings.pomodoroDuration * 60;
        } else if (mode === 'deep') {
          targetDuration = 90 * 60; // 深度专注默认90分钟
        } else {
          targetDuration = 120 * 60; // 心流模式默认120分钟
        }
        
        const session: FocusSession = {
          id: crypto.randomUUID(),
          mode,
          taskId,
          taskName,
          startTime: new Date(),
          duration: 0,
          targetDuration,
          completed: false,
          interrupted: false,
          goldEarned: 0,
          expEarned: 0,
        };
        
        set({
          isActive: true,
          currentMode: mode,
          currentSession: session,
          elapsedTime: 0,
          targetTime: targetDuration,
          pomodoroPhase: mode === 'pomodoro' ? 'work' : 'work',
        });
        
        console.log(`🎯 开始${mode}专注模式，目标时长: ${Math.floor(targetDuration / 60)}分钟`);
        
        // 发送通知
        if (settings.notificationEnabled && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('专注模式已开启', {
              body: `${taskName || '未指定任务'} - ${Math.floor(targetDuration / 60)}分钟`,
              icon: '🎯',
            });
          }
        }
      },
      
      // 暂停专注
      pauseFocus: () => {
        set({ isActive: false });
        console.log('⏸️ 暂停专注');
      },
      
      // 恢复专注
      resumeFocus: () => {
        const { currentSession } = get();
        if (currentSession) {
          set({ isActive: true });
          console.log('▶️ 恢复专注');
        }
      },
      
      // 停止专注
      stopFocus: (completed) => {
        const { currentSession, elapsedTime, settings } = get();
        if (!currentSession) return;
        
        const endTime = new Date();
        const actualDuration = elapsedTime;
        
        // 计算奖励
        const minutesFocused = Math.floor(actualDuration / 60);
        let goldEarned = 0;
        let expEarned = 0;
        
        if (completed) {
          // 完成奖励：每分钟5金币 + 10经验
          goldEarned = minutesFocused * 5;
          expEarned = minutesFocused * 10;
          
          // 完成加成：额外50%
          goldEarned = Math.floor(goldEarned * 1.5);
          expEarned = Math.floor(expEarned * 1.5);
        } else {
          // 中断惩罚：只获得50%
          goldEarned = Math.floor(minutesFocused * 2.5);
          expEarned = Math.floor(minutesFocused * 5);
        }
        
        // 发放奖励
        if (goldEarned > 0) {
          const { useGoldStore } = require('@/stores/goldStore');
          const goldStore = useGoldStore.getState();
          goldStore.addGold(goldEarned, `专注${completed ? '完成' : '中断'}: ${Math.floor(actualDuration / 60)}分钟`);
        }
        
        // 宠物获得经验
        if (expEarned > 0) {
          const { usePetStore } = require('@/stores/petStore');
          const petStore = usePetStore.getState();
          if (petStore.currentPet) {
            petStore.gainExp(expEarned);
          }
        }
        
        // 保存会话记录
        const finishedSession: FocusSession = {
          ...currentSession,
          endTime,
          duration: actualDuration,
          completed,
          interrupted: !completed,
          goldEarned,
          expEarned,
        };
        
        set((state) => ({
          isActive: false,
          currentMode: null,
          currentSession: null,
          elapsedTime: 0,
          targetTime: 0,
          pomodoroCount: 0,
          sessions: [finishedSession, ...state.sessions].slice(0, 100), // 只保留最近100条
        }));
        
        // 更新统计
        get().updateStats();
        
        console.log(`${completed ? '✅' : '❌'} 专注${completed ? '完成' : '中断'}: ${minutesFocused}分钟，获得 ${goldEarned} 金币，${expEarned} 经验`);
        
        // 发送通知
        if (settings.notificationEnabled && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(
              completed ? '专注完成！' : '专注中断',
              {
                body: `专注 ${minutesFocused} 分钟，获得 ${goldEarned} 金币`,
                icon: completed ? '✅' : '❌',
              }
            );
          }
        }
      },
      
      // 计时器tick
      tick: () => {
        const { isActive, currentSession, elapsedTime, targetTime, currentMode, settings } = get();
        
        if (!isActive || !currentSession) return;
        
        const newElapsedTime = elapsedTime + 1;
        
        set((state) => ({
          elapsedTime: newElapsedTime,
          currentSession: state.currentSession ? {
            ...state.currentSession,
            duration: newElapsedTime,
          } : null,
        }));
        
        // 检查是否完成
        if (newElapsedTime >= targetTime) {
          if (currentMode === 'pomodoro') {
            // 番茄钟模式：自动进入下一阶段
            get().nextPomodoroPhase();
          } else {
            // 其他模式：自动完成
            get().stopFocus(true);
          }
        }
      },
      
      // 番茄钟：下一阶段
      nextPomodoroPhase: () => {
        const { pomodoroPhase, pomodoroCount, settings, currentSession } = get();
        
        if (pomodoroPhase === 'work') {
          // 工作阶段结束，进入休息
          const newCount = pomodoroCount + 1;
          const isLongBreak = newCount % settings.pomodorosBeforeLongBreak === 0;
          const nextPhase: PomodoroPhase = isLongBreak ? 'longBreak' : 'shortBreak';
          const breakDuration = isLongBreak 
            ? settings.longBreakDuration * 60 
            : settings.shortBreakDuration * 60;
          
          // 完成当前工作会话
          get().stopFocus(true);
          
          // 自动开始休息
          if (settings.autoStartBreak) {
            set({
              isActive: true,
              pomodoroPhase: nextPhase,
              pomodoroCount: newCount,
              elapsedTime: 0,
              targetTime: breakDuration,
            });
            console.log(`☕ 开始${isLongBreak ? '长' : '短'}休息: ${Math.floor(breakDuration / 60)}分钟`);
          } else {
            set({
              isActive: false,
              pomodoroPhase: nextPhase,
              pomodoroCount: newCount,
              elapsedTime: 0,
              targetTime: breakDuration,
            });
            console.log(`⏸️ 工作完成，可以开始${isLongBreak ? '长' : '短'}休息`);
          }
        } else {
          // 休息结束，准备下一个番茄钟
          const workDuration = settings.pomodoroDuration * 60;
          
          if (settings.autoStartPomodoro) {
            set({
              isActive: true,
              pomodoroPhase: 'work',
              elapsedTime: 0,
              targetTime: workDuration,
            });
            console.log(`🍅 自动开始下一个番茄钟: ${settings.pomodoroDuration}分钟`);
          } else {
            set({
              isActive: false,
              pomodoroPhase: 'work',
              elapsedTime: 0,
              targetTime: workDuration,
            });
            console.log('⏸️ 休息完成，可以开始下一个番茄钟');
          }
        }
      },
      
      // 跳过休息
      skipBreak: () => {
        const { pomodoroPhase, settings } = get();
        
        if (pomodoroPhase !== 'work') {
          const workDuration = settings.pomodoroDuration * 60;
          set({
            isActive: true,
            pomodoroPhase: 'work',
            elapsedTime: 0,
            targetTime: workDuration,
          });
          console.log('⏭️ 跳过休息，开始工作');
        }
      },
      
      // 更新统计
      updateStats: () => {
        const { sessions } = get();
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const todaySessions = sessions.filter(s => s.startTime >= todayStart);
        const weekSessions = sessions.filter(s => s.startTime >= weekStart);
        
        const stats: FocusStats = {
          totalSessions: sessions.length,
          totalFocusTime: sessions.reduce((sum, s) => sum + s.duration, 0),
          completedSessions: sessions.filter(s => s.completed).length,
          interruptedSessions: sessions.filter(s => s.interrupted).length,
          todayFocusTime: todaySessions.reduce((sum, s) => sum + s.duration, 0),
          weekFocusTime: weekSessions.reduce((sum, s) => sum + s.duration, 0),
          longestStreak: 0, // TODO: 计算连续专注天数
          currentStreak: 0,
        };
        
        set({ stats });
      },
      
      // 获取今日统计
      getTodayStats: () => {
        const { sessions } = get();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const todaySessions = sessions.filter(s => s.startTime >= todayStart);
        const focusTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        
        return {
          sessions: todaySessions.length,
          focusTime,
        };
      },
      
      // 更新设置
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
    }),
    {
      name: 'manifestos-focus-storage',
      version: 1,
      partialize: (state) => ({
        sessions: state.sessions,
        stats: state.stats,
        settings: state.settings,
        pomodoroCount: state.pomodoroCount,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            
            // 恢复日期对象
            if (parsed?.state?.sessions) {
              parsed.state.sessions = parsed.state.sessions.map((session: any) => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined,
              }));
            }
            
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取专注存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('❌ 保存专注存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除专注存储失败:', error);
          }
        },
      },
    }
  )
);

