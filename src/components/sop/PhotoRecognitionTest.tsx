/**
 * 照片识别测试工具
 * 用于测试百度AI能识别出什么关键词
 */

import React, { useState } from 'react';
import { Camera, Upload, X, Copy, Check } from 'lucide-react';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';

interface PhotoRecognitionTestProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface RecognitionResult {
  keywords: string[];
  timestamp: Date;
  imagePreview: string;
}

export default function PhotoRecognitionTest({ isOpen, onClose, isDark = false }: PhotoRecognitionTestProps) {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [savedPhotos, setSavedPhotos] = useState<RecognitionResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRecognizing(true);
    setResult(null);

    try {
      const reader = new FileReader();
      const imagePreview = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const keywords = await baiduImageRecognition.recognizeGeneral(file);

      setResult({
        keywords,
        timestamp: new Date(),
        imagePreview,
      });
    } catch (error) {
      alert(`识别失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRecognizing(false);
      event.target.value = '';
    }
  };

  const handleSavePhoto = () => {
    if (!result) return;
    setSavedPhotos([result, ...savedPhotos]);
    alert('✅ 已保存到照片库');
  };

  const handleCopyKeywords = (keywords: string[], index?: number) => {
    const text = keywords.slice(0, 5).join('、');
    navigator.clipboard.writeText(text);
    
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleDeletePhoto = (index: number) => {
    if (confirm('确定要删除这张照片吗？')) {
      setSavedPhotos(savedPhotos.filter((_, i) => i !== index));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: bgColor }}>
        <div className="flex items-center justify-between px-6 py-6 pt-14 border-b" style={{ borderColor }}>
          <div className="flex items-center gap-3">
            <div className="text-4xl">🔍</div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: textColor }}>照片识别测试</h2>
              <p className="text-sm mt-1" style={{ color: secondaryColor }}>测试百度AI能识别出什么关键词</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-full">
            <X size={28} style={{ color: textColor }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 px-6 py-4">
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: cardBg }}>
            <h3 className="font-semibold mb-2" style={{ color: textColor }}>💡 使用说明</h3>
            <ul className="text-sm space-y-1" style={{ color: secondaryColor }}>
              <li>1️⃣ 拍摄或上传你家里常用场景的照片</li>
              <li>2️⃣ 查看百度AI识别出的关键词</li>
              <li>3️⃣ 复制前5个关键词，填入任务的验证规则</li>
              <li>4️⃣ 保存到照片库，方便以后查看</li>
            </ul>
          </div>

          <div className="flex gap-3 mb-4">
            <label className="flex-1">
              <div className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed cursor-pointer" style={{ borderColor, backgroundColor: cardBg }}>
                <Camera size={32} style={{ color: '#3B82F6' }} />
                <span className="text-sm font-semibold mt-2" style={{ color: textColor }}>拍摄照片</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={isRecognizing} />
              </div>
            </label>
            <label className="flex-1">
              <div className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed cursor-pointer" style={{ borderColor, backgroundColor: cardBg }}>
                <Upload size={32} style={{ color: '#8B5CF6' }} />
                <span className="text-sm font-semibold mt-2" style={{ color: textColor }}>上传照片</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isRecognizing} />
              </div>
            </label>
          </div>

          {isRecognizing && (
            <div className="p-6 rounded-xl text-center" style={{ backgroundColor: cardBg }}>
              <div className="animate-spin text-4xl mb-3">🔍</div>
              <p className="text-lg font-semibold" style={{ color: textColor }}>正在识别中...</p>
            </div>
          )}

          {result && !isRecognizing && (
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${borderColor}` }}>
              <img src={result.imagePreview} alt="预览" className="w-full h-auto" />
              <div className="p-4" style={{ backgroundColor: cardBg }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: textColor }}>识别到 {result.keywords.length} 个关键词</span>
                  <button onClick={() => handleCopyKeywords(result.keywords)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#10B981', color: '#fff' }}>
                    <Copy size={12} />
                    <span>复制前5个</span>
                  </button>
                </div>
                {result.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.keywords.slice(0, 5).map((keyword, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#10B981', color: '#fff' }}>{keyword}</span>
                    ))}
                  </div>
                )}
                <button onClick={handleSavePhoto} className="w-full py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#3B82F6', color: '#fff' }}>💾 保存到照片库</button>
              </div>
            </div>
          )}

          {savedPhotos.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: textColor }}>📚 照片库 ({savedPhotos.length})</h3>
              <div className="space-y-3">
                {savedPhotos.map((photo, index) => (
                  <div key={index} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                    <img src={photo.imagePreview} alt={`照片 ${index + 1}`} className="w-full h-32 object-cover" />
                    <div className="p-3" style={{ backgroundColor: cardBg }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: secondaryColor }}>{photo.timestamp.toLocaleString('zh-CN')}</span>
                        <button onClick={() => handleDeletePhoto(index)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#EF4444', color: '#fff' }}>删除</button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {photo.keywords.slice(0, 5).map((keyword, kIndex) => (
                          <span key={kIndex} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#10B981', color: '#fff' }}>{keyword}</span>
                        ))}
                      </div>
                      <button onClick={() => handleCopyKeywords(photo.keywords, index)} className="w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ backgroundColor: copiedIndex === index ? '#10B981' : '#3B82F6', color: '#fff' }}>
                        {copiedIndex === index ? <><Check size={14} /><span>已复制</span></> : <><Copy size={14} /><span>复制前5个关键词</span></>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
