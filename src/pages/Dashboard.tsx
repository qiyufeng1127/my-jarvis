import { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import FloatingAIChat from '@/components/ai/FloatingAIChat';
// import AISmartInput from '@/components/ai/AISmartInput'; // 临时注释
import TimelineCalendar from '@/components/calendar/TimelineCalendar';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { backgroundTaskScheduler } from '@/services/backgroundTaskScheduler';

export default function Dashboard() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const createTask = useTaskStore((state) => state.createTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const loadGrowthData = useGrowthStore((state) => state.loadGrowthData);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAISmartOpen, setIsAISmartOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<string>('timeline'); // 跟踪当前模块

  const scheduledTasks = useMemo(
    () => tasks.filter((task) => task.scheduledStart && task.scheduledEnd),
    [tasks]
  );

  useEffect(() => {
    document.title = 'ManifestOS - 主控面板';
    loadTasks();
    loadGrowthData();

    return () => {
    };
  }, [loadTasks, loadGrowthData]);
  
  // 当任务列表变化时，重新监控
  useEffect(() => {
    const scheduledTaskIds = new Set<string>();

    scheduledTasks.forEach((task) => {
      scheduledTaskIds.add(task.id);
      backgroundTaskScheduler.scheduleTask({
        taskId: task.id,
        taskTitle: task.title,
        scheduledStart: new Date(task.scheduledStart!).toISOString(),
        scheduledEnd: new Date(task.scheduledEnd!).toISOString(),
        goldReward: task.goldReward || 0,
        hasVerification: Boolean(
          task.verificationEnabled || task.verificationStart || task.verificationComplete
        ),
        startKeywords: task.startKeywords,
        completeKeywords: task.completeKeywords,
      });
    });

    tasks.forEach((task) => {
      if (!scheduledTaskIds.has(task.id)) {
        backgroundTaskScheduler.unscheduleTask(task.id);
      }
    });
  }, [scheduledTasks, tasks]);

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: '#fefaf0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
    >
      {/* 响应式布局 - 自动适配电脑端和手机端 */}
      <ResponsiveLayout 
        onOpenAISmart={() => setIsAISmartOpen(true)}
        onModuleChange={(module) => setCurrentModule(module)}
      />

      {/* 日历时间轴 - iOS 风格 */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div 
            className="w-full max-w-7xl h-[90vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(254, 250, 240, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(84, 41, 22, 0.2)',
            }}
          >
            {/* 头部 */}
            <div 
              className="flex items-center justify-between p-6"
              style={{
                borderBottom: '1px solid rgba(84, 41, 22, 0.1)',
              }}
            >
              <h2 
                className="text-xl font-bold"
                style={{ color: '#542916' }}
              >
                📅 日历与时间轴
              </h2>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="p-2 rounded-xl transition-all active:scale-95"
                style={{
                  backgroundColor: 'rgba(84, 41, 22, 0.1)',
                }}
              >
                <X className="w-5 h-5" style={{ color: '#542916' }} />
              </button>
            </div>
            
            {/* 日历内容 */}
            <div className="flex-1 overflow-hidden">
              <TimelineCalendar
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
        <FloatingAIChat 
          isFullScreen={isAIChatOpen} 
          onClose={() => setIsAIChatOpen(false)} 
          currentModule={currentModule}
        />
      )}

      {/* AI 智能输入框 - 临时禁用 */}
      {/* <AISmartInput isOpen={isAISmartOpen} onClose={() => setIsAISmartOpen(false)} /> */}
    </div>
  );
}
