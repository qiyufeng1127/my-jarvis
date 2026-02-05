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

  // iOS 风格的颜色系统 - 简约、高级
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  return (
    <div 
      className="h-full overflow-auto p-3 md:p-4 bg-white dark:bg-black" 
    >
      {/* 顶部标题栏 - 紧凑 */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg md:text-xl font-semibold" style={{ color: textColor }}>
          💰 副业追踪
        </h1>
        <button
          onClick={() => setShowAddHustle(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
          style={{ 
            backgroundColor: cardBg,
            color: textColor,
            fontSize: '14px',
          }}
        >
          <Plus size={16} />
          <span>新增</span>
        </button>
      </div>

      {/* 数据卡片 - 紧凑、iOS 风格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {/* 总收入 */}
        <div 
          className="p-3 rounded-xl"
          style={{ 
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">💰</span>
            <span className="text-xs font-medium" style={{ color: secondaryColor }}>总收入</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mb-0.5" style={{ color: textColor }}>
            ¥{totalIncome.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: '#34C759' }}>
            +¥{thisMonthIncome.toLocaleString()} 本月
          </div>
        </div>

        {/* 总支出 */}
        <div 
          className="p-3 rounded-xl"
          style={{ 
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">💸</span>
            <span className="text-xs font-medium" style={{ color: secondaryColor }}>总支出</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mb-0.5" style={{ color: textColor }}>
            ¥{totalExpense.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: '#FF3B30' }}>
            -¥{thisMonthExpense.toLocaleString()} 本月
          </div>
        </div>

        {/* 总利润 */}
        <div 
          className="p-3 rounded-xl"
          style={{ 
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">💵</span>
            <span className="text-xs font-medium" style={{ color: secondaryColor }}>总利润</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mb-0.5" style={{ color: textColor }}>
            ¥{totalProfit.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: totalProfit >= 0 ? '#34C759' : '#FF3B30' }}>
            {totalProfit >= 0 ? '+' : ''}¥{thisMonthProfit.toLocaleString()} 本月
          </div>
        </div>

        {/* 欠款 */}
        <div 
          className="p-3 rounded-xl"
          style={{ 
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">⚠️</span>
            <span className="text-xs font-medium" style={{ color: secondaryColor }}>欠款</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mb-0.5" style={{ color: textColor }}>
            ¥{totalDebt.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: totalDebt > 0 ? '#FF9500' : '#34C759' }}>
            {totalDebt > 0 ? '需还款' : '无欠款 ✓'}
          </div>
        </div>
      </div>

      {/* 快速操作 - 紧凑 */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowAddIncome(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium"
          style={{ 
            backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
            color: '#34C759',
          }}
        >
          <Plus size={16} />
          <span>收入</span>
        </button>
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium"
          style={{ 
            backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)',
            color: '#FF3B30',
          }}
        >
          <Plus size={16} />
          <span>支出</span>
        </button>
      </div>

      {/* 标签页 - 紧凑 */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: '📊 概览' },
          { id: 'hustles', label: '💼 副业' },
          { id: 'finance', label: '💳 财务' },
          { id: 'analysis', label: '📈 分析' },
          { id: 'ideas', label: '💡 想法' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-sm"
            style={{
              backgroundColor: activeTab === tab.id ? cardBg : 'transparent',
              color: activeTab === tab.id ? textColor : secondaryColor,
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 - 紧凑 */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* AI 洞察 */}
            <AIInsights isDark={isDark} />
            
            {/* 效率排名 */}
            <EfficiencyRanking isDark={isDark} />
            
            {/* 副业列表 */}
            <div>
              <h2 className="text-base font-semibold mb-2" style={{ color: textColor }}>
                💼 活跃副业
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {activeSideHustles.map((hustle) => (
                  <SideHustleCard key={hustle.id} sideHustle={hustle} isDark={isDark} />
                ))}
              </div>
              {activeSideHustles.length === 0 && (
                <div 
                  className="text-center py-8 rounded-xl"
                  style={{ backgroundColor: cardBg, color: secondaryColor }}
                >
                  <div className="text-3xl mb-2">💼</div>
                  <p className="text-sm">还没有副业，点击右上角"新增"开始吧！</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hustles' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {activeSideHustles.map((hustle) => (
              <SideHustleCard key={hustle.id} sideHustle={hustle} isDark={isDark} />
            ))}
          </div>
        )}

        {activeTab === 'finance' && (
          <div style={{ color: textColor }}>
            <p className="text-center py-8 text-sm" style={{ color: secondaryColor }}>
              💳 财务明细功能开发中...
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

