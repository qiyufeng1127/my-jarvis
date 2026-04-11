// ============================================
// 任务验证和启动系统
// ============================================

import { notificationService } from './notificationService';

const resolveAiEndpoint = (endpoint: string) => {
  if (typeof window !== 'undefined' && import.meta.env.DEV && endpoint.includes('api.deepseek.com')) {
    return '/ai-api';
  }

  return endpoint;
};

const extractJsonPayload = (raw: string) => {
  let content = raw.trim();

  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    content = fencedMatch[1].trim();
  }

  return content.trim();
};

export interface TaskVerification {
  enabled: boolean;
  startKeywords: string[]; // 启动验证关键词（可手动修改）
  completionKeywords: string[]; // 完成验证关键词（可手动修改）
  startDeadline: Date | null; // 启动截止时间（任务开始时间 + 2分钟）
  completionDeadline: Date | null; // 完成截止时间（任务结束时间）
  
  // 启动验证追踪
  startFailedAttempts: number; // 启动失败次数（0-3）
  startTimeoutCount: number; // 启动超时次数（用于计算惩罚）
  startRetryDeadline: Date | null; // 启动重试截止时间
  
  // 完成验证追踪
  completionFailedAttempts: number; // 完成失败次数（0-3）
  completionTimeoutCount: number; // 完成超时次数（用于计算惩罚）
  completionExtensionCount: number; // 完成延期次数
  
  // 效率追踪
  plannedImageCount?: number; // 计划拍照次数
  
  status: 'pending' | 'waiting_start' | 'start_retry' | 'started' | 'waiting_completion' | 'completion_extension' | 'completed' | 'failed';
  actualStartTime: Date | null; // 实际启动时间
  actualCompletionTime: Date | null; // 实际完成时间
  
  // 金币追踪
  startGoldEarned: number; // 启动获得的金币（40%）
  completionGoldEarned: number; // 完成获得的金币（60%）
  totalGoldPenalty: number; // 总共扣除的金币
  startPenaltyGold: number; // 启动阶段扣除的金币（完成时返还）
}

export interface TaskImage {
  id: string;
  url: string;
  type: 'cover' | 'attachment' | 'verification';
  uploadedAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// ============================================
// 金币系统 - 奖励和惩罚
// ============================================
export class GoldSystem {
  // 计算启动奖励（任务总金币的40%）
  static calculateStartReward(totalGold: number): number {
    return Math.round(totalGold * 0.4);
  }
  
  // 计算完成奖励（任务总金币的60%）
  static calculateCompletionReward(totalGold: number): number {
    return Math.round(totalGold * 0.6);
  }
  
  // 计算启动超时惩罚（梯度：10%、20%、30%、40%...递增）
  static calculateStartTimeoutPenalty(totalGold: number, timeoutCount: number): number {
    const percentage = (timeoutCount + 1) * 0.1; // 10%, 20%, 30%, 40%...
    return Math.round(totalGold * percentage);
  }
  
  // 计算提前完成奖励
  static calculateEarlyCompletionBonus(totalGold: number, savedPercentage: number): number {
    if (savedPercentage >= 50) {
      // 提前50%以上：额外奖励100%金币
      return totalGold;
    } else if (savedPercentage >= 20) {
      // 提前20%-50%：额外奖励33%金币
      return Math.round(totalGold * 0.33);
    }
    return 0;
  }
  
  // 计算完成验证窗口开启时间（提前多少分钟）
  static getCompletionWindowMinutes(durationMinutes: number): number {
    if (durationMinutes >= 30) {
      return 5; // 时长≥30分钟：提前5分钟
    } else if (durationMinutes < 10) {
      return 1; // 时长<10分钟：提前1分钟
    } else {
      return 3; // 10-30分钟：提前3分钟
    }
  }
  
  // 旧的方法保持兼容性
  static calculateCompletionTimeoutPenalty(timeoutCount: number): number {
    const penalties = [200, 300, 400];
    if (timeoutCount >= 3) {
      return 600;
    }
    return penalties[timeoutCount] || 0;
  }
  
  static calculateStartRetryPenalty(retryCount: number): number {
    if (retryCount === 0) return 0;
    if (retryCount === 1) return 400;
    return 600;
  }
  
