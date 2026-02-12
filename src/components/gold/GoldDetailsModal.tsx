/**
 * 金币详情弹窗
 * 显示金币历史记录和奖励商店
 */

import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react';
import { useGoldStore } from '@/stores/goldStore';

interface GoldDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function GoldDetailsModal({ isOpen, onClose, isDark }: GoldDetailsModalProps) {
  const { balance, transactions } = useGoldStore();
  const [activeTab, setActiveTab] = useState<'history' | 'shop'>('history');

  if (!isOpen) return null;

  // 将transactions转换为history格式
  const history = transactions.map(t => ({
    ...t,
    type: t.type === 'earn' ? 'earn' as const : 'spend' as const
  }));

  // 奖励商店物品
  const shopItems = [
    { id: 1, name: '休息15分钟', cost: 100, icon: '☕', description: '获得15分钟自由休息时间' },
    { id: 2, name: '跳过一次验证', cost: 50, icon: '⏭️', description: '跳过下一次任务验证' },
    { id: 3, name: '延长任务30分钟', cost: 80, icon: '⏰', description: '为当前任务延长30分钟' },
    { id: 4, name: '金币翻倍卡', cost: 200, icon: '💎', description: '下一个任务金币奖励翻倍' },
    { id: 5, name: '免罚卡', cost: 150, icon: '🛡️', description: '免除下一次超时惩罚' },
  ];

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
              {shopItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: isDark ? '#374151' : '#ffffff',
                    borderColor: isDark ? '#4b5563' : '#e5e7eb'
                  }}
                >
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-sm font-bold"
                      style={{ color: isDark ? '#ffffff' : '#000000' }}
                    >
                      {item.name}
                    </h3>
                    <p 
                      className="text-xs mt-0.5"
                      style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                    >
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold" style={{ color: '#FFD700' }}>
                        💰 {item.cost}
                      </span>
                      <button
                        onClick={() => {
                          if (balance >= item.cost) {
                            alert(`购买成功！使用了 ${item.cost} 金币购买 ${item.name}`);
                            // TODO: 实现购买逻辑
                          } else {
                            alert(`金币不足！还需要 ${item.cost - balance} 金币`);
                          }
                        }}
                        disabled={balance < item.cost}
                        className="px-3 py-1 rounded-full text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: balance >= item.cost ? '#10B981' : '#9ca3af',
                          color: '#ffffff'
                        }}
                      >
                        {balance >= item.cost ? '购买' : '金币不足'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

