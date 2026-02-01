import { useState } from 'react';
import type { SideHustle } from '@/types';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { Edit2, Trash2, TrendingUp, Clock, DollarSign, Target } from 'lucide-react';

interface SideHustleCardProps {
  sideHustle: SideHustle;
  isDark?: boolean;
}

export default function SideHustleCard({ sideHustle, isDark = false }: SideHustleCardProps) {
  const { deleteSideHustle, selectSideHustle } = useSideHustleStore();
  const [showMenu, setShowMenu] = useState(false);

  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const handleDelete = async () => {
    if (confirm(`确定要删除副业"${sideHustle.name}"吗？`)) {
      await deleteSideHustle(sideHustle.id);
    }
  };

  const handleEdit = () => {
    selectSideHustle(sideHustle);
    // TODO: 打开编辑表单
    alert('编辑功能开发中...');
  };

  // 计算进度条的最大值
  const maxValue = Math.max(sideHustle.totalHours, sideHustle.totalIncome / 100);
  const timeProgress = maxValue > 0 ? (sideHustle.totalHours / maxValue) * 100 : 0;
  const incomeProgress = maxValue > 0 ? ((sideHustle.totalIncome / 100) / maxValue) * 100 : 0;

  return (
    <div
      className="p-4 rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
      style={{ 
        backgroundColor: cardBg,
        border: `2px solid ${sideHustle.color}20`,
      }}
      onClick={() => selectSideHustle(sideHustle)}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: `${sideHustle.color}20` }}
          >
            {sideHustle.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: textColor }}>
              {sideHustle.name}
            </h3>
            {sideHustle.startDate && (
              <p className="text-sm" style={{ color: secondaryColor }}>
                开始于 {new Date(sideHustle.startDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            style={{ color: secondaryColor }}
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} style={{ color: '#10b981' }} />
            <span className="text-sm" style={{ color: secondaryColor }}>收入</span>
          </div>
          <div className="font-bold text-lg" style={{ color: textColor }}>
            ¥{sideHustle.totalIncome.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} style={{ color: '#ef4444' }} />
            <span className="text-sm" style={{ color: secondaryColor }}>支出</span>
          </div>
          <div className="font-bold text-lg" style={{ color: textColor }}>
            ¥{sideHustle.totalExpense.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} style={{ color: '#3b82f6' }} />
            <span className="text-sm" style={{ color: secondaryColor }}>时间</span>
          </div>
          <div className="font-bold text-lg" style={{ color: textColor }}>
            {sideHustle.totalHours.toFixed(1)}h
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} style={{ color: '#8b5cf6' }} />
            <span className="text-sm" style={{ color: secondaryColor }}>时薪</span>
          </div>
          <div className="font-bold text-lg" style={{ color: textColor }}>
            ¥{sideHustle.hourlyRate.toFixed(0)}/h
          </div>
        </div>
      </div>

      {/* 双色进度条 */}
      <div className="space-y-2 mb-4">
        {/* 时间进度条（绿色） */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm" style={{ color: secondaryColor }}>时间投入</span>
            <span className="text-sm font-medium" style={{ color: '#10b981' }}>
              {sideHustle.totalHours.toFixed(1)}h
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: cardBg }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(timeProgress, 100)}%`,
                backgroundColor: '#10b981',
              }}
            />
          </div>
        </div>

        {/* 收入进度条（粉色） */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm" style={{ color: secondaryColor }}>收入金额</span>
            <span className="text-sm font-medium" style={{ color: '#ec4899' }}>
              ¥{sideHustle.totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: cardBg }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(incomeProgress, 100)}%`,
                backgroundColor: '#ec4899',
              }}
            />
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: `${sideHustle.color}20` }}>
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: sideHustle.color }} />
          <span className="text-sm" style={{ color: secondaryColor }}>
            利润: <span className="font-bold" style={{ color: textColor }}>¥{sideHustle.profit.toLocaleString()}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: secondaryColor }}>ROI:</span>
          <span 
            className="text-sm font-bold px-2 py-1 rounded"
            style={{ 
              backgroundColor: sideHustle.roi > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: sideHustle.roi > 0 ? '#10b981' : '#ef4444',
            }}
          >
            {sideHustle.roi > 0 ? '+' : ''}{sideHustle.roi.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