  static calculateCompletionExtensionPenalty(extensionCount: number): number {
    const penalties = [200, 300, 400];
    return penalties[extensionCount] || 400;
  }
}

// ============================================
// AI 生成启动和完成验证关键词
// ============================================
export async function generateVerificationKeywords(
  taskTitle: string,
  taskType: string,
  apiKey: string,
  apiEndpoint: string
): Promise<{ startKeywords: string[]; completionKeywords: string[] }> {
  const prompt = `你是一个任务验证助手。请为以下任务生成启动验证和完成验证的关键词。

任务标题：${taskTitle}
任务类型：${taskType}

要求：
1. 启动验证关键词：用于验证任务是否真正开始（3-4个）
2. 完成验证关键词：用于验证任务是否真正完成（3-4个）
3. 关键词应该是具体的、可视化的物体或场景
4. 返回JSON格式：
{
  "startKeywords": ["关键词1", "关键词2", "关键词3"],
  "completionKeywords": ["关键词1", "关键词2", "关键词3"]
}

示例：
- 任务"洗碗"：
  启动验证：["脏碗", "水槽", "洗洁精", "准备洗碗"]
  完成验证：["洗干净的碗", "干净的水槽", "碗架上的碗", "整洁的厨房"]

- 任务"跑步"：
  启动验证：["运动鞋", "运动服", "室外", "准备跑步"]
  完成验证：["出汗", "运动后", "疲惫", "完成跑步"]

- 任务"学习"：
  启动验证：["书本", "笔记本", "电脑", "学习环境"]
  完成验证：["笔记", "完成的作业", "学习成果", "整理好的书桌"]

只返回JSON，不要其他文字。`;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个任务验证助手，专门生成任务验证关键词。只返回JSON格式。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('AI生成失败');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // 提取JSON
    let jsonStr = aiResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    const result = JSON.parse(jsonStr);
    console.log('🔑 AI生成验证关键词:', result);
    
    return {
      startKeywords: result.startKeywords || ['任务开始'],
      completionKeywords: result.completionKeywords || ['任务完成'],
    };
  } catch (error) {
    console.error('AI生成关键词失败:', error);
    // 返回默认关键词
    return {
      startKeywords: ['任务开始', '准备工作', '开始执行'],
      completionKeywords: ['任务完成', '完成状态', '收尾工作'],
    };
  }
}

