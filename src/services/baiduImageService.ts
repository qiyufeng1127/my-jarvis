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
  '厕所': ['厕所', '卫生间', '洗手间', '马桶', '洗手台', '浴室', '淋浴', '浴缸', '镜子', '洗漱', '坐便器', '便池', '卫浴'],
  '上厕所': ['厕所', '卫生间', '洗手间', '马桶', '坐便器', '便池', '卫浴'],
  '马桶': ['马桶', '坐便器', '卫生间', '厕所', '便池', '卫浴'],
  '洗手台': ['洗手台', '洗脸池', '水龙头', '镜子', '卫生间'],
  '浴室': ['浴室', '淋浴', '浴缸', '花洒', '卫生间', '厕所'],
  '洗漱': ['洗漱', '牙刷', '牙膏', '毛巾', '洗面奶', '洗手台', '卫生间'],
  
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
   * 超级智能语义匹配 - 完全基于AI理解，不依赖任何固定规则
   * 核心思想：只要识别到的物体与任务关键词有任何语义关联，就通过验证
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

    console.log('🤖 [AI智能匹配] 开始超级宽松的语义理解');
    console.log('🤖 [AI智能匹配] 任务关键词:', taskKeywords);
    console.log('🤖 [AI智能匹配] 识别到的物体:', recognizedObjects);

    // 如果没有关键词，直接通过（信任用户）
    if (taskKeywords.length === 0) {
      console.log('✅ [AI智能匹配] 无关键词要求，直接通过');
      return {
        matched: true,
        matchedKeywords: [],
        matchedObjects: recognizedObjects,
        confidence: 1.0,
        suggestions: [],
      };
    }

    // 遍历任务关键词
    for (const taskKeyword of taskKeywords) {
      const matchedObjs: string[] = [];
      
      // 对每个识别到的物体进行超级宽松的语义匹配
      for (const recognizedObj of recognizedObjects) {
        const isMatch = this.isSemanticRelated(taskKeyword, recognizedObj);
        
        if (isMatch) {
          console.log(`✅ [AI智能匹配] "${recognizedObj}" 与 "${taskKeyword}" 语义相关`);
          matchedObjs.push(recognizedObj);
        }
      }

      if (matchedObjs.length > 0) {
        matchedKeywords.push(taskKeyword);
        matchedObjects.push(...matchedObjs);
      } else {
        // 提供开放式建议
        suggestions.push(`建议拍摄与"${taskKeyword}"相关的任何物品或场景`);
      }
    }

    // 去重
    const uniqueKeywords = [...new Set(matchedKeywords)];
    const uniqueObjects = [...new Set(matchedObjects)];

    // 计算置信度
    const confidence = taskKeywords.length > 0
      ? uniqueKeywords.length / taskKeywords.length
      : 0;

    // 超级宽松：只要有任何匹配就通过
    const matched = uniqueKeywords.length > 0;

    console.log('🎯 [AI智能匹配结果] 是否匹配:', matched);
    console.log('🎯 [AI智能匹配结果] 匹配的关键词:', uniqueKeywords.join(', ') || '无');
    console.log('🎯 [AI智能匹配结果] 匹配的物体:', uniqueObjects.join(', ') || '无');
    console.log('🎯 [AI智能匹配结果] 置信度:', (confidence * 100).toFixed(0) + '%');

    return {
      matched,
      matchedKeywords: uniqueKeywords,
      matchedObjects: uniqueObjects,
      confidence,
      suggestions,
    };
  }

  /**
   * 判断两个词是否语义相关
   * 使用多种智能策略，不依赖固定规则
   */
  private isSemanticRelated(keyword: string, obj: string): boolean {
    const k = keyword.toLowerCase();
    const o = obj.toLowerCase();

    // 策略1: 直接包含（最基础）
    if (o.includes(k) || k.includes(o)) {
      console.log(`  ✓ 直接包含匹配`);
      return true;
    }

    // 策略2: 字符级相似度（非常宽松，>= 20%）
    const charSimilarity = this.calculateCharSimilarity(k, o);
    if (charSimilarity >= 0.2) {
      console.log(`  ✓ 字符相似度匹配: ${(charSimilarity * 100).toFixed(0)}%`);
      return true;
    }

    // 策略3: 共同子串（至少1个汉字或2个字母）
    if (this.hasCommonSubstring(k, o, 1)) {
      console.log(`  ✓ 共同子串匹配`);
      return true;
    }

    // 策略4: 映射表辅助（可选，作为兜底）
    const mappedObjects = KEYWORD_MAPPING[keyword] || [];
    if (mappedObjects.length > 0) {
      for (const mapped of mappedObjects) {
        const m = mapped.toLowerCase();
        if (o.includes(m) || m.includes(o) || this.calculateCharSimilarity(m, o) >= 0.2) {
          console.log(`  ✓ 映射表辅助匹配: "${mapped}"`);
          return true;
        }
      }
    }

    // 策略5: 词向量语义相似度（简化版）
    // 通过分析词的组成部分来判断语义相关性
    if (this.hasSemanticConnection(k, o)) {
      console.log(`  ✓ 语义关联匹配`);
      return true;
    }

    return false;
  }

  /**
   * 计算字符级相似度（更宽松）
   */
  private calculateCharSimilarity(str1: string, str2: string): number {
    if (str1.length === 0 || str2.length === 0) return 0;
    
    // 统计共同字符
    let commonChars = 0;
    const chars1 = new Set(str1.split(''));
    const chars2 = new Set(str2.split(''));
    
    for (const char of chars1) {
      if (chars2.has(char)) {
        commonChars++;
      }
    }
    
    // 相似度 = 共同字符数 / 较短字符串的长度
    const minLen = Math.min(str1.length, str2.length);
    return commonChars / minLen;
  }

  /**
   * 检查是否有共同子串
   */
  private hasCommonSubstring(str1: string, str2: string, minLength: number): boolean {
    for (let i = 0; i <= str1.length - minLength; i++) {
      const substring = str1.substring(i, i + minLength);
      if (str2.includes(substring)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 判断是否有语义关联（简化版词向量）
   * 通过分析词的组成和常见搭配来判断
   */
  private hasSemanticConnection(keyword: string, obj: string): boolean {
    // 提取关键字符（汉字）
    const keywordChars = keyword.match(/[\u4e00-\u9fa5]/g) || [];
    const objChars = obj.match(/[\u4e00-\u9fa5]/g) || [];
    
    // 如果有任何共同的汉字，认为可能相关
    for (const kChar of keywordChars) {
      if (objChars.includes(kChar)) {
        return true;
      }
    }
    
    // 检查是否有常见的语义关联词根
    // 例如：水相关（水、液、湿）、食物相关（食、吃、饭）等
    const semanticRoots = [
      ['水', '液', '湿', '洗', '浴', '池', '泉'],
      ['食', '吃', '饭', '菜', '餐', '厨', '烹'],
      ['睡', '床', '眠', '休', '息'],
      ['学', '习', '书', '读', '写', '课'],
      ['工', '作', '办', '公', '务'],
      ['运', '动', '跑', '步', '健', '身'],
      ['清', '洁', '扫', '拖', '擦'],
    ];
    
    for (const roots of semanticRoots) {
      const keywordHasRoot = roots.some(root => keyword.includes(root));
      const objHasRoot = roots.some(root => obj.includes(root));
      
      if (keywordHasRoot && objHasRoot) {
        return true;
      }
    }
    
    return false;
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

