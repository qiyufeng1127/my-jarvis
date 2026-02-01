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

  // 增强对比度的颜色系统
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.9)' : '#333333';
  const cardBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

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
      className="p-5 rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
      style={{ 
        backgroundColor: cardBg,
        border: `3px solid ${sideHustle.color}40`,
      }}
      onClick={() => selectSideHustle(sideHustle)}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="text-4xl w-16 h-16 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: `${sideHustle.color}30` }}
          >
            {sideHustle.icon}
          </div>
          <div>
            <h3 className="font-bold text-xl" style={{ color: textColor }}>
              {sideHustle.name}
            </h3>
            {sideHustle.startDate && (
              <p className="text-base mt-1" style={{ color: secondaryColor }}>
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
            <Edit2 size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* 数据统计 - 大字体、图标化 */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <TrendingUp size={28} style={{ color: '#10b981' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: secondaryColor }}>收入</div>
            <div className="font-bold text-2xl" style={{ color: textColor }}>
              ¥{sideHustle.totalIncome.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <TrendingUp size={28} style={{ color: '#ef4444' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: secondaryColor }}>支出</div>
            <div className="font-bold text-2xl" style={{ color: textColor }}>
              ¥{sideHustle.totalExpense.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <Clock size={28} style={{ color: '#3b82f6' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: secondaryColor }}>时间</div>
            <div className="font-bold text-2xl" style={{ color: textColor }}>
              {sideHustle.totalHours.toFixed(1)}h
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
          <DollarSign size={28} style={{ color: '#8b5cf6' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: secondaryColor }}>时薪</div>
            <div className="font-bold text-2xl" style={{ color: textColor }}>
              ¥{sideHustle.hourlyRate.toFixed(0)}/h
            </div>
          </div>
        </div>
      </div>

      {/* 双色进度条 - 更粗、更明显 */}
      <div className="space-y-3 mb-5">
        {/* 时间进度条（绿色） */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold" style={{ color: textColor }}>时间投入</span>
            <span className="text-base font-bold" style={{ color: '#10b981' }}>
              {sideHustle.totalHours.toFixed(1)}h
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(timeProgress, 100)}%`,
                backgroundColor: '#10b981',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
              }}
            />
          </div>
        </div>

        {/* 收入进度条（粉色） */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold" style={{ color: textColor }}>收入金额</span>
            <span className="text-base font-bold" style={{ color: '#ec4899' }}>
              ¥{sideHustle.totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(incomeProgress, 100)}%`,
                backgroundColor: '#ec4899',
                boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 底部信息 - 大字体 */}
      <div className="flex items-center justify-between pt-4 border-t-2" style={{ borderColor: `${sideHustle.color}30` }}>
        <div className="flex items-center gap-2">
          <Target size={20} style={{ color: sideHustle.color }} />
          <span className="text-base font-medium" style={{ color: secondaryColor }}>利润:</span>
          <span className="font-bold text-xl" style={{ color: textColor }}>¥{sideHustle.profit.toLocaleString()}</span>
        </div>
        <div 
          className="text-base font-bold px-4 py-2 rounded-lg"
          style={{ 
            backgroundColor: sideHustle.roi > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: sideHustle.roi > 0 ? '#10b981' : '#ef4444',
          }}
        >
          ROI {sideHustle.roi > 0 ? '+' : ''}{sideHustle.roi.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

