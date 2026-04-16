import { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useUserStore } from '@/stores/userStore';
import '@/styles/verification-animations.css';

interface TaskVerificationProps {
  task: {
    id: string;
    title: string;
    verificationType: 'photo' | 'upload' | 'file'; // 拍照、图片上传、文件上传
    requirement: string;
    acceptedFileTypes?: string[];
    maxFileSize?: number;
  };
  verificationType: 'start' | 'complete'; // 开始验证或完成验证
  keywords?: string[]; // 验证关键词（用于显示在相机界面顶部）
  onSuccess: () => void;
  onFail: () => void;
  onSkip: () => void;
  timeLimit?: number; // 秒
}

export default function TaskVerification({
  task,
  verificationType,
  keywords = [],
  onSuccess,
  onFail,
  onSkip,
  timeLimit = 120,
}: TaskVerificationProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | null>(null);
  const [verificationReason, setVerificationReason] = useState<string>('');
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]); // 验证日志
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 金币管理
  const { deductGold } = useUserStore();

  // 倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 启动摄像头（仅拍照验证）
  useEffect(() => {
    if (task.verificationType === 'photo') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [task.verificationType]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      alert('无法访问摄像头，请检查权限设置');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // 拍照
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    stopCamera();

    // 模拟 AI 验证
    verifyImage(imageData);
  };

  // 处理图片上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 文件上传验证
    if (task.verificationType === 'file') {
    // 检查文件类型
      const acceptedTypes = task.acceptedFileTypes || ['*/*'];
      const isAccepted = acceptedTypes.some(type => {
        if (type === '*/*') return true;
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category + '/');
        }
        return file.type === type;
      });

      if (!isAccepted) {
        alert(`请上传以下类型的文件：${acceptedTypes.join(', ')}`);
        return;
      }

      // 检查文件大小
      const maxSize = (task.maxFileSize || 10) * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`文件大小不能超过 ${task.maxFileSize || 10}MB`);
        return;
      }

      setUploadedFile(file);
      verifyFile(file);
      return;
    }

    // 图片上传验证
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      setUploadedImage(imageData);
      verifyImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  // 验证文件
  const verifyFile = async (file: File) => {
    setIsVerifying(true);

    try {
      // 调用 AI 服务验证文件
      const result = await aiService.verifyTaskFile(
        file.name,
        file.size,
        file.type,
        task.requirement,
        task.title
      );

      setIsVerifying(false);

      if (result.success && result.isValid && result.confidence >= 0.6) {
        // 验证成功
        setVerificationResult('success');
        setVerificationReason(result.reason || '文件验证通过');
        
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        // 验证失败
        setVerificationResult('fail');
        setVerificationReason(result.reason || '文件不符合要求');
        
        // 扣除金币
        deductGold(20, `任务验证失败: ${task.title}`);
        
        setTimeout(() => {
          onFail();
        }, 2000);
      }
    } catch (error) {
      console.error('文件验证错误:', error);
      setIsVerifying(false);
      setVerificationResult('fail');
      setVerificationReason('验证服务异常，请重试');
      
      // 扣除金币
      deductGold(20, `任务验证失败: ${task.title}`);
      
      setTimeout(() => {
        onFail();
      }, 2000);
    }
  };

  // 添加验证日志
  const addLog = (message: string) => {
    console.log('📝 [验证日志]', message);
    setVerificationLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    setVerificationReason(message);
  };

  // 验证图片
  const verifyImage = async (imageData: string) => {
    setIsVerifying(true);
    setVerificationLogs([]);
    addLog('🔍 正在验证中，请稍后...');

    // 添加30秒超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('验证超时（30秒），请检查网络连接')), 30000);
    });

    try {
      // 如果没有关键词要求，直接通过（向后兼容）
      if (!keywords || keywords.length === 0) {
        console.warn('⚠️ 没有验证关键词，自动通过验证');
        addLog('⚠️ 没有验证关键词，自动通过验证');
        setIsVerifying(false);
        setVerificationResult('success');
        addLog('✅ 验证通过');
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }

      // 使用百度AI图像识别验证
      addLog('🔍 开始调用百度AI图像识别...');
      addLog(`📝 验证关键词: ${keywords.join('、')}`);
      
      const { baiduImageRecognition } = await import('@/services/baiduImageRecognition');
      
      // 检查API配置
      if (!baiduImageRecognition.isConfigured()) {
        addLog('⚠️ 百度AI未配置，自动通过验证（信任用户）');
        setIsVerifying(false);
        setVerificationResult('success');
        addLog('✅ 验证通过（未配置AI，信任用户）');
        setTimeout(() => {
          onSuccess();
        }, 2000);
        return;
      }
      
      addLog('✅ 百度AI配置正常');
      addLog('🔄 正在调用百度API...');
      
      // 将base64转换为File对象
      const blob = await fetch(imageData).then(r => r.blob());
      const file = new File([blob], 'verification.jpg', { type: 'image/jpeg' });
      
      addLog('📤 图片已准备，开始识别...');
      
      // 调用百度AI验证 - 使用 smartVerifyImage 方法，添加超时保护
      const result = await Promise.race([
        baiduImageRecognition.smartVerifyImage(file, keywords, 0.2),
        timeoutPromise
      ]) as any;

      addLog('✅ API调用完成');
      
      // 显示识别到的关键词
      if (result.recognizedKeywords && result.recognizedKeywords.length > 0) {
        const topKeywords = result.recognizedKeywords.slice(0, 10).join('、');
        addLog(`🔍 已识别到: ${topKeywords}`);
      } else {
        addLog('⚠️ 未识别到任何内容');
      }
      
      // 显示匹配详情
      if (result.matchDetails) {
        addLog(`📊 匹配详情:\n${result.matchDetails}`);
      }

      setIsVerifying(false);

      console.log('✅ 验证结果:', result);
      
      if (result.success) {
        // 验证成功
        console.log('✅ 验证成功！');
        setVerificationResult('success');
        
        addLog('✅ 验证成功！');
        
        // 显示完整的验证描述
        const successMessage = result.description || `验证通过！识别到: ${result.matchedKeywords.join(', ')}`;
        addLog(successMessage);

        setTimeout(() => {
          console.log('✅ 调用 onSuccess 回调');
          onSuccess();
        }, 2000);
      } else {
        // 验证失败 - 显示完整的失败信息
        console.log('❌ 验证失败！');
        
        setVerificationResult('fail');
        
        addLog('❌ 验证失败');
        
        // 使用 AI 返回的完整描述和建议
        let failMessage = result.description || '验证失败';
        addLog(failMessage);
        
        if (result.suggestions && result.suggestions.length > 0) {
          result.suggestions.forEach(suggestion => {
            addLog(suggestion);
          });
        }
        
        setVerificationReason(failMessage);
        
        // 扣除金币
        console.log('💰 扣除20金币');
        addLog('💰 已扣除20金币');
        deductGold(20, `任务验证失败: ${task.title}`);
        
        // 不自动关闭，让用户看到失败原因并选择重新拍照或跳过
        console.log('❌ 验证失败，等待用户操作');
      }
    } catch (error) {
      console.error('❌ 图片验证错误:', error);
      setIsVerifying(false);
      setVerificationResult('fail');
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      addLog('❌ 验证服务异常');
      addLog(`错误信息: ${errorMessage}`);
      addLog('请检查网络连接和API配置');
      
      setVerificationReason(
        `验证服务异常：${errorMessage}\n\n请检查：\n1. 网络连接是否正常\n2. 百度AI配置是否正确（设置 → AI）\n3. 是否超出每日免费额度（500次）\n\n您可以：\n• 重新尝试验证\n• 或暂时跳过验证`
      );
      
      // 扣除金币
      addLog('💰 已扣除20金币');
      deductGold(20, `任务验证失败: ${task.title}`);
      
      // 不自动关闭，让用户选择
      console.log('❌ 验证异常，等待用户操作');
    }
  };

  // 超时处理
  const handleTimeout = () => {
    stopCamera();
    onFail();
  };

  // 跳过验证
  const handleSkip = () => {
    if (confirm('跳过验证将扣除 50 金币，确定要跳过吗？')) {
      // 扣除金币
      const success = deductGold(50, `跳过任务验证: ${task.title}`);
      
      if (!success) {
        alert('金币不足，无法跳过验证');
        return;
      }
      
      stopCamera();
      onSkip();
    }
  };

  // 重新拍照或上传
  const handleRetake = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setUploadedFile(null);
    setVerificationResult(null);
    if (task.verificationType === 'photo') {
      startCamera();
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算倒计时进度
  const progress = (timeLeft / timeLimit) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 keyboard-aware-modal-shell">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col keyboard-aware-modal-card"
        style={{ maxHeight: 'var(--app-modal-max-height)' }}>
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold flex items-center">
              🔒 任务验证
            </h2>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-white/90">任务: {task.title}</p>
          <p className="text-sm text-white/80 mt-1">要求: {task.requirement}</p>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto keyboard-aware-scroll">
          {/* 倒计时 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-neutral-700">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">剩余时间</span>
              </div>
              <span className={`text-2xl font-bold ${timeLeft < 30 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft < 30 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 摄像头预览、上传图片或结果显示 */}
          <div className="relative bg-neutral-900 rounded-xl overflow-hidden aspect-video mb-6">
            {/* 拍照验证 - 摄像头预览 */}
            {task.verificationType === 'photo' && !capturedImage && !verificationResult && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* 验证关键词提示 - 移到中间位置 */}
                {keywords.length > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-full px-4">
                    <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <p className="text-white text-center text-sm font-semibold mb-3">
                        📷 拍照验证
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mb-2">
                        {keywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/80 backdrop-blur-sm rounded-full"
                          >
                            <span className="text-white font-semibold text-sm">{keyword}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-white/90 text-center text-xs">
                        📸 请拍摄或上传包含以上内容的照片
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 拍照指引 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-white/50 rounded-lg w-64 h-48"></div>
                </div>
              </>
            )}

            {/* 上传验证 - 上传区域 */}
            {(task.verificationType === 'upload' || task.verificationType === 'file') && 
             !uploadedImage && !uploadedFile && !verificationResult && (
              <div className="w-full h-full flex items-center justify-center">
                {/* 验证关键词提示 - 移到中间位置 */}
                {keywords.length > 0 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-full px-4">
                    <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <p className="text-white text-center text-sm font-semibold mb-3">
                        📷 上传验证
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mb-2">
                        {keywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/80 backdrop-blur-sm rounded-full"
                          >
                            <span className="text-white font-semibold text-sm">{keyword}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-white/90 text-center text-xs">
                        📸 请上传包含以上内容的照片
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">
                    {task.verificationType === 'file' ? '上传验证文件' : '上传验证图片'}
                  </p>
                  <p className="text-white/70 text-sm mb-4">{task.requirement}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {task.verificationType === 'file' ? '选择文件' : '选择图片'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={task.verificationType === 'file' 
                      ? (task.acceptedFileTypes?.join(',') || '*/*')
                      : 'image/*'
                    }
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {task.verificationType === 'file' && task.acceptedFileTypes && (
                    <p className="text-white/50 text-xs mt-2">
                      支持的文件类型：{task.acceptedFileTypes.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 已拍照或已上传的图片 */}
            {(capturedImage || uploadedImage) && !verificationResult && (
              <img
                src={capturedImage || uploadedImage || ''}
                alt="Captured or Uploaded"
                className="w-full h-full object-cover"
              />
            )}

            {/* 已上传的文件 */}
            {uploadedFile && !verificationResult && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📄</span>
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">{uploadedFile.name}</p>
                  <p className="text-white/70 text-sm">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* 验证结果 */}
            {verificationResult && (
              <div className="w-full h-full flex items-center justify-center p-4">
                {verificationResult === 'success' ? (
                  <div className="text-center animate-bounce">
                    <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-white">验证成功！</p>
                    
                    {/* 显示验证日志 */}
                    <div className="mt-4 bg-black/50 rounded-lg p-4 max-h-48 overflow-y-auto text-left max-w-md mx-auto verification-logs">
                      {verificationLogs.map((log, index) => (
                        <div 
                          key={index} 
                          className="text-white/90 text-xs mb-1"
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-white/60 text-sm mt-4">任务即将开始...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-2xl font-bold text-white">验证失败</p>
                    
                    {/* 显示验证日志 */}
                    <div className="mt-4 bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto text-left max-w-md mx-auto verification-logs">
                      {verificationLogs.map((log, index) => (
                        <div 
                          key={index} 
                          className="text-white/90 text-xs mb-2"
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-red-400 text-sm mt-4 font-semibold">已扣除 20 金币</p>
                    <p className="text-white/60 text-sm mt-2">请重新{task.verificationType === 'photo' ? '拍照' : '上传'}或跳过验证</p>
                  </div>
                )}
              </div>
            )}

            {/* 验证中遮罩 - 显示详细日志 */}
            {isVerifying && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4">
                <div className="text-center max-w-md w-full">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white text-lg font-semibold mb-4">AI 识别中...</p>
                  
                  {/* 验证日志 - 实时显示 */}
                  <div className="bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto text-left verification-logs">
                    {verificationLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className="text-white/90 text-sm mb-2 animate-fade-in"
                        style={{ 
                          animationDelay: `${index * 0.1}s`,
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {log}
                      </div>
                    ))}
                    {verificationLogs.length === 0 && (
                      <div className="text-white/70 text-sm">
                        正在初始化验证...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-center space-x-4">
            {/* 拍照验证按钮 */}
            {task.verificationType === 'photo' && !capturedImage && !verificationResult && (
              <>
                <button
                  onClick={handleCapture}
                  disabled={!stream}
                  className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  <span className="font-semibold">拍照验证</span>
                </button>
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-300 transition-all"
                >
                  跳过 (-50💰)
                </button>
              </>
            )}

            {/* 上传验证按钮 */}
            {(task.verificationType === 'upload' || task.verificationType === 'file') && 
             !uploadedImage && !uploadedFile && !verificationResult && (
              <button
                onClick={handleSkip}
                className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-300 transition-all"
              >
                跳过 (-50💰)
              </button>
            )}

            {/* 重新操作按钮 - 验证前或验证失败后都可以重新拍照 */}
            {(capturedImage || uploadedImage || uploadedFile) && !isVerifying && (
              <>
                {verificationResult === 'fail' ? (
                  <>
                    <button
                      onClick={handleRetake}
                      className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                    >
                      重新{task.verificationType === 'photo' ? '拍照' : '上传'}
                    </button>
                    <button
                      onClick={handleSkip}
                      className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-300 transition-all"
                    >
                      跳过 (-50💰)
                    </button>
                  </>
                ) : !verificationResult && (
                  <button
                    onClick={handleRetake}
                    className="px-8 py-3 bg-neutral-600 text-white rounded-xl hover:bg-neutral-700 transition-all"
                  >
                    重新{task.verificationType === 'photo' ? '拍照' : '上传'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">验证提示：</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  {task.verificationType === 'photo' ? (
                    <>
                      <li>确保光线充足，画面清晰</li>
                      <li>将内容置于框内拍摄</li>
                      <li>验证失败将扣除 20 金币</li>
                      <li>超时未验证将自动标记失败</li>
                    </>
                  ) : task.verificationType === 'upload' ? (
                    <>
                      <li>上传符合要求的图片</li>
                      <li>图片大小不超过 10MB</li>
                      <li>验证失败将扣除 20 金币</li>
                      <li>超时未验证将自动标记失败</li>
                    </>
                  ) : (
                    <>
                      <li>上传符合要求的文件</li>
                      <li>文件大小不超过 {task.maxFileSize || 10}MB</li>
                      <li>验证失败将扣除 20 金币</li>
                      <li>超时未验证将自动标记失败</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

