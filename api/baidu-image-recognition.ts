/**
 * Vercel Serverless Function - 百度图像识别API代理
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
    tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;

    console.log('✅ [Serverless] Access Token获取成功');
    return cachedToken;
  } catch (error) {
    console.error('❌ [Serverless] 获取Access Token失败:', error);
    throw error;
  }
}

/**
 * 调用百度图像识别API
 */
async function recognizeImage(imageBase64: string, accessToken: string): Promise<any> {
  try {
    console.log('📸 [Serverless] 正在调用百度图像识别API...');
    console.log('📦 [Serverless] 图片数据长度:', imageBase64.length);
    
    // 移除 data:image/xxx;base64, 前缀（如果有）
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    console.log('📦 [Serverless] 处理后的base64长度:', base64Data.length);

    const response = await fetch(
      `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(base64Data)}&baike_num=5`,
      }
    );

    console.log('📥 [Serverless] 百度API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Serverless] 百度API返回错误:', response.status, errorText);
      throw new Error(`图像识别失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 检查百度API返回的错误
    if (data.error_code) {
      console.error('❌ [Serverless] 百度API错误:', data.error_code, data.error_msg);
      throw new Error(`百度API错误: ${data.error_msg} (${data.error_code})`);
    }
    
    console.log('✅ [Serverless] 图像识别成功，识别到', data.result_num || data.result?.length || 0, '个物体');
    
    return data;
  } catch (error) {
    console.error('❌ [Serverless] 图像识别失败:', error);
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
      error: '只允许POST请求' 
    });
  }

  try {
    const { imageBase64, apiKey, secretKey } = req.body;

    console.log('🚀 [Serverless] 收到图像识别请求');
    console.log('📦 [Serverless] 请求参数:', {
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64?.length || 0,
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : '未提供',
    });

    // 验证必需参数
    if (!imageBase64) {
      console.error('❌ [Serverless] 缺少图片数据');
      return res.status(400).json({ 
        success: false, 
        error: '缺少图片数据' 
      });
    }

    if (!apiKey || !secretKey) {
      console.error('❌ [Serverless] 缺少API密钥配置');
      return res.status(400).json({ 
        success: false, 
        error: '缺少API密钥配置' 
      });
    }

    console.log('✅ [Serverless] 参数验证通过');

    // 1. 获取Access Token
    console.log('🔑 [Serverless] 步骤1: 获取Access Token');
    const accessToken = await getAccessToken(apiKey, secretKey);
    console.log('✅ [Serverless] Access Token获取成功');

    // 2. 调用图像识别API
    console.log('📸 [Serverless] 步骤2: 调用图像识别API');
    const recognitionResult = await recognizeImage(imageBase64, accessToken);
    console.log('✅ [Serverless] 图像识别完成');

    // 3. 返回结果
    console.log('📤 [Serverless] 返回识别结果');
    return res.status(200).json({
      success: true,
      data: recognitionResult,
    });

  } catch (error) {
    console.error('❌ [Serverless] 处理请求失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('❌ [Serverless] 错误详情:', errorMessage);
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

