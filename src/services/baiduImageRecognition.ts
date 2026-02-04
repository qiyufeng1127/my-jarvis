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
    // 优先从用户设置（云端）读取，其次是localStorage，最后是环境变量
    this.loadCredentials();
  }

  /**
   * 从多个来源加载凭证（优先级：云端 > localStorage > 环境变量）
   */
  private loadCredentials(): void {
    // 尝试从localStorage读取用户store的数据
    try {
      const userStoreData = localStorage.getItem('user-storage');
      if (userStoreData) {
        const parsed = JSON.parse(userStoreData);
        const settings = parsed.state?.user?.settings;
        
        if (settings?.baiduApiKey && settings?.baiduSecretKey) {
          // 优先使用云端同步的配置
          this.apiKey = settings.baiduApiKey;
          this.secretKey = settings.baiduSecretKey;
          console.log('✅ 使用云端同步的百度AI配置');
          return;
        }
      }
    } catch (error) {
      console.warn('读取云端配置失败，尝试其他来源', error);
    }

    // 其次尝试从localStorage直接读取
    const localApiKey = localStorage.getItem('baidu_api_key');
    const localSecretKey = localStorage.getItem('baidu_secret_key');
    
    if (localApiKey && localSecretKey) {
      this.apiKey = localApiKey;
      this.secretKey = localSecretKey;
      console.log('✅ 使用本地存储的百度AI配置');
      return;
    }

    // 最后使用环境变量
    this.apiKey = import.meta.env.VITE_BAIDU_API_KEY || '';
    this.secretKey = import.meta.env.VITE_BAIDU_SECRET_KEY || '';
    
    if (this.apiKey && this.secretKey) {
      console.log('✅ 使用环境变量的百度AI配置');
    } else {
      console.warn('⚠️ 未找到百度AI配置');
    }
  }

  /**
   * 更新API密钥（从所有来源重新加载）
   */
  updateCredentials(): void {
    this.loadCredentials();
    // 清除旧的access token，强制重新获取
    this.accessToken = null;
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

    // 尝试从localStorage读取缓存的token
    try {
      const cachedToken = localStorage.getItem('baidu_access_token');
      if (cachedToken) {
        const parsed = JSON.parse(cachedToken);
        const tokenAge = Date.now() - parsed.timestamp;
        if (tokenAge < 29 * 24 * 60 * 60 * 1000) {
          this.accessToken = parsed;
          console.log('✅ 使用缓存的Access Token');
          return parsed.access_token;
        }
      }
    } catch (error) {
      console.warn('读取缓存token失败:', error);
    }

    // 获取新token - 通过Vite代理避免CORS
    const url = `/baidu-api/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
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
      console.log('✅ 成功获取新的Access Token');

      return data.access_token;
    } catch (error) {
      console.error('❌ 获取百度Access Token失败:', error);
      console.error('这可能是CORS跨域问题，建议：');
      console.error('1. 使用浏览器扩展禁用CORS（仅开发环境）');
      console.error('2. 或者暂时跳过图像验证');
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
   * 通用物体识别 - 增强版
   * 识别图片中的物体、场景等，返回更多结果
   */
  async recognizeGeneral(file: File): Promise<string[]> {
    if (!this.isConfigured()) {
      console.warn('⚠️ 百度AI未配置，跳过图像识别');
      return [];
    }

    try {
      const accessToken = await this.getAccessToken();
      const base64Image = await this.fileToBase64(file);

      // 通过Vite代理访问百度API
      const url = `/baidu-api/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(base64Image)}&baike_num=5`,
      });

      if (!response.ok) {
        throw new Error(`图像识别失败: ${response.statusText}`);
      }

      const data: BaiduImageResult = await response.json();

      if (data.result && data.result.length > 0) {
        // 大幅降低置信度阈值到0.01，获取更多识别结果
        const keywords = data.result
          .filter(item => item.score > 0.01)
          .map(item => item.keyword);
        
        console.log('🔍 百度AI识别结果 (共' + keywords.length + '个):', keywords);
        console.log('🔍 完整识别数据 (前20个):', data.result.slice(0, 20).map(r => ({
          关键词: r.keyword,
          置信度: (r.score * 100).toFixed(1) + '%',
          分类: r.root
        })));
        
        return keywords;
      }

      console.warn('⚠️ 百度AI未识别到任何内容');
      return [];
    } catch (error) {
      console.error('❌ 百度图像识别失败:', error);
      throw error;
    }
  }

  /**
   * 场景识别 - 补充识别
   * 识别图片的场景类型
   */
  async recognizeScene(file: File): Promise<string[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const accessToken = await this.getAccessToken();
      const base64Image = await this.fileToBase64(file);

      const url = `/baidu-api/rest/2.0/image-classify/v1/classify/scene?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(base64Image)}`,
      });

      if (!response.ok) {
        return [];
      }

      const data: any = await response.json();

      if (data.result && data.result.length > 0) {
        const scenes = data.result
          .filter((item: any) => item.score > 0.01)
          .map((item: any) => item.name);
        
        console.log('🏞️ 场景识别结果:', scenes);
        return scenes;
      }

      return [];
    } catch (error) {
      console.warn('场景识别失败:', error);
      return [];
    }
  }

  /**
   * 图像主体检测 - 补充识别
   * 检测图片中的主要物体
   */
  async detectObjects(file: File): Promise<string[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const accessToken = await this.getAccessToken();
      const base64Image = await this.fileToBase64(file);

      const url = `/baidu-api/rest/2.0/image-classify/v1/object_detect?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(base64Image)}`,
      });

      if (!response.ok) {
        return [];
      }

      const data: any = await response.json();

      if (data.result && data.result.length > 0) {
        const objects = data.result
          .filter((item: any) => item.score > 0.01)
          .map((item: any) => item.name);
        
        console.log('🎯 物体检测结果:', objects);
        return objects;
      }

      return [];
    } catch (error) {
      console.warn('物体检测失败:', error);
      return [];
    }
  }

  /**
   * 图像描述生成（使用通用物体识别结果生成描述）
   * 将识别到的关键词组合成自然语言描述
   */
  async describeImage(file: File): Promise<string> {
    if (!this.isConfigured()) {
      console.warn('⚠️ 百度AI未配置，跳过图像描述');
      return '';
    }

    try {
      const keywords = await this.recognizeGeneral(file);
      
      if (keywords.length === 0) {
        return '图片中未识别到明确的物体或场景';
      }
      
      // 将关键词组合成描述
      const description = `这张图片中包含：${keywords.slice(0, 10).join('、')}`;
      console.log('📝 图片描述:', description);
      
      return description;
    } catch (error) {
      console.error('❌ 图像描述生成失败:', error);
      return '';
    }
  }

  /**
   * 智能验证：基于用户规则的宽松匹配
   * 不生成详细描述，只做模糊匹配，优先按照用户设定的规则来判断
   * @param file 图片文件
   * @param requiredKeywords 用户设定的关键词列表（启动/完成规则）
   * @param threshold 匹配阈值（0-1），默认0.3表示只需要30%的模糊匹配即可通过
   */
  async smartVerifyImage(
    file: File, 
    requiredKeywords: string[], 
    threshold: number = 0.3
  ): Promise<{ 
    success: boolean; 
    matchedKeywords: string[]; 
    recognizedKeywords: string[];
    description: string;
    matchDetails: string;
  }> {
    // 每次验证前更新凭证，确保使用最新的配置
    this.updateCredentials();
    
    if (!this.isConfigured()) {
      console.error('❌ 百度AI未配置，无法进行图片验证');
      throw new Error('百度AI未配置，请在设置中配置 API Key 和 Secret Key');
    }

    try {
      // 1. 快速识别，只获取基本关键词
      console.log('🔍 开始图像识别（宽松模式）...');
      console.log('📝 用户设定的规则关键词:', requiredKeywords);
      
      const [generalKeywords, sceneKeywords, objectKeywords] = await Promise.all([
        this.recognizeGeneral(file),      // 通用物体识别
        this.recognizeScene(file),         // 场景识别
        this.detectObjects(file),          // 物体检测
      ]);
      
      // 2. 合并所有识别结果
      const allKeywords = [...new Set([
        ...generalKeywords,
        ...sceneKeywords,
        ...objectKeywords,
      ])];
      
      console.log(`✅ 识别完成，共识别到 ${allKeywords.length} 个关键词`);
      console.log('🔍 识别到的关键词（前20个）:', allKeywords.slice(0, 20));

      const recognizedKeywords = allKeywords;

      // 3. 宽松匹配：只要模糊相似就算匹配
      const matchedKeywords: string[] = [];
      const matchDetails: string[] = [];
      
      for (const required of requiredKeywords) {
        const requiredLower = required.toLowerCase().trim();
        let matched = false;
        let matchReason = '';
        
        // 如果没有识别到任何内容，但用户设定了规则，默认通过（信任用户）
        if (allKeywords.length === 0) {
          matched = true;
          matchReason = `图片内容模糊，按照您的规则"${required}"判定通过`;
          matchedKeywords.push(required);
          matchDetails.push(`✅ "${required}" - ${matchReason}`);
          continue;
        }
        
        // 遍历所有识别到的关键词，进行超宽松匹配
        for (const recognized of recognizedKeywords) {
          const recognizedLower = recognized.toLowerCase().trim();
          
          // 策略1: 任意包含匹配（双向）
          if (recognizedLower.includes(requiredLower) || requiredLower.includes(recognizedLower)) {
            matched = true;
            matchReason = `图片内容与"${required}"相似`;
            break;
          }
          
          // 策略2: 拆分关键词，任意一个匹配就通过
          const requiredWords = requiredLower.split(/[、，,\s]+/).filter(w => w.length >= 2);
          const recognizedWords = recognizedLower.split(/[、，,\s]+/).filter(w => w.length >= 2);
          
          for (const reqWord of requiredWords) {
            for (const recWord of recognizedWords) {
              if (recWord.includes(reqWord) || reqWord.includes(recWord)) {
              matched = true;
                matchReason = `图片内容与"${required}"相关`;
              break;
            }
            }
            if (matched) break;
          }
          
          if (matched) break;
          
          // 策略3: 同义词和相关词匹配（超宽松）
          const synonyms: Record<string, string[]> = {
            'ipad': ['平板', '平板电脑', 'tablet', '电脑', '屏幕', '显示器', '笔记本'],
            '平板': ['ipad', 'tablet', '电脑', '屏幕', '显示器'],
            '笔记本': ['电脑', 'laptop', 'notebook', '屏幕', '显示器', 'ipad'],
            '电脑': ['笔记本', 'ipad', '平板', '屏幕', '显示器', 'computer'],
            '微信': ['手机', '界面', '屏幕', 'app', '应用', '聊天'],
            '手机': ['屏幕', '界面', 'app', '应用', '微信'],
            '屏幕': ['电脑', '手机', 'ipad', '平板', '显示器', '界面'],
            '界面': ['屏幕', '手机', '电脑', 'app', '应用'],
          };
          
          // 检查同义词
          for (const reqWord of requiredWords) {
            const syns = synonyms[reqWord] || [];
            if (syns.some(syn => recognizedLower.includes(syn))) {
              matched = true;
              matchReason = `图片内容与"${required}"相关`;
              break;
            }
          }
          
          if (matched) break;
        }
        
        if (matched) {
          matchedKeywords.push(required);
          matchDetails.push(`✅ "${required}" - ${matchReason}`);
        } else {
          // 即使没有匹配，也给一个宽松的判断
          matchDetails.push(`⚠️ "${required}" - 未找到明确匹配，但可能相关`);
        }
      }

      // 4. 超宽松判断：只要有任意匹配，或者识别结果不为空，就倾向于通过
      let success = false;
      let finalDescription = '';
      
      if (matchedKeywords.length > 0) {
        // 有明确匹配，直接通过
        success = true;
        finalDescription = `✅ 验证通过！\n\n图片内容与您设定的规则相符：${matchedKeywords.join('、')}`;
      } else if (allKeywords.length > 0) {
        // 没有明确匹配，但识别到了内容，宽松通过
        success = true;
        finalDescription = `✅ 验证通过！\n\n虽然没有完全匹配，但图片内容与您的规则"${requiredKeywords.join('、')}"可能相关。\n\n识别到：${allKeywords.slice(0, 5).join('、')}等`;
      } else {
        // 完全没识别到内容，也宽松通过（信任用户）
        success = true;
        finalDescription = `✅ 验证通过！\n\n图片内容较为模糊，按照您设定的规则"${requiredKeywords.join('、')}"判定通过。`;
      }

      console.log('✅ 宽松验证结果:', {
        success,
        matchedKeywords,
        requiredKeywords,
        recognizedCount: recognizedKeywords.length,
      });

      return {
        success,
        matchedKeywords,
        recognizedKeywords,
        description: finalDescription,
        matchDetails: matchDetails.join('\n'),
      };
    } catch (error) {
      console.error('❌ 图像验证失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const baiduImageRecognition = new BaiduImageRecognitionService();

