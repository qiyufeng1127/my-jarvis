import { useState } from 'react';
import { Download, Upload, X, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import type { Task } from '@/types';

interface ImportExportButtonProps {
  tasks: Task[];
  onImport: (tasks: Task[]) => void;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
  isDark?: boolean;
}

export default function ImportExportButton({
  tasks,
  onImport,
  bgColor = '#ffffff',
  textColor = '#000000',
  accentColor = '#666666',
  borderColor = 'rgba(0, 0, 0, 0.1)',
  isDark = false,
}: ImportExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showResult, setShowResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 导出今日时间轴数据
  const handleExport = () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 筛选今日的所有任务
      const todayTasks = tasks.filter(task => {
        if (!task.scheduledStart) return false;
        const taskDate = new Date(task.scheduledStart);
        return taskDate >= today && taskDate < tomorrow;
      });

      if (todayTasks.length === 0) {
        setShowResult({
          type: 'error',
          message: '今日没有任务可导出',
        });
        setTimeout(() => setShowResult(null), 3000);
        return;
      }

      // 准备导出数据
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        date: today.toISOString().split('T')[0],
        tasks: todayTasks,
      };

      // 创建下载链接
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `时间轴_${exportData.date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowResult({
        type: 'success',
        message: `成功导出 ${todayTasks.length} 个任务`,
      });
      setTimeout(() => {
        setShowResult(null);
        setShowMenu(false);
      }, 2000);

      console.log('✅ 导出成功:', todayTasks.length, '个任务');
    } catch (error) {
      console.error('❌ 导出失败:', error);
      setShowResult({
        type: 'error',
        message: '导出失败，请重试',
      });
      setTimeout(() => setShowResult(null), 3000);
    }
  };

  // 导入时间轴数据
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // 验证数据格式
        if (!importData.version || !importData.tasks || !Array.isArray(importData.tasks)) {
          throw new Error('无效的数据格式');
        }

        // 恢复日期对象
        const importedTasks: Task[] = importData.tasks.map((task: any) => ({
          ...task,
          scheduledStart: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
          scheduledEnd: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
          actualStart: task.actualStart ? new Date(task.actualStart) : undefined,
          actualEnd: task.actualEnd ? new Date(task.actualEnd) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          startVerificationDeadline: task.startVerificationDeadline ? new Date(task.startVerificationDeadline) : undefined,
          completionDeadline: task.completionDeadline ? new Date(task.completionDeadline) : undefined,
        }));

        // 检查是否有重复任务（根据ID）
        const existingIds = new Set(tasks.map(t => t.id));
        const newTasks = importedTasks.filter(t => !existingIds.has(t.id));
        const duplicateCount = importedTasks.length - newTasks.length;

        if (newTasks.length === 0) {
          setShowResult({
            type: 'error',
            message: '所有任务已存在，无需导入',
          });
          setTimeout(() => setShowResult(null), 3000);
          return;
        }

        // 执行导入
        onImport(newTasks);

        setShowResult({
          type: 'success',
          message: `成功导入 ${newTasks.length} 个任务${duplicateCount > 0 ? `，跳过 ${duplicateCount} 个重复` : ''}`,
        });
        setTimeout(() => {
          setShowResult(null);
          setShowMenu(false);
        }, 2000);

        console.log('✅ 导入成功:', newTasks.length, '个任务');
      } catch (error) {
        console.error('❌ 导入失败:', error);
        setShowResult({
          type: 'error',
          message: '导入失败，文件格式错误',
        });
        setTimeout(() => setShowResult(null), 3000);
      }
    };

    reader.readAsText(file);
    // 重置input，允许重复选择同一文件
    event.target.value = '';
  };

  return (
    <div className="relative">
      {/* 主按钮 */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:shadow-md active:scale-95"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          color: textColor,
        }}
        title="导入/导出"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">导入/导出</span>
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* 菜单内容 */}
          <div
            className="absolute top-full right-0 mt-2 w-64 rounded-xl shadow-lg z-50 overflow-hidden"
            style={{
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
            }}
          >
            {/* 结果提示 */}
            {showResult && (
              <div
                className="p-4 flex items-center gap-3"
                style={{
                  backgroundColor: showResult.type === 'success' 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)',
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                {showResult.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#EF4444' }} />
                )}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: showResult.type === 'success' ? '#10B981' : '#EF4444',
                  }}
                >
                  {showResult.message}
                </span>
              </div>
            )}

            {/* 菜单项 */}
            {!showResult && (
              <>
                {/* 导出按钮 */}
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    color: textColor,
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Download className="w-5 h-5" style={{ color: '#3B82F6' }} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">导出今日时间轴</div>
                    <div className="text-xs" style={{ color: accentColor }}>
                      保存为 JSON 文件
                    </div>
                  </div>
                </button>

                {/* 导入按钮 */}
                <label
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer"
                  style={{ color: textColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Upload className="w-5 h-5" style={{ color: '#10B981' }} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">导入时间轴</div>
                    <div className="text-xs" style={{ color: accentColor }}>
                      从 JSON 文件导入
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>

                {/* 说明 */}
                <div
                  className="px-4 py-3 text-xs"
                  style={{
                    color: accentColor,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      导出包含今日所有任务、心情、事件、日记等数据。导入时会自动跳过重复任务。
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

