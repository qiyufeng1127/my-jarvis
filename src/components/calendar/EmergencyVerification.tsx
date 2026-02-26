/**
 * 🔥 紧急修复版本 - 最简单的验证流程
 * 去掉所有可能卡住的地方
 */

import React, { useState } from 'react';
import { useGoldStore } from '@/stores/goldStore';

interface EmergencyVerificationProps {
  taskId: string;
  taskTitle: string;
  keywords: string[];
  goldReward: number;
  onSuccess: () => void;
  onFail: () => void;
}

export default function EmergencyVerification({
  taskId,
  taskTitle,
  keywords,
  goldReward,
  onSuccess,
  onFail,
}: EmergencyVerificationProps) {
  const { addGold, penaltyGold } = useGoldStore();
  const [logs, setLogs] = useState<string[]>(['等待选择图片...']);
  const [isVerifying, setIsVerifying] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    const log = `[${time}] ${msg}`;
    console.log('🔥 LOG:', log);
    setLogs(prev => {
      const newLogs = [...prev, log];
      console.log('🔥 当前日志数量:', newLogs.length);
      return newLogs;
    });
  };

  const handleSelectImage = (useCamera: boolean) => {
    addLog('📷 打开文件选择器');
    
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

      addLog('✅ 已选择文件: ' + file.name);
      await verifyImage(file);
    };

    input.click();
  };

  const verifyImage = async (file: File) => {
    setIsVerifying(true);
    addLog('🚀 开始验证');

    try {
      // 1. 检查API配置
      addLog('1️⃣ 检查API配置');
      const apiKey = localStorage.getItem('baidu_api_key');
      const secretKey = localStorage.getItem('baidu_secret_key');

      if (!apiKey || !secretKey) {
        addLog('❌ API未配置');
        setTimeout(() => {
          penaltyGold(Math.floor(goldReward * 0.2), '验证失败', taskId, taskTitle);
          onFail();
        }, 2000);
        return;
      }
      addLog('✅ API配置正常');

      // 2. 读取文件（不做任何处理）
      addLog('2️⃣ 读取图片文件');
      const reader = new FileReader();
      
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          addLog('✅ 图片读取完成');
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          addLog('❌ 图片读取失败');
          reject(new Error('读取失败'));
        };
        reader.readAsDataURL(file);
      });

      // 3. 调用API（最简单的方式）
      addLog('3️⃣ 调用百度API');
      addLog('📡 发送请求...');
      
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
      addLog(`⏱️ 请求完成，耗时 ${endTime - startTime}ms`);

      if (!response.ok) {
        addLog(`❌ API返回错误: ${response.status}`);
        const errorText = await response.text();
        addLog(`📋 错误详情: ${errorText.substring(0, 100)}`);
        
        setTimeout(() => {
          penaltyGold(Math.floor(goldReward * 0.2), '验证失败', taskId, taskTitle);
          onFail();
        }, 2000);
        return;
      }

      const result = await response.json();
      addLog('✅ 收到API响应');

      // 4. 显示识别结果
      if (result.recognizedObjects && result.recognizedObjects.length > 0) {
        addLog('🔍 识别到: ' + result.recognizedObjects.slice(0, 3).join('、'));
      } else {
        addLog('⚠️ 未识别到内容');
      }

      // 5. 判断成功/失败
      if (result.success) {
        addLog('🎉 验证成功！');
        if (result.matchedKeywords) {
          addLog('✅ 匹配: ' + result.matchedKeywords.join('、'));
        }
        
        const bonus = Math.floor(goldReward * 0.5);
        addGold(bonus, '验证成功', taskId, taskTitle);
        addLog(`💰 获得 ${bonus} 金币`);

        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        addLog('❌ 验证失败');
        addLog('📋 原因: ' + (result.message || '未匹配到关键词'));
        
        setTimeout(() => {
          penaltyGold(Math.floor(goldReward * 0.2), '验证失败', taskId, taskTitle);
          onFail();
        }, 2000);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      addLog('❌ 异常: ' + errorMsg);
      
      setTimeout(() => {
        penaltyGold(Math.floor(goldReward * 0.2), '验证异常', taskId, taskTitle);
        onFail();
      }, 2000);
    } finally {
      setIsVerifying(false);
      addLog('🏁 验证流程结束');
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-3 text-center">{taskTitle}</h3>

      {/* 关键词 */}
      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
        <p className="text-xs font-bold text-yellow-800 text-center">
          📷 拍摄: {keywords.join(' / ')}
        </p>
      </div>

      {/* 日志框 */}
      <div 
        className="mb-3 p-3 bg-blue-50 border border-blue-300 rounded" 
        style={{ minHeight: '150px', maxHeight: '250px', overflowY: 'auto' }}
      >
        {logs.map((log, index) => (
          <p key={index} className="text-xs text-blue-900 mb-1">
            {log}
          </p>
        ))}
      </div>

      {/* 按钮 */}
      {!isVerifying && (
        <div className="flex gap-2">
          <button
            onClick={() => handleSelectImage(true)}
            className="flex-1 py-2 bg-blue-500 text-white rounded font-bold"
          >
            📷 拍照
          </button>
          <button
            onClick={() => handleSelectImage(false)}
            className="flex-1 py-2 bg-purple-500 text-white rounded font-bold"
          >
            🖼️ 相册
          </button>
        </div>
      )}

      {isVerifying && (
        <div className="text-center text-sm text-gray-600">
          <span className="animate-spin inline-block">⏳</span> 验证中...
        </div>
      )}
    </div>
  );
}

