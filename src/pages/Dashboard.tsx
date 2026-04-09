import { useEffect, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { X, Volume2 } from 'lucide-react';
import NotificationContainer from '@/components/ui/NotificationContainer';
import FloatingAIChat from '@/components/ai/FloatingAIChat';
// import AISmartInput from '@/components/ai/AISmartInput'; // 临时注释
import TimelineCalendar from '@/components/calendar/TimelineCalendar';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { taskMonitorService } from '@/services/taskMonitorService';
import { notificationService } from '@/services/notificationService';
import { backgroundTaskScheduler } from '@/services/backgroundTaskScheduler';

export default function Dashboard() {
  const { tasks, loadTasks, updateTask, createTask, deleteTask } = useTaskStore();
  const { loadGrowthData } = useGrowthStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAISmartOpen, setIsAISmartOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<string>('timeline'); // 跟踪当前模块
  const [showVoiceActivation, setShowVoiceActivation] = useState(false);
  const [voiceActivated, setVoiceActivated] = useState(false);

  // 检查语音是否已激活
  useEffect(() => {
    const activated = localStorage.getItem('voice_activated');
    if (!activated) {
      setShowVoiceActivation(true);
    } else {
      setVoiceActivated(true);
    }
  }, []);

  // 激活语音播报
  const handleActivateVoice = async () => {
    try {
      await notificationService.initSpeech();
      notificationService.speak('语音播报已激活！您现在可以听到任务提醒了。');
      localStorage.setItem('voice_activated', 'true');
      setVoiceActivated(true);
      setShowVoiceActivation(false);
      console.log('✅ 语音播报已激活');
    } catch (error) {
      console.error('❌ 语音激活失败:', error);
      alert('语音激活失败，请检查浏览器设置是否允许自动播放音频');
    }
  };

  useEffect(() => {
    document.title = 'ManifestOS - 主控面板';
    loadTasks();
    loadGrowthData();
    
    // 请求通知权限
    taskMonitorService.requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('✅ 通知权限已授予');
        // 开始监控所有任务
        taskMonitorService.monitorTasks(tasks);
      } else {
        console.warn('⚠️ 通知权限未授予');
      }
    });
    
    // 清理函数
    return () => {
      taskMonitorService.clearAll();
    };
  }, [loadTasks, loadGrowthData]);
  
  // 当任务列表变化时，重新监控
  useEffect(() => {
    taskMonitorService.monitorTasks(tasks);
    tasks.forEach((task) => {
      if (task.scheduledStart && task.scheduledEnd) {
        backgroundTaskScheduler.scheduleTask({
          taskId: task.id,
          taskTitle: task.title,
          scheduledStart: new Date(task.scheduledStart).toISOString(),
          scheduledEnd: new Date(task.scheduledEnd).toISOString(),
          goldReward: task.goldReward || 0,
          hasVerification: Boolean(
            task.verificationEnabled || task.verificationStart || task.verificationComplete
          ),
          startKeywords: task.startKeywords,
          completeKeywords: task.completeKeywords,
        });
      } else {
        backgroundTaskScheduler.unscheduleTask(task.id);
      }
    });
  }, [tasks]);

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: '#fefaf0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
    >
      {/* 通知容器 */}
      <NotificationContainer />

      {/* 语音激活提示条 - iOS 风格 */}
      {showVoiceActivation && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 shadow-lg"
          style={{
            backgroundColor: 'rgba(0, 122, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6 animate-pulse" style={{ color: '#ffffff' }} />
              <div>
                <p className="font-bold" style={{ color: '#ffffff' }}>🔊 激活语音播报</p>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>点击激活后，您将听到任务开始、结束、超时等语音提醒</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleActivateVoice}
                className="px-6 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#007AFF',
                }}
              >
                立即激活
              </button>
              <button
                onClick={() => setShowVoiceActivation(false)}
                className="p-2 rounded-lg transition-colors active:scale-95"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <X className="w-5 h-5" style={{ color: '#ffffff' }} />
              </button>
            </div>
          </div>
        </div>
      )}

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
