/**
 * 照片识别测试工具
 * 用于测试百度AI能识别出什么关键词
 */

import React, { useState, useEffect } from 'react';
import { Camera, Upload, X, Copy, Check, ChevronDown, ChevronRight, Trash2, FolderPlus } from 'lucide-react';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';
import { usePhotoLibraryStore } from '@/stores/photoLibraryStore';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['default']));
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');
  const [selectedFolderId, setSelectedFolderId] = useState('default');
  
  const { folders, photos, addPhoto, deletePhoto, createFolder, deleteFolder, getPhotosByFolder, loadPhotos, isLoaded } = usePhotoLibraryStore();

  // 组件加载时从IndexedDB加载照片
  useEffect(() => {
    if (isOpen && !isLoaded) {
      loadPhotos();
    }
  }, [isOpen, isLoaded, loadPhotos]);

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
    addPhoto(result.imagePreview, result.keywords, selectedFolderId);
    alert('✅ 已保存到照片库');
    setResult(null);
  };

  const handleCopyKeywords = (keywords: string[], photoId?: string) => {
    const text = keywords.slice(0, 5).join('、');
    navigator.clipboard.writeText(text);
    
    if (photoId) {
      setCopiedId(photoId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      alert('请输入文件夹名称');
      return;
    }
    createFolder(newFolderName, newFolderEmoji);
    setShowNewFolderDialog(false);
    setNewFolderName('');
    setNewFolderEmoji('📁');
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

        <div className="flex-1 overflow-y-auto pb-32 px-6 py-4">
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
                
                {/* 选择保存到哪个文件夹 */}
                <div className="mb-3">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: textColor }}>保存到文件夹：</label>
                  <select 
                    value={selectedFolderId} 
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: bgColor, color: textColor, border: `1px solid ${borderColor}` }}
                  >
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.emoji} {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button onClick={handleSavePhoto} className="w-full py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#3B82F6', color: '#fff' }}>💾 保存到照片库</button>
              </div>
            </div>
          )}

          {/* 照片库 */}
          {photos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold" style={{ color: textColor }}>📚 照片库 ({photos.length})</h3>
                <button 
                  onClick={() => setShowNewFolderDialog(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
                >
                  <FolderPlus size={14} />
                  <span>新建文件夹</span>
                </button>
              </div>
              
              {/* 文件夹列表 */}
              <div className="space-y-3">
                {folders.map(folder => {
                  const folderPhotos = getPhotosByFolder(folder.id);
                  const isExpanded = expandedFolders.has(folder.id);
                  
                  return (
                    <div key={folder.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                      {/* 文件夹头部 */}
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        style={{ backgroundColor: cardBg }}
                        onClick={() => toggleFolder(folder.id)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={18} style={{ color: textColor }} /> : <ChevronRight size={18} style={{ color: textColor }} />}
                          <span className="text-xl">{folder.emoji}</span>
                          <span className="font-semibold" style={{ color: textColor }}>{folder.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#3B82F6', color: '#fff' }}>
                            {folderPhotos.length}
                          </span>
                        </div>
                        
                        {folder.id !== 'default' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`确定要删除文件夹"${folder.name}"及其所有照片吗？`)) {
                                deleteFolder(folder.id);
                              }
                            }}
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: '#EF4444', color: '#fff' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      {/* 文件夹内容 - 两列布局 */}
                      {isExpanded && folderPhotos.length > 0 && (
                        <div className="p-3 grid grid-cols-2 gap-3" style={{ backgroundColor: bgColor }}>
                          {folderPhotos.map(photo => (
                            <div key={photo.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                              <img src={photo.imageUrl} alt="照片" className="w-full h-32 object-cover" />
                              <div className="p-2" style={{ backgroundColor: cardBg }}>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {photo.keywords.slice(0, 5).map((keyword, kIndex) => (
                                    <span key={kIndex} className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#10B981', color: '#fff' }}>
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => handleCopyKeywords(photo.keywords, photo.id)} 
                                    className="flex-1 py-1 rounded text-[10px] font-semibold flex items-center justify-center gap-1"
                                    style={{ backgroundColor: copiedId === photo.id ? '#10B981' : '#3B82F6', color: '#fff' }}
                                  >
                                    {copiedId === photo.id ? <><Check size={10} /><span>已复制</span></> : <><Copy size={10} /><span>复制</span></>}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('确定要删除这张照片吗？')) {
                                        deletePhoto(photo.id);
                                      }
                                    }}
                                    className="p-1 rounded"
                                    style={{ backgroundColor: '#EF4444', color: '#fff' }}
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isExpanded && folderPhotos.length === 0 && (
                        <div className="p-6 text-center" style={{ color: secondaryColor }}>
                          <p className="text-sm">暂无照片</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* 新建文件夹对话框 */}
        {showNewFolderDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewFolderDialog(false)}>
            <div className="w-80 rounded-xl p-6" style={{ backgroundColor: bgColor }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>新建文件夹</h3>
              
              <div className="mb-4">
                <label className="text-sm font-semibold mb-1 block" style={{ color: textColor }}>图标：</label>
                <div className="flex gap-2 flex-wrap">
                  {['📁', '🏠', '🍳', '🛁', '🛏️', '💼', '🎮', '📚'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewFolderEmoji(emoji)}
                      className="text-2xl p-2 rounded-lg"
                      style={{ 
                        backgroundColor: newFolderEmoji === emoji ? '#3B82F6' : cardBg,
                        border: `2px solid ${newFolderEmoji === emoji ? '#3B82F6' : borderColor}`
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-semibold mb-1 block" style={{ color: textColor }}>名称：</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="例如：厨房、卫生间"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ backgroundColor: cardBg, color: textColor, border: `1px solid ${borderColor}` }}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewFolderDialog(false)}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: cardBg, color: textColor }}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: '#3B82F6', color: '#fff' }}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

