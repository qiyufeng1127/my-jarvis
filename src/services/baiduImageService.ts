/**
 * 百度图像识别服务
 * 用于任务验证时识别照片中的物体
 */

interface BaiduAccessTokenResponse {
  access_token: string;
  expires_in: number;
}

interface BaiduImageRecognitionResponse {
  result_num: number;
  result: Array<{
    keyword: string;
    score: number;
    root: string;
  }>;
  log_id: number;
}

// 关键词映射表：任务关键词 -> 百度识别关键词
const KEYWORD_MAPPING: Record<string, string[]> = {
  // 厨房相关
  '厨房': ['厨房', '灶台', '炉灶', '油烟机', '橱柜', '厨具', '锅', '碗', '盘子', '筷子', '勺子', '刀', '砧板', '调料', '食材', '冰箱'],
  '水槽': ['水槽', '洗碗池', '水龙头', '洗涤', '厨房'],
  '锅': ['锅', '炒锅', '平底锅', '汤锅', '砂锅', '厨具'],
  '碗': ['碗', '餐具', '瓷碗', '汤碗'],
  '盘子': ['盘子', '餐具', '瓷盘', '碟子'],
  '调料': ['调料', '调味品', '酱油', '醋', '盐', '糖', '油', '香料'],
  '冰箱': ['冰箱', '冷藏', '电器'],
  
  // 厕所相关
  '厕所': ['厕所', '卫生间', '洗手间', '马桶', '洗手台', '浴室', '淋浴', '浴缸', '镜子', '洗漱'],
  '马桶': ['马桶', '坐便器', '卫生间'],
  '洗手台': ['洗手台', '洗脸池', '水龙头', '镜子'],
  '浴室': ['浴室', '淋浴', '浴缸', '花洒', '卫生间'],
  '洗漱': ['洗漱', '牙刷', '牙膏', '毛巾', '洗面奶', '洗手台'],
  
  // 卧室相关
  '卧室': ['卧室', '床', '被子', '枕头', '衣柜', '床头柜', '台灯', '窗帘'],
  '床': ['床', '床铺', '被子', '枕头', '床单', '卧室'],
  '衣柜': ['衣柜', '衣橱', '衣服', '卧室'],
  
  // 客厅相关
  '客厅': ['客厅', '沙发', '茶几', '电视', '电视柜', '窗帘', '地毯'],
  '沙发': ['沙发', '座椅', '客厅'],
  '电视': ['电视', '电视机', '显示器', '客厅'],
  
  // 工作区相关
  '工作区': ['办公桌', '书桌', '电脑', '笔记本', '键盘', '鼠标', '显示器', '椅子', '台灯', '文具'],
  '书桌': ['书桌', '办公桌', '桌子', '电脑桌'],
  '电脑': ['电脑', '笔记本电脑', '台式机', '显示器', '键盘', '鼠标'],
  '键盘': ['键盘', '电脑', '办公'],
  '鼠标': ['鼠标', '电脑', '办公'],
  
  // 健身相关
  '健身房': ['健身房', '跑步机', '哑铃', '杠铃', '健身器材', '瑜伽垫', '运动', '锻炼'],
  '跑步机': ['跑步机', '健身器材', '运动'],
  '哑铃': ['哑铃', '健身器材', '运动'],
  '瑜伽垫': ['瑜伽垫', '运动垫', '健身'],
  
  // 学习相关
  '书': ['书', '书籍', '课本', '笔记本', '阅读'],
  '笔记本': ['笔记本', '本子', '笔记', '学习'],
  '笔': ['笔', '钢笔', '圆珠笔', '铅笔', '文具'],
  
  // 宠物相关
  '猫': ['猫', '猫咪', '宠物', '猫粮', '猫砂'],
  '狗': ['狗', '狗狗', '宠物', '狗粮'],
  '猫粮': ['猫粮', '宠物食品', '猫'],
  '猫砂': ['猫砂', '宠物用品', '猫'],
  
  // 清洁相关
  '扫把': ['扫把', '扫帚', '清洁工具'],
  '拖把': ['拖把', '清洁工具'],
  '垃圾桶': ['垃圾桶', '垃圾箱', '废纸篓'],
  '洗衣机': ['洗衣机', '洗衣', '电器'],
  
  // 食物相关
  '食物': ['食物', '食品', '菜', '饭', '面', '水果', '蔬菜', '肉', '零食'],
  '水果': ['水果', '苹果', '香蕉', '橙子', '葡萄', '西瓜'],
  '蔬菜': ['蔬菜', '青菜', '白菜', '萝卜', '土豆', '番茄'],
};

