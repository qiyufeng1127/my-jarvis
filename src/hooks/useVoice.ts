import { useState, useCallback, useRef } from 'react';
import { useVoiceRecognition } from './useVoiceRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useUserStore } from '@/stores/userStore';
import { VOICE_CONFIG, DEFAULT_GROWTH_DIMENSIONS } from '@/constants';
import { VoiceCommandParser, VoiceResponseGenerator } from '@/services/voiceCommandService';
import type { VoiceCommand } from '@/services/voiceCommandService';

export function useVoice() {
  const [isActive, setIsActive] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store hooks
  const { tasks, createTask, getTodayTasks } = useTaskStore();
  const { dimensions, totalGrowth, goals } = useGrowthStore();

  const { speak, isSpeaking } = useSpeechSynthesis({
    lang: VOICE_CONFIG.SYNTHESIS_LANGUAGE,
    rate: VOICE_CONFIG.DEFAULT_VOICE_SPEED,
  });

  const handleVoiceResult = useCallback((transcript: string) => {
    console.log('识别到语音:', transcript);
    
    // 解析语音指令
    const command = VoiceCommandParser.parse(transcript);
    setLastCommand(command);

    // 执行相应的操作
    handleCommand(command);
  }, []);

  const { isListening, startListening, stopListening, transcript } = useVoiceRecognition({
    lang: VOICE_CONFIG.RECOGNITION_LANGUAGE,
    onResult: handleVoiceResult,
    onError: (error) => {
      console.error('语音识别错误:', error);
      speak('抱歉，我没有听清楚，请再说一遍');
    },
  });

  const activate = useCallback(() => {
    setIsActive(true);
    speak('我在，请说');
    
    // 等待语音播放完成后开始监听
    setTimeout(() => {
      startListening();
    }, 1000);

    // 8秒后自动关闭
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      stopListening();
      setIsActive(false);
    }, VOICE_CONFIG.WAKE_TIMEOUT);
  }, [startListening, stopListening, speak]);

  const deactivate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    stopListening();
    setIsActive(false);
  }, [stopListening]);

  const handleCommand = useCallback((command: VoiceCommand) => {
    // 根据指令类型执行不同的操作
    switch (command.type) {
      case 'task':
        handleTaskCommand(command);
        break;
      case 'query':
        handleQueryCommand(command);
        break;
      case 'control':
        handleControlCommand(command);
        break;
      case 'emotion':
        handleEmotionCommand(command);
        break;
      default:
        const response = VoiceResponseGenerator.unknown();
        speak(response.text);
    }
  }, [speak, tasks, dimensions, totalGrowth, goals]);

  // 处理任务指令
  const handleTaskCommand = useCallback((command: VoiceCommand) => {
    switch (command.intent) {
      case 'create': {
        const { description, time, duration } = command.entities;
        
        // 创建任务
        createTask({
          title: description || '新任务',
          description: description,
          durationMinutes: duration ? parseInt(duration) : 30,
          scheduledStart: time ? parseTime(time) : new Date(),
        }).then((task) => {
          const response = VoiceResponseGenerator.taskCreated(task);
          speak(response.text);
        }).catch(() => {
          const response = VoiceResponseGenerator.error('创建任务失败了，请重试');
          speak(response.text);
        });
        break;
      }
      case 'delete': {
        const { taskName } = command.entities;
        const task = tasks.find((t) => t.title.includes(taskName));
        if (task) {
          // TODO: 实现删除逻辑
          speak(`好的，已删除任务"${task.title}"`);
        } else {
          speak(`没有找到名为"${taskName}"的任务`);
        }
        break;
      }
      default:
        speak('这个任务操作我还不太会');
    }
  }, [tasks, createTask, speak]);

  // 处理查询指令
  const handleQueryCommand = useCallback((command: VoiceCommand) => {
    switch (command.intent) {
      case 'view_tasks': {
        const { timeScope } = command.entities;
        const todayTasks = getTodayTasks();
        const response = VoiceResponseGenerator.taskList(todayTasks, timeScope || 'today');
        speak(response.text);
        break;
      }
      case 'view_growth': {
        const { subIntent } = command.entities;
        
        if (subIntent === 'overview') {
          speak(`你的总成长值是${totalGrowth}点，继续加油！`);
        } else if (subIntent === 'story') {
          speak('播放今天的成长故事功能正在开发中，敬请期待');
        } else {
          // 查询具体维度
          const dimensionMap: Record<string, string> = {
            focus: '专注力',
            execution: '执行力',
            health: '健康力',
            wealth: '财富力',
            charm: '魅力值',
          };
          
          const dimensionName = dimensionMap[subIntent];
          if (dimensionName) {
            const dimension = dimensions.find((d) => d.name === dimensionName);
            if (dimension) {
              const response = VoiceResponseGenerator.growthStatus(
                dimensionName,
                dimension.currentValue,
                dimension.targetValue
              );
              speak(response.text);
            } else {
              speak(`${dimensionName}数据暂时没有`);
            }
          }
        }
        break;
      }
      default:
        const response = VoiceResponseGenerator.unknown();
        speak(response.text);
    }
  }, [tasks, dimensions, totalGrowth, getTodayTasks, speak]);

  // 处理控制指令
  const handleControlCommand = useCallback((command: VoiceCommand) => {
    switch (command.intent) {
      case 'focus_mode': {
        const response = VoiceResponseGenerator.focusMode(true);
        speak(response.text);
        // TODO: 实际启动专注模式
        break;
      }
      case 'pause': {
        const { duration } = command.entities;
        const response = VoiceResponseGenerator.pause(duration || '10分钟');
        speak(response.text);
        break;
      }
      case 'redeem': {
        const { reward } = command.entities;
        // TODO: 实现兑换逻辑
        speak(`兑换"${reward}"功能正在开发中`);
        break;
      }
      default:
        speak('这个控制指令我还不太会');
    }
  }, [speak]);

  // 处理情感指令
  const handleEmotionCommand = useCallback((command: VoiceCommand) => {
    const response = VoiceResponseGenerator.emotionalSupport(command.intent);
    speak(response.text);
  }, [speak]);

  return {
    isActive,
    isListening,
    isSpeaking,
    transcript,
    lastCommand,
    activate,
    deactivate,
    speak,
  };
}

// 辅助函数：解析时间字符串
function parseTime(timeStr: string): Date {
  const now = new Date();
  
  // 匹配 "下午3点" 或 "15:00" 格式
  const hourMatch = timeStr.match(/(\d+)点|(\d+):(\d+)/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[1] || hourMatch[2]);
    const minute = hourMatch[3] ? parseInt(hourMatch[3]) : 0;
    
    // 判断上午/下午
    const isPM = /下午|晚上/.test(timeStr);
    const adjustedHour = isPM && hour < 12 ? hour + 12 : hour;
    
    now.setHours(adjustedHour, minute, 0, 0);
  }
  
  // 判断明天
  if (/明天/.test(timeStr)) {
    now.setDate(now.getDate() + 1);
  }
  
  return now;
}

