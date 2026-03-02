/**
 * 保存任务到SOP按钮组件
 * 用于在时间轴任务卡片上添加"保存到SOP"功能
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
    // 保存任务到SOP，包含所有验证规则和子任务
    createTask(folderId, {
      title: task.title,
      description: task.description || '',
      durationMinutes: task.durationMinutes || 30,
      tags: task.tags || [],
      location: task.location,
      goldReward: task.goldReward,
      longTermGoals: task.longTermGoals || {},
      // 保存验证配置
      verificationEnabled: task.verificationEnabled || false,
      startKeywords: task.startKeywords || [],
      completeKeywords: task.completeKeywords || [],
      // 保存子任务
      subtasks: task.subtasks || [],
    });
    
    setShowFolderSelector(false);
    
    // 显示成功提示
    const folderName = folders.find(f => f.id === folderId)?.name || 'SOP文件夹';
    const hasVerification = (task.startKeywords && task.startKeywords.length > 0) || (task.completeKeywords && task.completeKeywords.length > 0);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    
    let message = `✅ 已保存到 ${folderName}`;
    if (hasVerification) {
      message += `\n📸 已保存验证关键词`;
    }
    if (hasSubtasks) {
      message += `\n✅ 已保存 ${task.subtasks?.length} 个子任务`;
    }
    
    alert(message);
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
      
      {/* 使用Portal渲染对话框到body */}
      {showFolderSelector && createPortal(
        <>
          {/* 文件夹选择对话框 - 背景遮罩 */}
          <div 
            className="fixed inset-0"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 2147483647
            }}
            onClick={() => setShowFolderSelector(false)}
          />
          
          {/* 文件夹选择对话框 - 内容 */}
          <div 
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 2147483647 }}
            onClick={() => setShowFolderSelector(false)}
          >
            <div
              className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden"
              style={{ 
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                border: `2px solid ${isDark ? '#3B82F6' : '#E5E7EB'}`,
                maxHeight: '85vh',
                position: 'relative',
                zIndex: 2147483647
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* 头部 - 纯色背景 */}
            <div 
              className="flex items-center justify-between p-6 border-b"
              style={{ 
                backgroundColor: isDark ? '#2563EB' : '#3B82F6',
                borderColor: 'transparent'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  💾
                </div>
                <h3 className="text-lg font-bold text-white">
                  保存到SOP文件夹
                </h3>
              </div>
              <button
                onClick={() => setShowFolderSelector(false)}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            
            {/* 内容区域 */}
            <div className="p-6">
              {/* 任务信息预览 */}
              <div 
                className="mb-4 p-4 rounded-xl border-2"
                style={{ 
                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                  borderColor: isDark ? '#374151' : '#E5E7EB'
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📋</div>
                  <div className="flex-1">
                    <div className="font-bold mb-2" style={{ color: textColor }}>
                      {task.title}
                    </div>
                    <div className="space-y-1 text-xs" style={{ color: secondaryColor }}>
                      <div>⏱️ 时长：{task.durationMinutes}分钟</div>
                      {task.tags && task.tags.length > 0 && (
                        <div>🏷️ 标签：{task.tags.join('、')}</div>
                      )}
                      {task.goldReward && (
                        <div>💰 金币：{task.goldReward}</div>
                      )}
                      {(task.startKeywords && task.startKeywords.length > 0) && (
                        <div>✅ 启动验证：{task.startKeywords.join('、')}</div>
                      )}
                      {(task.completeKeywords && task.completeKeywords.length > 0) && (
                        <div>🎯 完成验证：{task.completeKeywords.join('、')}</div>
                      )}
                      {(task.subtasks && task.subtasks.length > 0) && (
                        <div>📋 子任务：{task.subtasks.length}个</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 文件夹列表 */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {folders.length === 0 ? (
                  <div 
                    className="text-center py-12 rounded-xl border-2 border-dashed"
                    style={{ 
                      color: secondaryColor,
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      backgroundColor: isDark ? '#111827' : '#F9FAFB'
                    }}
                  >
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-sm font-medium">暂无SOP文件夹</p>
                    <p className="text-xs mt-2">请先在SOP页面创建文件夹</p>
                  </div>
                ) : (
                  folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => handleSaveToFolder(folder.id)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                      style={{ 
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        border: `2px solid ${folder.color}`
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
                        style={{ backgroundColor: folder.color }}
                      >
                        {folder.emoji}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-base mb-1" style={{ color: textColor }}>
                          {folder.name}
                        </div>
                        <div className="text-xs flex items-center gap-1" style={{ color: secondaryColor }}>
                          <span>💾</span>
                          <span>点击保存到此文件夹</span>
                        </div>
                      </div>
                      <div className="text-2xl opacity-50">→</div>
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div 
              className="p-4 border-t"
              style={{ 
                backgroundColor: isDark ? '#111827' : '#F9FAFB',
                borderColor: isDark ? '#374151' : '#E5E7EB'
              }}
            >
              <button
                onClick={() => setShowFolderSelector(false)}
                className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                  color: textColor
                }}
              >
                取消
              </button>
            </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