class BaiduImageService {
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  /**
   * 获取百度API的Access Token
   */
  private async getAccessToken(apiKey: string, secretKey: string): Promise<string> {
    // 如果token还没过期，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error(`获取Access Token失败: ${response.status}`);
      }

      const data: BaiduAccessTokenResponse = await response.json();
      this.accessToken = data.access_token;
      // 提前5分钟过期，避免边界情况
      this.tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;

      console.log('✅ [百度API] Access Token获取成功');
      return this.accessToken;
    } catch (error) {
      console.error('❌ [百度API] 获取Access Token失败:', error);
      throw error;
    }
  }

  /**
   * 调用百度通用物体识别API
   */
  private async recognizeImage(imageBase64: string, accessToken: string): Promise<BaiduImageRecognitionResponse> {
    try {
      // 移除base64前缀（如果有）
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await fetch(
        `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `image=${encodeURIComponent(base64Data)}`,
        }
      );

      if (!response.ok) {
        throw new Error(`图像识别失败: ${response.status}`);
      }

      const data: BaiduImageRecognitionResponse = await response.json();
      console.log('✅ [百度API] 图像识别成功，识别到', data.result_num, '个物体');
      console.log('🔍 [百度API] 识别结果:', data.result.map(r => `${r.keyword}(${r.score.toFixed(2)})`).join(', '));

      return data;
    } catch (error) {
      console.error('❌ [百度API] 图像识别失败:', error);
      throw error;
    }
  }

  /**
   * 从任务标题和描述中提取关键词
   */
  private extractKeywords(taskTitle: string, requirement: string): string[] {
    const text = `${taskTitle} ${requirement}`.toLowerCase();
    const keywords: string[] = [];

    // 遍历关键词映射表，找出所有匹配的关键词
    for (const [keyword, _] of Object.entries(KEYWORD_MAPPING)) {
      if (text.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }

    console.log('🔍 [关键词提取] 任务:', taskTitle);
    console.log('🔍 [关键词提取] 提取到的关键词:', keywords.join(', '));

    return keywords;
  }

  /**
   * 检查识别结果是否包含任务相关的物体
   * 使用超级宽松的匹配标准
   */
  private checkMatch(recognizedObjects: string[], taskKeywords: string[]): {
    matched: boolean;
    matchedKeywords: string[];
    matchedObjects: string[];
    confidence: number;
    suggestions: string[];
  } {
    const matchedKeywords: string[] = [];
    const matchedObjects: string[] = [];
    const suggestions: string[] = [];

    console.log('🔍 [匹配检查] 开始匹配');
    console.log('🔍 [匹配检查] 任务关键词:', taskKeywords);
    console.log('🔍 [匹配检查] 识别到的物体:', recognizedObjects);

    // 遍历任务关键词
    for (const taskKeyword of taskKeywords) {
      const relatedObjects = KEYWORD_MAPPING[taskKeyword] || [];
      console.log(`🔍 [匹配检查] 关键词"${taskKeyword}"的相关物体:`, relatedObjects);

      // 检查识别结果中是否包含相关物体
      for (const recognizedObj of recognizedObjects) {
        for (const relatedObj of relatedObjects) {
          // 超级宽松的模糊匹配
          const recognized = recognizedObj.toLowerCase();
          const related = relatedObj.toLowerCase();
          
          if (
            recognized.includes(related) ||
            related.includes(recognized) ||
            // 额外的宽松匹配：只要有一个字相同也算
            this.hasCommonChar(recognized, related)
          ) {
            console.log(`✅ [匹配成功] "${recognizedObj}" 匹配 "${relatedObj}"`);
            matchedKeywords.push(taskKeyword);
            matchedObjects.push(recognizedObj);
            break;
          }
        }
      }

      // 如果这个关键词没有匹配，添加建议
      if (!matchedKeywords.includes(taskKeyword)) {
        const topSuggestions = relatedObjects.slice(0, 3);
        suggestions.push(`拍摄包含以下物品的照片：${topSuggestions.join('、')}`);
      }
    }

    // 去重
    const uniqueKeywords = [...new Set(matchedKeywords)];
    const uniqueObjects = [...new Set(matchedObjects)];

    // 计算置信度：匹配的关键词数量 / 总关键词数量
    const confidence = taskKeywords.length > 0
      ? uniqueKeywords.length / taskKeywords.length
      : 0;

    // 超级宽松：只要有任何匹配就通过
    const matched = uniqueKeywords.length > 0;

    console.log('🎯 [匹配结果] 是否匹配:', matched);
    console.log('🎯 [匹配结果] 匹配的关键词:', uniqueKeywords.join(', ') || '无');
    console.log('🎯 [匹配结果] 匹配的物体:', uniqueObjects.join(', ') || '无');
    console.log('🎯 [匹配结果] 置信度:', (confidence * 100).toFixed(0) + '%');
    console.log('🎯 [匹配结果] 建议:', suggestions);

    return {
      matched,
      matchedKeywords: uniqueKeywords,
      matchedObjects: uniqueObjects,
      confidence,
      suggestions,
    };
  }

  /**
   * 检查两个字符串是否有共同的字符（用于超级宽松匹配）
   */
  private hasCommonChar(str1: string, str2: string): boolean {
    const chars1 = new Set(str1.split(''));
    const chars2 = new Set(str2.split(''));
    
    for (const char of chars1) {
      if (chars2.has(char) && char.length > 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 验证任务照片
   * @param imageBase64 图片的Base64编码
   * @param taskTitle 任务标题
   * @param requirement 验证要求
   * @param apiKey 百度API Key
   * @param secretKey 百度Secret Key
   * @returns 验证结果
   */
  async verifyTaskImage(
    imageBase64: string,
    taskTitle: string,
    requirement: string,
    apiKey: string,
    secretKey: string
  ): Promise<{
    success: boolean;
    isValid: boolean;
    confidence: number;
    reason: string;
    matchedKeywords?: string[];
    matchedObjects?: string[];
    recognizedObjects?: string[];
    suggestions?: string[];
    debugInfo?: string;
  }> {
    try {
      console.log('🔍 [百度验证] 开始验证任务照片');
      console.log('🔍 [百度验证] 任务:', taskTitle);
      console.log('🔍 [百度验证] 要求:', requirement);
      console.log('🔍 [百度验证] API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : '未配置');

      // 检查API配置
      if (!apiKey || !secretKey) {
        console.error('❌ [百度验证] API未配置');
        return {
          success: false,
          isValid: false,
          confidence: 0,
          reason: '❌ 百度API未配置，请在设置中填入API Key和Secret Key',
          debugInfo: '错误原因：未配置百度API密钥',
        };
      }

      // 1. 获取Access Token
      console.log('🔑 [百度验证] 正在获取Access Token...');
      let accessToken: string;
      try {
        accessToken = await this.getAccessToken(apiKey, secretKey);
        console.log('✅ [百度验证] Access Token获取成功');
      } catch (error) {
        console.error('❌ [百度验证] Access Token获取失败:', error);
        return {
          success: false,
          isValid: false,
          confidence: 0,
          reason: `❌ 获取百度API访问令牌失败：${error instanceof Error ? error.message : '未知错误'}`,
          debugInfo: `错误原因：Access Token获取失败\n错误详情：${error instanceof Error ? error.message : '未知错误'}\n请检查API Key和Secret Key是否正确`,
        };
      }

      // 2. 调用图像识别API
      console.log('📸 [百度验证] 正在调用图像识别API...');
      let recognitionResult: any;
      try {
        recognitionResult = await this.recognizeImage(imageBase64, accessToken);
        console.log('✅ [百度验证] 图像识别成功');
      } catch (error) {
        console.error('❌ [百度验证] 图像识别失败:', error);
        return {
          success: false,
          isValid: false,
          confidence: 0,
          reason: `❌ 图像识别失败：${error instanceof Error ? error.message : '未知错误'}`,
          debugInfo: `错误原因：图像识别API调用失败\n错误详情：${error instanceof Error ? error.message : '未知错误'}\n可能原因：\n1. 网络连接问题\n2. 图片格式不支持\n3. 图片过大\n4. API额度用完`,
        };
      }

      // 3. 提取识别到的物体名称
      const recognizedObjects = recognitionResult.result.map((r: any) => r.keyword);
      console.log('🔍 [百度验证] 识别到的物体:', recognizedObjects);

      // 4. 从任务中提取关键词
      const taskKeywords = this.extractKeywords(taskTitle, requirement);
      console.log('🔍 [百度验证] 任务关键词:', taskKeywords);

      if (taskKeywords.length === 0) {
        // 如果没有提取到关键词，说明任务没有明确的物体要求，直接通过
        console.log('⚠️ [百度验证] 任务中没有明确的物体要求，默认通过');
        return {
          success: true,
          isValid: true,
          confidence: 1.0,
          reason: '✅ 验证通过！任务中没有明确的物体要求，照片已通过验证',
          recognizedObjects,
          debugInfo: `验证通过原因：任务中没有明确的物体要求\n识别到的物体：${recognizedObjects.join('、')}`,
        };
      }

      // 5. 检查匹配
      const matchResult = this.checkMatch(recognizedObjects, taskKeywords);

      // 6. 生成验证结果说明
      let reason = '';
      let debugInfo = '';
      
      if (matchResult.matched) {
        reason = `✅ 验证通过！识别到与任务相关的物体：${matchResult.matchedObjects.join('、')}`;
        debugInfo = `验证通过原因：\n` +
          `- 任务关键词：${taskKeywords.join('、')}\n` +
          `- 匹配的关键词：${matchResult.matchedKeywords.join('、')}\n` +
          `- 匹配的物体：${matchResult.matchedObjects.join('、')}\n` +
          `- 所有识别到的物体：${recognizedObjects.join('、')}\n` +
          `- 置信度：${(matchResult.confidence * 100).toFixed(0)}%`;
      } else {
        reason = `❌ 验证失败\n\n` +
          `任务要求：${taskKeywords.join('、')}\n` +
          `识别到的物体：${recognizedObjects.slice(0, 10).join('、')}\n\n` +
          `💡 建议：\n${matchResult.suggestions.join('\n')}`;
        
        debugInfo = `验证失败原因：\n` +
          `- 任务关键词：${taskKeywords.join('、')}\n` +
          `- 识别到的物体：${recognizedObjects.join('、')}\n` +
          `- 匹配结果：无匹配\n\n` +
          `建议：\n${matchResult.suggestions.join('\n')}\n\n` +
          `提示：\n` +
          `1. 确保照片清晰\n` +
          `2. 确保照片包含任务相关的物品\n` +
          `3. 光线充足\n` +
          `4. 物品在照片中清晰可见`;
      }

      return {
        success: true,
        isValid: matchResult.matched,
        confidence: matchResult.confidence,
        reason,
        matchedKeywords: matchResult.matchedKeywords,
        matchedObjects: matchResult.matchedObjects,
        recognizedObjects,
        suggestions: matchResult.suggestions,
        debugInfo,
      };
    } catch (error) {
      console.error('❌ [百度验证] 验证失败:', error);
      return {
        success: false,
        isValid: false,
        confidence: 0,
        reason: `❌ 验证失败：${error instanceof Error ? error.message : '未知错误'}`,
        debugInfo: `错误原因：未知错误\n错误详情：${error instanceof Error ? error.stack : '未知错误'}\n请联系技术支持`,
      };
    }
  }

  /**
   * 添加自定义关键词映射
   */
  addKeywordMapping(keyword: string, relatedObjects: string[]) {
    KEYWORD_MAPPING[keyword] = relatedObjects;
    console.log('✅ [关键词映射] 添加自定义映射:', keyword, '->', relatedObjects.join(', '));
  }

  /**
   * 获取所有支持的关键词
   */
  getSupportedKeywords(): string[] {
    return Object.keys(KEYWORD_MAPPING);
  }
}

export const baiduImageService = new BaiduImageService();

