import { useState } from 'react';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface IncomeExpenseFormProps {
  type: 'income' | 'expense';
  isDark?: boolean;
  onClose: () => void;
}

export default function IncomeExpenseForm({ type, isDark = false, onClose }: IncomeExpenseFormProps) {
  const { getActiveSideHustles, addIncome, addExpense } = useSideHustleStore();
  const [sideHustleId, setSideHustleId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // 增强对比度的颜色系统
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.9)' : '#333333';
  const cardBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

  const activeSideHustles = getActiveSideHustles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sideHustleId || !amount) {
      alert('请填写必填项');
      return;
    }

    const data = {
      sideHustleId,
      amount: parseFloat(amount),
      description,
      date: new Date(date),
    };

    try {
      if (type === 'income') {
        await addIncome(data);
      } else {
        await addExpense(data);
      }
      onClose();
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败，请重试');
    }
  };

  const isIncome = type === 'income';
  const color = isIncome ? '#10b981' : '#ef4444';
  const Icon = isIncome ? TrendingUp : TrendingDown;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={24} style={{ color }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: textColor }}>
              添加{isIncome ? '收入' : '支出'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            style={{ color: secondaryColor }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 选择副业 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              选择副业 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={sideHustleId}
              onChange={(e) => setSideHustleId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: 'none',
                outline: 'none',
              }}
              required
            >
              <option value="">请选择副业</option>
              {activeSideHustles.map((hustle) => (
                <option key={hustle.id} value={hustle.id}>
                  {hustle.icon} {hustle.name}
                </option>
              ))}
            </select>
          </div>

          {/* 金额 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              金额 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: secondaryColor }}
              >
                ¥
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 rounded-lg"
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                  border: 'none',
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          {/* 日期 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: 'none',
                outline: 'none',
              }}
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              备注
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加备注..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg resize-none"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: 'none',
                outline: 'none',
              }}
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: cardBg,
                color: textColor,
              }}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: color,
                color: '#ffffff',
              }}
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

