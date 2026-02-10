/**
 * 任务验证扩展组件 - 完全独立，不侵入原有代码
 * 负责：启动验证、完成验证、子任务勾选、拍照验证
 */

import { useState, useEffect, useRef } from 'react';
import eventBus from '@/utils/eventBus';
import { useVerificationStates } from '@/hooks/useVerificationStates';
import { SoundEffects } from '@/services/taskVerificationService';

interface SubTask {
  id: string;
  name: string;
  checked: boolean;
}

interface TaskVerificationData {
  taskId: string;
  taskTitle: string;
  subTasks?: SubTask[];
  durationMinutes: number;
  onStartVerify: () => void;
  onCompleteVerify: () => void;
}

export default function TaskVerificationExtension() {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'start' | 'complete'>('start');
  const [countdown, setCountdown] = useState(120); // 启动验证：2分钟
  const [taskData, setTaskData] = useState<TaskVerificationData | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [isSubTaskOpen, setIsSubTaskOpen] = useState(false);
  const [allSubTasksChecked, setAllSubTasksChecked] = useState(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { markStartVerificationComplete, markCompleteVerificationComplete } = useVerificationStates();

  // 监听原有组件的"任务到时间"事件
  useEffect(() => {
    const handleTaskTimeArrived = (data: TaskVerificationData) => {
      console.log('🔔 收到任务验证触发事件:', data);
      setTaskData(data);
      setSubTasks(data.subTasks || []);
      setShowVerification(true);
      setVerificationStatus('start');
      setCountdown(120); // 启动验证：2分钟
      startCountdown();
    };

    eventBus.on('taskTimeArrived', handleTaskTimeArrived);

    return () => {
      eventBus.off('taskTimeArrived', handleTaskTimeArrived);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // 倒计时逻辑
  const startCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 格式化时间（分:秒）
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // 启动验证完成 → 切换到完成验证状态
  const handleStartVerify = () => {
    if (!taskData) return;

    console.log('🚀 启动验证完成，切换到完成验证状态');
    
    // 更新验证状态
    markStartVerificationComplete(taskData.taskId);
    
    // 切换到完成验证
    setVerificationStatus('complete');
    setCountdown(taskData.durationMinutes * 60); // 完成验证：任务时长
    startCountdown();
    
    // 播放音效
    SoundEffects.playSuccessSound();
    
    // 调用原有组件的回调
    taskData.onStartVerify();
  };

  // 子任务展开/收起
  const toggleSubTask = () => {
    setIsSubTaskOpen(!isSubTaskOpen);
  };

  // 子任务勾选
  const handleSubTaskCheck = (taskId: string) => {
    const newSubTasks = subTasks.map(task => 
      task.id === taskId ? { ...task, checked: !task.checked } : task
    );
    setSubTasks(newSubTasks);
    
    // 检查是否全部勾选
    const allChecked = newSubTasks.every(task => task.checked);
    setAllSubTasksChecked(allChecked);
  };

  // 完成验证 → 唤起拍摄
  const handleCompleteVerify = () => {
    if (!taskData) return;

    console.log('🏁 完成验证，唤起拍摄');
    
    // 更新验证状态
    markCompleteVerificationComplete(taskData.taskId);
    
    // 播放音效
    SoundEffects.playSuccessSound();
    SoundEffects.playCoinSound();
    
    // 调用原有组件的回调
    taskData.onCompleteVerify();
    
    // 重置状态
    setShowVerification(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
  };

  // 不显示验证界面时返回 null
  if (!showVerification || !taskData) {
    return null;
  }

  return (
    <div 
      className="verification-card rounded-2xl p-6 my-4 shadow-lg"
      style={{ 
        background: verificationStatus === 'start' 
          ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' 
          : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        color: 'white'
      }}
    >
      {/* 启动验证状态 */}
      {verificationStatus === 'start' && (
        <div className="start-verification text-center">
          <div className="text-3xl font-bold mb-4">{taskData.taskTitle}</div>
          <div className="text-xl mb-4">马上进行启动验证</div>
          <div className="text-6xl font-bold mb-6 animate-pulse">
            {formatTime(countdown)}
          </div>
          {countdown <= 0 && (
            <div className="text-red-300 mb-4">
              ⚠️ 启动验证超时！完成任务将扣除30%金币
            </div>
          )}
          <button
            onClick={handleStartVerify}
            className="px-8 py-3 bg-white text-gray-900 rounded-xl text-xl font-bold hover:bg-gray-100 active:scale-95 transition-all shadow-xl"
          >
            确认启动验证
          </button>
        </div>
      )}

      {/* 完成验证状态 */}
      {verificationStatus === 'complete' && (
        <div className="complete-verification">
          <div className="text-3xl font-bold mb-4 text-center">{taskData.taskTitle}</div>
          <div className="text-xl mb-4 text-center">距离任务完成</div>
          <div className="text-6xl font-bold mb-6 text-center animate-pulse">
            {formatTime(countdown)}
          </div>

          {/* 子任务展开/勾选 */}
          {subTasks.length > 0 && (
            <div className="mb-6">
              <button
                onClick={toggleSubTask}
                className="w-full px-4 py-2 bg-white/20 rounded-lg text-lg font-semibold hover:bg-white/30 transition-colors mb-3"
              >
                {isSubTaskOpen ? '▼ 收起子任务' : '▶ 展开子任务'} ({subTasks.filter(t => t.checked).length}/{subTasks.length})
              </button>
              
              {isSubTaskOpen && (
                <div className="bg-white/10 rounded-lg p-4 space-y-2">
                  {subTasks.map(task => (
                    <label 
                      key={task.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={task.checked}
                        onChange={() => handleSubTaskCheck(task.id)}
                        className="w-5 h-5 rounded"
                      />
                      <span className={`text-lg ${task.checked ? 'line-through opacity-70' : ''}`}>
                        {task.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 完成按钮 - 仅所有子任务勾选后可点击 */}
          <button
            onClick={handleCompleteVerify}
            disabled={subTasks.length > 0 && !allSubTasksChecked}
            className="w-full px-8 py-4 bg-white text-gray-900 rounded-xl text-2xl font-bold hover:bg-gray-100 active:scale-95 transition-all shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {subTasks.length > 0 && !allSubTasksChecked 
              ? '请先完成所有子任务' 
              : '完成验证'}
          </button>
        </div>
      )}
    </div>
  );
}

