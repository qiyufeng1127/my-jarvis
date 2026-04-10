/**
 * 后台任务调度服务
 * 使用 Service Worker 和浏览器通知实现真正的后台运行
 * 即使应用关闭，也能在计划时间触发通知和倒计时
 */

import { notificationService } from './notificationService';

interface ScheduledTask {
  taskId: string;
  taskTitle: string;
  scheduledStart: string; // ISO 时间字符串
  scheduledEnd: string;
  goldReward: number;
  hasVerification: boolean;
  startKeywords?: string[];
  completeKeywords?: string[];
}

interface TaskScheduleState {
  taskId: string;
  scheduledStart: string;
  scheduledEnd: string;
  // 倒计时状态
  status: 'waiting_start' | 'start_countdown' | 'task_countdown' | 'completed';
  startDeadline: string | null; // 启动倒计时截止时间
  taskDeadline: string | null; // 任务倒计时截止时间
  startTimeoutCount: number;
  completeTimeoutCount: number;
  actualStartTime: string | null;
  // 提醒记录（避免重复提醒）
  remindersTriggered: string[];
}

class BackgroundTaskScheduler {
  private storageKey = 'background_task_schedules';
  private checkInterval: number | null = null;
  private isInitialized = false;

  private areTaskDetailsEqual(a: ScheduledTask, b: ScheduledTask) {
    return (
      a.taskTitle === b.taskTitle &&
      a.scheduledStart === b.scheduledStart &&
      a.scheduledEnd === b.scheduledEnd &&
      a.goldReward === b.goldReward &&
      a.hasVerification === b.hasVerification &&
      JSON.stringify(a.startKeywords || []) === JSON.stringify(b.startKeywords || []) &&
      JSON.stringify(a.completeKeywords || []) === JSON.stringify(b.completeKeywords || [])
    );
  }

