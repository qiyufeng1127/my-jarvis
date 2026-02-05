import { useState, useRef } from 'react';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { exportAllData, importAllData, clearAllData } from '@/utils/dataBackup';

export default function DataBackupPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出数据
  const handleExport = () => {
    try {
      const success = exportAllData();
      if (success) {
        setMessage({ type: 'success', text: '✅ 数据导出成功！文件已下载到您的设备' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: '❌ 数据导出失败，请重试' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ 导出过程中出现错误' });
    }
  };

  // 导入数据
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: '❌ 请选择 JSON 格式的备份文件' });
      return;
    }

    setIsImporting(true);
    setMessage({ type: 'info', text: '📥 正在导入数据，请稍候...' });

    try {
      await importAllData(file);
      setMessage({ type: 'success', text: '✅ 数据导入成功！页面将在3秒后刷新' });
      
      // 3秒后刷新页面以应用新数据
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ 数据导入失败: ${error.message}` });
      setIsImporting(false);
    }

    // 清空文件选择
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 清空数据
  const handleClear = () => {
    clearAllData();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">数据备份与恢复</h2>
      </div>

      {/* 说明文字 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 leading-relaxed">
          💡 <strong>重要提示：</strong>
          <br />
          • 所有数据存储在浏览器本地，建议定期导出备份
          <br />
          • 导出的文件可以保存到电脑、云盘等安全位置
          <br />
          • 更换设备或清理浏览器前，请先导出数据
          <br />
          • 导入数据会覆盖当前所有数据，请谨慎操作
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {message.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {message.type === 'info' && <Database className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-4">
        {/* 导出数据 */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              导出所有数据
            </h3>
            <p className="text-sm text-gray-600">
              将所有数据导出为 JSON 文件，保存到您的设备
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            导出备份
          </button>
        </div>

        {/* 导入数据 */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              导入数据
            </h3>
            <p className="text-sm text-gray-600">
              从备份文件恢复数据（会覆盖当前数据）
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isImporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-4 h-4" />
              {isImporting ? '导入中...' : '选择文件'}
            </label>
          </div>
        </div>

        {/* 清空数据 */}
        <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              清空所有数据
            </h3>
            <p className="text-sm text-red-600">
              ⚠️ 危险操作！将删除所有本地数据，不可恢复
            </p>
          </div>
          <button
            onClick={handleClear}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            清空数据
          </button>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">📖 使用说明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>导出备份：</strong>点击"导出备份"按钮，系统会自动下载一个 JSON 文件到您的设备</li>
          <li>• <strong>保存备份：</strong>建议将备份文件保存到电脑、U盘、云盘等安全位置</li>
          <li>• <strong>导入恢复：</strong>点击"选择文件"，选择之前导出的 JSON 备份文件即可恢复</li>
          <li>• <strong>定期备份：</strong>建议每周或每月导出一次备份，以防数据丢失</li>
          <li>• <strong>跨设备使用：</strong>可以在电脑上导出，然后在手机上导入，实现数据迁移</li>
        </ul>
      </div>
    </div>
  );
}

