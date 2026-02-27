import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { OBJECT_CATEGORIES, OBJECT_LABELS } from '@/services/realtimeObjectDetection';

interface ObjectSelectorProps {
  onConfirm: (selectedObjects: string[]) => void;
  onCancel: () => void;
  maxSelection?: number; // 最大选择数量
  preSelected?: string[]; // 预选物品
}

export default function ObjectSelector({
  onConfirm,
  onCancel,
  maxSelection = 10,
  preSelected = [],
}: ObjectSelectorProps) {
  const [selectedObjects, setSelectedObjects] = useState<string[]>(preSelected);
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(OBJECT_CATEGORIES)[0]);

  // 切换物品选择
  const toggleObject = (objectClass: string) => {
    if (selectedObjects.includes(objectClass)) {
      setSelectedObjects(selectedObjects.filter(obj => obj !== objectClass));
    } else {
      if (selectedObjects.length < maxSelection) {
        setSelectedObjects([...selectedObjects, objectClass]);
      } else {
        alert(`最多只能选择 ${maxSelection} 个物品`);
      }
    }
  };

  // 全选当前分类
  const selectAllInCategory = () => {
    const categoryObjects = OBJECT_CATEGORIES[activeCategory as keyof typeof OBJECT_CATEGORIES];
    const newSelected = [...new Set([...selectedObjects, ...categoryObjects])].slice(0, maxSelection);
    setSelectedObjects(newSelected);
  };

  // 清空当前分类
  const clearCategory = () => {
    const categoryObjects = OBJECT_CATEGORIES[activeCategory as keyof typeof OBJECT_CATEGORIES];
    setSelectedObjects(selectedObjects.filter(obj => !categoryObjects.includes(obj)));
  };

  // 确认选择
  const handleConfirm = () => {
    if (selectedObjects.length === 0) {
      alert('请至少选择一个物品');
      return;
    }
    onConfirm(selectedObjects);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              选择验证物品
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 已选物品数量 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              已选择 {selectedObjects.length}/{maxSelection} 个物品
            </span>
            {selectedObjects.length > 0 && (
              <button
                onClick={() => setSelectedObjects([])}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                清空全部
              </button>
            )}
          </div>

          {/* 已选物品列表 */}
          {selectedObjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedObjects.map((obj) => (
                <div
                  key={obj}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {OBJECT_LABELS[obj] || obj}
                  <button
                    onClick={() => toggleObject(obj)}
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分类标签 */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2">
            {Object.keys(OBJECT_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 物品列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {activeCategory}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllInCategory}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                全选
              </button>
              <button
                onClick={clearCategory}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                清空
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {OBJECT_CATEGORIES[activeCategory as keyof typeof OBJECT_CATEGORIES]?.map((objectClass) => {
              const isSelected = selectedObjects.includes(objectClass);
              const label = OBJECT_LABELS[objectClass] || objectClass;

              return (
                <button
                  key={objectClass}
                  onClick={() => toggleObject(objectClass)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">
                      {getObjectEmoji(objectClass)}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {objectClass}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedObjects.length === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认选择 ({selectedObjects.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// 获取物品对应的emoji图标
function getObjectEmoji(objectClass: string): string {
  const emojiMap: Record<string, string> = {
    'person': '🧑',
    'bicycle': '🚲',
    'car': '🚗',
    'motorcycle': '🏍️',
    'airplane': '✈️',
    'bus': '🚌',
    'train': '🚆',
    'truck': '🚚',
    'boat': '⛵',
    'chair': '🪑',
    'couch': '🛋️',
    'bed': '🛏️',
    'dining table': '🍽️',
    'toilet': '🚽',
    'tv': '📺',
    'laptop': '💻',
    'mouse': '🖱️',
    'remote': '📱',
    'keyboard': '⌨️',
    'cell phone': '📱',
    'bottle': '🍾',
    'wine glass': '🍷',
    'cup': '☕',
    'fork': '🍴',
    'knife': '🔪',
    'spoon': '🥄',
    'bowl': '🥣',
    'banana': '🍌',
    'apple': '🍎',
    'sandwich': '🥪',
    'orange': '🍊',
    'broccoli': '🥦',
    'carrot': '🥕',
    'hot dog': '🌭',
    'pizza': '🍕',
    'donut': '🍩',
    'cake': '🎂',
    'backpack': '🎒',
    'umbrella': '☂️',
    'handbag': '👜',
    'tie': '👔',
    'suitcase': '🧳',
    'frisbee': '🥏',
    'skis': '🎿',
    'snowboard': '🏂',
    'sports ball': '⚽',
    'kite': '🪁',
    'baseball bat': '⚾',
    'baseball glove': '🥎',
    'skateboard': '🛹',
    'surfboard': '🏄',
    'tennis racket': '🎾',
    'bird': '🐦',
    'cat': '🐱',
    'dog': '🐶',
    'horse': '🐴',
    'sheep': '🐑',
    'cow': '🐄',
    'elephant': '🐘',
    'bear': '🐻',
    'zebra': '🦓',
    'giraffe': '🦒',
    'book': '📚',
    'clock': '🕐',
    'vase': '🏺',
    'scissors': '✂️',
    'teddy bear': '🧸',
    'hair drier': '💇',
    'toothbrush': '🪥',
    'potted plant': '🪴',
    'sink': '🚰',
    'refrigerator': '🧊',
    'oven': '🔥',
    'microwave': '📻',
    'toaster': '🍞',
  };

  return emojiMap[objectClass] || '📦';
}

