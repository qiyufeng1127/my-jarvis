import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { 
  WakeWordDetector, 
  VoiceRecognitionService, 
  VoiceFeedbackService,
  DeviceFeedbackService,
  type WakeState 
} from '@/services/voiceWakeService';

interface VoiceAssistantProps {
  onCommand?: (command: string) => void;
  wakeWord?: string;
  isDark?: boolean;
  mode?: 'float' | 'inline'; // 浮动按钮或内联模式
}

/**
 * Kiki 语音助手组件
 * 整合了语音唤醒、识别、反馈等所有功能
 */
export default function VoiceAssistant({ 
  onCommand, 
  wakeWord = 'kiki宝宝',
  isDark = false,
  mode = 'float'
}: VoiceAssistantProps) {
  const { isActive, isListening, isSpeaking, activate, deactivate, transcript, lastCommand } = useVoice();
  const [wakeState, setWakeState] = useState<WakeState>('sleeping');
  const [listeningTimer, setListeningTimer] = useState(8);
  const [localTranscript, setLocalTranscript] = useState('');
  const [feedbackAnimation, setFeedbackAnimation] = useState<{
    show: boolean;
    type: 'success' | 'warning' | 'alert' | 'question';
    text: string;
    color: string;
  } | null>(null);

  const wakeDetectorRef = useRef<WakeWordDetector | null>(null);
  const voiceRecognitionRef = useRef<VoiceRecognitionService | null>(null);
  const voiceFeedbackRef = useRef<VoiceFeedbackService | null>(null);
  const deviceFeedbackRef = useRef<DeviceFeedbackService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化服务
  useEffect(() => {
    wakeDetectorRef.current = new WakeWordDetector();
    voiceRecognitionRef.current = new VoiceRecognitionService();
    voiceFeedbackRef.current = new VoiceFeedbackService();
    deviceFeedbackRef.current = new DeviceFeedbackService();

    return () => {
      if (wakeDetectorRef.current) {
        wakeDetectorRef.current.stop();
      }
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stopListening();
      }
      if (voiceFeedbackRef.current) {
        voiceFeedbackRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 处理唤醒
  const handleWake = async () => {
    if (!voiceRecognitionRef.current || !voiceFeedbackRef.current || !deviceFeedbackRef.current) return;

    // 设置为激活状态
    setWakeState('activated');
    activate();
    
    // 设备反馈
    deviceFeedbackRef.current.vibrate(200);
    deviceFeedbackRef.current.playSound('wake');

    // 语音反馈："我在，请说"
    await voiceFeedbackRef.current.provideFeedback('success', { action: '我在，请说' });
    
    // 开始监听
    setWakeState('listening');
    setListeningTimer(8);
    
    // 启动8秒倒计时
    let timeLeft = 8;
    timerRef.current = setInterval(() => {
      timeLeft--;
      setListeningTimer(timeLeft);
      
      if (timeLeft <= 0) {
        handleListeningTimeout();
      }
    }, 1000);

    // 开始语音识别
    voiceRecognitionRef.current.startListening(
      (text) => {
        setLocalTranscript(text);
      },
      () => {
        // 识别结束
        if (localTranscript) {
          handleCommand(localTranscript);
        }
      }
    );
  };

  // 监听超时
  const handleListeningTimeout = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stopListening();
    }
    
    setWakeState('sleeping');
    setLocalTranscript('');
    deactivate();
    
    if (deviceFeedbackRef.current) {
      deviceFeedbackRef.current.playSound('warning');
    }
  };

  // 处理命令
  const handleCommand = async (command: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setWakeState('processing');
    
    // 回调
    if (onCommand) {
      onCommand(command);
    }
    
    // 反馈
    if (deviceFeedbackRef.current) {
      deviceFeedbackRef.current.vibrate([100, 50, 100]);
      deviceFeedbackRef.current.playSound('success');
    }

    // 显示成功反馈
    showFeedback('success', '指令已接收');
    
    setTimeout(() => {
      setWakeState('sleeping');
      setLocalTranscript('');
      deactivate();
    }, 1000);
  };

  // 切换激活状态
  const toggleActive = () => {
    if (isActive || wakeState !== 'sleeping') {
      // 停止唤醒词检测
      if (wakeDetectorRef.current) {
        wakeDetectorRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stopListening();
      }
      deactivate();
      setWakeState('sleeping');
    } else {
      // 启动唤醒词检测或直接唤醒
      handleWake();
    }
  };

  // 显示反馈动画
  const showFeedback = (type: 'success' | 'warning' | 'alert' | 'question', text: string) => {
    const colors = {
      success: '#10B981',
      warning: '#F59E0B',
      alert: '#EF4444',
      question: '#3B82F6',
    };

    setFeedbackAnimation({
      show: true,
      type,
      text,
      color: colors[type],
    });

    setTimeout(() => {
      setFeedbackAnimation(null);
    }, 2000);
  };

  const getStateColor = () => {
    switch (wakeState) {
      case 'activated':
        return '#F59E0B';
      case 'listening':
        return '#3B82F6';
      case 'processing':
        return '#10B981';
      default:
        return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    }
  };

  const getStateText = () => {
    if (isSpeaking) return 'Kiki 说话中...';
    switch (wakeState) {
      case 'activated':
        return '已唤醒';
      case 'listening':
        return `聆听中 (${listeningTimer}s)`;
      case 'processing':
        return '处理中';
      default:
        return isActive ? '休眠中' : 'Kiki 宝宝';
    }
  };

  const displayTranscript = localTranscript || transcript;

  // 浮动按钮模式
  if (mode === 'float') {
    return (
      <>
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-4">
          {/* 语音识别文本显示 */}
          {(displayTranscript || lastCommand) && wakeState !== 'sleeping' && (
            <div className="absolute bottom-20 right-0 mb-2 p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-sm animate-slide-up border border-neutral-200 dark:border-neutral-700">
              {displayTranscript && (
                <div className="mb-2">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">识别中...</div>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">{displayTranscript}</p>
                </div>
              )}
              {lastCommand && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">指令类型</div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {lastCommand.type}
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{lastCommand.intent}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 声波动画 */}
          {wakeState === 'listening' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-16 h-16 rounded-full border-2 border-blue-400 animate-ping"
                  style={{
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '1.5s',
                  }}
                />
              ))}
            </div>
          )}

          {/* 主按钮 */}
          <button
            onClick={toggleActive}
            className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
            style={{ 
              backgroundColor: getStateColor(),
              boxShadow: wakeState === 'listening' ? '0 0 30px rgba(59, 130, 246, 0.5)' : '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {isActive || wakeState !== 'sleeping' ? (
              <Mic className="w-8 h-8 text-white" />
            ) : (
              <span className="text-2xl">🎤</span>
            )}
            
            {/* 脉动波纹 */}
            {wakeState === 'listening' && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-pulse" />
              </>
            )}

            {/* 倒计时环 */}
            {wakeState === 'listening' && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="28"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - listeningTimer / 8)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            )}
          </button>

          {/* 状态标签 */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="px-3 py-1 bg-white dark:bg-neutral-800 rounded-full shadow-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: getStateColor() }}
              />
              {getStateText()}
            </div>
          </div>

          {/* 说话状态波形 */}
          {isSpeaking && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-purple-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 12 + 4}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 反馈动画 */}
        {feedbackAnimation?.show && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999] pointer-events-none">
            <div 
              className="px-8 py-6 rounded-2xl shadow-2xl animate-bounce"
              style={{ backgroundColor: feedbackAnimation.color }}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">
                  {feedbackAnimation.type === 'success' && '✅'}
                  {feedbackAnimation.type === 'warning' && '⚠️'}
                  {feedbackAnimation.type === 'alert' && '🔔'}
                  {feedbackAnimation.type === 'question' && '❓'}
                </div>
                <div className="text-white font-semibold text-lg">
                  {feedbackAnimation.text}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 内联模式（用于嵌入其他组件）
  return (
    <div className="relative">
      <button
        onClick={toggleActive}
        className="p-3 rounded-lg transition-all hover:scale-105"
        style={{ 
          backgroundColor: getStateColor(),
          color: '#ffffff'
        }}
      >
        {isActive || wakeState !== 'sleeping' ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </button>
      
      {displayTranscript && (
        <div className="absolute top-full mt-2 left-0 right-0 p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg text-xs">
          {displayTranscript}
        </div>
      )}
    </div>
  );
}

