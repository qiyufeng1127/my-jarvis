import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Coins } from 'lucide-react';
import type { NotificationPayload } from '@/services/notificationService';

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<(NotificationPayload & { id: string })[]>([]);

  useEffect(() => {
    const handleNotification = (event: CustomEvent<NotificationPayload>) => {
      const payload = event.detail;
      
      // 只显示高优先级和严重级别的通知
      if (payload.priority === 'high' || payload.priority === 'critical') {
        const id = Date.now().toString();
        const notification = { ...payload, id };
        
        setNotifications(prev => [...prev, notification]);
        
        // 自动关闭（除非明确禁止）
        if (payload.autoClose !== false) {
          const delay = payload.autoCloseDelay || (payload.priority === 'critical' ? 10000 : 5000);
          setTimeout(() => {
            removeNotification(id);
          }, delay);
        }
      }
    };

    window.addEventListener('app-notification', handleNotification as EventListener);
    
    return () => {
      window.removeEventListener('app-notification', handleNotification as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationCardProps {
  notification: NotificationPayload & { id: string };
  onClose: () => void;
}

function NotificationCard({ notification, onClose }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'verification_success':
      case 'gold_earned':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      
      case 'verification_timeout':
      case 'verification_failed':
      case 'gold_penalty':
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      
      case 'critical_failure':
      case 'bad_habit_warning':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    if (notification.priority === 'critical') {
      return 'bg-red-500/95';
    }
    return 'bg-white dark:bg-gray-800';
  };

  const getTextColor = () => {
    if (notification.priority === 'critical') {
      return 'text-white';
    }
    return 'text-gray-900 dark:text-white';
  };

  const isCritical = notification.priority === 'critical';

  return (
    <div
      className={`${getBackgroundColor()} ${getTextColor()} rounded-xl shadow-2xl p-4 animate-slide-in-right border-2 ${
        isCritical ? 'border-red-600 animate-pulse-border' : 'border-transparent'
      }`}
      style={{
        animation: isCritical ? 'shake 0.5s ease-in-out' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-lg">{notification.title}</h4>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                isCritical 
                  ? 'hover:bg-white/20' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-1 text-sm opacity-90">{notification.message}</p>

          {/* 金币变动 */}
          {notification.goldAmount !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span className={`font-bold ${
                notification.goldAmount > 0 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {notification.goldAmount > 0 ? '+' : ''}{notification.goldAmount} 金币
              </span>
            </div>
          )}

          {/* 任务标题 */}
          {notification.taskTitle && (
            <div className="mt-2 text-xs opacity-70">
              📋 {notification.taskTitle}
            </div>
          )}
        </div>
      </div>

      {/* 严重警告的额外视觉效果 */}
      {isCritical && (
        <div className="mt-3 pt-3 border-t border-white/30">
          <div className="text-center font-bold text-sm animate-pulse">
            ⚠️ 请立即处理 ⚠️
          </div>
        </div>
      )}
    </div>
  );
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  @keyframes pulse-border {
    0%, 100% { border-color: rgb(220, 38, 38); }
    50% { border-color: rgb(239, 68, 68); }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }

  .animate-pulse-border {
    animation: pulse-border 1s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

