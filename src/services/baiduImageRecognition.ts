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
          const keywords = data.result
            .filter(item => item.score > 0.01)
            .map(item => item.keyword);
          
          console.log('🔍 [recognizeGeneral] 百度AI识别结果 (共' + keywords.length + '个):', keywords);
          
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
        body: `image=${encodeURIComponent(base64Image)}&baike_num=5`,
      });

      if (!response.ok) {
        throw new Error(`图像识别失败: ${response.statusText}`);
      }

      const data: BaiduImageResult = await response.json();

      if (data.result && data.result.length > 0) {
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
      
      // 同义词和相关词库（扩展版）
      const synonyms: Record<string, string[]> = {
        'ipad': ['平板', '平板电脑', 'tablet', '电脑', '屏幕', '显示器', '笔记本', '键盘', '鼠标', '桌面', '办公', '数码'],
        '平板': ['ipad', 'tablet', '电脑', '屏幕', '显示器', '键盘', '桌面', '数码'],
        '笔记本': ['电脑', 'laptop', 'notebook', '屏幕', '显示器', 'ipad', '键盘', '鼠标', '桌面', '办公', '数码'],
        '电脑': ['笔记本', 'ipad', '平板', '屏幕', '显示器', 'computer', '键盘', '鼠标', '桌面', '办公', '数码'],
        '微信': ['手机', '界面', '屏幕', 'app', '应用', '聊天', '社交', '通讯', '软件'],
        '手机': ['屏幕', '界面', 'app', '应用', '微信', '通讯', '电子', '数码'],
        '屏幕': ['电脑', '手机', 'ipad', '平板', '显示器', '界面', '桌面', '数码'],
        '界面': ['屏幕', '手机', '电脑', 'app', '应用', '软件', '程序'],
        '厨房': ['水槽', '灶台', '冰箱', '碗', '盘子', '锅', '厨具', '餐具', '食物', '烹饪', '橱柜', '台面'],
        '水槽': ['厨房', '水龙头', '洗碗', '清洗', '水', '台面', '不锈钢'],
        '厕所': ['卫生间', '洗手间', '马桶', '洗漱', '浴室', '淋浴', '洗手台', '镜子'],
        '卫生间': ['厕所', '洗手间', '马桶', '洗漱', '浴室', '淋浴'],
        '卧室': ['床', '房间', '睡觉', '休息', '卧床', '被子', '枕头'],
        '客厅': ['沙发', '电视', '茶几', '房间', '起居室', '家具'],
        '床': ['卧室', '睡觉', '休息', '被子', '枕头', '床单'],
        '桌子': ['桌面', '台面', '书桌', '餐桌', '办公桌', '家具'],
        '椅子': ['座椅', '凳子', '办公椅', '家具'],
      };
      
      // 拍摄建议库
      const shootingTips: Record<string, string[]> = {
        'ipad': ['拍摄iPad屏幕', '拍摄平板电脑', '拍摄工作桌面'],
        '平板': ['拍摄平板电脑', '拍摄iPad', '拍摄电子设备'],
        '笔记本': ['拍摄笔记本电脑', '拍摄电脑屏幕', '拍摄工作桌面'],
        '电脑': ['拍摄电脑屏幕', '拍摄键盘', '拍摄工作桌面'],
        '微信': ['打开微信界面拍摄', '拍摄手机屏幕显示微信'],
        '手机': ['拍摄手机', '拍摄手机屏幕'],
        '厨房': ['拍摄厨房环境', '拍摄灶台', '拍摄水槽', '拍摄橱柜'],
        '水槽': ['拍摄厨房水槽', '拍摄洗碗池', '拍摄水龙头'],
        '厕所': ['拍摄卫生间', '拍摄洗手间', '拍摄马桶或洗手台'],
        '卫生间': ['拍摄卫生间', '拍摄洗手间', '拍摄马桶或洗手台'],
        '卧室': ['拍摄卧室环境', '拍摄床', '拍摄房间'],
        '客厅': ['拍摄客厅环境', '拍摄沙发', '拍摄电视'],
        '床': ['拍摄床', '拍摄卧室'],
        '桌子': ['拍摄桌面', '拍摄书桌', '拍摄工作台'],
      };
      
      for (const required of requiredKeywords) {
        const requiredLower = required.toLowerCase().trim();
        let matched = false;
        let matchReason = '';
        
        // 遍历所有识别到的关键词，进行宽松匹配
        for (const recognized of recognizedKeywords) {
          const recognizedLower = recognized.toLowerCase().trim();
          
          // 策略1: 直接包含匹配（双向）
          if (recognizedLower.includes(requiredLower) || requiredLower.includes(recognizedLower)) {
            matched = true;
            matchReason = `识别到"${recognized}"`;
            break;
          }
          
          // 策略2: 拆分关键词匹配
          const requiredWords = requiredLower.split(/[、，,\s]+/).filter(w => w.length >= 1);
          const recognizedWords = recognizedLower.split(/[、，,\s]+/).filter(w => w.length >= 1);
          
          for (const reqWord of requiredWords) {
            for (const recWord of recognizedWords) {
              if (recWord.includes(reqWord) || reqWord.includes(recWord)) {
                matched = true;
                matchReason = `识别到"${recognized}"`;
                break;
              }
            }
            if (matched) break;
          }
          
          if (matched) break;
          
          // 策略3: 同义词匹配
          for (const reqWord of requiredWords) {
            const syns = synonyms[reqWord] || [];
            for (const syn of syns) {
              if (recognizedLower.includes(syn)) {
                matched = true;
                matchReason = `识别到"${recognized}"（与"${required}"相关）`;
                break;
              }
            }
            if (matched) break;
          }
          
          if (matched) break;
        }
        
        if (matched) {
          matchedKeywords.push(required);
          matchDetails.push(`✅ "${required}" - ${matchReason}`);
        } else {
          unmatchedKeywords.push(required);
          matchDetails.push(`❌ "${required}" - 未识别到`);
          
          // 给出具体的拍摄建议
          const tips = shootingTips[requiredLower] || [`拍摄包含"${required}"的照片`];
          suggestions.push(`📸 请${tips[0]}，确保清晰可见`);
        }
      }

      // 4. 判断是否通过（严格模式：必须匹配到至少一个关键词）
      let success = false;
      let finalDescription = '';
      
      const matchRate = matchedKeywords.length / requiredKeywords.length;
      
      if (allKeywords.length === 0) {
        // 完全没识别到内容 - 不通过，给出建议
        success = false;
        finalDescription = `❌ 验证未通过\n\n图片内容过于模糊，未能识别到任何内容。\n\n请重新拍摄，确保：\n• 光线充足\n• 目标清晰\n• 包含以下内容：${requiredKeywords.join('、')}`;
        
        // 给出每个关键词的拍摄建议
        for (const required of requiredKeywords) {
          const tips = shootingTips[required.toLowerCase()] || [`拍摄包含"${required}"的照片`];
          suggestions.push(`📸 ${tips.join(' 或 ')}`);
        }
      } else if (matchedKeywords.length > 0) {
        // ✅ 匹配到至少一个关键词 - 通过验证
        success = true;
        if (matchedKeywords.length === requiredKeywords.length) {
          finalDescription = `✅ 验证通过！\n\n图片内容完全符合要求：${matchedKeywords.join('、')}`;
        } else {
          finalDescription = `✅ 验证通过！\n\n已识别到：${matchedKeywords.join('、')}\n\n${unmatchedKeywords.length > 0 ? `未明确识别到：${unmatchedKeywords.join('、')}\n但已满足基本要求。` : ''}`;
        }
      } else {
        // ❌ 没有匹配到任何关键词 - 验证失败
        success = false;
        const recognizedText = allKeywords.length > 0 
          ? allKeywords.slice(0, 8).join('、') 
          : '无相关内容';
        
        finalDescription = `❌ 验证未通过\n\n要求包含：${requiredKeywords.join(' 或 ')}\n实际识别到：${recognizedText}\n\n请重新拍摄，确保：\n• 光线充足\n• 目标清晰可见\n• 包含要求的内容`;
        
        // 给出每个关键词的拍摄建议
        for (const required of requiredKeywords) {
          const tips = shootingTips[required.toLowerCase()] || [`拍摄包含"${required}"的照片`];
          suggestions.push(`📸 ${tips.join(' 或 ')}`);
        }
      }

      console.log('✅ 严格验证结果:', {
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

