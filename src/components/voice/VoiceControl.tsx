/**
 * 语音控制（免手模式）组件 - 增强版
 * 支持百度语音识别、持续监听、模糊匹配、任务控制和验证跳转
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, X, Mic, MicOff, Settings } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { EnhancedVoiceCommandService } from '@/services/enhancedVoiceCommandService';
import { baiduVoiceRecognition } from '@/services/baiduVoiceRecognition';
import TaskVerification from '@/components/calendar/TaskVerification';

interface VoiceControlProps {
  isOpen: boolean;
  onClose: () => void;
  onListeningChange?: (isListening: boolean) => void;
}

export default function VoiceControl({ isOpen, onClose, onListeningChange }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useBaiduAPI, setUseBaiduAPI] = useState(false);
  
  // 验证相关
  const [showVerification, setShowVerification] = useState(false);
  const [verificationTask, setVerificationTask] = useState<any>(null);
  const [verificationType, setVerificationType] = useState<'start' | 'complete'>('start');
  
  const { tasks, deleteTask, updateTask, createTask } = useTaskStore();
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 检查是否配置了百度语音API
  useEffect(() => {
    const configured = baiduVoiceRecognition.isConfigured();
    setUseBaiduAPI(configured);
    console.log('🎤 百度语音API配置状态:', configured ? '已配置' : '未配置');
  }, [isOpen]);

  // 获取当前任务
  const getCurrentTask = () => {
    const now = new Date();
    return tasks.find(t => {
      if (!t.scheduledStart || !t.scheduledEnd) return false;
      const start = new Date(t.scheduledStart);
      const end = new Date(t.scheduledEnd);
      return now >= start && now <= end && t.status === 'in_progress';
    });
  };

  // 初始化语音识别
  useEffect(() => {
    if (!isOpen) return;

    // 检查浏览器是否支持语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const msg = '您的浏览器不支持语音识别功能，请使用Chrome浏览器';
      setResponse(msg);
      speak(msg);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true; // 持续监听
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      console.log('🎤 收到语音识别结果');
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('🎤 最终识别:', finalTranscript);
        setTranscript(finalTranscript);
        // 给用户反馈：识别到了
        setResponse('正在处理您的指令...');
        handleVoiceCommand(finalTranscript);
      } else {
        // 显示临时识别结果
        console.log('🎤 临时识别:', interimTranscript);
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ 语音识别错误:', event.error);
      
      // 给用户明确的错误反馈
      let errorMessage = '';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '没有检测到语音，请再说一遍';
          setResponse(errorMessage);
          speak(errorMessage);
          // 继续监听
          return;
        
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查麦克风权限。点击浏览器地址栏的麦克风图标允许访问';
          setResponse(errorMessage);
          speak(errorMessage);
          setIsListening(false);
          onListeningChange?.(false);
          return;
        
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
          setResponse(errorMessage);
          speak(errorMessage);
          setIsListening(false);
          onListeningChange?.(false);
          return;
        
        case 'network':
          errorMessage = '网络错误，语音识别需要网络连接';
          setResponse(errorMessage);
          speak(errorMessage);
          break;
        
        case 'aborted':
          // 被主动中止，不提示
          console.log('语音识别被中止');
          return;
        
        default:
          errorMessage = `语音识别出错：${event.error}，正在重试...`;
          setResponse(errorMessage);
          console.log(errorMessage);
          break;
      }
      
      // 其他错误，尝试重启
      if (isListening && event.error !== 'aborted') {
        console.log('尝试重启语音识别...');
        setTimeout(() => {
          try {
            recognition.start();
            console.log('✅ 语音识别已重启');
          } catch (e) {
            console.log('❌ 重启识别失败:', e);
            setIsListening(false);
            onListeningChange?.(false);
            const msg = '语音识别重启失败，请手动重新开启';
            setResponse(msg);
            speak(msg);
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('⚠️ 语音识别结束');
      // 如果还在监听状态，自动重启
      if (isListening) {
        console.log('🔄 自动重启语音识别...');
        setTimeout(() => {
          try {
            recognition.start();
            console.log('✅ 语音识别已重启');
          } catch (e) {
            console.log('❌ 重启识别失败:', e);
          }
        }, 500);
      }
    };

    recognition.onstart = () => {
      console.log('✅ 语音识别已启动，麦克风正在监听');
      setResponse('麦克风已启动，请说话...');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          console.log('语音识别已停止');
        } catch (e) {
          console.log('停止识别失败:', e);
        }
      }
      // 停止语音播报
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]); // 移除 isListening 依赖，避免重复初始化

  // 开始/停止监听
  const toggleListening = async () => {
    if (isListening) {
      // 停止监听
      try {
        if (useBaiduAPI && mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        } else {
          recognitionRef.current?.abort();
        }
      } catch (e) {
        console.log('停止识别失败:', e);
      }
      setIsListening(false);
      onListeningChange?.(false);
      setResponse('免手模式已关闭');
      speak('免手模式已关闭');
    } else {
      // 开始监听
      setIsListening(true);
      onListeningChange?.(true);
      setResponse('正在启动麦克风...');
      
      if (useBaiduAPI) {
        // 使用百度语音识别
        await startBaiduRecognition();
      } else {
        // 使用浏览器内置识别
        try {
          recognitionRef.current?.start();
          speak('免手模式已启动，我在听，请说出您的指令');
        } catch (e) {
          console.error('启动识别失败:', e);
          const errorMsg = '启动语音识别失败，请检查麦克风权限';
          setResponse(errorMsg);
          speak(errorMsg);
          setIsListening(false);
          onListeningChange?.(false);
        }
      }
    }
  };

  // 启动百度语音识别
  const startBaiduRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];
        
        // 发送到百度API识别
        setResponse('正在识别您的指令...');
        const result = await baiduVoiceRecognition.recognize(audioBlob, 'wav', 16000);
        
        if (result.success && result.text) {
          setTranscript(result.text);
          handleVoiceCommand(result.text);
        } else {
          const errorMsg = result.error || '识别失败';
          setResponse(errorMsg);
          speak(errorMsg);
        }
        
        // 继续监听
        if (isListening) {
          setTimeout(() => startBaiduRecognition(), 500);
        }
      };

      mediaRecorder.start();
      
      // 每3秒停止一次，触发识别
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);
      
      setResponse('麦克风已启动，请说话...');
      speak('免手模式已启动，我在听，请说出您的指令');
      
    } catch (error) {
      console.error('启动百度语音识别失败:', error);
      const errorMsg = '无法访问麦克风，请检查权限设置';
      setResponse(errorMsg);
      speak(errorMsg);
      setIsListening(false);
    }
  };

  // 语音播报 - 增强版
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      window.speechSynthesis.cancel(); // 取消之前的播报
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.1; // 稍快一点
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 处理语音指令 - 使用增强版服务
  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    console.log('🎤 [语音指令]:', command);

    try {
      const currentTask = getCurrentTask();
      const result = await EnhancedVoiceCommandService.processCommand(command, tasks, currentTask);
      
      console.log('📋 指令结果:', result);
      
      // 根据结果类型处理
      if (result.type === 'navigation') {
        // 导航到验证页面
        if (result.action === 'start_verification') {
          const taskId = result.data?.taskId;
          const task = result.data?.task || tasks.find(t => t.id === taskId);
          
          if (task) {
            setVerificationTask(task);
            setVerificationType('start');
            setShowVerification(true);
            setResponse(result.message);
            speak(result.message);
          } else {
            const msg = '没有找到要启动的任务';
            setResponse(msg);
            speak(msg);
          }
        } else if (result.action === 'complete_verification') {
          const taskId = result.data?.taskId;
          const task = currentTask || tasks.find(t => t.id === taskId);
          
          if (task) {
            setVerificationTask(task);
            setVerificationType('complete');
            setShowVerification(true);
            setResponse(result.message);
            speak(result.message);
          } else {
            const msg = '没有找到当前任务';
            setResponse(msg);
            speak(msg);
          }
        }
      } else if (result.type === 'action') {
        // 执行操作
        if (result.action === 'delete_tasks') {
          // 删除任务
          const taskIds = result.data?.taskIds || [];
          for (const taskId of taskIds) {
            await deleteTask(taskId);
          }
          setResponse(result.message);
          speak(result.message);
        } else if (result.action === 'move_tasks') {
          // 移动任务
          const taskIds = result.data?.taskIds || [];
          const offset = result.data?.offset || 0;
          
          for (const taskId of taskIds) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.scheduledStart && task.scheduledEnd) {
              const newStart = new Date(task.scheduledStart);
              newStart.setDate(newStart.getDate() + offset);
              
              const newEnd = new Date(task.scheduledEnd);
              newEnd.setDate(newEnd.getDate() + offset);
              
              await updateTask(taskId, {
                scheduledStart: newStart,
                scheduledEnd: newEnd
              });
            }
          }
          
          setResponse(result.message);
          speak(result.message);
        }
      } else if (result.type === 'query') {
        // 查询结果
        setResponse(result.message);
        speak(result.message);
      } else {
        // 未知指令
        setResponse(result.message);
        speak(result.message);
      }

    } catch (error) {
      console.error('处理语音指令失败:', error);
      const errorMessage = '抱歉，处理指令时出错了';
      setResponse(errorMessage);
      speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-white max-h-[85vh] overflow-y-auto" style={{ marginTop: '60px' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-gradient-to-br from-purple-600 to-blue-600 pb-2 z-10">
            <h2 className="text-2xl font-bold">🎤 免手模式</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* API配置状态提示 */}
          <div className="mb-4 p-3 bg-white bg-opacity-20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {useBaiduAPI ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">✅ 百度语音API已配置</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm">⚠️ 使用浏览器内置识别</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  onClose();
                  // 打开AI配置模态框
                  const event = new CustomEvent('openAIConfig');
                  window.dispatchEvent(event);
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title="配置百度语音API"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            {!useBaiduAPI && (
              <p className="text-xs mt-2 opacity-80">
                💡 配置百度语音API可获得更准确的识别效果
              </p>
            )}
          </div>

          {/* 麦克风按钮 */}
          <div className="flex flex-col items-center mb-6">
            <button
              onClick={toggleListening}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {isListening ? (
                <Mic className="w-16 h-16" />
              ) : (
                <MicOff className="w-16 h-16" />
              )}
            </button>
            <p className="mt-4 text-lg font-semibold">
              {isListening ? '🎤 正在监听中...' : '点击开始语音控制'}
            </p>
            {isListening && (
              <div className="mt-2 space-y-1 text-center">
                <p className="text-sm opacity-80">
                  持续监听模式，再次点击关闭
                </p>
                <p className="text-xs opacity-60">
                  💡 说话后会自动识别并处理
                </p>
              </div>
            )}
          </div>

          {/* 识别状态指示器 */}
          {isListening && !transcript && !response && (
            <div className="mb-4 p-3 bg-blue-500/20 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm">等待您说话...</span>
              </div>
            </div>
          )}

          {/* 识别文本 */}
          {transcript && (
            <div className="mb-4 p-4 bg-white bg-opacity-20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">👂</span>
                <span className="font-semibold">您说：</span>
              </div>
              <p className="text-white">{transcript}</p>
            </div>
          )}

          {/* AI回复 */}
          {response && (
            <div className="mb-4 p-4 bg-white bg-opacity-20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🤖</span>
                <span className="font-semibold">AI回复：</span>
              </div>
              <p className="text-white whitespace-pre-line">{response}</p>
            </div>
          )}

          {/* 处理中状态 */}
          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 text-white mb-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}

          {/* 状态指示器 */}
          {isSpeaking && (
            <div className="mb-4 flex items-center justify-center space-x-2 text-yellow-300">
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span className="text-sm">正在播报...</span>
            </div>
          )}

          {/* 使用提示 - 更新为新的指令 */}
          <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg text-sm">
            <p className="font-semibold mb-2">💡 您可以说：</p>
            <ul className="space-y-1 opacity-90 text-xs">
              <li>• "下个任务是什么"</li>
              <li>• "还有多长时间"</li>
              <li>• "下个任务几点开始"</li>
              <li>• "明天有多少个任务"</li>
              <li>• "删除今天的任务"</li>
              <li>• "把昨天的任务移到今天"</li>
              <li>• "把今天的任务移到明天"</li>
              <li>• "把16号的任务移到15号"</li>
              <li>• "当前任务已完成"（跳转完成验证）</li>
              <li>• "启动"（开始验证）</li>
              <li>• "下个任务可以开始了"</li>
            </ul>
          </div>

          {/* 测试按钮 */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                const msg = '这是一条测试消息，如果您能听到这句话，说明语音功能正常';
                setResponse(msg);
                speak(msg);
              }}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all bg-white bg-opacity-20 hover:bg-opacity-30"
            >
              🔊 测试语音
            </button>
            <button
              onClick={() => {
                handleVoiceCommand('下个任务是什么');
              }}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all bg-white bg-opacity-20 hover:bg-opacity-30"
            >
              🧪 测试指令
            </button>
          </div>
        </div>
      </div>

      {/* 任务验证弹窗 */}
      {showVerification && verificationTask && (
        <TaskVerification
          task={verificationTask}
          verificationType={verificationType}
          onSuccess={() => {
            setShowVerification(false);
            setVerificationTask(null);
            const msg = verificationType === 'start' ? '启动验证成功！' : '完成验证成功！';
            setResponse(msg);
            speak(msg);
          }}
          onFail={() => {
            setShowVerification(false);
            setVerificationTask(null);
            const msg = '验证失败，请重试';
            setResponse(msg);
            speak(msg);
          }}
          onSkip={() => {
            setShowVerification(false);
            setVerificationTask(null);
            const msg = '已跳过验证';
            setResponse(msg);
            speak(msg);
          }}
        />
      )}
    </>
  );
}

