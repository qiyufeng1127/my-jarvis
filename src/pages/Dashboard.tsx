import { useEffect, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { X } from 'lucide-react';
import NotificationContainer from '@/components/ui/NotificationContainer';
import FloatingAIChat from '@/components/ai/FloatingAIChat';
// import AISmartInput from '@/components/ai/AISmartInput'; // 临时注释
import TimelineCalendar from '@/components/calendar/TimelineCalendar';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

export default function Dashboard() {
  const { tasks, loadTasks, updateTask, createTask, deleteTask } = useTaskStore();
  const { loadGrowthData } = useGrowthStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAISmartOpen, setIsAISmartOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<string>('timeline'); // 跟踪当前模块

  useEffect(() => {
    document.title = 'ManifestOS - 主控面板';
    loadTasks();
    loadGrowthData();
  }, [loadTasks, loadGrowthData]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      {/* 通知容器 */}
      <NotificationContainer />

      {/* 响应式布局 - 自动适配电脑端和手机端 */}
      <ResponsiveLayout 
        onOpenAISmart={() => setIsAISmartOpen(true)}
        onModuleChange={(module) => setCurrentModule(module)}
      />

      {/* 日历时间轴 */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-xl font-bold">📅 日历与时间轴</h2>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 日历内容 */}
            <div className="flex-1 overflow-hidden">
              <TimelineCalendar
                tasks={tasks}
                onTaskUpdate={updateTask}
                onTaskCreate={createTask}
                onTaskDelete={deleteTask}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI 对话框 - 使用 FloatingAIChat - 只在时间轴界面显示 */}
      {currentModule === 'timeline' && (
        <FloatingAIChat isFullScreen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      )}

      {/* AI 智能输入框 - 临时禁用 */}
      {/* <AISmartInput isOpen={isAISmartOpen} onClose={() => setIsAISmartOpen(false)} /> */}
    </div>
  );
}