// ============================================
// AI 拆解子任务
// ============================================
export async function generateSubTasks(
  taskTitle: string,
  taskDescription: string,
  apiKey: string,
  apiEndpoint: string
): Promise<string[]> {
  const prompt = `你是一个任务拆解助手。请将以下大任务拆解成3-5个容易完成的小任务。

任务标题：${taskTitle}
任务描述：${taskDescription || '无'}

要求：
1. 每个子任务应该是具体的、可执行的
2. 子任务应该按照执行顺序排列
3. 子任务应该简洁明了
4. 返回JSON数组格式：["子任务1", "子任务2", "子任务3"]

示例：
- 任务"写报告" → ["收集资料", "整理大纲", "撰写初稿", "修改润色", "最终检查"]
- 任务"做饭" → ["准备食材", "清洗食材", "切菜", "烹饪", "装盘"]
- 任务"整理房间" → ["收拾桌面", "整理衣物", "打扫地面", "擦拭家具", "垃圾分类"]

只返回JSON数组，不要其他文字。`;

  try {
    const response = await fetch(resolveAiEndpoint(apiEndpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个任务拆解助手，专门将大任务拆解成小任务。只返回JSON数组。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI拆解失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '[]';
    const jsonStr = extractJsonPayload(aiResponse);
    const subTasks = JSON.parse(jsonStr);

    if (!Array.isArray(subTasks)) {
      throw new Error('AI返回的任务拆解结果不是数组');
    }

    const normalizedSubTasks = subTasks
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 5);

    if (normalizedSubTasks.length === 0) {
      throw new Error('AI返回的任务拆解结果为空');
    }

    console.log('📋 AI拆解子任务:', normalizedSubTasks);
    return normalizedSubTasks;
  } catch (error) {
    console.error('AI拆解失败:', error);
    return ['开始准备', '执行任务', '完成收尾'];
  }
}

// ============================================
// 语音提醒系统（已废弃，使用 notificationManager 代替）
// 保留此类以保持向后兼容，但所有方法都转发到 notificationManager
// ============================================
export class VoiceReminder {
  // 任务开始提醒
  static remindTaskStart(taskTitle: string, keywords: string[]) {
    void keywords;
    notificationService.speak(`${taskTitle}现在开始。`);
  }
  
  // 10秒倒计时提醒
  static remindStartUrgent(taskTitle: string) {
    const message = `${taskTitle} 启动验证即将超时，请立即完成验证！`;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // 启动超时提醒
  static remindStartTimeout(taskTitle: string, penaltyGold: number, timeoutCount: number) {
    const message = `${taskTitle} 启动验证超时${timeoutCount}次${penaltyGold > 0 ? `，扣除${penaltyGold}金币` : ''}`;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // 启动重试提醒
  static remindStartRetry(taskTitle: string, retryCount: number, penaltyGold: number) {
    const message = `任务"${taskTitle}"第${retryCount}次重试${penaltyGold > 0 ? `，扣除${penaltyGold}金币` : ''}。请在2分钟内完成启动验证。`;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // 完成超时提醒
  static remindCompletionTimeout(taskTitle: string, penaltyGold: number, extensionCount: number) {
    const message = `${taskTitle} 完成验证超时${extensionCount}次${penaltyGold > 0 ? `，扣除${penaltyGold}金币` : ''}`;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // 连续失败全屏警报
  static remindCriticalFailure(taskTitle: string, totalPenalty: number) {
    const message = `警告！任务"${taskTitle}"连续失败，扣除${totalPenalty}金币！`;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  }
  
  // 启动成功获得金币
  static congratulateStartSuccess(taskTitle: string, goldEarned: number) {
    void goldEarned;
    notificationService.speak(`${taskTitle}已成功开始。`);
  }
  
  // 任务即将结束提醒（前1分钟或前10分钟）
  static remindTaskEnding(taskTitle: string, minutesLeft: number) {
    notificationService.notifyTaskEnding(taskTitle, minutesLeft, true);
  }
  
  // 任务完成提醒
  static remindTaskCompletion(taskTitle: string, keywords: string[]) {
    void keywords;
    notificationService.speak(`${taskTitle}已完成。`);
  }
  
  // 提前完成祝贺
  static congratulateEarlyCompletion(taskTitle: string, goldEarned: number) {
    void goldEarned;
    notificationService.speak(`${taskTitle}已提前完成，做得很好。`);
  }
  
  // 任务完成祝贺
  static congratulateCompletion(taskTitle: string, goldEarned: number) {
    void goldEarned;
    notificationService.speak(`${taskTitle}已完成。`);
  }
  
  // 通用语音播报
  static speak(message: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  }
}
export class SoundEffects {
  private static audioContext: AudioContext | null = null;

  // 初始化音频上下文
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // 播放成功音效（叮铃铃）
  static playSuccessSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // 创建三个音符（C-E-G和弦）
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      // 音量包络
      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.1 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.3);
      
      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.3);
    });
  }

  // 播放失败音效（低沉的嗡嗡声）
  static playFailSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 200; // 低音
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  // 播放警报音效（连续三次失败）
  static playAlarmSound() {
    const ctx = this.getAudioContext();
    let time = ctx.currentTime;

    // 播放10秒的警报声
    for (let i = 0; i < 20; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // 交替高低音
      oscillator.frequency.value = i % 2 === 0 ? 800 : 600;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.4, time);
      gainNode.gain.setValueAtTime(0, time + 0.25);
      
      oscillator.start(time);
      oscillator.stop(time + 0.25);
      
      time += 0.5;
    }
  }

  // 播放金币掉落音效
  static playCoinSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // 快速上升的音调
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
}