  constructor() {
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    if (this.isInitialized) return;

    console.log('🚀 [后台任务调度] 初始化服务');

    // 注册 Service Worker
    await this.registerServiceWorker();

    // 启动定时检查（每10秒检查一次）
    this.startPeriodicCheck();

    // 监听来自 Service Worker 的消息
    this.listenToServiceWorker();

    // 页面可见性变化时重新检查
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('📱 [后台任务调度] 应用重新打开，检查任务状态');
        this.checkAllTasks();
      }
    });

    this.isInitialized = true;
    console.log('✅ [后台任务调度] 初始化完成');
  }

  /**
   * 注册 Service Worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ 浏览器不支持 Service Worker');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.log('✅ Service Worker 注册成功:', registration.scope);

      // 等待 Service Worker 激活
      if (registration.active) {
        console.log('✅ Service Worker 已激活');
        // 通知 Service Worker 启动后台检查
        registration.active.postMessage({ type: 'START_BACKGROUND_CHECK' });
      } else {
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker 已就绪');
        const activeWorker = await navigator.serviceWorker.ready;
        activeWorker.active?.postMessage({ type: 'START_BACKGROUND_CHECK' });
      }
    } catch (error) {
      console.error('❌ Service Worker 注册失败:', error);
    }
  }

  /**
   * 监听来自 Service Worker 的消息
   */
  listenToServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 [后台任务调度] 收到 Service Worker 消息:', event.data);

      if (event.data && event.data.type === 'CHECK_TASKS_REQUEST') {
        console.log('🔍 [后台任务调度] Service Worker 请求检查任务');
        this.checkAllTasks();
      }
    });
  }

  /**
   * 启动定时检查
   */
  startPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    const runCheck = () => {
      if (document.hidden) return;
      this.checkAllTasks();
    };

    // 每60秒检查一次任务，避免高频轮询导致界面抖动
    this.checkInterval = window.setInterval(runCheck, 60000);

    // 立即执行一次检查
    this.checkAllTasks();

    console.log('⏰ [后台任务调度] 定时检查已启动（每60秒）');
  }

  /**
   * 停止定时检查
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏸️ [后台任务调度] 定时检查已停止');
    }
  }

  /**
   * 调度任务
   */
  scheduleTask(task: ScheduledTask) {
    const schedules = this.loadSchedules();
    
    // 检查是否已存在
    const existingIndex = schedules.findIndex(s => s.taskId === task.taskId);
    
    if (existingIndex >= 0) {
      // 更新现有任务
      const existing = schedules[existingIndex];
      
      // 如果任务时间发生变化，重置状态
      if (existing.scheduledStart !== task.scheduledStart || 
          existing.scheduledEnd !== task.scheduledEnd) {
        console.log(`🔄 [后台任务调度] 任务时间已更新: ${task.taskTitle}`);
        schedules[existingIndex] = {
          taskId: task.taskId,
          scheduledStart: task.scheduledStart,
          scheduledEnd: task.scheduledEnd,
          status: 'waiting_start',
          startDeadline: null,
          taskDeadline: null,
          startTimeoutCount: 0,
          completeTimeoutCount: 0,
          actualStartTime: null,
          remindersTriggered: [],
        };
      }
    } else {
      // 添加新任务
      console.log(`➕ [后台任务调度] 添加新任务: ${task.taskTitle}`);
      schedules.push({
        taskId: task.taskId,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
        status: 'waiting_start',
        startDeadline: null,
        taskDeadline: null,
        startTimeoutCount: 0,
        completeTimeoutCount: 0,
        actualStartTime: null,
        remindersTriggered: [],
      });
    }
    
    this.saveSchedules(schedules);
    
    // 同时保存任务详情（用于通知）
    this.saveTaskDetails(task);
    
    // 立即检查任务
    this.checkAllTasks();
  }

  /**
   * 取消任务调度
   */
  unscheduleTask(taskId: string) {
    const schedules = this.loadSchedules();
    const filtered = schedules.filter(s => s.taskId !== taskId);
    
    if (filtered.length < schedules.length) {
      console.log(`🗑️ [后台任务调度] 取消任务调度: ${taskId}`);
      this.saveSchedules(filtered);
      
      // 删除任务详情
      localStorage.removeItem(`task_details_${taskId}`);
    }
  }

  private getLiveTask(taskId: string) {
    try {
      const saved = localStorage.getItem('manifestos-tasks-storage');
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return parsed?.state?.tasks?.find((task: any) => task.id === taskId) || null;
    } catch (error) {
      console.error('❌ 读取实时任务数据失败:', error);
      return null;
    }
  }

  /**
   * 检查所有任务
   */
  checkAllTasks() {
    const schedules = this.loadSchedules();
    const now = new Date();
    let schedulesChanged = false;

    schedules.forEach(schedule => {
      const task = this.loadTaskDetails(schedule.taskId);
      if (!task) return;

      const changed = this.checkTask(schedule, task, now);
      if (changed) {
        schedulesChanged = true;
      }
    });

    // 只有状态真的变化时才保存，避免轮询不断写 localStorage
    if (schedulesChanged) {
      this.saveSchedules(schedules);
    }
  }

  /**
   * 检查单个任务
   */
  private checkTask(schedule: TaskScheduleState, task: ScheduledTask, now: Date) {
    let changed = false;
    const liveTask = this.getLiveTask(schedule.taskId);
    if (!liveTask || !liveTask.scheduledStart || !liveTask.scheduledEnd) {
      this.unscheduleTask(schedule.taskId);
      return false;
    }

    const nextTaskDetails: ScheduledTask = {
      taskId: schedule.taskId,
      taskTitle: liveTask.title,
      scheduledStart: new Date(liveTask.scheduledStart).toISOString(),
      scheduledEnd: new Date(liveTask.scheduledEnd).toISOString(),
      goldReward: liveTask.goldReward || 0,
      hasVerification: Boolean(
        liveTask.verificationEnabled || liveTask.verificationStart || liveTask.verificationComplete
      ),
      startKeywords: liveTask.startKeywords,
      completeKeywords: liveTask.completeKeywords,
    };

    if (
      schedule.scheduledStart !== nextTaskDetails.scheduledStart ||
      schedule.scheduledEnd !== nextTaskDetails.scheduledEnd
    ) {
      schedule.scheduledStart = nextTaskDetails.scheduledStart;
      schedule.scheduledEnd = nextTaskDetails.scheduledEnd;
      schedule.status = 'waiting_start';
      schedule.startDeadline = null;
      schedule.taskDeadline = null;
      schedule.actualStartTime = null;
      schedule.remindersTriggered = [];
      changed = true;
    }

    if (!this.areTaskDetailsEqual(task, nextTaskDetails)) {
      this.saveTaskDetails(nextTaskDetails);
      task = nextTaskDetails;
    }

    const scheduledStart = new Date(schedule.scheduledStart);
    const scheduledEnd = new Date(schedule.scheduledEnd);

    // 1. 检查任务开始前提醒
    if (this.checkTaskStartBeforeReminder(schedule, task, now, scheduledStart)) {
      changed = true;
    }

    // 2. 检查是否到达任务开始时间（只发送通知，不修改状态）
    if (schedule.status === 'waiting_start' && now >= scheduledStart) {
      const reminderKey = `task-start-${schedule.taskId}`;
      if (!schedule.remindersTriggered.includes(reminderKey)) {
        console.log(`⏰ [后台任务调度] 任务到达开始时间: ${task.taskTitle}`);
        
        // 触发任务开始通知
        notificationService.notifyTaskStart(task.taskTitle, task.hasVerification);
        
        schedule.remindersTriggered.push(reminderKey);
        changed = true;
      }
    }

    // 3. 检查启动倒计时超时（只发送通知，不修改状态）
    if (schedule.status === 'start_countdown' && schedule.startDeadline) {
      const deadline = new Date(schedule.startDeadline);
      if (now >= deadline) {
        const reminderKey = `start-timeout-${schedule.taskId}-${schedule.startTimeoutCount}`;
        if (!schedule.remindersTriggered.includes(reminderKey)) {
          console.log(`⚠️ [后台任务调度] 启动超时: ${task.taskTitle}`);
          
          // 触发超时通知
          notificationService.notifyOvertime(task.taskTitle, 'start');
          notificationService.notifyProcrastination(task.taskTitle, schedule.startTimeoutCount + 1);
          
          schedule.remindersTriggered.push(reminderKey);
        }
      }
    }

    // 4. 检查任务进行中提醒
    if (schedule.status === 'task_countdown' && schedule.actualStartTime) {
      if (this.checkTaskDuringReminder(schedule, task, now)) {
        changed = true;
      }
    }

    // 5. 检查任务即将结束提醒
    if (schedule.status === 'task_countdown' && schedule.taskDeadline) {
      if (this.checkTaskEndingReminder(schedule, task, now)) {
        changed = true;
      }
    }

    // 6. 检查任务倒计时超时（只发送通知，不修改状态）
    if (schedule.status === 'task_countdown' && schedule.taskDeadline) {
      const deadline = new Date(schedule.taskDeadline);
      if (now >= deadline) {
        const reminderKey = `complete-timeout-${schedule.taskId}-${schedule.completeTimeoutCount}`;
        if (!schedule.remindersTriggered.includes(reminderKey)) {
          console.log(`⚠️ [后台任务调度] 完成超时: ${task.taskTitle}`);
          
          // 触发超时通知
          notificationService.notifyOvertime(task.taskTitle, 'completion');
          notificationService.notifyProcrastination(task.taskTitle, schedule.completeTimeoutCount + 1);
          
          schedule.remindersTriggered.push(reminderKey);
          changed = true;
        }
      }
    }

    return changed;
  }

  /**
   * 检查任务开始前提醒
   */
  private checkTaskStartBeforeReminder(
    schedule: TaskScheduleState,
    task: ScheduledTask,
    now: Date,
    scheduledStart: Date
  ) {
    if (schedule.status !== 'waiting_start') return false;

    const settingsStr = localStorage.getItem('notification_settings');
    if (!settingsStr) return false;

    try {
      const settings = JSON.parse(settingsStr);
      if (!settings.browserNotification) {
        return false;
      }
      if (!settings.taskStartBeforeReminder) return false;

      const reminderMinutes = settings.taskStartBeforeMinutes || 2;
      const reminderTime = new Date(scheduledStart.getTime() - reminderMinutes * 60 * 1000);
      
      const reminderKey = `task-start-before-${reminderMinutes}`;
      
      // 如果当前时间在提醒时间之后，且还没触发过
      if (now >= reminderTime && !schedule.remindersTriggered.includes(reminderKey)) {
        console.log(`⏰ [后台任务调度] 任务开始前提醒（${reminderMinutes}分钟）: ${task.taskTitle}`);
        notificationService.notifyTaskStartBefore(task.taskTitle, reminderMinutes, task.hasVerification);
        schedule.remindersTriggered.push(reminderKey);
        return true;
      }
    } catch (error) {
      console.error('读取通知设置失败:', error);
    }

    return false;
  }

  /**
   * 检查任务进行中提醒
   */
  private checkTaskDuringReminder(
    schedule: TaskScheduleState,
    task: ScheduledTask,
    now: Date
  ) {
    const settingsStr = localStorage.getItem('notification_settings');
    if (!settingsStr) return false;

    try {
      const settings = JSON.parse(settingsStr);
      if (!settings.browserNotification) {
        return false;
      }
      if (!settings.taskDuringReminder) return false;

      const intervalMinutes = settings.taskDuringMinutes || 10;
      const startTime = new Date(schedule.actualStartTime!);
      const elapsedMs = now.getTime() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      // 检查是否到达提醒时间点
      if (elapsedMinutes > 0 && elapsedMinutes % intervalMinutes === 0) {
        const reminderKey = `task-during-${elapsedMinutes}`;
        
        if (!schedule.remindersTriggered.includes(reminderKey)) {
          console.log(`⏰ [后台任务调度] 任务进行中提醒（${elapsedMinutes}分钟）: ${task.taskTitle}`);
          notificationService.notifyTaskDuring(task.taskTitle, elapsedMinutes);
          schedule.remindersTriggered.push(reminderKey);
          return true;
        }
      }
    } catch (error) {
      console.error('读取通知设置失败:', error);
    }

    return false;
  }

  /**
   * 检查任务即将结束提醒
   */
  private checkTaskEndingReminder(
    schedule: TaskScheduleState,
    task: ScheduledTask,
    now: Date
  ) {
    const settingsStr = localStorage.getItem('notification_settings');
    if (!settingsStr) return false;

    try {
      const settings = JSON.parse(settingsStr);
      if (!settings.browserNotification) {
        return false;
      }
      if (!settings.taskEndBeforeReminder) return false;

      const reminderMinutes = settings.taskEndBeforeMinutes || 5;
      const deadline = new Date(schedule.taskDeadline!);
      const timeLeft = deadline.getTime() - now.getTime();
      const minutesLeft = Math.floor(timeLeft / 60000);

      const reminderKey = `task-end-before-${reminderMinutes}`;
      
      // 如果剩余时间等于提醒时间，且还没触发过
      if (minutesLeft === reminderMinutes && !schedule.remindersTriggered.includes(reminderKey)) {
        console.log(`⏰ [后台任务调度] 任务即将结束（${reminderMinutes}分钟）: ${task.taskTitle}`);
        notificationService.notifyTaskEnding(task.taskTitle, reminderMinutes, task.hasVerification);
        schedule.remindersTriggered.push(reminderKey);
        return true;
      }
    } catch (error) {
      console.error('读取通知设置失败:', error);
    }

    return false;
  }

  /**
   * 更新任务状态（由组件调用）
   */
  updateTaskStatus(
    taskId: string,
    status: 'start_countdown' | 'task_countdown' | 'completed',
    data?: {
      startDeadline?: string;
      taskDeadline?: string;
      actualStartTime?: string;
      startTimeoutCount?: number;
      completeTimeoutCount?: number;
    }
  ) {
    const schedules = this.loadSchedules();
    const schedule = schedules.find(s => s.taskId === taskId);
    
    if (!schedule) {
      console.warn(`⚠️ [后台任务调度] 任务不存在: ${taskId}`);
      return;
    }

    schedule.status = status;
    
    if (data) {
      if (data.startDeadline !== undefined) schedule.startDeadline = data.startDeadline;
      if (data.taskDeadline !== undefined) schedule.taskDeadline = data.taskDeadline;
      if (data.actualStartTime !== undefined) schedule.actualStartTime = data.actualStartTime;
      if (data.startTimeoutCount !== undefined) schedule.startTimeoutCount = data.startTimeoutCount;
      if (data.completeTimeoutCount !== undefined) schedule.completeTimeoutCount = data.completeTimeoutCount;
    }

    this.saveSchedules(schedules);
    console.log(`✅ [后台任务调度] 任务状态已更新: ${taskId} -> ${status}`);
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskScheduleState | null {
    const schedules = this.loadSchedules();
    return schedules.find(s => s.taskId === taskId) || null;
  }

  /**
   * 加载所有调度
   */
  private loadSchedules(): TaskScheduleState[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ 加载任务调度失败:', error);
    }
    return [];
  }

  /**
   * 保存所有调度
   */
  private saveSchedules(schedules: TaskScheduleState[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(schedules));
    } catch (error) {
      console.error('❌ 保存任务调度失败:', error);
    }
  }

  /**
   * 保存任务详情
   */
  private saveTaskDetails(task: ScheduledTask) {
    try {
      localStorage.setItem(`task_details_${task.taskId}`, JSON.stringify(task));
    } catch (error) {
      console.error('❌ 保存任务详情失败:', error);
    }
  }

  /**
   * 加载任务详情
   */
  private loadTaskDetails(taskId: string): ScheduledTask | null {
    try {
      const saved = localStorage.getItem(`task_details_${taskId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ 加载任务详情失败:', error);
    }
    return null;
  }
}

// 导出单例
export const backgroundTaskScheduler = new BackgroundTaskScheduler();

