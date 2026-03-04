import { useTaskStore } from '@/stores/taskStore';
import { useGoldStore } from '@/stores/goldStore';
import type { Task } from '@/types';

/**
 * RPG数据分析器 - 从时间轴读取真实数据
 */
export class RPGDataAnalyzer {
  /**
   * 计算经验值（基于金币）
   * 规则：1000金币 = 10经验值
   */
  static calculateExpFromGold(goldAmount: number): number {
    return Math.floor(goldAmount / 100); // 100金币 = 1经验
  }

  /**
   * 计算自律值（基于任务准时启动和拖延情况）
   * 返回 0-100 的值
   */
  static calculateDisciplineScore(): number {
    const tasks = useTaskStore.getState().tasks;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取今天的任务
    const todayTasks = tasks.filter(task => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    if (todayTasks.length === 0) return 50; // 没有任务，默认50分

    let onTimeCount = 0;
    let delayCount = 0;

    todayTasks.forEach(task => {
      if (task.actualStart && task.scheduledStart) {
        const scheduledTime = new Date(task.scheduledStart).getTime();
        const actualTime = new Date(task.actualStart).getTime();
        const delayMinutes = (actualTime - scheduledTime) / 60000;

        if (delayMinutes <= 5) {
          // 5分钟内启动算准时
          onTimeCount++;
        } else {
          // 超过5分钟算拖延
          delayCount++;
        }
      }
    });

    // 计算自律分数
    const totalChecked = onTimeCount + delayCount;
    if (totalChecked === 0) return 50;

    const score = Math.round((onTimeCount / totalChecked) * 100);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 预估心情值（基于任务完成情况和类型）
   * 返回 0-100 的值
   */
  static estimateMoodScore(): number {
    const tasks = useTaskStore.getState().tasks;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取今天的任务
    const todayTasks = tasks.filter(task => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    if (todayTasks.length === 0) return 70; // 没有任务，默认70分

    let moodScore = 70; // 基础分数

    // 完成任务增加心情
    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    moodScore += completedTasks.length * 5;

    // 休息类任务额外加分
    const restTasks = completedTasks.filter(t => t.taskType === 'rest');
    moodScore += restTasks.length * 3;

    // 健康类任务额外加分
    const healthTasks = completedTasks.filter(t => t.taskType === 'health');
    moodScore += healthTasks.length * 3;

    // 未完成任务减少心情
    const incompleteTasks = todayTasks.filter(t => t.status === 'pending' || t.status === 'overdue');
    moodScore -= incompleteTasks.length * 2;

    return Math.max(0, Math.min(100, moodScore));
  }

  /**
   * 生成今日状态标签（6个以上）
   */
  static generateTodayStatus(): string[] {
    const tasks = useTaskStore.getState().tasks;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = tasks.filter(task => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    const status: string[] = [];

    // 1. 任务完成情况
    const completedCount = todayTasks.filter(t => t.status === 'completed').length;
    if (completedCount > 0) {
      status.push(`完成${completedCount}个任务`);
    }

    // 2. 专注时长
    const totalMinutes = todayTasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    if (totalMinutes > 0) {
      const hours = Math.floor(totalMinutes / 60);
      if (hours > 0) {
        status.push(`专注${hours}小时`);
      }
    }

    // 3. 自律情况
    const disciplineScore = this.calculateDisciplineScore();
    if (disciplineScore >= 80) {
      status.push('自律满分');
    } else if (disciplineScore >= 60) {
      status.push('保持自律');
    } else if (disciplineScore < 40) {
      status.push('需要加油');
    }

    // 4. 心情状态
    const moodScore = this.estimateMoodScore();
    if (moodScore >= 80) {
      status.push('心情愉悦');
    } else if (moodScore >= 60) {
      status.push('状态良好');
    } else {
      status.push('需要休息');
    }

    // 5. 任务类型分析
    const workTasks = todayTasks.filter(t => t.taskType === 'work' && t.status === 'completed');
    if (workTasks.length >= 3) {
      status.push('工作高效');
    }

    const studyTasks = todayTasks.filter(t => t.taskType === 'study' && t.status === 'completed');
    if (studyTasks.length >= 2) {
      status.push('学习进步');
    }

    const healthTasks = todayTasks.filter(t => t.taskType === 'health' && t.status === 'completed');
    if (healthTasks.length >= 1) {
      status.push('注重健康');
    }

    // 6. 金币收入
    const goldStore = useGoldStore.getState();
    if (goldStore.todayEarned > 100) {
      status.push(`赚取${goldStore.todayEarned}金币`);
    }

    // 7. 早起情况
    const earlyTasks = todayTasks.filter(t => {
      if (!t.actualStart) return false;
      const hour = new Date(t.actualStart).getHours();
      return hour >= 6 && hour <= 8;
    });
    if (earlyTasks.length > 0) {
      status.push('早起鸟儿');
    }

    // 8. 夜猫子检测
    const lateTasks = todayTasks.filter(t => {
      if (!t.actualStart) return false;
      const hour = new Date(t.actualStart).getHours();
      return hour >= 22 || hour <= 2;
    });
    if (lateTasks.length > 0) {
      status.push('夜猫子');
    }

    // 确保至少有6个状态
    if (status.length < 6) {
      const defaultStatus = ['保持节奏', '稳步前进', '持续成长', '积极向上', '充满活力', '目标明确'];
      while (status.length < 6) {
        const randomStatus = defaultStatus[Math.floor(Math.random() * defaultStatus.length)];
        if (!status.includes(randomStatus)) {
          status.push(randomStatus);
        }
      }
    }

    return status.slice(0, 8); // 最多返回8个
  }

  /**
   * 分析性格特质（5-6个）
   */
  static analyzePersonality(): string[] {
    const tasks = useTaskStore.getState().tasks;
    const recentTasks = tasks.slice(-30); // 最近30个任务

    const personality: string[] = [];

    // 1. 自律性分析
    const disciplineScore = this.calculateDisciplineScore();
    if (disciplineScore >= 80) {
      personality.push('高度自律');
    } else if (disciplineScore >= 60) {
      personality.push('自律');
    } else {
      personality.push('需要提升自律');
    }

    // 2. 完成率分析
    const completedCount = recentTasks.filter(t => t.status === 'completed').length;
    const completionRate = recentTasks.length > 0 ? completedCount / recentTasks.length : 0;
    if (completionRate >= 0.8) {
      personality.push('执行力强');
    } else if (completionRate >= 0.6) {
      personality.push('执行力中等');
    }

    // 3. 任务类型偏好
    const workCount = recentTasks.filter(t => t.taskType === 'work').length;
    const studyCount = recentTasks.filter(t => t.taskType === 'study').length;
    const healthCount = recentTasks.filter(t => t.taskType === 'health').length;

    if (workCount > studyCount && workCount > healthCount) {
      personality.push('工作导向');
    } else if (studyCount > workCount) {
      personality.push('学习型');
    } else if (healthCount > 0) {
      personality.push('注重健康');
    }

    // 4. 时间偏好
    const morningTasks = recentTasks.filter(t => {
      if (!t.actualStart) return false;
      const hour = new Date(t.actualStart).getHours();
      return hour >= 6 && hour <= 12;
    });
    const nightTasks = recentTasks.filter(t => {
      if (!t.actualStart) return false;
      const hour = new Date(t.actualStart).getHours();
      return hour >= 18 && hour <= 23;
    });

    if (morningTasks.length > nightTasks.length) {
      personality.push('早起型');
    } else if (nightTasks.length > morningTasks.length) {
      personality.push('夜猫子型');
    }

    // 5. 理性/感性
    const planningTasks = recentTasks.filter(t => t.description && t.description.length > 20);
    if (planningTasks.length / recentTasks.length > 0.5) {
      personality.push('偏理性');
    } else {
      personality.push('偏感性');
    }

    // 6. 目标导向
    const goalTasks = recentTasks.filter(t => t.tags && t.tags.length > 0);
    if (goalTasks.length / recentTasks.length > 0.6) {
      personality.push('目标导向');
    }

    return personality.slice(0, 6);
  }

  /**
   * 分析优势能力（5个以上）
   */
  static analyzeStrengths(): Array<{ label: string; description: string }> {
    const tasks = useTaskStore.getState().tasks;
    const recentTasks = tasks.slice(-30);
    const strengths: Array<{ label: string; description: string }> = [];

    // 1. 执行力
    const completedCount = recentTasks.filter(t => t.status === 'completed').length;
    if (completedCount >= 20) {
      strengths.push({
        label: '执行力强',
        description: `最近完成${completedCount}个任务，执行力优秀`
      });
    }

    // 2. 时间管理
    const onTimeTasks = recentTasks.filter(t => {
      if (!t.actualStart || !t.scheduledStart) return false;
      const delay = (new Date(t.actualStart).getTime() - new Date(t.scheduledStart).getTime()) / 60000;
      return delay <= 5;
    });
    if (onTimeTasks.length >= 15) {
      strengths.push({
        label: '时间管理能力',
        description: `${onTimeTasks.length}次准时启动任务，时间观念强`
      });
    }

    // 3. 专注力
    const longTasks = recentTasks.filter(t => (t.durationMinutes || 0) >= 60);
    if (longTasks.length >= 5) {
      strengths.push({
        label: '专注力',
        description: `完成${longTasks.length}个长时间任务，专注力优秀`
      });
    }

    // 4. 学习能力
    const studyTasks = recentTasks.filter(t => t.taskType === 'study' && t.status === 'completed');
    if (studyTasks.length >= 5) {
      strengths.push({
        label: '学习能力',
        description: `完成${studyTasks.length}个学习任务，持续进步`
      });
    }

    // 5. 健康意识
    const healthTasks = recentTasks.filter(t => t.taskType === 'health' && t.status === 'completed');
    if (healthTasks.length >= 3) {
      strengths.push({
        label: '健康意识',
        description: `完成${healthTasks.length}个健康任务，注重身心健康`
      });
    }

    // 6. 工作效率
    const workTasks = recentTasks.filter(t => t.taskType === 'work' && t.status === 'completed');
    if (workTasks.length >= 10) {
      strengths.push({
        label: '工作效率',
        description: `完成${workTasks.length}个工作任务，职业素养高`
      });
    }

    // 7. 创造力
    const creativeTasks = recentTasks.filter(t => t.taskType === 'creative' && t.status === 'completed');
    if (creativeTasks.length >= 3) {
      strengths.push({
        label: '创造力',
        description: `完成${creativeTasks.length}个创意任务，富有创造力`
      });
    }

    // 8. 社交能力
    const socialTasks = recentTasks.filter(t => t.taskType === 'social' && t.status === 'completed');
    if (socialTasks.length >= 3) {
      strengths.push({
        label: '社交能力',
        description: `完成${socialTasks.length}个社交任务，人际关系良好`
      });
    }

    // 确保至少有5个优势
    if (strengths.length < 5) {
      const defaultStrengths = [
        { label: '坚持不懈', description: '持续记录和完成任务' },
        { label: '自我管理', description: '能够规划和管理自己的时间' },
        { label: '目标明确', description: '清楚自己想要什么' },
        { label: '积极主动', description: '主动安排和完成任务' },
        { label: '反思能力', description: '善于总结和改进' },
      ];
      
      for (const strength of defaultStrengths) {
        if (strengths.length >= 5) break;
        if (!strengths.find(s => s.label === strength.label)) {
          strengths.push(strength);
        }
      }
    }

    return strengths.slice(0, 8);
  }

  /**
   * 分析待改进行为（5个以上）
   */
  static analyzeImprovements(): Array<{ label: string; description: string; progress: number }> {
    const tasks = useTaskStore.getState().tasks;
    const recentTasks = tasks.slice(-30);
    const improvements: Array<{ label: string; description: string; progress: number }> = [];

    // 1. 拖延分析
    const delayedTasks = recentTasks.filter(t => {
      if (!t.actualStart || !t.scheduledStart) return false;
      const delay = (new Date(t.actualStart).getTime() - new Date(t.scheduledStart).getTime()) / 60000;
      return delay > 5;
    });
    if (delayedTasks.length > 0) {
      const delayRate = (delayedTasks.length / recentTasks.length) * 100;
      improvements.push({
        label: '拖延',
        description: `${delayedTasks.length}次推迟任务，需要提升时间观念`,
        progress: Math.max(0, 100 - delayRate)
      });
    }

    // 2. 任务完成率
    const incompleteTasks = recentTasks.filter(t => t.status === 'pending' || t.status === 'overdue');
    if (incompleteTasks.length > 5) {
      const completeRate = ((recentTasks.length - incompleteTasks.length) / recentTasks.length) * 100;
      improvements.push({
        label: '任务完成率',
        description: `${incompleteTasks.length}个任务未完成，需要提升执行力`,
        progress: completeRate
      });
    }

    // 3. 专注力不足
    const shortTasks = recentTasks.filter(t => {
      if (!t.durationMinutes) return false;
      return t.durationMinutes < 30 && t.taskType !== 'life';
    });
    if (shortTasks.length > 10) {
      improvements.push({
        label: '专注力不足',
        description: `${shortTasks.length}个任务时长过短，需要提升专注力`,
        progress: Math.max(0, 100 - (shortTasks.length / recentTasks.length) * 100)
      });
    }

    // 4. 缺乏运动
    const healthTasks = recentTasks.filter(t => t.taskType === 'health');
    if (healthTasks.length < 3) {
      improvements.push({
        label: '缺乏运动',
        description: `仅${healthTasks.length}次健康活动，需要增加运动`,
        progress: (healthTasks.length / 10) * 100
      });
    }

    // 5. 学习时间不足
    const studyTasks = recentTasks.filter(t => t.taskType === 'study');
    if (studyTasks.length < 5) {
      improvements.push({
        label: '学习时间不足',
        description: `仅${studyTasks.length}次学习，需要增加学习时间`,
        progress: (studyTasks.length / 15) * 100
      });
    }

    // 6. 休息不足
    const restTasks = recentTasks.filter(t => t.taskType === 'rest');
    if (restTasks.length < 3) {
      improvements.push({
        label: '休息不足',
        description: `仅${restTasks.length}次休息，需要注意劳逸结合`,
        progress: (restTasks.length / 10) * 100
      });
    }

    // 7. 社交不足
    const socialTasks = recentTasks.filter(t => t.taskType === 'social');
    if (socialTasks.length < 2) {
      improvements.push({
        label: '社交不足',
        description: `仅${socialTasks.length}次社交活动，需要增加社交`,
        progress: (socialTasks.length / 8) * 100
      });
    }

    // 8. 创造力不足
    const creativeTasks = recentTasks.filter(t => t.taskType === 'creative');
    if (creativeTasks.length < 2) {
      improvements.push({
        label: '创造力不足',
        description: `仅${creativeTasks.length}次创意活动，需要培养创造力`,
        progress: (creativeTasks.length / 8) * 100
      });
    }

    // 确保至少有5个待改进项
    if (improvements.length < 5) {
      const defaultImprovements = [
        { label: '时间规划', description: '需要更好地规划时间', progress: 50 },
        { label: '目标设定', description: '需要设定更明确的目标', progress: 60 },
        { label: '自我激励', description: '需要提升自我激励能力', progress: 55 },
        { label: '压力管理', description: '需要学会管理压力', progress: 65 },
        { label: '情绪控制', description: '需要提升情绪管理能力', progress: 70 },
      ];
      
      for (const improvement of defaultImprovements) {
        if (improvements.length >= 5) break;
        if (!improvements.find(i => i.label === improvement.label)) {
          improvements.push(improvement);
        }
      }
    }

    return improvements.slice(0, 8);
  }

  /**
   * 同步所有数据到RPG Store
   */
  static syncAllData() {
    const { useRPGStore } = require('@/stores/rpgStore');
    const goldStore = useGoldStore.getState();
    
    // 计算经验值（基于金币）
    const totalExp = this.calculateExpFromGold(goldStore.balance);
    
    // 计算等级
    let level = 1;
    let remainingExp = totalExp;
    let maxExp = 200;
    
    while (remainingExp >= maxExp) {
      level++;
      remainingExp -= maxExp;
      maxExp = Math.floor(maxExp * 1.5);
    }
    
    // 更新角色数据
    useRPGStore.getState().updateCharacter({
      level,
      exp: remainingExp,
      maxExp,
      discipline: this.calculateDisciplineScore(), // 自律值
      mood: this.estimateMoodScore(),
      personality: this.analyzePersonality(),
      strengths: this.analyzeStrengths(),
      improvements: this.analyzeImprovements(),
    });
    
    // 更新今日状态
    useRPGStore.setState({
      todayStatus: this.generateTodayStatus()
    });
    
    console.log('✅ RPG数据已同步');
  }
}