// ============================================
// 任务时间自动调整
// ============================================
export class TaskTimeAdjuster {
  // 提前完成任务，自动调整后续任务时间
  static adjustFollowingTasks(
    completedTaskId: string,
    actualEndTime: Date,
    allTasks: any[],
    onTaskUpdate: (taskId: string, updates: any) => void
  ) {
    // 找到已完成任务
    const completedTask = allTasks.find(t => t.id === completedTaskId);
    if (!completedTask || !completedTask.scheduledEnd) return;
    
    const originalEndTime = new Date(completedTask.scheduledEnd);
    const timeSaved = originalEndTime.getTime() - actualEndTime.getTime();
    
    if (timeSaved <= 0) return; // 没有提前完成
    
    console.log(`⏰ 任务提前完成，节省了 ${Math.round(timeSaved / 60000)} 分钟`);
    
    // 找到所有在原定结束时间之后的任务
    const followingTasks = allTasks
      .filter(t => {
        if (!t.scheduledStart) return false;
        const taskStart = new Date(t.scheduledStart);
        return taskStart >= originalEndTime;
      })
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    
    // 将所有后续任务往前移
    followingTasks.forEach(task => {
      const oldStart = new Date(task.scheduledStart);
      const newStart = new Date(oldStart.getTime() - timeSaved);
      
      const oldEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : null;
      const newEnd = oldEnd ? new Date(oldEnd.getTime() - timeSaved) : null;
      
      console.log(`📅 调整任务 "${task.title}": ${oldStart.toLocaleTimeString()} → ${newStart.toLocaleTimeString()}`);
      
      onTaskUpdate(task.id, {
        scheduledStart: newStart,
        scheduledEnd: newEnd,
      });
    });
    
    if (followingTasks.length > 0) {
      VoiceReminder.speak(`已自动调整${followingTasks.length}个后续任务的时间，全部提前${Math.round(timeSaved / 60000)}分钟。`);
    }
  }
  
  // 计算提醒时间（短任务前1分钟，长任务前10分钟）
  static getRemindTime(taskDuration: number, taskEndTime: Date): Date {
    const remindMinutes = taskDuration <= 5 ? 1 : 10;
    return new Date(taskEndTime.getTime() - remindMinutes * 60 * 1000);
  }
}
// ============================================
// 任务监控系统 - 自动定时提醒（支持重试和延期）
// ============================================
export class TaskMonitor {
  private static timers: Map<string, NodeJS.Timeout[]> = new Map();
  
  // 开始监控任务
  static startMonitoring(
    taskId: string,
    taskTitle: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    durationMinutes: number,
    totalGold: number,
    verification: TaskVerification | null,
    onStartRemind: () => void,
    onEndRemind: () => void,
    onStartTimeout: (timeoutCount: number, penalty: number) => void,
    onCompletionTimeout: (extensionCount: number, penalty: number) => void
  ) {
    // 清除旧的定时器
    this.stopMonitoring(taskId);
    
    const timers: NodeJS.Timeout[] = [];
    const now = new Date();
    
    // 🔧 修复：如果任务是历史任务（开始时间在当前时间之前），不启动监控
    // 这样补录历史任务时就不会触发超时警告
    if (scheduledStart.getTime() < now.getTime()) {
      console.log(`📝 任务 "${taskTitle}" 是历史任务，跳过监控`);
      return;
    }
    
    // 如果启用了验证
    if (verification && verification.enabled) {
      // 1. 任务开始时间到达 - 开始启动倒计时
      const startDelay = scheduledStart.getTime() - now.getTime();
      if (startDelay > 0) {
        const startTimer = setTimeout(() => {
          VoiceReminder.remindTaskStart(taskTitle, verification.startKeywords);
          onStartRemind();
        }, startDelay);
        timers.push(startTimer);
        
        // 2. 启动倒计时最后10秒提醒
        const urgentDelay = startDelay + 110 * 1000; // 开始后1分50秒
        if (urgentDelay > 0) {
          const urgentTimer = setTimeout(() => {
            VoiceReminder.remindStartUrgent(taskTitle);
          }, urgentDelay);
          timers.push(urgentTimer);
        }
        
        // 3. 启动超时处理（支持重试）
        this.setupStartTimeoutHandlers(
          taskId,
          taskTitle,
          startDelay,
          verification,
          onStartTimeout,
          timers
        );
      }
      
      // 4. 任务即将结束提醒
      const remindTime = TaskTimeAdjuster.getRemindTime(durationMinutes, scheduledEnd);
      const remindDelay = remindTime.getTime() - now.getTime();
      if (remindDelay > 0) {
        const remindMinutes = durationMinutes <= 5 ? 1 : 10;
        const remindTimer = setTimeout(() => {
          VoiceReminder.remindTaskEnding(taskTitle, remindMinutes);
        }, remindDelay);
        timers.push(remindTimer);
      }
      
      // 5. 任务结束时间到达 - 提醒完成验证
      const endDelay = scheduledEnd.getTime() - now.getTime();
      if (endDelay > 0) {
        const endTimer = setTimeout(() => {
          VoiceReminder.remindTaskCompletion(taskTitle, verification.completionKeywords);
          onEndRemind();
        }, endDelay);
        timers.push(endTimer);
        
        // 6. 完成超时处理（支持延期）
        this.setupCompletionTimeoutHandlers(
          taskId,
          taskTitle,
          endDelay,
          verification,
          onCompletionTimeout,
          timers
        );
      }
    }
    
    this.timers.set(taskId, timers);
    console.log(`🔔 开始监控任务 "${taskTitle}"，设置了 ${timers.length} 个定时器`);
  }
  
