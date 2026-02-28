/**
 * 任务验证组件
 * 用于任务开始和完成时的验证
 */

import React, { useState, useEffect } from 'react';
import { Camera, Upload, X, Clock, AlertCircle } from 'lucide-react';
import { baiduImageService } from '@/services/baiduImageService';

interface TaskVerificationModalProps {
  isOpen: boolean;
  verificationType: 'start' | 'complete';
  taskTitle: string;
  requirement: string;
  timeout: number; // 秒
  onVerify: (result: { success: boolean; evidence?: string; reason?: string }) => void;
  onCancel: () => void;
  baiduApiKey?: string;
  baiduSecretKey?: string;
}

export default function TaskVerificationModal({
  isOpen,
  verificationType,
  taskTitle,
  requirement,
  timeout,
  onVerify,
  onCancel,
  baiduApiKey,
  baiduSecretKey,
}: TaskVerificationModalProps) {
  const [timeLeft, setTimeLeft] = useState(timeout);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]); // 🆕 实时日志
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    isValid: boolean;
    reason: string;
    matchedObjects?: string[];
    recognizedObjects?: string[];
    suggestions?: string[];
    debugInfo?: string;
  } | null>(null);

  // 倒计时
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 超时自动失败
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // 语音提醒
  useEffect(() => {
    if (!isOpen) return;

    const message = verificationType === 'start'
      ? `任务启动验证已开始，请拍摄${requirement}`
      : `任务即将完成，请拍摄${requirement}`;

    // 使用浏览器语音API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [isOpen, verificationType, requirement]);

  // 超时处理
  const handleTimeout = () => {
    onVerify({
      success: false,
      reason: '验证超时，未在规定时间内提交证据',
    });
  };

  // 拍照
  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // 清空 input 的 value，确保下次选择同一文件也能触发 onChange
    event.target.value = '';
    
    if (!file) return;

    console.log('📸 开始读取图片文件:', file.name, file.size, 'bytes');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageBase64 = e.target?.result as string;
      console.log('✅ 图片读取成功，大小:', imageBase64.length, 'chars');
      setCapturedImage(imageBase64);
    };
    
    reader.onerror = (error) => {
      console.error('❌ 图片读取失败:', error);
      alert('图片读取失败，请重试');
    };
    
    reader.readAsDataURL(file);
  };

  // 🆕 添加日志的辅助函数
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setVerificationLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 提交验证
  const handleSubmit = async () => {
    if (!capturedImage) {
      alert('请先拍摄照片');
      return;
    }

    setIsVerifying(true);
    setVerificationLogs([]); // 清空之前的日志

    try {
      addLog('🚀 开始验证流程...');
      
      // 检查API配置
      addLog('🔍 检查百度API配置...');
      if (!baiduApiKey || !baiduSecretKey) {
        addLog('❌ 未配置百度API密钥');
        setVerificationResult({
          success: false,
          isValid: false,
          reason: '❌ 未配置百度API\n\n请在设置中填入百度API Key和Secret Key',
          debugInfo: '错误原因：未配置百度API密钥\n\n解决方法：\n1. 访问 https://ai.baidu.com/\n2. 注册/登录账号\n3. 创建应用并获取API Key和Secret Key\n4. 在系统设置中填入密钥',
      });
        return;
      }
      
      addLog(`✅ API配置正常 (Key: ${baiduApiKey.substring(0, 8)}...)`);
      addLog('📸 准备上传图片...');
      addLog(`📦 图片大小: ${Math.round(capturedImage.length / 1024)}KB`);
      
      addLog('🌐 正在调用百度图像识别API...');
        const result = await baiduImageService.verifyTaskImage(
        capturedImage,
          taskTitle,
          requirement,
          baiduApiKey,
          baiduSecretKey
        );

        if (result.isValid) {
        addLog('✅ 验证成功！');
        addLog(`🎯 匹配到: ${result.matchedObjects?.join('、') || '无'}`);
        } else {
        addLog('❌ 验证失败');
        addLog(`📝 识别到: ${result.recognizedObjects?.join('、') || '无'}`);
      }

          setVerificationResult({
            success: result.success,
            isValid: result.isValid,
            reason: result.reason,
            matchedObjects: result.matchedObjects,
            recognizedObjects: result.recognizedObjects,
            suggestions: result.suggestions,
            debugInfo: result.debugInfo,
          });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      addLog(`❌ 验证异常: ${errorMsg}`);
      
      setVerificationResult({
        success: false,
        isValid: false,
        reason: `❌ 验证失败：${errorMsg}`,
        debugInfo: `错误详情：\n${error instanceof Error ? error.stack : '未知错误'}\n\n请检查：\n1. 网络连接是否正常\n2. 百度API配置是否正确\n3. 照片格式是否支持`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // 重新拍照
  const handleRetake = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setVerificationLogs([]); // 清空日志
  };

  // 确认失败结果
  const handleConfirmFailure = () => {
    onVerify({
      success: false,
      reason: verificationResult?.reason || '验证失败',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {verificationType === 'start' ? '🚀 启动验证' : '✅ 完成验证'}
              </h2>
              <p className="text-sm opacity-90 mt-1">{taskTitle}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 倒计时 */}
          <div className="mt-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-semibold">
              剩余时间：{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            {timeLeft <= 10 && (
              <span className="ml-2 px-2 py-1 bg-red-500 rounded-full text-xs animate-pulse">
                即将超时！
              </span>
            )}
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 验证要求 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">验证要求</h3>
                <p className="text-blue-700">{requirement}</p>
              </div>
            </div>
          </div>

          {/* 拍照区域 */}
          {!capturedImage && !verificationResult && (
            <div className="space-y-4">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
                  <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">点击拍照</p>
                  <p className="text-sm text-gray-500">或从相册选择照片</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapture}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
          )}

          {/* 预览照片 */}
          {capturedImage && !verificationResult && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="预览"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              {/* 🆕 实时日志显示 */}
              {isVerifying && verificationLogs.length > 0 && (
                <div className="p-4 bg-gray-900 rounded-lg text-white font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                  <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-700">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-green-400">验证中...</span>
                  </div>
                  {verificationLogs.map((log, index) => (
                    <div key={index} className="text-gray-300 leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleRetake}
                  disabled={isVerifying}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重新拍照
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isVerifying}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
                >
                  {isVerifying ? '验证中...' : '提交验证'}
                </button>
              </div>
            </div>
          )}

          {/* 验证结果 */}
          {verificationResult && (
            <div className="space-y-4">
              {verificationResult.isValid ? (
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900">验证通过！</h3>
                      <p className="text-green-700 whitespace-pre-line">{verificationResult.reason}</p>
                    </div>
                  </div>

                  {verificationResult.matchedObjects && verificationResult.matchedObjects.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">✅ 匹配的物体：</p>
                      <div className="flex flex-wrap gap-2">
                        {verificationResult.matchedObjects.map((obj, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {verificationResult.recognizedObjects && verificationResult.recognizedObjects.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">🔍 所有识别到的物体：</p>
                      <div className="flex flex-wrap gap-2">
                        {verificationResult.recognizedObjects.map((obj, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {verificationResult.debugInfo && (
                    <details className="mt-3">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                        📊 查看详细信息
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {verificationResult.debugInfo}
                      </pre>
                    </details>
                  )}

                  {/* 🔧 新增：确认按钮 */}
                  <button
                    onClick={() => {
                      onVerify({
                        success: true,
                        evidence: capturedImage || undefined,
                        reason: verificationResult.reason,
                      });
                    }}
                    className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-colors shadow-lg"
                  >
                    ✅ 确认完成
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl">❌</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-red-900">验证失败</h3>
                      <p className="text-red-700 whitespace-pre-line mt-2">{verificationResult.reason}</p>
                    </div>
                  </div>

                  {verificationResult.recognizedObjects && verificationResult.recognizedObjects.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">🔍 识别到的物体：</p>
                      <div className="flex flex-wrap gap-2">
                        {verificationResult.recognizedObjects.map((obj, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {verificationResult.suggestions && verificationResult.suggestions.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">💡 建议：</p>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {verificationResult.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {verificationResult.debugInfo && (
                    <details className="mt-3" open>
                      <summary className="text-sm font-semibold text-red-900 cursor-pointer hover:text-red-700">
                        🐛 查看详细调试信息（帮助解决问题）
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap border border-red-200">
                        {verificationResult.debugInfo}
                      </pre>
                    </details>
                  )}

                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleRetake}
                      className="flex-1 py-3 px-4 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-300"
                    >
                      🔄 重新拍照
                    </button>
                    <button
                      onClick={handleConfirmFailure}
                      className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      ❌ 确认失败
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

