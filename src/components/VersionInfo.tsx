import { useState } from 'react';
import { X, GitCommit, Bug, Sparkles, Zap } from 'lucide-react';

// 版本号配置
export const VERSION = '1.0.0';

// 更新日志
const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2025-02-04',
    changes: [
      { type: 'fix', text: '修复编辑任务白屏问题' },
      { type: 'feature', text: '添加版本号显示和更新日志功能' },
      { type: 'improve', text: '优化AI任务颜色分配规则，避免颜色重复' },
      { type: 'improve', text: '优化应用加载速度，移除阻塞式数据加载' },
      { type: 'feature', text: '添加游客模式，无需登录即可使用' },
    ],
  },
];

interface VersionInfoProps {
  isDark?: boolean;
}

export default function VersionInfo({ isDark = false }: VersionInfoProps) {
  const [showChangelog, setShowChangelog] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-4 h-4 text-green-500" />;
      case 'fix':
        return <Bug className="w-4 h-4 text-red-500" />;
      case 'improve':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <GitCommit className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature':
        return '新功能';
      case 'fix':
        return '修复';
      case 'improve':
        return '优化';
      default:
        return '更新';
    }
  };

  return (
    <>
      {/* 版本号按钮 */}
      <button
        onClick={() => setShowChangelog(true)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          color: isDark ? '#ffffff' : '#000000',
        }}
        title="查看更新日志"
      >
        版本: {VERSION}
      </button>

      {/* 更新日志弹窗 */}
      {showChangelog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
          >
            {/* 头部 */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
              }}
            >
              <div>
                <h3 className="text-xl font-bold" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                  📋 更新日志
                </h3>
                <p className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  当前版本: {VERSION}
                </p>
              </div>
              <button
                onClick={() => setShowChangelog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                style={{ color: isDark ? '#ffffff' : '#000000' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 更新日志列表 */}
            <div className="p-6 space-y-6">
              {CHANGELOG.map((log) => (
                <div key={log.version} className="space-y-3">
                  {/* 版本头 */}
                  <div className="flex items-center gap-3">
                    <div
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                        color: isDark ? '#ffffff' : '#000000',
                      }}
                    >
                      v{log.version}
                    </div>
                    <span className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                      {log.date}
                    </span>
                  </div>

                  {/* 更新内容 */}
                  <div className="space-y-2">
                    {log.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                      >
                        <div className="flex-shrink-0 mt-0.5">{getTypeIcon(change.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded"
                              style={{
                                backgroundColor:
                                  change.type === 'feature'
                                    ? 'rgba(34,197,94,0.2)'
                                    : change.type === 'fix'
                                    ? 'rgba(239,68,68,0.2)'
                                    : 'rgba(59,130,246,0.2)',
                                color:
                                  change.type === 'feature'
                                    ? '#22c55e'
                                    : change.type === 'fix'
                                    ? '#ef4444'
                                    : '#3b82f6',
                              }}
                            >
                              {getTypeLabel(change.type)}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                            {change.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部提示 */}
            <div
              className="px-6 py-4 border-t text-center text-sm"
              style={{
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#9ca3af' : '#6b7280',
              }}
            >
              💡 每次更新都会自动递增版本号
            </div>
          </div>
        </div>
      )}
    </>
  );
}