  // 设置启动超时处理器（支持重试）
  private static setupStartTimeoutHandlers(
    taskId: string,
    taskTitle: string,
    startDelay: number,
    verification: TaskVerification,
    onStartTimeout: (timeoutCount: number, penalty: number) => void,
    timers: NodeJS.Timeout[]
  ) {
    // 第1次超时（2分钟后）
    const timeout1 = setTimeout(() => {
      if (verification.status === 'waiting_start') {
        const penalty = GoldSystem.calculateStartTimeoutPenalty(0);
        VoiceReminder.remindStartTimeout(taskTitle, penalty, 1);
        VoiceReminder.remindStartRetry(taskTitle, 1, 0); // 第1次重试不扣金币
        SoundEffects.playFailSound();
        onStartTimeout(1, penalty);
      }
    }, startDelay + 120 * 1000);
    timers.push(timeout1);
    
    // 第2次超时（再2分钟后）
    const timeout2 = setTimeout(() => {
      if (verification.status === 'start_retry' && verification.startTimeoutCount === 1) {
        const penalty = GoldSystem.calculateStartTimeoutPenalty(1);
        const retryPenalty = GoldSystem.calculateStartRetryPenalty(1);
        VoiceReminder.remindStartTimeout(taskTitle, penalty, 2);
        VoiceReminder.remindStartRetry(taskTitle, 2, retryPenalty);
        SoundEffects.playFailSound();
        onStartTimeout(2, penalty + retryPenalty);
      }
    }, startDelay + 240 * 1000);
    timers.push(timeout2);
    
    // 第3次超时（再2分钟后）- 触发全屏警报
    const timeout3 = setTimeout(() => {
      if (verification.status === 'start_retry' && verification.startTimeoutCount === 2) {
        const penalty = GoldSystem.calculateStartTimeoutPenalty(2);
        const retryPenalty = GoldSystem.calculateStartRetryPenalty(2);
        const totalPenalty = penalty + retryPenalty;
        
        VoiceReminder.remindCriticalFailure(taskTitle, totalPenalty);
        SoundEffects.playAlarmSound(); // 全屏警报
        onStartTimeout(3, totalPenalty);
      }
    }, startDelay + 360 * 1000);
    timers.push(timeout3);
  }
  
