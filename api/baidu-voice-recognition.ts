/**
 * Vercel Serverless Function - 百度语音识别API代理
 * 解决浏览器跨域问题
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Access Token缓存
let cachedToken: string | null = null;
let tokenExpireTime: number = 0;

/**
 * 获取百度API Access Token
 */
async function getAccessToken(apiKey: string, secretKey: string): Promise<string> {
  // 检查缓存
  if (cachedToken && Date.now() < tokenExpireTime) {
    console.log('✅ [Serverless] 使用缓存的Access Token');
    return cachedToken;
  }

  try {
    console.log('🔑 [Serverless] 正在获取新的Access Token...');
    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`获取Access Token失败: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // 提前1天过期
    tokenExpireTime = Date.now() + (data.expires_in - 86400) * 1000;

    console.log('✅ [Serverless] Access Token获取成功');
    return cachedToken;
  } catch (error) {
    console.error('❌ [Serverless] 获取Access Token失败:', error);
    throw error;
  }
}

/**
 * 调用百度语音识别API
 */
async function recognizeVoice(
  audioBase64: string,
  format: string,
  rate: number,
  token: string
): Promise<any> {
  try {
    console.log('🎤 [Serverless] 正在调用百度语音识别API...');

    const response = await fetch('https://vop.baidu.com/server_api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format,
        rate,
        channel: 1,
        cuid: 'manifestos_user',
        token,
        speech: audioBase64,
        len: Buffer.from(audioBase64, 'base64').length,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Serverless] 百度API返回错误:', response.status, errorText);
      throw new Error(`语音识别失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Serverless] 语音识别成功');

    return data;
  } catch (error) {
    console.error('❌ [Serverless] 语音识别失败:', error);
    throw error;
  }
}

/**
 * Serverless Function入口
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '只允许POST请求',
    });
  }

  try {
    const { audioBase64, format, rate, apiKey, secretKey } = req.body;

    // 验证必需参数
    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: '缺少音频数据',
      });
    }

    if (!apiKey || !secretKey) {
      return res.status(400).json({
        success: false,
        error: '缺少API密钥配置',
      });
    }

    console.log('🚀 [Serverless] 开始处理语音识别请求');

    // 1. 获取Access Token
    const accessToken = await getAccessToken(apiKey, secretKey);

    // 2. 调用语音识别API
    const recognitionResult = await recognizeVoice(
      audioBase64,
      format || 'wav',
      rate || 16000,
      accessToken
    );

    // 3. 返回结果
    return res.status(200).json({
      success: true,
      data: recognitionResult,
    });
  } catch (error) {
    console.error('❌ [Serverless] 处理请求失败:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
}

