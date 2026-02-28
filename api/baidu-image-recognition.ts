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

// 关键词映射表
const KEYWORD_MAPPING: Record<string, string[]> = {
  '厨房': ['厨房', '灶台', '炉灶', '油烟机', '橱柜', '厨具', '锅', '碗', '盘子', '筷子'],
  '水槽': ['水槽', '洗碗池', '水龙头', '洗涤', '厨房'],
  '厕所': ['厕所', '卫生间', '洗手间', '马桶', '洗手台', '浴室', '淋浴'],
  '马桶': ['马桶', '坐便器', '卫生间', '厕所', '便池'],
  '卧室': ['卧室', '床', '被子', '枕头', '衣柜', '床头柜'],
  '床': ['床', '床铺', '被子', '枕头', '床单', '卧室'],
  '书桌': ['书桌', '办公桌', '桌子', '电脑桌'],
  '电脑': ['电脑', '笔记本电脑', '台式机', '显示器', '键盘', '鼠标'],
};

/**
 * 匹配关键词
 */
function matchKeywords(recognizedObjects: string[], targetKeywords: string[]): {
  matched: boolean;
  matchedKeywords: string[];
  recognizedObjects: string[];
} {
  console.log('🔍 [Serverless] 开始匹配关键词');
  console.log('🎯 [Serverless] 目标关键词:', targetKeywords);
  console.log('📝 [Serverless] 识别到的物体:', recognizedObjects);

  const matchedKeywords: string[] = [];

  for (const keyword of targetKeywords) {
    // 获取扩展关键词
    const expandedKeywords = KEYWORD_MAPPING[keyword] || [keyword];
    console.log(`🔍 [Serverless] 检查关键词 "${keyword}"，扩展为:`, expandedKeywords);

    // 检查是否有任何识别到的物体匹配扩展关键词
    for (const recognized of recognizedObjects) {
      for (const expanded of expandedKeywords) {
        if (recognized.includes(expanded) || expanded.includes(recognized)) {
          console.log(`✅ [Serverless] 匹配成功: "${recognized}" 匹配 "${expanded}"`);
          matchedKeywords.push(keyword);
          break;
        }
      }
      if (matchedKeywords.includes(keyword)) break;
    }
  }

  const matched = matchedKeywords.length > 0;
  console.log(`🎯 [Serverless] 匹配结果: ${matched ? '成功' : '失败'}`);
  console.log(`📊 [Serverless] 匹配到的关键词:`, matchedKeywords);

  return {
    matched,
    matchedKeywords,
    recognizedObjects,
  };
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
      message: '只允许POST请求' 
    });
  }

  try {
    // 兼容两种参数名：image 和 imageBase64
    const { image, imageBase64, keywords, apiKey, secretKey } = req.body;
    const imageData = image || imageBase64;

    console.log('🚀 [Serverless] 收到图像识别请求');
    console.log('📦 [Serverless] 请求参数:', {
      hasImage: !!imageData,
      imageLength: imageData?.length || 0,
      keywords: keywords,
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : '未提供',
    });

    // 验证必需参数
    if (!imageData) {
      console.error('❌ [Serverless] 缺少图片数据');
      return res.status(400).json({ 
        success: false, 
        message: '缺少图片数据' 
      });
    }

    // keywords 参数可选（照片识别测试功能不需要关键词）
    const needsKeywordMatch = keywords && Array.isArray(keywords) && keywords.length > 0;

    if (!apiKey || !secretKey) {
      console.error('❌ [Serverless] 缺少API密钥配置');
      return res.status(400).json({ 
        success: false, 
        message: '缺少API密钥配置' 
      });
    }

    console.log('✅ [Serverless] 参数验证通过');

    // 1. 获取Access Token
    console.log('🔑 [Serverless] 步骤1: 获取Access Token');
    const accessToken = await getAccessToken(apiKey, secretKey);
    console.log('✅ [Serverless] Access Token获取成功');

    // 2. 调用图像识别API
    console.log('📸 [Serverless] 步骤2: 调用图像识别API');
    const recognitionResult = await recognizeImage(imageData, accessToken);
    console.log('✅ [Serverless] 图像识别完成');

    // 3. 提取识别到的物体名称
    const recognizedObjects = recognitionResult.result?.map((item: any) => item.keyword) || [];
    console.log('📝 [Serverless] 识别到的物体:', recognizedObjects);

    // 4. 如果需要关键词匹配，则进行匹配
    if (needsKeywordMatch) {
    console.log('🔍 [Serverless] 步骤3: 匹配关键词');
    const matchResult = matchKeywords(recognizedObjects, keywords);

      // 5. 返回匹配结果
      console.log('📤 [Serverless] 返回匹配结果');
    return res.status(200).json({
      success: matchResult.matched,
      message: matchResult.matched 
        ? `验证成功！识别到：${matchResult.matchedKeywords.join('、')}` 
        : `验证失败，未识别到：${keywords.join('、')}`,
      matchedKeywords: matchResult.matchedKeywords,
      recognizedObjects: matchResult.recognizedObjects,
      rawData: recognitionResult,
    });
    } else {
      // 5. 只返回识别结果（照片识别测试功能）
      console.log('📤 [Serverless] 返回识别结果（无关键词匹配）');
      return res.status(200).json({
        success: true,
        data: recognitionResult,
        message: '识别成功',
      });
    }

  } catch (error) {
    console.error('❌ [Serverless] 处理请求失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('❌ [Serverless] 错误详情:', errorMessage);
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