  // 设置完成超时处理器（支持延期）
  private static setupCompletionTimeoutHandlers(
    taskId: string,
    taskTitle: string,
    endDelay: number,
    verification: TaskVerification,
    onCompletionTimeout: (extensionCount: number, penalty: number) => void,
    timers: NodeJS.Timeout[]
  ) {
    // 第1次超时（任务结束时间）
    const timeout1 = setTimeout(() => {
      if (verification.status === 'started') {
        const penalty = GoldSystem.calculateCompletionExtensionPenalty(0);
        VoiceReminder.remindCompletionTimeout(taskTitle, penalty, 1);
        SoundEffects.playFailSound();
        onCompletionTimeout(1, penalty);
      }
    }, endDelay);
    timers.push(timeout1);
    
    // 第2次超时（10分钟后）
    const timeout2 = setTimeout(() => {
      if (verification.status === 'completion_extension' && verification.completionExtensionCount === 1) {
        const penalty = GoldSystem.calculateCompletionExtensionPenalty(1);
        VoiceReminder.remindCompletionTimeout(taskTitle, penalty, 2);
        SoundEffects.playFailSound();
        onCompletionTimeout(2, penalty);
      }
    }, endDelay + 600 * 1000);
    timers.push(timeout2);
    
    // 第3次超时（再10分钟后）- 触发全屏警报
    const timeout3 = setTimeout(() => {
      if (verification.status === 'completion_extension' && verification.completionExtensionCount === 2) {
        const penalty = GoldSystem.calculateCompletionExtensionPenalty(2);
        const totalPenalty = GoldSystem.calculateCompletionTimeoutPenalty(3);
        
        VoiceReminder.remindCriticalFailure(taskTitle, totalPenalty);
        SoundEffects.playAlarmSound(); // 全屏警报
        onCompletionTimeout(3, totalPenalty);
      }
    }, endDelay + 1200 * 1000);
    timers.push(timeout3);
  }
  
  // 停止监控任务
  static stopMonitoring(taskId: string) {
    const timers = this.timers.get(taskId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.timers.delete(taskId);
      console.log(`🔕 停止监控任务 ${taskId}`);
    }
  }
  
  // 停止所有监控
  static stopAll() {
    this.timers.forEach((timers, taskId) => {
      timers.forEach(timer => clearTimeout(timer));
    });
    this.timers.clear();
    console.log('🔕 停止所有任务监控');
  }
}

export class ImageUploader {
  // 压缩图片到指定大小以下（默认1MB）
  static async compressImage(file: File, maxSizeMB: number = 1, maxWidth: number = 1920): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 按比例缩放
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // 动态调整质量，确保文件小于目标大小
          let quality = 0.9;
          const maxSizeBytes = maxSizeMB * 1024 * 1024;
          
          const tryCompress = (q: number) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('压缩失败'));
                return;
              }
              
              console.log(`📸 [压缩] 质量=${q}, 大小=${(blob.size / 1024).toFixed(2)}KB`);
              
              // 如果文件大小符合要求，或质量已经很低了，就返回
              if (blob.size <= maxSizeBytes || q <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`✅ [压缩完成] 原始=${(file.size / 1024).toFixed(2)}KB, 压缩后=${(blob.size / 1024).toFixed(2)}KB`);
                resolve(compressedFile);
              } else {
                // 继续降低质量
                tryCompress(q - 0.1);
              }
            }, 'image/jpeg', q);
          };
          
          tryCompress(quality);
        };
        
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // 上传图片到本地 IndexedDB 永久存储
  static async uploadImage(file: File): Promise<string> {
    try {
      // 1. 先压缩图片到1MB以下
      console.log(`📸 [上传] 开始压缩图片: ${file.name}, 原始大小=${(file.size / 1024).toFixed(2)}KB`);
      const compressedFile = await this.compressImage(file, 1, 1920);
      
      // 2. 转换为 base64
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('图片读取失败'));
        reader.readAsDataURL(compressedFile);
      });
      
      // 3. 保存到 localStorage（作为备份）
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageKey = `task_image_${imageId}`;
      
      try {
        localStorage.setItem(storageKey, dataUrl);
        console.log(`✅ [存储] 图片已保存到 localStorage: ${storageKey}`);
      } catch (e) {
        console.warn('⚠️ [存储] localStorage 空间不足，仅使用内存存储');
      }
      
      // 4. 返回 data URL（可以直接在 img 标签中使用）
      console.log(`✅ [上传完成] 图片ID: ${imageId}`);
      return dataUrl;
      
    } catch (error) {
      console.error('❌ [上传失败]', error);
      throw new Error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 从 localStorage 加载图片
  static loadImage(imageId: string): string | null {
    const storageKey = `task_image_${imageId}`;
    return localStorage.getItem(storageKey);
  }
  
  // 删除图片
  static deleteImage(imageId: string): void {
    const storageKey = `task_image_${imageId}`;
    localStorage.removeItem(storageKey);
    console.log(`🗑️ [删除] 已删除图片: ${storageKey}`);
  }
}

