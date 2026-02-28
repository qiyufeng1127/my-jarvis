import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, ListChecks, Settings } from 'lucide-react';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    {
      path: '/',
      icon: Home,
      label: '时间轴',
      emoji: '🏠',
    },
    {
      path: '/calendar',
      icon: Calendar,
      label: '日历',
      emoji: '📅',
    },
    {
      path: '/inbox',
      icon: ListChecks,
      label: '收集箱',
      emoji: '📥',
    },
    {
      path: '/habit',
      icon: ListChecks,
      label: '习惯',
      emoji: '🏺',
    },
    {
      path: '/sop',
      icon: ListChecks,
      label: 'SOP',
      emoji: '📋',
    },
    {
      path: '/memory',
      icon: ListChecks,
      label: '记忆',
      emoji: '🧠',
    },
    {
      path: '/goals',
      icon: ListChecks,
      label: '目标',
      emoji: '🎯',
    },
    {
      path: '/settings',
      icon: Settings,
      label: '设置',
      emoji: '⚙️',
    },
  ];
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors px-0.5 ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <span className="text-lg">{item.emoji}</span>
                {active && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium leading-tight ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

