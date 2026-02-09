/**
 * 语音控制（免手模式）组件
 * 支持语音识别和语音回复，集成AI助手所有功能
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { aiService } from '@/services/aiService';
import UnifiedTaskEditor from '@/components/shared/UnifiedTaskEditor';

interface VoiceControlProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceControl({ isOpen, onClose }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  
  const { tasks, getTodayTasks, deleteTask, updateTask, createTask } = useTaskStore();
  const recognitionRef = useRef<any>(null);

  // 初始化语音识别
  useEffect(() => {
    if (!isOpen) return;

    // 检查浏览器是否支持语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别功能，请使用Chrome浏览器');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true; // 持续监听
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
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
        setTranscript(finalTranscript);
        handleVoiceCommand(finalTranscript);
      } else {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      if (event.error === 'no-speech') {
        // 没有检测到语音，继续监听
        return;
      }
      // 其他错误，重启识别
      if (isListening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('重启识别失败:', e);
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      // 如果还在监听状态，自动重启
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.log('重启识别失败:', e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, isListening]);

  // 开始/停止监听
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      speak('免手模式已关闭');
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        speak('免手模式已启动，我在听，请说出您的指令');
      } catch (e) {
        console.error('启动识别失败:', e);
      }
    }
  };

  // 语音播报
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // 取消之前的播报
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 处理语音指令 - 集成AI助手功能
  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    console.log('🎤 [语音指令]:', command);

    try {
      // 使用AI服务处理指令
      const result = await aiService.processVoiceCommand(command, tasks);
      
      if (result.type === 'create_tasks') {
        // 创建任务
        setEditingTasks(result.tasks);
        setShowTaskEditor(true);
        setResponse(`好的，我为您准备了${result.tasks.length}个任务，请确认`);
        speak(`好的，我为您准备了${result.tasks.length}个任务，请确认`);
      } else if (result.type === 'query') {
        // 查询任务
        setResponse(result.message);
        speak(result.message);
      } else if (result.type === 'delete') {
        // 删除任务
        for (const taskId of result.taskIds) {
          await deleteTask(taskId);
        }
        setResponse(result.message);
        speak(result.message);
      } else if (result.type === 'update') {
        // 更新任务
        for (const update of result.updates) {
          await updateTask(update.taskId, update.changes);
        }
        setResponse(result.message);
        speak(result.message);
      } else {
        // 其他回复
        setResponse(result.message);
        speak(result.message);
      }

    } catch (error) {
      console.error('处理语音指令失败:', error);
      const errorMessage = '抱歉，我没有理解您的指令，请再说一遍';
      setResponse(errorMessage);
      speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // 确认创建任务
  const handleConfirmTasks = async (confirmedTasks: any[]) => {
    for (const task of confirmedTasks) {
      await createTask(task);
    }
    setShowTaskEditor(false);
    setEditingTasks([]);
    const message = `已为您创建${confirmedTasks.length}个任务`;
    setResponse(message);
    speak(message);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-white">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🎤 免手模式</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
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
                <Volume2 className="w-16 h-16" />
              ) : (
                <VolumeX className="w-16 h-16" />
              )}
            </button>
            <p className="mt-4 text-lg font-semibold">
              {isListening ? '正在监听中...' : '点击开始语音控制'}
            </p>
            {isListening && (
              <p className="mt-2 text-sm opacity-80">
                持续监听模式，再次点击关闭
              </p>
            )}
          </div>

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

          {/* 使用提示 */}
          <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg text-sm">
            <p className="font-semibold mb-2">💡 您可以说：</p>
            <ul className="space-y-1 opacity-90">
              <li>• "5分钟后去洗漱"</li>
              <li>• "帮我安排今天的任务"</li>
              <li>• "现在正在做什么"</li>
              <li>• "下一个任务是什么"</li>
              <li>• "删除今天的任务"</li>
              <li>• "把16号的任务挪到15号"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 任务编辑器 */}
      {showTaskEditor && editingTasks.length > 0 && (
        <UnifiedTaskEditor
          tasks={editingTasks}
          onClose={() => {
            setShowTaskEditor(false);
            setEditingTasks([]);
          }}
          onConfirm={handleConfirmTasks}
        />
      )}
    </>
  );
}

