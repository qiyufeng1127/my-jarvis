import { useEffect, useState } from 'react';
import { Play, Pause, AlertTriangle, Zap, CheckCircle } from 'lucide-react';

interface TaskStatusIndicatorProps {
  status: 'pending' | 'in_progress' | 'completed' | 'procrastinating' | 'low_efficiency';
  taskTitle: string;
  taskColor?: string;
  isProcrastinating?: boolean;
  isLowEfficiency?: boolean;
  onStatusChange?: (status: string) => void;
}

export default function TaskStatusIndicator({
  status,
  taskTitle,
  taskColor = '#3B82F6',
  isProcrastinating = false,
  isLowEfficiency = false,
  onStatusChange,
}: TaskStatusIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);

  // 播放声音
  const playSound = (type: 'start' | 'complete' | 'warning' | 'alarm') => {
    if (soundPlayed) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'start':
        // 启动音效 - 上升音调
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
        
      case 'complete':
        // 完成音效 - 欢快的和弦
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
        
      case 'warning':
        // 警告音效 - 双音调
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
        
      case 'alarm':
        // 警报音效 - 急促的重复音
        for (let i = 0; i < 3; i++) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.setValueAtTime(1000, audioContext.currentTime + i * 0.3);
          gain.gain.setValueAtTime(0.5, audioContext.currentTime + i * 0.3);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.3 + 0.2);
          osc.start(audioContext.currentTime + i * 0.3);
          osc.stop(audioContext.currentTime + i * 0.3 + 0.2);
        }
        break;
    }
    
    setSoundPlayed(true);
    setTimeout(() => setSoundPlayed(false), 1000);
  };

  // 语音提醒
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 状态变化时的效果
  useEffect(() => {
    if (status === 'in_progress') {
      setIsAnimating(true);
      playSound('start');
      speak(`开始任务：${taskTitle}`);
    } else if (status === 'completed') {
      setIsAnimating(true);
      playSound('complete');
      speak(`任务完成：${taskTitle}`);
      setTimeout(() => setIsAnimating(false), 2000);
    }
  }, [status]);

  // 拖延或低效率时的警告
  useEffect(() => {
    if (isProcrastinating) {
      playSound('alarm');
      speak(`警告！任务拖延：${taskTitle}`);
    } else if (isLowEfficiency) {
      playSound('warning');
      speak(`提醒：任务效率低下：${taskTitle}`);
    }
  }, [isProcrastinating, isLowEfficiency]);

  // 获取状态样式
  const getStatusStyle = () => {
    if (status === 'completed') {
      return {
        bg: 'bg-green-500',
        text: 'text-white',
        icon: <CheckCircle className="w-5 h-5" />,
        label: '✅ 已完成',
        animation: 'animate-bounce',
      };
    }
    
    if (isProcrastinating) {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        icon: <AlertTriangle className="w-5 h-5 animate-pulse" />,
        label: '⚠️ 拖延中',
        animation: 'animate-pulse',
      };
    }
    
    if (isLowEfficiency) {
      return {
        bg: 'bg-orange-500',
        text: 'text-white',
        icon: <Zap className="w-5 h-5" />,
        label: '⚡ 低效率',
        animation: 'animate-pulse',
      };
    }
    
    if (status === 'in_progress') {
      return {
        bg: 'bg-blue-500',
        text: 'text-white',
        icon: <Play className="w-5 h-5" />,
        label: '▶️ 进行中',
        animation: 'animate-pulse',
      };
    }
    
    return {
      bg: 'bg-gray-400',
      text: 'text-white',
      icon: <Pause className="w-5 h-5" />,
      label: '⏸️ 未开始',
      animation: '',
    };
  };

  const statusStyle = getStatusStyle();

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${statusStyle.bg} ${statusStyle.text} ${isAnimating ? statusStyle.animation : ''} transition-all duration-300 shadow-lg`}>
      {statusStyle.icon}
      <span className="font-semibold text-sm">{statusStyle.label}</span>
    </div>
  );
}

