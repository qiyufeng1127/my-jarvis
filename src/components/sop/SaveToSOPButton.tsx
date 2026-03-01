/**
 * 保存任务到SOP按钮组件
 * 用于在时间轴任务卡片上添加"保存到SOP"功能
 */

import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useSOPStore } from '@/stores/sopStore';
import type { Task } from '@/types';

interface SaveToSOPButtonProps {
  task: Task;
  isDark?: boolean;
  size?: 'small' | 'normal';
}

export default function SaveToSOPButton({ task, isDark = false, size = 'normal' }: SaveToSOPButtonProps) {
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const { folders, createTask } = useSOPStore();
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  const handleSaveToFolder = (folderId: string) => {
    // 保存任务到SOP
    createTask(folderId, {
      title: task.title,
      description: task.description || '',
      durationMinutes: task.durationMinutes || 30,
      tags: task.tags || [],
      location: task.location,
      goldReward: task.goldReward,
      longTermGoals: task.longTermGoals || {},
      verificationStart: task.verificationStart,
      verificationComplete: task.verificationComplete,
      subtasks: task.subtasks || [],
    });
    
    setShowFolderSelector(false);
    alert(`✅ 已保存到SOP文件夹`);
  };
  
  const buttonSize = size === 'small' ? 'w-6 h-6' : 'w-7 h-7';
  const iconSize = size === 'small' ? 14 : 16;
  
  return (
    <>
      {/* 保存到SOP按钮 */}
      <button
        onClick={() => setShowFolderSelector(true)}
        className="px-2 py-0.5 rounded-full text-xs font-bold transition-all hover:scale-105"
        style={{ 
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          color: '#ffffff'
        }}
        title="保存到SOP"
      >
        SOP
      </button>
      
      {/* 文件夹选择对话框 */}
      {showFolderSelector && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowFolderSelector(false)}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6"
            style={{ backgroundColor: bgColor }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: textColor }}>
                保存到SOP文件夹
              </h3>
              <button
                onClick={() => setShowFolderSelector(false)}
                className="p-1 rounded hover:bg-black hover:bg-opacity-10"
              >
                <X size={20} style={{ color: textColor }} />
              </button>
            </div>
            
            {/* 任务信息预览 */}
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: cardBg }}>
              <div className="font-semibold mb-1" style={{ color: textColor }}>
                {task.title}
              </div>
              <div className="text-xs" style={{ color: secondaryColor }}>
                时长：{task.durationMinutes}分钟
                {task.tags && task.tags.length > 0 && ` · 标签：${task.tags.join('、')}`}
              </div>
            </div>
            
            {/* 文件夹列表 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="text-center py-8" style={{ color: secondaryColor }}>
                  <p className="text-sm">暂无SOP文件夹</p>
                  <p className="text-xs mt-2">请先在SOP页面创建文件夹</p>
                </div>
              ) : (
                folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleSaveToFolder(folder.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ 
                      backgroundColor: `${folder.color}20`,
                      border: `2px solid ${folder.color}`
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    >
                      {folder.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold" style={{ color: textColor }}>
                        {folder.name}
                      </div>
                      <div className="text-xs" style={{ color: secondaryColor }}>
                        点击保存到此文件夹
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            {/* 取消按钮 */}
            <button
              onClick={() => setShowFolderSelector(false)}
              className="w-full mt-4 py-2 rounded-lg font-medium transition-all"
              style={{ backgroundColor: cardBg, color: textColor }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
}

