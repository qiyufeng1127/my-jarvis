import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { realtimeObjectDetection, DetectionResult, OBJECT_LABELS } from '@/services/realtimeObjectDetection';

interface RealtimeObjectVerificationProps {
  targetObjects: string[]; // 目标物品列表（英文类名，如 ['cup', 'book']）
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
  minConfidence?: number; // 最小置信度（0-1）
  requireAll?: boolean; // 是否需要识别到所有物品
}

export default function RealtimeObjectVerification({
  targetObjects,
  onSuccess,
  onFail,
  onClose,
  minConfidence = 0.5,
  requireAll = false,
}: RealtimeObjectVerificationProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [matchedObjects, setMatchedObjects] = useState<string[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  // 启动摄像头
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // 使用后置摄像头
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      setError('无法访问摄像头，请检查权限设置');
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // 加载模型并启动摄像头
  useEffect(() => {
    const init = async () => {
      try {
        setIsModelLoading(true);
        await realtimeObjectDetection.loadModel();
        setIsModelLoading(false);
        await startCamera();
      } catch (error) {
        console.error('初始化失败:', error);
        setError('模型加载失败，请刷新页面重试');
        setIsModelLoading(false);
      }
    };

    init();

    return () => {
      stopCamera();
    };
  }, []);

  // 开始实时检测
  const startDetection = () => {
    if (!videoRef.current || isDetecting) return;

    setIsDetecting(true);

    // 每500ms检测一次
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const results = await realtimeObjectDetection.detect(videoRef.current);
        setDetections(results);

        // 绘制检测框
        drawDetections(results);

        // 检查是否匹配目标物品
        const verification = realtimeObjectDetection.verifyObjects(
          results,
          targetObjects,
          minConfidence
        );

        setMatchedObjects(verification.matchedObjects);

        // 判断是否验证成功
        if (requireAll) {
          // 需要识别到所有物品
          if (verification.matchedObjects.length === targetObjects.length) {
            console.log('✅ 验证成功！识别到所有目标物品');
            stopCamera();
            setTimeout(() => onSuccess(), 1000);
          }
        } else {
          // 只需识别到任意一个物品
          if (verification.matched) {
            console.log('✅ 验证成功！识别到目标物品:', verification.matchedObjects);
            stopCamera();
            setTimeout(() => onSuccess(), 1000);
          }
        }
      } catch (error) {
        console.error('检测失败:', error);
      }
    }, 500);
  };

  // 绘制检测框
  const drawDetections = (results: DetectionResult[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas尺寸与video一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制每个检测结果
    results.forEach((detection) => {
      const [x, y, width, height] = detection.bbox;
      const isTarget = targetObjects.includes(detection.class);

      // 设置颜色
      ctx.strokeStyle = isTarget ? '#10b981' : '#3b82f6'; // 目标物品绿色，其他蓝色
      ctx.lineWidth = 3;
      ctx.fillStyle = isTarget ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)';

      // 绘制矩形框
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);

      // 绘制标签
      const label = `${detection.label} ${(detection.score * 100).toFixed(0)}%`;
      ctx.font = '16px Arial';
      ctx.fillStyle = isTarget ? '#10b981' : '#3b82f6';
      ctx.fillText(label, x, y > 20 ? y - 5 : y + 20);

      // 如果是目标物品，绘制对勾
      if (isTarget) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('✓', x + width - 30, y + 30);
      }
    });
  };

  // 视频加载完成后开始检测
  const handleVideoLoaded = () => {
    if (!isDetecting) {
      startDetection();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 顶部提示栏 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span className="font-semibold">实时物品识别</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 目标物品列表 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {targetObjects.map((obj) => {
            const isMatched = matchedObjects.includes(obj);
            return (
              <div
                key={obj}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                  isMatched
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                {isMatched && <CheckCircle className="w-4 h-4" />}
                {OBJECT_LABELS[obj] || obj}
              </div>
            );
          })}
        </div>

        {/* 进度提示 */}
        <div className="mt-2 text-sm">
          {requireAll
            ? `已识别 ${matchedObjects.length}/${targetObjects.length} 个物品`
            : matchedObjects.length > 0
            ? '✅ 已识别到目标物品！'
            : '📸 请将摄像头对准目标物品'}
        </div>
      </div>

      {/* 相机画面 */}
      <div className="flex-1 relative bg-black">
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-white">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p className="text-lg">正在加载识别模型...</p>
              <p className="text-sm text-gray-400 mt-2">首次加载可能需要几秒钟</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-white max-w-md px-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg mb-2">出错了</p>
              <p className="text-sm text-gray-400">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={handleVideoLoaded}
          className="w-full h-full object-cover"
        />

        {/* 检测框画布 */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* 检测状态指示器 */}
        {isDetecting && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            正在识别
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="bg-gray-900 text-white p-4 text-center">
        <p className="text-sm">
          {requireAll
            ? '请确保所有目标物品都在画面中'
            : '识别到任意一个目标物品即可通过验证'}
        </p>
      </div>
    </div>
  );
}

