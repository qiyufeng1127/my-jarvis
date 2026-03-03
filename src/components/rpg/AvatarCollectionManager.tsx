import { useState } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { X, Plus, FolderOpen, ChevronDown, ChevronUp, Lock, Trash2 } from 'lucide-react';

const VINTAGE_COLORS = {
  cream: '#FFF4E6',
  softPink: '#F5D5CB',
  dustyRose: '#E8B4B8',
  mauve: '#C8A2C8',
  deepPurple: '#6B4C6B',
  beige: '#E8DCC4',
  khaki: '#D4C5A0',
  sage: '#B8C5A8',
  dustyBlue: '#A8B8C8',
  terracotta: '#C97064',
  mustard: '#D4A574',
  burgundy: '#43302E',
};

interface AvatarCollectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentExp: number;
}

export default function AvatarCollectionManager({ isOpen, onClose, currentExp }: AvatarCollectionManagerProps) {
  const { collections, addCollection, removeCollection, toggleCollapse, setCurrentAvatar } = useAvatarStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  if (!isOpen) return null;

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const readers: Promise<string>[] = [];
    
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      readers.push(promise);
    }

    Promise.all(readers).then((results) => {
      setUploadedImages(results);
    });
  };

  // 添加新集合
  const handleAddCollection = () => {
    if (!newTitle || uploadedImages.length === 0) {
      alert('请填写标题并上传至少1张图片');
      return;
    }

    addCollection(newTitle, newEmoji || '📁', uploadedImages);
    
    // 重置表单
    setNewTitle('');
    setNewEmoji('');
    setUploadedImages([]);
    setShowAddForm(false);
  };

  // 选择头像
  const handleSelectAvatar = (imageUrl: string, unlocked: boolean) => {
    if (!unlocked) {
      alert('该头像尚未解锁');
      return;
    }
    
    setCurrentAvatar(imageUrl);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: VINTAGE_COLORS.cream }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div 
          className="p-6 relative"
          style={{ backgroundColor: VINTAGE_COLORS.mauve }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <FolderOpen className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">头像收集册</h2>
          </div>

          <div className="text-sm text-white opacity-90">
            当前经验值：{currentExp} EXP
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 添加新集合按钮 */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 rounded-xl mb-4 flex items-center justify-center gap-2 transition-all"
              style={{ 
                backgroundColor: VINTAGE_COLORS.beige,
                border: `2px dashed ${VINTAGE_COLORS.khaki}`
              }}
            >
              <Plus className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />
              <span className="font-semibold" style={{ color: VINTAGE_COLORS.burgundy }}>
                添加新的头像集合
              </span>
            </button>
          )}

          {/* 添加表单 */}
          {showAddForm && (
            <div 
              className="p-4 rounded-xl mb-4"
              style={{ backgroundColor: VINTAGE_COLORS.beige }}
            >
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
                  集合标题
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：BLACKPINK"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: '#fff',
                    border: `1px solid ${VINTAGE_COLORS.khaki}`
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-semibold mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
                  Emoji 图标
                </label>
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="例如：💖"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: '#fff',
                    border: `1px solid ${VINTAGE_COLORS.khaki}`
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-semibold mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
                  上传头像（最多5张）
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full"
                />
                
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddCollection}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: VINTAGE_COLORS.sage }}
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTitle('');
                    setNewEmoji('');
                    setUploadedImages([]);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold"
                  style={{ 
                    backgroundColor: VINTAGE_COLORS.khaki,
                    color: VINTAGE_COLORS.burgundy
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 头像集合列表 */}
          <div className="space-y-3">
            {collections.map((collection) => {
              const unlockedCount = collection.avatars.filter(a => a.unlocked).length;
              const totalCount = collection.avatars.length;

              return (
                <div 
                  key={collection.id}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: VINTAGE_COLORS.beige }}
                >
                  {/* 集合头部 */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleCollapse(collection.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{collection.emoji}</span>
                      <div>
                        <div className="font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
                          {collection.title}
                        </div>
                        <div className="text-xs opacity-70" style={{ color: VINTAGE_COLORS.burgundy }}>
                          已收集 {unlockedCount}/{totalCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除"${collection.title}"集合吗？`)) {
                            removeCollection(collection.id);
                          }
                        }}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: VINTAGE_COLORS.terracotta }}
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                      
                      {collection.collapsed ? (
                        <ChevronDown className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />
                      ) : (
                        <ChevronUp className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />
                      )}
                    </div>
                  </div>

                  {/* 头像网格 */}
                  {!collection.collapsed && (
                    <div className="p-4 pt-0">
                      <div className="grid grid-cols-5 gap-3">
                        {collection.avatars.map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => handleSelectAvatar(avatar.imageUrl, avatar.unlocked)}
                            className="aspect-square rounded-xl overflow-hidden relative transition-all hover:scale-105"
                            style={{
                              backgroundColor: VINTAGE_COLORS.khaki,
                              opacity: avatar.unlocked ? 1 : 0.5,
                            }}
                          >
                            <img 
                              src={avatar.imageUrl} 
                              alt="Avatar" 
                              className="w-full h-full object-cover"
                            />
                            
                            {!avatar.unlocked && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                <Lock className="w-6 h-6 text-white mb-1" />
                                <div className="text-xs text-white font-semibold">
                                  {avatar.requiredExp} EXP
                                </div>
                              </div>
                            )}
                            
                            {avatar.unlocked && avatar.unlockedAt && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: VINTAGE_COLORS.sage }}
                              >
                                <span className="text-xs text-white">✓</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 空状态 */}
          {collections.length === 0 && !showAddForm && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-lg font-semibold mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
                还没有头像集合
              </p>
              <p className="text-sm opacity-70" style={{ color: VINTAGE_COLORS.burgundy }}>
                点击上方按钮添加你的第一个头像集合
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

