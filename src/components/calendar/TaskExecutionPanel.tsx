import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Check, X, Clock, Target, TrendingUp, DollarSign, MessageSquare } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

interface TaskExecutionPanelProps {
  task: {
    id: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    rewards: {
      gold: number;
      growth: { dimension: string; value: number; completed: number }[];
    };
    goals?: { name: string; contribution: number }[];
    verificationComplete?: {
      type: 'photo' | 'upload' | 'file';
      requirement: string;
      timeout?: number;
      acceptedFileTypes?: string[];
      maxFileSize?: number;
    };
  };
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onAbandon: () => void;
}

export default function TaskExecutionPanel({
  task,
  onPause,
  onResume,
  onComplete,
  onAbandon,
}: TaskExecutionPanelProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  
  const dragStart = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  
  // 金币管理
  const { deductGold } = useUserStore();

  // 计时器
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setElapsedMinutes((prev) => {
        const newElapsed = prev + 1;
        
        // 每60分钟检查一次进度（长任务）
        if (newElapsed > 0 && newElapsed % 60 === 0 && task.durationMinutes > 60) {
          setShowProgressCheck(true);
        }
        
        return newElapsed;
      });
    }, 60000); // 每分钟更新一次

    return () => clearInterval(timer);
  }, [isPaused, task.durationMinutes]);

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 暂停/恢复
  const handleTogglePause = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
    setIsPaused(!isPaused);
  };

  // 完成任务
  const handleComplete = () => {
    // 如果任务需要完成验证，这里不直接完成，而是由父组件处理验证流程
    // 这个函数会在验证通过后被调用
    if (confirm('确定要完成这个任务吗？')) {
      onComplete();
    }
  };

  // 放弃任务
  const handleAbandon = () => {
    if (confirm('放弃任务将扣除 50 金币，确定要放弃吗？')) {
      // 扣除金币
      const success = deductGold(50, `放弃任务: ${task.title}`);
      
      if (!success) {
        alert('金币不足，但仍然可以放弃任务');
      }
      
      onAbandon();
    }
  };

  // 提交进度
  const handleSubmitProgress = () => {
    if (!progressNote.trim()) {
      alert('请输入当前进展');
      return;
    }
    
    // TODO: 保存进度记录
    console.log('进度记录:', progressNote);
    setShowProgressCheck(false);
    setProgressNote('');
  };

  // 跳过进度检查
  const handleSkipProgress = () => {
    if (confirm('跳过进度检查将扣除 20 金币，确定要跳过吗？')) {
      // 扣除金币
      const success = deductGold(20, `跳过进度检查: ${task.title}`);
      
      if (!success) {
        alert('金币不足，但仍然可以跳过');
      }
      
      setShowProgressCheck(false);
      setProgressNote('');
    }
  };

  // 计算进度
  const progress = Math.min((elapsedMinutes / task.durationMinutes) * 100, 100);
  const remainingMinutes = Math.max(task.durationMinutes - elapsedMinutes, 0);

  // 格式化时间
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  // 最小化视图
  if (isMinimized) {
    return (
      <div
        ref={panelRef}
        className="fixed bg-white rounded-full shadow-2xl px-6 py-3 cursor-move z-50 border-2 border-blue-500"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isPaused ? (
              <Pause className="w-5 h-5 text-yellow-600" />
            ) : (
              <Play className="w-5 h-5 text-green-600 animate-pulse" />
            )}
            <span className="font-semibold text-sm">{task.title}</span>
          </div>
          <div className="text-sm text-neutral-600">
            {formatTime(elapsedMinutes)} / {formatTime(task.durationMinutes)}
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 主面板 */}
      <div
        ref={panelRef}
        className={`fixed bg-white rounded-2xl shadow-2xl w-96 z-50 border-2 ${
          isPaused ? 'border-yellow-500' : 'border-green-500'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        {/* 头部 */}
        <div className={`p-4 rounded-t-2xl ${
          isPaused ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-lg flex items-center">
              {isPaused ? '⏸️' : '▶️'} 正在执行
            </h3>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-white transform rotate-180" />
            </button>
          </div>
          <p className="text-white font-semibold">{task.title}</p>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 进度条 */}
          <div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-neutral-700">
                已进行: <span className="font-semibold">{formatTime(elapsedMinutes)}</span>
              </span>
              <span className="text-neutral-700">
                预计: <span className="font-semibold">{formatTime(task.durationMinutes)}</span>
              </span>
            </div>
            <div className="relative w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isPaused ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {Math.round(progress)}%
              </div>
            </div>
            {remainingMinutes > 0 && (
              <p className="text-xs text-neutral-600 mt-1 text-center">
                剩余 {formatTime(remainingMinutes)}
              </p>
            )}
          </div>

          {/* 关联成长 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">关联成长</span>
            </div>
            <div className="space-y-2">
              {task.rewards.growth.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">{item.dimension}</span>
                  <span className="font-semibold text-blue-900">
                    +{item.value} <span className="text-xs text-blue-600">(已完成+{item.completed})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 目标贡献 */}
          {task.goals && task.goals.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">目标贡献</span>
              </div>
              <div className="space-y-1">
                {task.goals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-purple-800">{goal.name}</span>
                    <span className="font-semibold text-purple-900">+{goal.contribution}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 奖励预估 */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-900">奖励预估</span>
              </div>
              <span className="text-lg font-bold text-yellow-900">{task.rewards.gold} 💰</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleTogglePause}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:scale-105 ${
                isPaused
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 mb-1" />
                  <span className="text-xs font-semibold">继续</span>
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 mb-1" />
                  <span className="text-xs font-semibold">暂停</span>
                </>
              )}
            </button>

            <button
              onClick={handleComplete}
              className="flex flex-col items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all hover:scale-105"
            >
              <Check className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">完成</span>
            </button>

            <button
              onClick={handleAbandon}
              className="flex flex-col items-center justify-center p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all hover:scale-105"
            >
              <X className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">放弃</span>
            </button>
          </div>

          {/* 提示 */}
          <div className="text-xs text-neutral-500 text-center">
            💡 拖拽面板可移动位置
          </div>
        </div>
      </div>

      {/* 进度检查弹窗 */}
      {showProgressCheck && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold">进展检查</h3>
            </div>

            <p className="text-neutral-700 mb-4">
              已经进行了 <span className="font-semibold text-blue-600">{formatTime(elapsedMinutes)}</span>，请简要说明当前进展：
            </p>

            <textarea
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="例如：已完成数据收集，正在进行分析..."
              className="w-full h-32 px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />

            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handleSubmitProgress}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                提交进展
              </button>
              <button
                onClick={handleSkipProgress}
                className="px-4 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                跳过 (-20💰)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

