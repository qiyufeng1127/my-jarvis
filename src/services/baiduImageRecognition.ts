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
   * 检测是否在生产环境（Vercel部署）
   */
  private isProduction(): boolean {
    const hostname = window.location.hostname;
    const isProd = hostname.includes('vercel.app') || 
           hostname.includes('your-domain.com') ||
           import.meta.env.PROD;
    
    console.log('🌍 环境检测:', {
      hostname,
      isProd,
      mode: import.meta.env.MODE,
    });
    
    return isProd;
  }

  /**
   * 获取Access Token（生产环境不需要，直接通过Serverless API）
   */
  private async getAccessToken(): Promise<string> {
    // 生产环境不需要单独获取token，Serverless API会处理
    if (this.isProduction()) {
      return 'not-needed-in-production';
    }

    // 开发环境：检查缓存的token是否还有效
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

    // 开发环境：获取新token - 通过Vite代理避免CORS
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
      console.log('📸 [recognizeGeneral] 开始转换图片为Base64...');
      const base64Image = await this.fileToBase64(file);
      console.log('✅ [recognizeGeneral] Base64转换完成，长度:', base64Image.length);

      // 生产环境：使用Serverless API
      if (this.isProduction()) {
        console.log('☁️ [生产环境] 使用Serverless API进行图像识别');
        console.log('📤 准备发送请求到 /api/baidu-image-recognition');
        
        const requestBody = {
          imageBase64: base64Image,
          apiKey: this.apiKey,
          secretKey: this.secretKey,
        };
        
        console.log('📦 请求体:', {
          imageBase64Length: base64Image.length,
          apiKeyPrefix: this.apiKey.substring(0, 8) + '...',
          secretKeyPrefix: this.secretKey.substring(0, 8) + '...',
        });
        
        console.log('🚀 [recognizeGeneral] 发送请求...');
        const fetchStartTime = Date.now();
        
        const response = await fetch('/api/baidu-image-recognition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const fetchTime = ((Date.now() - fetchStartTime) / 1000).toFixed(2);
        console.log(`📥 [recognizeGeneral] 收到响应，耗时 ${fetchTime} 秒:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [recognizeGeneral] API调用失败，响应内容:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            throw new Error(`API调用失败: ${response.status} ${response.statusText}\n响应: ${errorText.substring(0, 200)}`);
          }
          
          throw new Error(errorData.error || `API调用失败: ${response.status}`);
        }

        console.log('📦 [recognizeGeneral] 解析响应JSON...');
        const result = await response.json();
        
        console.log('✅ [recognizeGeneral] API返回结果:', result);
        
        if (!result.success) {
          console.error('❌ [recognizeGeneral] API返回失败:', result.error);
          throw new Error(result.error || 'API返回失败');
        }

        const data: BaiduImageResult = result.data;

        if (data.result && data.result.length > 0) {
          // 🎯 返回前15个结果，不过滤置信度（让用户在设置中调整）
          const keywords = data.result
            .slice(0, 15)  // 取前15个
            .map(item => item.keyword);
          
          console.log('🔍 [recognizeGeneral] 百度AI识别结果 (共' + keywords.length + '个):', keywords);
          console.log('📊 返回前15个识别结果（置信度过滤由用户设置控制）');
          
          return keywords;
        }

        console.warn('⚠️ [recognizeGeneral] 百度AI未识别到任何内容');
        return [];
      }

      // 开发环境：通过Vite代理访问百度API
      console.log('💻 [开发环境] 使用Vite代理');
      const accessToken = await this.getAccessToken();
      const url = `/baidu-api/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(base64Image)}&baike_num=15`,
      });

      if (!response.ok) {
        throw new Error(`图像识别失败: ${response.statusText}`);
      }

      const data: BaiduImageResult = await response.json();

      if (data.result && data.result.length > 0) {
        // 🎯 返回前15个结果，不过滤置信度（让用户在设置中调整）
        const keywords = data.result
          .slice(0, 15)  // 取前15个
          .map(item => item.keyword);
        
        console.log('🔍 百度AI识别结果 (共' + keywords.length + '个):', keywords);
        console.log('📊 返回前15个识别结果（置信度过滤由用户设置控制）');
        console.log('🔍 完整识别数据 (前15个):', data.result.slice(0, 15).map(r => ({
          关键词: r.keyword,
          置信度: (r.score * 100).toFixed(1) + '%',
          分类: r.root
        })));
        
        return keywords;
      }

      console.warn('⚠️ 百度AI未识别到任何内容');
      return [];
    } catch (error) {
      console.error('❌ [recognizeGeneral] 百度图像识别失败:', error);
      console.error('❌ [recognizeGeneral] 错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      });
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
      const base64Image = await this.fileToBase64(file);

      // 生产环境：暂时跳过场景识别（可选功能）
      if (this.isProduction()) {
        console.log('⚠️ [生产环境] 场景识别暂不支持，跳过');
        return [];
      }

      // 开发环境
      const accessToken = await this.getAccessToken();
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
      const base64Image = await this.fileToBase64(file);

      // 生产环境：暂时跳过物体检测（可选功能）
      if (this.isProduction()) {
        console.log('⚠️ [生产环境] 物体检测暂不支持，跳过');
        return [];
      }

      // 开发环境
      const accessToken = await this.getAccessToken();
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
   * 智能验证：宽松但有意义的验证
   * 确保用户真的拍了照片，但不要太严格
   * 如果不通过，给出明确的拍摄建议
   * @param file 图片文件
   * @param requiredKeywords 用户设定的关键词列表（启动/完成规则）
   * @param threshold 匹配阈值（0-1），默认0.2表示20%的模糊匹配即可通过
   */
  async smartVerifyImage(
    file: File, 
    requiredKeywords: string[], 
    threshold: number = 0.2
  ): Promise<{ 
    success: boolean; 
    matchedKeywords: string[]; 
    recognizedKeywords: string[];
    description: string;
    matchDetails: string;
    suggestions?: string[];
  }> {
    // 每次验证前更新凭证，确保使用最新的配置
    this.updateCredentials();
    
    console.log('🔍 [验证开始] API配置状态:', {
      isConfigured: this.isConfigured(),
      hasApiKey: !!this.apiKey,
      hasSecretKey: !!this.secretKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : '未配置',
    });
    
    // 如果未配置百度AI，直接通过（信任用户）
    if (!this.isConfigured()) {
      console.warn('⚠️ 百度AI未配置，自动通过验证（信任用户）');
      return {
        success: true,
        matchedKeywords: requiredKeywords,
        recognizedKeywords: [],
        description: `✅ 验证通过！\n\n由于未配置百度AI，系统信任您已按要求完成。\n\n💡 提示：如需自动验证，请在【设置 → AI】中配置百度AI密钥。`,
        matchDetails: requiredKeywords.map(k => `✅ "${k}" - 已信任通过`).join('\n'),
      };
    }

    try {
      // 1. 快速识别，获取所有关键词
      console.log('📷 [20:20:06] 📷 开始完成验证流程');
      console.log('✅ [20:20:06] ✅ API配置检查通过');
      console.log(`📋 [20:20:06] 📋 目标关键词: ${requiredKeywords.join('、')}`);
      console.log('🔍 开始图像识别（宽松模式）...');
      console.log('📝 用户设定的规则关键词:', requiredKeywords);
      
      // 添加超时保护（20秒）
      const recognitionTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('图像识别超时（20秒），请检查网络连接或API配置')), 20000);
      });
      
      console.log('📸 开始调用百度AI识别API...');
      const startTime = Date.now();
      
      const [generalKeywords, sceneKeywords, objectKeywords] = await Promise.race([
        Promise.all([
          this.recognizeGeneral(file).catch((err) => {
            console.error('❌ 通用物体识别失败:', err);
            return [];
          }),
          this.recognizeScene(file).catch((err) => {
            console.error('❌ 场景识别失败:', err);
            return [];
          }),
          this.detectObjects(file).catch((err) => {
            console.error('❌ 物体检测失败:', err);
            return [];
          }),
        ]),
        recognitionTimeout
      ]);
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ 识别完成，耗时 ${elapsedTime} 秒`);
      
      console.log('📊 识别结果统计:', {
        通用物体: generalKeywords.length,
        场景: sceneKeywords.length,
        物体检测: objectKeywords.length,
      });
      
      // 2. 合并所有识别结果
      const allKeywords = [...new Set([
        ...generalKeywords,
        ...sceneKeywords,
        ...objectKeywords,
      ])];
      
      console.log(`✅ 识别完成，共识别到 ${allKeywords.length} 个关键词`);
      console.log('🔍 识别到的关键词（前30个）:', allKeywords.slice(0, 30));
      
      // 📋 输出清晰的验证信息
      console.log('📋 [验证信息总览]');
      console.log(`📋 目标关键词: ${requiredKeywords.join('、')}`);
      console.log(`📋 已识别: ${allKeywords.slice(0, 10).join('、')}${allKeywords.length > 10 ? '...' : ''}`);
      
      // 🔍 输出时间戳格式的日志（与你的日志格式一致）
      const nowTime = new Date();
      const timeString = nowTime.toTimeString().slice(0, 8);
      console.log(`[${timeString}] 🔍 已识别: ${allKeywords.slice(0, 5).join('、')}${allKeywords.length > 5 ? '...' : ''}`);

      const recognizedKeywords = allKeywords;

      // 🔧 如果识别失败（没有识别到任何内容），给出明确的错误提示
      if (allKeywords.length === 0) {
        console.error('❌ 百度AI未识别到任何内容，可能的原因：');
        console.error('1. 百度API配置错误（API Key或Secret Key不正确）');
        console.error('2. 网络连接问题（无法访问百度API）');
        console.error('3. 图片质量问题（过于模糊或光线不足）');
        console.error('4. 超出每日免费额度（500次/天）');
        
        return {
          success: false,
          matchedKeywords: [],
          recognizedKeywords: [],
          description: `❌ 验证失败：未识别到任何内容\n\n可能的原因：\n\n1️⃣ 百度AI配置问题\n   • 请检查【设置 → AI】中的百度API配置\n   • API Key 和 Secret Key 是否正确\n   • 是否已开通图像识别服务\n\n2️⃣ 网络连接问题\n   • 请检查网络连接是否正常\n   • 是否能访问百度AI服务\n\n3️⃣ 图片质量问题\n   • 请确保光线充足\n   • 拍摄目标清晰可见\n   • 避免过度模糊或反光\n\n4️⃣ 超出免费额度\n   • 百度AI每天免费500次\n   • 请检查是否超出额度\n\n💡 建议：\n   • 先检查百度API配置\n   • 重新拍摄更清晰的照片\n   • 或联系开发者排查问题`,
          matchDetails: requiredKeywords.map(k => `❌ "${k}" - 未识别到任何内容，无法验证`).join('\n'),
          suggestions: [
            '🔧 请先检查百度API配置（设置 → AI）',
            '📸 确保照片清晰、光线充足',
            '🌐 检查网络连接是否正常',
            '💰 检查是否超出每日免费额度（500次）',
          ],
        };
      }

      // 3. 宽松匹配：模糊相似就算匹配
      const matchedKeywords: string[] = [];
      const unmatchedKeywords: string[] = [];
      const matchDetails: string[] = [];
      const suggestions: string[] = [];
      
      // 同义词和相关词库（超级扩展版 - 极度宽松）
      const synonyms: Record<string, string[]> = {
        // 洗漱相关（大幅扩展）
        '干净的牙齿': ['牙齿', '牙', '口腔', '嘴', '嘴巴', '笑容', '微笑', '脸', '面部', '人脸', '人物', '美女', '女人', '男人', '少女', '少年', '人', '头', '头部', '五官', '面孔', '容貌', '美容', '化妆', '护肤', '洗漱', '牙刷', '牙膏', '漱口', '刷牙', '洁白', '清洁', '卫生'],
        '牙齿': ['牙', '口腔', '嘴', '嘴巴', '笑容', '微笑', '脸', '面部', '人脸', '人物', '美女', '女人', '男人', '少女', '少年', '人', '头', '头部', '五官', '面孔', '容貌', '美容', '化妆', '护肤', '洗漱', '牙刷', '牙膏', '漱口', '刷牙', '洁白', '清洁', '卫生'],
        '清爽的脸': ['脸', '面部', '人脸', '脸部', '面孔', '容貌', '五官', '头', '头部', '人物', '美女', '女人', '男人', '少女', '少年', '人', '肖像', '特写', '人物特写', '美容', '化妆', '护肤', '洗漱', '清洁', '干净', '清爽', '皮肤', '面容', '表情', '眼睛', '鼻子', '嘴', '额头', '脸颊'],
        '脸': ['面部', '人脸', '脸部', '面孔', '容貌', '五官', '头', '头部', '人物', '美女', '女人', '男人', '少女', '少年', '人', '肖像', '特写', '人物特写', '美容', '化妆', '护肤', '洗漱', '清洁', '干净', '清爽', '皮肤', '面容', '表情', '眼睛', '鼻子', '嘴', '额头', '脸颊'],
        '整齐的洗漱用品': ['洗漱用品', '洗漱', '牙刷', '牙膏', '毛巾', '洗面奶', '香皂', '肥皂', '洗手液', '沐浴露', '洗发水', '护发素', '梳子', '镜子', '杯子', '水杯', '漱口杯', '洗手台', '台面', '卫生间', '浴室', '厕所', '洗脸', '刷牙', '洗手', '清洁', '卫生', '日用品', '生活用品', '用品', '物品', '摆放', '整理', '收纳'],
        '洗漱用品': ['洗漱', '牙刷', '牙膏', '毛巾', '洗面奶', '香皂', '肥皂', '洗手液', '沐浴露', '洗发水', '护发素', '梳子', '镜子', '杯子', '水杯', '漱口杯', '洗手台', '台面', '卫生间', '浴室', '厕所', '洗脸', '刷牙', '洗手', '清洁', '卫生', '日用品', '生活用品', '用品', '物品', '摆放', '整理', '收纳'],
        '关掉的水龙头': ['水龙头', '水龙', '龙头', '水', '水流', '水槽', '洗手台', '台面', '厨房', '卫生间', '浴室', '洗漱', '洗手', '洗脸', '清洗', '水管', '阀门', '开关', '金属', '不锈钢', '银色', '白色', '关闭', '节水', '节约'],
        '水龙头': ['水龙', '龙头', '水', '水流', '水槽', '洗手台', '台面', '厨房', '卫生间', '浴室', '洗漱', '洗手', '洗脸', '清洗', '水管', '阀门', '开关', '金属', '不锈钢', '银色', '白色', '关闭', '节水', '节约'],
        
        // 人物相关（新增）
        '人物': ['人', '人脸', '脸', '面部', '头', '美女', '女人', '男人', '少女', '少年', '肖像', '特写', '人物特写'],
        '美女': ['女人', '女性', '少女', '人', '人物', '人脸', '脸', '面部', '美容', '化妆', '护肤'],
        '女人': ['美女', '女性', '少女', '人', '人物', '人脸', '脸', '面部', '美容', '化妆', '护肤'],
        '人物特写': ['特写', '人物', '人', '人脸', '脸', '面部', '头', '肖像', '美女', '女人', '男人'],
        '清纯少女': ['少女', '女孩', '美女', '女人', '人', '人物', '人脸', '脸', '面部', '清纯', '青春'],
        
        // 电子设备
        'ipad': ['平板', '平板电脑', 'tablet', '电脑', '屏幕', '显示器', '笔记本', '键盘', '鼠标', '桌面', '办公', '数码'],
        '平板': ['ipad', 'tablet', '电脑', '屏幕', '显示器', '键盘', '桌面', '数码'],
        '笔记本': ['电脑', 'laptop', 'notebook', '屏幕', '显示器', 'ipad', '键盘', '鼠标', '桌面', '办公', '数码'],
        '电脑': ['笔记本', 'ipad', '平板', '屏幕', '显示器', 'computer', '键盘', '鼠标', '桌面', '办公', '数码'],
        '微信': ['手机', '界面', '屏幕', 'app', '应用', '聊天', '社交', '通讯', '软件'],
        '手机': ['屏幕', '界面', 'app', '应用', '微信', '通讯', '电子', '数码'],
        '屏幕': ['电脑', '手机', 'ipad', '平板', '显示器', '界面', '桌面', '数码'],
        '界面': ['屏幕', '手机', '电脑', 'app', '应用', '软件', '程序'],
        
        // 厨房相关
        '厨房': ['水槽', '灶台', '冰箱', '碗', '盘子', '锅', '厨具', '餐具', '食物', '烹饪', '橱柜', '台面'],
        '水槽': ['厨房', '水龙头', '洗碗', '清洗', '水', '台面', '不锈钢'],
        
        // 卫生间相关
        '厕所': ['卫生间', '洗手间', '马桶', '洗漱', '浴室', '淋浴', '洗手台', '镜子'],
        '卫生间': ['厕所', '洗手间', '马桶', '洗漱', '浴室', '淋浴'],
        
        // 房间相关
        '卧室': ['床', '房间', '睡觉', '休息', '卧床', '被子', '枕头'],
        '客厅': ['沙发', '电视', '茶几', '房间', '起居室', '家具'],
        '床': ['卧室', '睡觉', '休息', '被子', '枕头', '床单'],
        '桌子': ['桌面', '台面', '书桌', '餐桌', '办公桌', '家具'],
        '椅子': ['座椅', '凳子', '办公椅', '家具'],
      };
      
      // 拍摄建议库（扩展版）
      const shootingTips: Record<string, string[]> = {
        // 洗漱相关
        '干净的牙齿': ['拍摄自己的笑容（露出牙齿）', '拍摄自己的脸部', '拍摄牙刷或牙膏'],
        '牙齿': ['拍摄自己的笑容（露出牙齿）', '拍摄自己的脸部', '拍摄牙刷或牙膏'],
        '清爽的脸': ['拍摄自己的脸部', '拍摄洗漱后的自拍', '拍摄镜子中的自己'],
        '脸': ['拍摄自己的脸部', '拍摄洗漱后的自拍', '拍摄镜子中的自己'],
        '整齐的洗漱用品': ['拍摄洗手台上的牙刷牙膏', '拍摄整理好的洗漱用品', '拍摄卫生间台面'],
        '洗漱用品': ['拍摄洗手台上的牙刷牙膏', '拍摄整理好的洗漱用品', '拍摄卫生间台面'],
        '关掉的水龙头': ['拍摄关闭的水龙头', '拍摄洗手台', '拍摄水槽'],
        '水龙头': ['拍摄关闭的水龙头', '拍摄洗手台', '拍摄水槽'],
        
        // 电子设备
        'ipad': ['拍摄iPad屏幕', '拍摄平板电脑', '拍摄工作桌面'],
        '平板': ['拍摄平板电脑', '拍摄iPad', '拍摄电子设备'],
        '笔记本': ['拍摄笔记本电脑', '拍摄电脑屏幕', '拍摄工作桌面'],
        '电脑': ['拍摄电脑屏幕', '拍摄键盘', '拍摄工作桌面'],
        '微信': ['打开微信界面拍摄', '拍摄手机屏幕显示微信'],
        '手机': ['拍摄手机', '拍摄手机屏幕'],
        
        // 厨房相关
        '厨房': ['拍摄厨房环境', '拍摄灶台', '拍摄水槽', '拍摄橱柜'],
        '水槽': ['拍摄厨房水槽', '拍摄洗碗池', '拍摄水龙头'],
        
        // 卫生间相关
        '厕所': ['拍摄卫生间', '拍摄洗手间', '拍摄马桶或洗手台'],
        '卫生间': ['拍摄卫生间', '拍摄洗手间', '拍摄马桶或洗手台'],
        
        // 房间相关
        '卧室': ['拍摄卧室环境', '拍摄床', '拍摄房间'],
        '客厅': ['拍摄客厅环境', '拍摄沙发', '拍摄电视'],
        '床': ['拍摄床', '拍摄卧室'],
        '桌子': ['拍摄桌面', '拍摄书桌', '拍摄工作台'],
      };
      
      // 🤖 智能语义匹配函数（超级宽松版 - 字符级匹配）
      const isSemanticMatch = (required: string, recognized: string): { matched: boolean; reason: string } => {
        const reqLower = required.toLowerCase().trim();
        const recLower = recognized.toLowerCase().trim();
          
        // 1. 直接包含（最基础）
        if (recLower.includes(reqLower) || reqLower.includes(recLower)) {
          return { matched: true, reason: '直接包含匹配' };
        }
        
        // 🆕 2. 字符级匹配：只要有2个连续字符相同就算匹配
        for (let i = 0; i < reqLower.length - 1; i++) {
          const twoChars = reqLower.substring(i, i + 2);
          if (recLower.includes(twoChars)) {
            return { matched: true, reason: `字符匹配: 包含"${twoChars}"` };
          }
          }
          
        // 🆕 3. 单字符匹配：如果关键词很短（1-2个字），单字符匹配也算
        if (reqLower.length <= 2) {
          for (const char of reqLower) {
            if (recLower.includes(char)) {
              return { matched: true, reason: `单字符匹配: "${char}"` };
            }
          }
        }
        
        // 4. 提取关键词（去掉修饰词）
        const extractKeywords = (text: string): string[] => {
          // 去掉常见的修饰词
          const modifiers = ['干净的', '清爽的', '整齐的', '关掉的', '打开的', '漂亮的', '好看的', '新的', '旧的'];
          let cleaned = text;
          modifiers.forEach(mod => {
            cleaned = cleaned.replace(mod, '');
          });
          // 拆分成单个词
          return cleaned.split(/[、，,\s]+/).filter(w => w.length > 0);
        };
        
        const reqKeywords = extractKeywords(reqLower);
        const recKeywords = extractKeywords(recLower);
        
        // 5. 检查是否有共同的关键字
        for (const reqWord of reqKeywords) {
          for (const recWord of recKeywords) {
            if (reqWord.includes(recWord) || recWord.includes(reqWord)) {
              return { matched: true, reason: `关键词匹配: "${reqWord}" ↔ "${recWord}"` };
            }
            // 🆕 关键词的字符级匹配
            if (reqWord.length >= 2 && recWord.length >= 2) {
              for (let i = 0; i < reqWord.length - 1; i++) {
                const twoChars = reqWord.substring(i, i + 2);
                if (recWord.includes(twoChars)) {
                  return { matched: true, reason: `关键词字符匹配: "${twoChars}"` };
                }
              }
            }
          }
        }
        
        // 6. 智能语义关联（基于常识和AI理解）
        // 提取核心概念 - 更智能、更宽泛
        const getConcept = (text: string): string[] => {
          const concepts: string[] = [];
          
          // 人物相关（超级宽泛）
          if (/人|脸|面|头|眼|鼻|嘴|笑|容|貌|美|女|男|少|孩|童|老|青|年|肖像|特写|自拍|照片|相片|五官|表情|神态/.test(text)) {
            concepts.push('人物');
          }
          
          // 洗漱/清洁相关（超级宽泛）
          if (/牙|齿|口|刷|膏|漱|洗|脸|面|手|台|镜|毛巾|肥皂|香皂|洗面|洁|净|清|爽|卫生|浴|厕|盥洗|梳妆|化妆|护肤|美容|洗手|洗脸|刷牙/.test(text)) {
            concepts.push('洗漱');
            concepts.push('清洁');
          }
          
          // 水相关
          if (/水|龙头|水槽|水池|水流|湿|洗|清|洁|液|流|滴|喷|淋/.test(text)) {
            concepts.push('水');
          }
          
          // 厨房相关
          if (/厨|灶|锅|碗|盘|筷|勺|刀|菜|饭|食|餐|炒|煮|烹|冰箱|橱柜|台面|厨具|餐具/.test(text)) {
            concepts.push('厨房');
              }
          
          // 卧室相关
          if (/床|被|枕|卧|睡|眠|休息|房间|寝室/.test(text)) {
            concepts.push('卧室');
          }
          
          // 电子设备
          if (/电脑|笔记本|平板|ipad|手机|屏幕|键盘|鼠标|显示器|数码|电子|设备|pad|phone|mac|pc/.test(text)) {
            concepts.push('电子设备');
          }
          
          // 家具
          if (/桌|椅|柜|沙发|茶几|床|架|台|凳/.test(text)) {
            concepts.push('家具');
          }
          
          // 日用品/物品
          if (/用品|物品|东西|器具|工具|设备|物件|物体|产品|商品/.test(text)) {
            concepts.push('日用品');
          }
          
          // 场景/环境
          if (/室内|房间|家|屋|空间|环境|场景|地方/.test(text)) {
            concepts.push('场景');
          }
          
          return concepts;
        };
        
        const reqConcepts = getConcept(reqLower);
        const recConcepts = getConcept(recLower);
          
        // 如果有共同的概念，认为相关
        for (const reqConcept of reqConcepts) {
          if (recConcepts.includes(reqConcept)) {
            return { matched: true, reason: `语义概念匹配: ${reqConcept}` };
          }
        }
        
        // 7. 使用同义词库作为兜底（但不强制依赖）
        const syns = synonyms[required] || synonyms[reqLower] || [];
            for (const syn of syns) {
          const synLower = syn.toLowerCase();
          if (recLower.includes(synLower) || synLower.includes(recLower)) {
            return { matched: true, reason: `同义词匹配: "${syn}"` };
          }
          // 🆕 同义词的字符级匹配
          if (synLower.length >= 2) {
            for (let i = 0; i < synLower.length - 1; i++) {
              const twoChars = synLower.substring(i, i + 2);
              if (recLower.includes(twoChars)) {
                return { matched: true, reason: `同义词字符匹配: "${syn}"中的"${twoChars}"` };
              }
            }
          }
        }
        
        return { matched: false, reason: '无匹配' };
      };
      
      // 遍历每个要求的关键词，进行智能匹配
      for (const required of requiredKeywords) {
        let matched = false;
        let matchReason = '';
        
        console.log(`🔍 [智能匹配] 开始检查关键词: "${required}"`);
        
        // 遍历所有识别到的关键词
        for (const recognized of recognizedKeywords) {
          const result = isSemanticMatch(required, recognized);
          if (result.matched) {
            matched = true;
            matchReason = `识别到"${recognized}"（${result.reason}）`;
            console.log(`✅ [智能匹配] "${required}" 匹配到 "${recognized}" - ${result.reason}`);
            break;
          }
        }
        
        if (matched) {
          matchedKeywords.push(required);
          matchDetails.push(`✅ "${required}" - ${matchReason}`);
          console.log(`✅ [智能匹配] "${required}" 最终匹配成功`);
        } else {
          unmatchedKeywords.push(required);
          matchDetails.push(`❌ "${required}" - 未识别到`);
          console.log(`❌ [智能匹配] "${required}" 最终匹配失败`);
          console.log(`❌ [智能匹配] 识别到的所有关键词:`, recognizedKeywords.slice(0, 20));
          
          // 给出具体的拍摄建议
          const tips = shootingTips[required] || shootingTips[required.toLowerCase()] || [`拍摄包含"${required}"的照片`];
          suggestions.push(`📸 请${tips[0]}，确保清晰可见`);
        }
      }

      // 4. 判断是否通过（严格模式：必须匹配到至少一个关键词）
      let success = false;
      let finalDescription = '';
      
      const matchRate = matchedKeywords.length / requiredKeywords.length;
      
      console.log('🔍 [验证判断] 开始判断验证结果:', {
        识别到的关键词数量: allKeywords.length,
        要求的关键词: requiredKeywords,
        匹配到的关键词: matchedKeywords,
        未匹配的关键词: unmatchedKeywords,
        匹配率: `${(matchRate * 100).toFixed(0)}%`,
      });
      
      // 🔍 输出时间戳格式的匹配结果
      const matchTime = new Date();
      const matchTimeStr = matchTime.toTimeString().slice(0, 8);
      if (matchedKeywords.length > 0) {
        console.log(`[${matchTimeStr}] ✅ 匹配成功: ${matchedKeywords.join('、')}`);
      } else {
        console.log(`[${matchTimeStr}] ❌ 未匹配到关键词`);
      }
      
      if (allKeywords.length === 0) {
        // 完全没识别到内容 - 不通过，给出建议
        console.log('❌ [验证判断] 未识别到任何内容，验证失败');
        success = false;
        finalDescription = `❌ 验证未通过\n\n图片内容过于模糊，未能识别到任何内容。\n\n请重新拍摄，确保：\n• 光线充足\n• 目标清晰\n• 包含以下内容：${requiredKeywords.join('、')}`;
        
        // 给出每个关键词的拍摄建议
        for (const required of requiredKeywords) {
          const tips = shootingTips[required.toLowerCase()] || [`拍摄包含"${required}"的照片`];
          suggestions.push(`📸 ${tips.join(' 或 ')}`);
        }
      } else if (matchedKeywords.length > 0) {
        // ✅ 匹配到至少一个关键词 - 通过验证
        console.log('✅ [验证判断] 匹配到关键词，验证通过');
        success = true;
        if (matchedKeywords.length === requiredKeywords.length) {
          finalDescription = `✅ 验证通过！\n\n图片内容完全符合要求：${matchedKeywords.join('、')}`;
        } else {
          finalDescription = `✅ 验证通过！\n\n已识别到：${matchedKeywords.join('、')}\n\n${unmatchedKeywords.length > 0 ? `未明确识别到：${unmatchedKeywords.join('、')}\n但已满足基本要求。` : ''}`;
        }
      } else {
        // ❌ 没有匹配到任何关键词 - 验证失败
        console.log('❌ [验证判断] 未匹配到任何关键词，验证失败');
        console.log('❌ [验证判断] 要求:', requiredKeywords);
        console.log('❌ [验证判断] 识别到:', allKeywords.slice(0, 20));
        
        // 🔍 详细分析为什么没有匹配成功
        console.log('🔍 [详细分析] 开始逐个检查为什么没有匹配:');
        for (const required of requiredKeywords) {
          console.log(`🔍 [详细分析] 关键词 "${required}":`);
          console.log(`   - 同义词库:`, synonyms[required] || synonyms[required.toLowerCase()] || ['无']);
          console.log(`   - 识别结果中是否包含相关词:`, allKeywords.filter(k => {
            const kLower = k.toLowerCase();
            const reqLower = required.toLowerCase();
            const syns = synonyms[required] || synonyms[reqLower] || [];
            return kLower.includes(reqLower) || reqLower.includes(kLower) || syns.some(s => kLower.includes(s.toLowerCase()));
          }));
        }
        
        // 输出时间戳格式的失败原因
        const failTime = new Date();
        const failTimeStr = failTime.toTimeString().slice(0, 8);
        console.log(`[${failTimeStr}] ❌ 验证失败: 验证失败，未识别到：${requiredKeywords.join('、')}`);
        
        success = false;
        const recognizedText = allKeywords.length > 0 
          ? allKeywords.slice(0, 8).join('、') 
          : '无相关内容';
        
        finalDescription = `❌ 验证未通过\n\n要求包含：${requiredKeywords.join(' 或 ')}\n实际识别到：${recognizedText}\n\n请重新拍摄，确保：\n• 光线充足\n• 目标清晰可见\n• 包含要求的内容`;
        
        // 给出每个关键词的拍摄建议
        for (const required of requiredKeywords) {
          const tips = shootingTips[required] || shootingTips[required.toLowerCase()] || [`拍摄包含"${required}"的照片`];
          suggestions.push(`📸 ${tips.join(' 或 ')}`);
        }
      }

      console.log('✅ 最终验证结果:', {
        success,
        matchedKeywords,
        unmatchedKeywords,
        requiredKeywords,
        recognizedCount: recognizedKeywords.length,
        matchRate: `${(matchRate * 100).toFixed(0)}%`,
        通过原因: success ? '匹配到关键词' : '未匹配到任何关键词',
      });

      return {
        success,
        matchedKeywords,
        recognizedKeywords,
        description: finalDescription,
        matchDetails: matchDetails.join('\n'),
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (error) {
      console.error('❌ 图像验证失败:', error);
      
      // 服务异常 - 给出明确的错误提示和解决方案
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      return {
        success: false,
        matchedKeywords: [],
        recognizedKeywords: [],
        description: `❌ 验证失败\n\n图像识别服务异常：${errorMessage}\n\n请检查：\n1. 网络连接是否正常\n2. 百度AI配置是否正确（设置 → AI）\n3. 是否超出每日免费额度（500次）\n\n您可以：\n• 重新尝试验证\n• 或暂时跳过验证`,
        matchDetails: requiredKeywords.map(k => `❌ "${k}" - 服务异常，无法验证`).join('\n'),
        suggestions: [
          '🔧 图像识别服务异常，请检查：',
          '  • 网络连接是否正常',
          '  • 百度AI密钥是否正确（设置 → AI）',
          '  • 是否超出每日免费额度（500次/天）',
          '',
          '💡 您可以：',
          '  • 点击"重新拍摄"再试一次',
          '  • 或点击"跳过验证"继续',
        ],
      };
    }
  }
}

// 导出单例
export const baiduImageRecognition = new BaiduImageRecognitionService();

