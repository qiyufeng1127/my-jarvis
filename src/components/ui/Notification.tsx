import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Notification({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const styles = {
    success: 'bg-success-50 border-success-500 text-success-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    warning: 'bg-warning-50 border-warning-500 text-warning-900',
    info: 'bg-blue-50 border-blue-500 text-blue-900',
  };

  const iconColors = {
    success: 'text-success-600',
    error: 'text-red-600',
    warning: 'text-warning-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 rounded-lg border-l-4 shadow-md transition-all duration-300',
        styles[type],
        isVisible ? 'animate-slide-down opacity-100' : 'opacity-0 translate-y-2'
      )}
    >
      <div className={cn('flex-shrink-0', iconColors[type])}>{icons[type]}</div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
      </div>

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

