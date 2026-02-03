/**
 * 百度AI图像识别服务
 * 
 * 使用百度AI开放平台的图像识别API
 * 免费额度：每天500次调用
 * 
 * 申请步骤：
 * 1. 访问 https://ai.baidu.com/
 * 2. 注册/登录百度账号
 * 3. 进入控制台 -> 创建应用
 * 4. 获取 API Key 和 Secret Key
 * 5. 在 .env 文件中配置：
 *    VITE_BAIDU_API_KEY=你的API_KEY
 *    VITE_BAIDU_SECRET_KEY=你的SECRET_KEY
 */

interface BaiduAccessToken {
  access_token: string;
  expires_in: number;
  timestamp: number;
}

interface BaiduImageResult {
  log_id: number;
  result: Array<{
    keyword: string;
    score: number;
    root: string;
  }>;
}

class BaiduImageRecognitionService {
  private apiKey: string;
  private secretKey: string;
  private accessToken: BaiduAccessToken | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_BAIDU_API_KEY || '';
    this.secretKey = import.meta.env.VITE_BAIDU_SECRET_KEY || '';
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.secretKey);
  }

  /**
   * 获取Access Token
   */
  private async getAccessToken(): Promise<string> {
    // 检查缓存的token是否还有效
    if (this.accessToken) {
      const now = Date.now();
      const tokenAge = now - this.accessToken.timestamp;
      // token有效期30天，提前1天刷新
      if (tokenAge < 29 * 24 * 60 * 60 * 1000) {
        return this.accessToken.access_token;
      }
    }

    // 获取新token
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取Access Token失败: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`百度API错误: ${data.error_description}`);
      }

      this.accessToken = {
        access_token: data.access_token,
        expires_in: data.expires_in,
        timestamp: Date.now(),
      };

      // 缓存到localStorage
      localStorage.setItem('baidu_access_token', JSON.stringify(this.accessToken));

      return data.access_token;
    } catch (error) {
      console.error('❌ 获取百度Access Token失败:', error);
      throw error;
    }
  }

  /**
   * 将图片文件转换为Base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 通用物体识别
   * 识别图片中的物体、场景等
   */
  async recognizeGeneral(file: File): Promise<string[]> {
    if (!this.isConfigured()) {
      console.warn('⚠️ 百度AI未配置，跳过图像识别');
      return [];
    }

    try {
      const accessToken = await this.getAccessToken();
      const base64Image = await this.fileToBase64(file);

      const url = `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(base64Image)}`,
      });

      if (!response.ok) {
        throw new Error(`图像识别失败: ${response.statusText}`);
      }

      const data: BaiduImageResult = await response.json();

      if (data.result && data.result.length > 0) {
        // 返回识别到的关键词（置信度>0.5）
        const keywords = data.result
          .filter(item => item.score > 0.5)
          .map(item => item.keyword);
        
        console.log('🔍 百度AI识别结果:', keywords);
        return keywords;
      }

      return [];
    } catch (error) {
      console.error('❌ 百度图像识别失败:', error);
      throw error;
    }
  }

  /**
   * 验证图片是否包含指定关键词
   * @param file 图片文件
   * @param requiredKeywords 必须包含的关键词列表
   * @param threshold 匹配阈值（0-1），默认0.3表示至少匹配30%的关键词
   */
  async verifyImage(
    file: File, 
    requiredKeywords: string[], 
    threshold: number = 0.3
  ): Promise<{ success: boolean; matchedKeywords: string[]; recognizedKeywords: string[] }> {
    if (!this.isConfigured()) {
      console.warn('⚠️ 百度AI未配置，验证自动通过');
      return {
        success: true,
        matchedKeywords: requiredKeywords,
        recognizedKeywords: [],
      };
    }

    try {
      // 识别图片中的物体
      const recognizedKeywords = await this.recognizeGeneral(file);

      // 检查匹配的关键词
      const matchedKeywords: string[] = [];
      
      for (const required of requiredKeywords) {
        const requiredLower = required.toLowerCase();
        
        // 检查是否有识别到的关键词包含必需关键词
        const matched = recognizedKeywords.some(recognized => {
          const recognizedLower = recognized.toLowerCase();
          return recognizedLower.includes(requiredLower) || requiredLower.includes(recognizedLower);
        });
        
        if (matched) {
          matchedKeywords.push(required);
        }
      }

      // 计算匹配率
      const matchRate = matchedKeywords.length / requiredKeywords.length;
      const success = matchRate >= threshold;

      console.log('✅ 图像验证结果:', {
        success,
        matchRate: `${(matchRate * 100).toFixed(0)}%`,
        matchedKeywords,
        recognizedKeywords,
        requiredKeywords,
      });

      return {
        success,
        matchedKeywords,
        recognizedKeywords,
      };
    } catch (error) {
      console.error('❌ 图像验证失败:', error);
      // 验证失败时返回失败
      return {
        success: false,
        matchedKeywords: [],
        recognizedKeywords: [],
      };
    }
  }
}

// 导出单例
export const baiduImageRecognition = new BaiduImageRecognitionService();

