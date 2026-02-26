/**
 * 超级简单的验证组件 - 从零开始重写
 * 只做最核心的功能，不搞复杂的
 */

import React, { useState, useEffect } from 'react';
import { useGoldStore } from '@/stores/goldStore';
import { fixImageOrientation } from '@/utils/imageOrientation';

interface SimpleVerificationProps {
  taskId: string;
  taskTitle: string;
  keywords: string[];
  goldReward: number;
  onSuccess: () => void;
  onFail: () => void;
}

export default function SimpleVerification({
  taskId,
  taskTitle,
  keywords,
  goldReward,
  onSuccess,
  onFail,
}: SimpleVerificationProps) {
  const { addGold, penaltyGold } = useGoldStore();
  const [log, setLog] = useState('等待上传图片...');
  const [logs, setLogs] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // 添加日志
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const logMsg = `[${time}] ${msg}`;
    console.log(logMsg);
    setLog(msg);
    setLogs(prev => [...prev, logMsg]);
  };

  // 选择图片
  const handleSelectImage = (useCamera: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) {
      input.capture = 'environment' as any;
    }

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        addLog('❌ 未选择文件');
        return;
      }

      await verifyImage(file);
    };

    input.click();
  };

  // 验证图片
  const verifyImage = async (file: File) => {
    setIsVerifying(true);
    setLogs([]);

    try {
      addLog('📷 开始验证');
      addLog('🎯 目标: ' + keywords.join('、'));

      // 1. 检查API配置
      const apiKey = localStorage.getItem('baidu_api_key');
      const secretKey = localStorage.getItem('baidu_secret_key');

      if (!apiKey || !secretKey) {
        addLog('❌ 百度API未配置');
        addLog('💡 请前往【设置→AI】配置');
        setTimeout(() => {
          penaltyGold(Math.floor(goldReward * 0.2), '验证失败', taskId, taskTitle);
          onFail();
        }, 3000);
        return;
      }

      addLog('✅ API配置正常');

      // 2. 修正图片旋转
      addLog('🔄 修正图片角度...');
      const fixedBlob = await fixImageOrientation(file);
      addLog('✅ 图片已修正');

      // 3. 转换为base64
      addLog('📤 转换图片格式...');
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fixedBlob);
      });
      addLog('✅ 格式转换完成');

      // 4. 调用API
      addLog('🌐 连接百度服务器...');
      const startTime = Date.now();

      const response = await fetch('/api/baidu-image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          keywords: keywords,
          apiKey: apiKey,
          secretKey: secretKey,
        }),
      });

      const endTime = Date.now();
      addLog(`⏱️ 耗时: ${endTime - startTime}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ 请求失败: ${response.status}`);
        addLog(`📋 错误: ${errorText}`);
        setTimeout(() => {
          penaltyGold(Math.floor(goldReward * 0.2), '验证失败', taskId, taskTitle);
          onFail();
        }, 3000);
        return;
      }

      const result = await response.json();
      addLog('✅ 收到响应');

      // 5. 显示识别结果
      if (result.recognizedObjects && result.recognizedObjects.length > 0) {
        addLog('🔍 识别到: ' + result.recognizedObjects.join('、'));
      } else {
        addLog('⚠️ 未识别到内容');
      }

      // 6. 判断成功/失败
      if (result.success && result.matchedKeywords && result.matchedKeywords.length > 0) {
        addLog('✅ 匹配成功: ' + result.matchedKeywords.join('、'));
        addLog('🎉 验证通过！');
        
        const bonus = Math.floor(goldReward * 0.5);
        addGold(bonus, '验证成功', taskId, taskTitle);
        addLog(`💰 获得 ${bonus} 金币`);

        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        addLog('❌ 未匹配到关键词');
        addLog('📋 需要: ' + keywords.join('、'));
        
        setTimeout(() => {
          penaltyGold(Math.floor(goldReward * 0.2), '验证失败', taskId, taskTitle);
          onFail();
        }, 3000);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      addLog('❌ 异常: ' + errorMsg);
      
      setTimeout(() => {
        penaltyGold(Math.floor(goldReward * 0.2), '验证异常', taskId, taskTitle);
        onFail();
      }, 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-lg">
      {/* 标题 */}
      <h3 className="text-lg font-bold mb-4 text-center">{taskTitle}</h3>

      {/* 关键词提示 */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-sm font-semibold text-yellow-800 text-center">
          📷 请拍摄包含：<span className="font-bold">{keywords.join(' / ')}</span>
        </p>
      </div>

      {/* 日志显示框 */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-lg" style={{ minHeight: '150px', maxHeight: '300px', overflowY: 'auto' }}>
        <div className="flex items-start gap-2">
          {isVerifying && <span className="animate-spin text-xl">⏳</span>}
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900 mb-2">{log}</p>
            {logs.length > 0 && (
              <div className="space-y-1">
                {logs.map((logItem, index) => (
                  <p key={index} className="text-xs text-blue-700" style={{ opacity: 0.8 }}>
                    {logItem}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 按钮 */}
      {!isVerifying && (
        <div className="flex gap-3">
          <button
            onClick={() => handleSelectImage(true)}
            className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
          >
            📷 拍照
          </button>
          <button
            onClick={() => handleSelectImage(false)}
            className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 transition-colors"
          >
            🖼️ 相册
          </button>
        </div>
      )}

      {isVerifying && (
        <div className="text-center text-sm text-gray-500">
          验证中，请稍候...
        </div>
      )}
    </div>
  );
}

