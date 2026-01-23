import { useRef } from 'react';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareReportProps {
  reportData: {
    title: string;
    date: string;
    rating: {
      emoji: string;
      text: string;
      color: string;
    };
    stats: {
      label: string;
      value: string;
      color: string;
    }[];
    highlights: string[];
  };
  onClose: () => void;
}

export default function ShareReport({ reportData, onClose }: ShareReportProps) {
  const shareCardRef = useRef<HTMLDivElement>(null);

  // 生成分享图片
  const generateImage = async () => {
    if (!shareCardRef.current) return;

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      // 转换为 Blob
      canvas.toBlob((blob) => {
        if (!blob) return;

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.title}-${reportData.date}.png`;
        link.click();

        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('生成图片失败:', error);
      alert('生成图片失败，请重试');
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    if (!shareCardRef.current) return;

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          alert('已复制到剪贴板！');
        } catch (error) {
          console.error('复制失败:', error);
          alert('复制失败，请使用下载功能');
        }
      });
    } catch (error) {
      console.error('生成图片失败:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900">分享报告</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 预览区域 */}
        <div className="p-6 bg-neutral-50">
          <div
            ref={shareCardRef}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            style={{ width: '600px', margin: '0 auto' }}
          >
            {/* 卡片头部 */}
            <div
              className="p-8 text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${reportData.rating.color} 0%, ${reportData.rating.color}dd 100%)`,
              }}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full transform translate-x-24 -translate-y-24" />
              </div>

              <div className="relative z-10">
                <div className="text-white/80 text-sm mb-2">{reportData.title}</div>
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-6xl">{reportData.rating.emoji}</span>
                  <div>
                    <div className="text-4xl font-bold">{reportData.rating.text}</div>
                    <div className="text-white/90">{reportData.date}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="p-6 grid grid-cols-3 gap-4">
              {reportData.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 亮点 */}
            {reportData.highlights.length > 0 && (
              <div className="px-6 pb-6">
                <div className="text-sm font-semibold text-neutral-700 mb-3">
                  ✨ 今日亮点
                </div>
                <div className="space-y-2">
                  {reportData.highlights.slice(0, 3).map((highlight, index) => (
                    <div
                      key={index}
                      className="text-sm text-neutral-800 bg-yellow-50 rounded-lg px-3 py-2"
                    >
                      • {highlight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 底部水印 */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>ManifestOS - 个人成长系统</span>
                <span>manifestos.app</span>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={generateImage}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              <span>下载图片</span>
            </button>
            <button
              onClick={copyToClipboard}
              className="flex-1 px-4 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
            >
              复制到剪贴板
            </button>
          </div>
          <p className="text-xs text-neutral-600 text-center mt-3">
            💡 下载后可分享到社交媒体
          </p>
        </div>
      </div>
    </div>
  );
}

