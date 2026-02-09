import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TaskCountdownProps {
  deadline: Date;
  type: 'start' | 'complete';
  onTimeout?: () => void;
}

export default function TaskCountdown({ deadline, type, onTimeout }: TaskCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onTimeout) {
          onTimeout();
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline, onTimeout]);

  const formatTime = () => {
    if (timeLeft.isExpired) {
      return '已超时';
    }

    const parts = [];
    if (timeLeft.hours > 0) {
      parts.push(`${timeLeft.hours}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`);
    } else {
      parts.push(`${timeLeft.minutes}:${String(timeLeft.seconds).padStart(2, '0')}`);
    }
    return parts.join('');
  };

  const getColor = () => {
    if (timeLeft.isExpired) {
      return '#EF4444'; // 红色
    }
    
    if (type === 'start') {
      // 启动验证倒计时：2分钟
      const totalSeconds = timeLeft.minutes * 60 + timeLeft.seconds;
      if (totalSeconds <= 30) {
        return '#EF4444'; // 红色：最后30秒
      } else if (totalSeconds <= 60) {
        return '#F59E0B'; // 橙色：最后1分钟
      }
      return '#10B981'; // 绿色：充足时间
    } else {
      // 完成验证倒计时：任务总时长
      const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
      const percentage = (totalMinutes * 60 + timeLeft.seconds) / (deadline.getTime() - new Date().getTime() + (timeLeft.hours * 60 + timeLeft.minutes) * 60 * 1000);
      
      if (percentage < 0.2) {
        return '#EF4444'; // 红色：剩余不足20%
      } else if (percentage < 0.5) {
        return '#F59E0B'; // 橙色：剩余不足50%
      }
      return '#10B981'; // 绿色：充足时间
    }
  };

  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ 
        backgroundColor: `${getColor()}20`,
        border: `1px solid ${getColor()}`,
      }}
    >
      <Clock className="w-3.5 h-3.5" style={{ color: getColor() }} />
      <span 
        className="text-xs font-bold tabular-nums"
        style={{ color: getColor() }}
      >
        {formatTime()}
      </span>
    </div>
  );
}

