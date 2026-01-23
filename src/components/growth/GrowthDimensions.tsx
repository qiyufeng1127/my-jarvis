import { useState } from 'react';
import { TrendingUp, Target, Calendar, ChevronRight, Edit, Trash2, Plus, Info } from 'lucide-react';
// import { Line } from 'react-chartjs-2';
/*
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
*/

interface GrowthDimension {
  id: string;
  name: string;
  icon: string;
  color: string;
  currentValue: number;
  weeklyChange: number;
  description: string;
  weight: number;
  relatedTaskTypes: string[];
  history: { date: string; value: number }[];
}

interface GrowthDimensionsProps {
  dimensions: GrowthDimension[];
  onDimensionClick: (dimensionId: string) => void;
  onEdit?: (dimensionId: string) => void;
  onDelete?: (dimensionId: string) => void;
  onAdd?: () => void;
  isEditMode?: boolean;
}

export default function GrowthDimensions({
  dimensions,
  onDimensionClick,
  onEdit,
  onDelete,
  onAdd,
  isEditMode = false,
}: GrowthDimensionsProps) {
  const [sortedDimensions, setSortedDimensions] = useState(dimensions);

  // 拖拽排序
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    
    if (dragIndex === dropIndex) return;

    const newDimensions = [...sortedDimensions];
    const [removed] = newDimensions.splice(dragIndex, 1);
    newDimensions.splice(dropIndex, 0, removed);
    
    setSortedDimensions(newDimensions);
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">成长维度</h2>
          <p className="text-sm text-neutral-600 mt-1">追踪你的多维度成长进展</p>
        </div>
        {isEditMode && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加新维度</span>
          </button>
        )}
      </div>

      {/* 维度卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedDimensions.map((dimension, index) => (
          <div
            key={dimension.id}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all ${
              isEditMode ? 'cursor-move' : 'cursor-pointer'
            } overflow-hidden group`}
            onClick={() => !isEditMode && onDimensionClick(dimension.id)}
          >
            {/* 顶部彩色条 */}
            <div
              className="h-2"
              style={{ backgroundColor: dimension.color }}
            />

            {/* 卡片内容 */}
            <div className="p-5">
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${dimension.color}20` }}
                  >
                    {dimension.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">
                      {dimension.name}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      权重 ×{dimension.weight}
                    </p>
                  </div>
                </div>

                {/* 编辑模式按钮 */}
                {isEditMode && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(dimension.id);
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除"${dimension.name}"维度吗？`)) {
                          onDelete?.(dimension.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* 当前值和进度 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600">当前值</span>
                  <span className="text-2xl font-bold" style={{ color: dimension.color }}>
                    {dimension.currentValue}
                  </span>
                </div>
                
                {/* 进度条 */}
                <div className="relative w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((dimension.currentValue / 100) * 100, 100)}%`,
                      backgroundColor: dimension.color,
                    }}
                  />
                </div>
              </div>

              {/* 本周变化 */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-600">本周变化</span>
                <div className={`flex items-center space-x-1 font-semibold ${
                  dimension.weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${
                    dimension.weeklyChange < 0 ? 'transform rotate-180' : ''
                  }`} />
                  <span>
                    {dimension.weeklyChange >= 0 ? '+' : ''}
                    {dimension.weeklyChange}
                  </span>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                {dimension.description}
              </p>

              {/* 查看详情 */}
              {!isEditMode && (
                <div className="flex items-center justify-end text-sm font-medium group-hover:text-blue-600 transition-colors"
                  style={{ color: dimension.color }}
                >
                  <span>查看详情</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {sortedDimensions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            还没有成长维度
          </h3>
          <p className="text-neutral-600 mb-4">
            添加你的第一个成长维度，开始追踪你的进步
          </p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加新维度
            </button>
          )}
        </div>
      )}

      {/* 编辑模式提示 */}
      {isEditMode && sortedDimensions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">编辑模式提示：</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>拖拽卡片可以调整显示顺序</li>
                <li>点击编辑按钮修改维度信息</li>
                <li>点击删除按钮移除维度</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

