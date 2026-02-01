import { useState, useEffect } from 'react';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, Lightbulb, BarChart3 } from 'lucide-react';
import SideHustleCard from './SideHustleCard';
import EfficiencyRanking from './EfficiencyRanking';
import AIInsights from './AIInsights';
import IdeaPool from './IdeaPool';
import IncomeExpenseForm from './IncomeExpenseForm';
import SideHustleForm from './SideHustleForm';

interface MoneyTrackerProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function MoneyTracker({ isDark = false, bgColor = '#ffffff' }: MoneyTrackerProps) {
  const {
    loadSideHustles,
    getActiveSideHustles,
    getTotalIncome,
    getTotalExpense,
    getTotalProfit,
    getTotalDebt,
  } = useSideHustleStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'hustles' | 'finance' | 'analysis' | 'ideas'>('overview');
  const [showAddHustle, setShowAddHustle] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // 加载数据
  useEffect(() => {
    loadSideHustles();
  }, [loadSideHustles]);

  const activeSideHustles = getActiveSideHustles();
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const totalProfit = getTotalProfit();
  const totalDebt = getTotalDebt();

  // 本月数据（简化版，实际应该根据日期过滤）
  const thisMonthIncome = totalIncome * 0.3; // 假设本月占30%
  const thisMonthExpense = totalExpense * 0.3;
  const thisMonthProfit = thisMonthIncome - thisMonthExpense;

  // 增强对比度的颜色系统
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.9)' : '#333333';
  const cardBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const borderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)';

  return (
    <div 
      className="h-full overflow-auto p-6" 
      style={{ backgroundColor: bgColor }}
    >
      {/* 顶部概览区 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>
            💰 副业追踪器
          </h1>
          <button
            onClick={() => setShowAddHustle(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{ 
              backgroundColor: cardBg,
              color: textColor,
            }}
          >
            <Plus size={20} />
            <span>新增副业</span>
          </button>
        </div>

        {/* 数据卡片 - 大字体、高对比度 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 总收入 */}
          <div 
            className="p-5 rounded-xl relative overflow-hidden"
            style={{ 
              backgroundColor: cardBg,
              border: `2px solid rgba(16, 185, 129, 0.3)`,
            }}
          >
            {/* 背景装饰 */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ color: '#10b981' }}>
              <TrendingUp size={96} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={24} style={{ color: '#10b981' }} />
                <span className="text-base font-semibold" style={{ color: textColor }}>总收入</span>
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: textColor }}>
                ¥{totalIncome.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-base font-medium" style={{ color: '#10b981' }}>
                  +¥{thisMonthIncome.toLocaleString()}
                </div>
                <span className="text-sm" style={{ color: secondaryColor }}>本月</span>
              </div>
            </div>
          </div>

          {/* 总支出 */}
          <div 
            className="p-5 rounded-xl relative overflow-hidden"
            style={{ 
              backgroundColor: cardBg,
              border: `2px solid rgba(239, 68, 68, 0.3)`,
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ color: '#ef4444' }}>
              <TrendingDown size={96} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={24} style={{ color: '#ef4444' }} />
                <span className="text-base font-semibold" style={{ color: textColor }}>总支出</span>
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: textColor }}>
                ¥{totalExpense.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-base font-medium" style={{ color: '#ef4444' }}>
                  -¥{thisMonthExpense.toLocaleString()}
                </div>
                <span className="text-sm" style={{ color: secondaryColor }}>本月</span>
              </div>
            </div>
          </div>

          {/* 总利润 */}
          <div 
            className="p-5 rounded-xl relative overflow-hidden"
            style={{ 
              backgroundColor: cardBg,
              border: `2px solid rgba(139, 92, 246, 0.3)`,
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ color: '#8b5cf6' }}>
              <DollarSign size={96} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={24} style={{ color: '#8b5cf6' }} />
                <span className="text-base font-semibold" style={{ color: textColor }}>总利润</span>
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: textColor }}>
                ¥{totalProfit.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-base font-medium" style={{ color: '#8b5cf6' }}>
                  +¥{thisMonthProfit.toLocaleString()}
                </div>
                <span className="text-sm" style={{ color: secondaryColor }}>本月</span>
              </div>
            </div>
          </div>

          {/* 欠债 */}
          <div 
            className="p-5 rounded-xl relative overflow-hidden"
            style={{ 
              backgroundColor: cardBg,
              border: `2px solid rgba(245, 158, 11, 0.3)`,
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10" style={{ color: '#f59e0b' }}>
              <AlertCircle size={96} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={24} style={{ color: '#f59e0b' }} />
                <span className="text-base font-semibold" style={{ color: textColor }}>欠债</span>
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: textColor }}>
                ¥{totalDebt.toLocaleString()}
              </div>
              <div className="text-base font-medium" style={{ color: totalDebt > 0 ? '#f59e0b' : '#10b981' }}>
                {totalDebt > 0 ? '需要还款' : '无欠债 ✓'}
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddIncome(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
            }}
          >
            <Plus size={18} />
            <span>添加收入</span>
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
            }}
          >
            <Plus size={18} />
            <span>添加支出</span>
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: '概览', icon: BarChart3 },
          { id: 'hustles', label: '副业', icon: DollarSign },
          { id: 'finance', label: '财务', icon: TrendingUp },
          { id: 'analysis', label: '分析', icon: BarChart3 },
          { id: 'ideas', label: '想法', icon: Lightbulb },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap"
            style={{
              backgroundColor: activeTab === tab.id ? cardBg : 'transparent',
              color: activeTab === tab.id ? textColor : secondaryColor,
              borderBottom: activeTab === tab.id ? `2px solid ${textColor}` : 'none',
            }}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI 洞察 */}
            <AIInsights isDark={isDark} />
            
            {/* 效率排名 */}
            <EfficiencyRanking isDark={isDark} />
            
            {/* 副业列表 */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: textColor }}>
                活跃副业
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeSideHustles.map((hustle) => (
                  <SideHustleCard key={hustle.id} sideHustle={hustle} isDark={isDark} />
                ))}
              </div>
              {activeSideHustles.length === 0 && (
                <div 
                  className="text-center py-12 rounded-xl"
                  style={{ backgroundColor: cardBg, color: secondaryColor }}
                >
                  <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                  <p>还没有副业，点击右上角"新增副业"开始吧！</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hustles' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeSideHustles.map((hustle) => (
              <SideHustleCard key={hustle.id} sideHustle={hustle} isDark={isDark} />
            ))}
          </div>
        )}

        {activeTab === 'finance' && (
          <div style={{ color: textColor }}>
            <p className="text-center py-12" style={{ color: secondaryColor }}>
              财务明细功能开发中...
            </p>
          </div>
        )}

        {activeTab === 'analysis' && (
          <EfficiencyRanking isDark={isDark} />
        )}

        {activeTab === 'ideas' && (
          <IdeaPool isDark={isDark} />
        )}
      </div>

      {/* 弹窗 */}
      {showAddHustle && (
        <SideHustleForm
          isDark={isDark}
          onClose={() => setShowAddHustle(false)}
        />
      )}

      {showAddIncome && (
        <IncomeExpenseForm
          type="income"
          isDark={isDark}
          onClose={() => setShowAddIncome(false)}
        />
      )}

      {showAddExpense && (
        <IncomeExpenseForm
          type="expense"
          isDark={isDark}
          onClose={() => setShowAddExpense(false)}
        />
      )}
    </div>
  );
}

