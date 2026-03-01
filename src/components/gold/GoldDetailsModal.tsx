/**
 * 金币详情弹窗
 * 显示金币历史记录和奖励商店
 */

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ShoppingBag, Plus, Edit2, Trash2 } from 'lucide-react';
import { useGoldStore } from '@/stores/goldStore';

interface GoldDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
}

export default function GoldDetailsModal({ isOpen, onClose, isDark }: GoldDetailsModalProps) {
  const { balance, transactions } = useGoldStore();
  const [activeTab, setActiveTab] = useState<'history' | 'shop'>('shop'); // 默认显示奖励商店
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

  // 从 localStorage 加载自定义奖励
  useEffect(() => {
    const saved = localStorage.getItem('goldShopItems');
    if (saved) {
      setShopItems(JSON.parse(saved));
    } else {
      // 默认奖励
      const defaultItems: ShopItem[] = [
        { id: '1', name: '休息15分钟', cost: 100, icon: '☕', description: '获得15分钟自由休息时间' },
        { id: '2', name: '跳过一次验证', cost: 50, icon: '⏭️', description: '跳过下一次任务验证' },
        { id: '3', name: '延长任务30分钟', cost: 80, icon: '⏰', description: '为当前任务延长30分钟' },
        { id: '4', name: '金币翻倍卡', cost: 200, icon: '💎', description: '下一个任务金币奖励翻倍' },
        { id: '5', name: '免罚卡', cost: 150, icon: '🛡️', description: '免除下一次超时惩罚' },
      ];
      setShopItems(defaultItems);
      localStorage.setItem('goldShopItems', JSON.stringify(defaultItems));
    }
  }, []);

  // 保存到 localStorage
  const saveItems = (items: ShopItem[]) => {
    setShopItems(items);
    localStorage.setItem('goldShopItems', JSON.stringify(items));
  };

  // 添加新奖励
  const addNewItem = () => {
    const name = prompt('🎁 输入奖励名称：');
    if (!name) return;
    
    const costStr = prompt('💰 输入所需金币：');
    const cost = parseInt(costStr || '100');
    if (isNaN(cost) || cost <= 0) {
      alert('❌ 请输入有效的金币数量');
      return;
    }
    
    const icon = prompt('✨ 输入图标 emoji（可选）：') || '🎁';
    const description = prompt('📝 输入描述（可选）：') || '';
    
    const newItem: ShopItem = {
      id: Date.now().toString(),
      name,
      cost,
      icon,
      description,
    };
    
    saveItems([...shopItems, newItem]);
    setIsAddingItem(false);
  };

  // 编辑奖励
  const editItem = (item: ShopItem) => {
    const name = prompt('🎁 修改奖励名称：', item.name);
    if (!name) return;
    
    const costStr = prompt('💰 修改所需金币：', item.cost.toString());
    const cost = parseInt(costStr || item.cost.toString());
    if (isNaN(cost) || cost <= 0) {
      alert('❌ 请输入有效的金币数量');
      return;
    }
    
    const icon = prompt('✨ 修改图标 emoji：', item.icon) || item.icon;
    const description = prompt('📝 修改描述：', item.description) || item.description;
    
    const updatedItems = shopItems.map(i => 
      i.id === item.id 
        ? { ...i, name, cost, icon, description }
        : i
    );
    
    saveItems(updatedItems);
  };

  // 删除奖励
  const deleteItem = (id: string) => {
    if (!confirm('确定要删除这个奖励吗？')) return;
    saveItems(shopItems.filter(i => i.id !== id));
  };

  // 按可兑换状态排序
  const sortedShopItems = [...shopItems].sort((a, b) => {
    const aCanAfford = balance >= a.cost;
    const bCanAfford = balance >= b.cost;
    
    // 可兑换的排在前面
    if (aCanAfford && !bCanAfford) return -1;
    if (!aCanAfford && bCanAfford) return 1;
    
    // 同样状态下按金币从低到高排序
    return a.cost - b.cost;
  });

  if (!isOpen) return null;

  // 将transactions转换为history格式
  const history = transactions.map(t => ({
    ...t,
    type: t.type === 'earn' ? 'earn' as const : 'spend' as const
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ 
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          maxHeight: '80vh'
        }}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h2 
                className="text-lg font-bold"
                style={{ color: isDark ? '#ffffff' : '#000000' }}
              >
                金币详情
              </h2>
              <p 
                className="text-sm"
                style={{ 
                  color: balance >= 0 ? '#10B981' : '#EF4444',
                  fontWeight: 'bold'
                }}
              >
                当前余额: {balance} 金币
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
          </button>
        </div>

        {/* 标签切换 */}
        <div 
          className="flex border-b"
          style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
        >
          <button
            onClick={() => setActiveTab('shop')}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === 'shop' 
                ? (isDark ? '#60a5fa' : '#3b82f6')
                : (isDark ? '#9ca3af' : '#6b7280'),
              borderBottom: activeTab === 'shop' ? '2px solid' : 'none',
              borderColor: activeTab === 'shop' ? (isDark ? '#60a5fa' : '#3b82f6') : 'transparent'
            }}
          >
            🛍️ 奖励商店
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === 'history' 
                ? (isDark ? '#60a5fa' : '#3b82f6')
                : (isDark ? '#9ca3af' : '#6b7280'),
              borderBottom: activeTab === 'history' ? '2px solid' : 'none',
              borderColor: activeTab === 'history' ? (isDark ? '#60a5fa' : '#3b82f6') : 'transparent'
            }}
          >
            📊 历史记录
          </button>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
          {activeTab === 'history' ? (
            <div className="p-4 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    暂无历史记录
                  </p>
                </div>
              ) : (
                history.slice().reverse().map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {record.type === 'earn' ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p 
                          className="text-sm font-medium truncate"
                          style={{ color: isDark ? '#ffffff' : '#000000' }}
                        >
                          {record.reason}
                        </p>
                        <span
                          className="text-sm font-bold flex-shrink-0"
                          style={{ 
                            color: record.type === 'earn' ? '#10B981' : '#EF4444'
                          }}
                        >
                          {record.type === 'earn' ? '+' : '-'}{record.amount}
                        </span>
                      </div>
                      {record.taskTitle && (
                        <p 
                          className="text-xs mt-0.5 truncate"
                          style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                        >
                          任务: {record.taskTitle}
                        </p>
                      )}
                      <p 
                        className="text-xs mt-0.5"
                        style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                      >
                        {new Date(record.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* 添加新奖励按钮 */}
              <button
                onClick={addNewItem}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  borderColor: isDark ? '#4b5563' : '#d1d5db',
                  backgroundColor: isDark ? '#374151' : '#f9fafb',
                  color: isDark ? '#60a5fa' : '#3b82f6'
                }}
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">添加自定义奖励</span>
              </button>

              {/* 奖励列表 */}
              {sortedShopItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    暂无奖励，点击上方按钮添加
                  </p>
                </div>
              ) : (
                sortedShopItems.map((item) => {
                  const canAfford = balance >= item.cost;
                  const progress = Math.min((balance / item.cost) * 100, 100);
                  const remaining = Math.max(item.cost - balance, 0);

                  return (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        borderColor: canAfford 
                          ? (isDark ? '#10B981' : '#10B981')
                          : (isDark ? '#4b5563' : '#e5e7eb'),
                        boxShadow: canAfford ? '0 4px 20px rgba(16, 185, 129, 0.2)' : 'none'
                      }}
                    >
                      {/* 进度条背景 */}
                      <div 
                        className="absolute inset-0 transition-all duration-500"
                        style={{
                          background: canAfford
                            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                            : `linear-gradient(90deg, ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'} 0%, transparent ${progress}%, transparent 100%)`,
                        }}
                      />

                      <div className="relative flex items-start gap-3 p-4">
                        {/* 图标 */}
                        <div 
                          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg"
                          style={{
                            backgroundColor: canAfford 
                              ? 'rgba(16, 185, 129, 0.2)'
                              : (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'),
                          }}
                        >
                          {item.icon}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 
                              className="text-base font-bold"
                              style={{ color: isDark ? '#ffffff' : '#000000' }}
                            >
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => editItem(item)}
                                className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="w-3.5 h-3.5" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                              </button>
                            </div>
                          </div>

                          {item.description && (
                            <p 
                              className="text-sm mb-2"
                              style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                            >
                              {item.description}
                            </p>
                          )}

                          {/* 金币和进度 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: '#FFD700' }}>
                                  💰 {item.cost} 金币
                                </span>
                                {!canAfford && (
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ 
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444'
                                  }}>
                                    还差 {remaining}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  if (canAfford) {
                                    if (confirm(`确定要使用 ${item.cost} 金币购买「${item.name}」吗？`)) {
                                      alert(`🎉 购买成功！已使用 ${item.cost} 金币购买「${item.name}」`);
                                      // TODO: 实现购买逻辑，扣除金币
                                    }
                                  } else {
                                    alert(`💰 金币不足！还需要 ${remaining} 金币才能兑换`);
                                  }
                                }}
                                disabled={!canAfford}
                                className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                                style={{
                                  backgroundColor: canAfford ? '#10B981' : (isDark ? '#4b5563' : '#d1d5db'),
                                  color: '#ffffff'
                                }}
                              >
                                {canAfford ? '✨ 立即兑换' : '🔒 金币不足'}
                              </button>
                            </div>

                            {/* 进度条 */}
                            {!canAfford && (
                              <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#4b5563' : '#e5e7eb' }}>
                                <div 
                                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

