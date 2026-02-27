/**
 * 实时物品识别服务
 * 
 * 使用 TensorFlow.js + COCO-SSD 模型进行实时物品识别
 * 支持浏览器端实时识别，无需上传图片到服务器
 * 
 * 支持识别的物品类别（COCO数据集80类）：
 * - 人物：person
 * - 交通工具：bicycle, car, motorcycle, airplane, bus, train, truck, boat
 * - 家具：chair, couch, bed, dining table, toilet
 * - 电子设备：tv, laptop, mouse, remote, keyboard, cell phone
 * - 厨房用品：bottle, wine glass, cup, fork, knife, spoon, bowl
 * - 食物：banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake
 * - 日常用品：backpack, umbrella, handbag, tie, suitcase, frisbee, skis, snowboard, sports ball, kite
 * - 动物：bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe
 * - 其他：book, clock, vase, scissors, teddy bear, hair drier, toothbrush
 */

// 物品类别映射（英文 -> 中文）
export const OBJECT_LABELS: Record<string, string> = {
  // 人物
  'person': '人',
  
  // 交通工具
  'bicycle': '自行车',
  'car': '汽车',
  'motorcycle': '摩托车',
  'airplane': '飞机',
  'bus': '公共汽车',
  'train': '火车',
  'truck': '卡车',
  'boat': '船',
  
  // 家具
  'chair': '椅子',
  'couch': '沙发',
  'bed': '床',
  'dining table': '餐桌',
  'toilet': '马桶',
  
  // 电子设备
  'tv': '电视',
  'laptop': '笔记本电脑',
  'mouse': '鼠标',
  'remote': '遥控器',
  'keyboard': '键盘',
  'cell phone': '手机',
  
  // 厨房用品
  'bottle': '瓶子',
  'wine glass': '酒杯',
  'cup': '杯子',
  'fork': '叉子',
  'knife': '刀',
  'spoon': '勺子',
  'bowl': '碗',
  
  // 食物
  'banana': '香蕉',
  'apple': '苹果',
  'sandwich': '三明治',
  'orange': '橙子',
  'broccoli': '西兰花',
  'carrot': '胡萝卜',
  'hot dog': '热狗',
  'pizza': '披萨',
  'donut': '甜甜圈',
  'cake': '蛋糕',
  
  // 日常用品
  'backpack': '背包',
  'umbrella': '雨伞',
  'handbag': '手提包',
  'tie': '领带',
  'suitcase': '行李箱',
  'frisbee': '飞盘',
  'skis': '滑雪板',
  'snowboard': '滑雪板',
  'sports ball': '运动球',
  'kite': '风筝',
  'baseball bat': '棒球棒',
  'baseball glove': '棒球手套',
  'skateboard': '滑板',
  'surfboard': '冲浪板',
  'tennis racket': '网球拍',
  
  // 动物
  'bird': '鸟',
  'cat': '猫',
  'dog': '狗',
  'horse': '马',
  'sheep': '羊',
  'cow': '牛',
  'elephant': '大象',
  'bear': '熊',
  'zebra': '斑马',
  'giraffe': '长颈鹿',
  
  // 其他
  'book': '书',
  'clock': '时钟',
  'vase': '花瓶',
  'scissors': '剪刀',
  'teddy bear': '泰迪熊',
  'hair drier': '吹风机',
  'toothbrush': '牙刷',
  'potted plant': '盆栽',
  'sink': '水槽',
  'refrigerator': '冰箱',
  'oven': '烤箱',
  'microwave': '微波炉',
  'toaster': '烤面包机',
};

// 物品分类
export const OBJECT_CATEGORIES = {
  '房间类': ['chair', 'couch', 'bed', 'dining table', 'toilet', 'sink', 'potted plant'],
  '日常物品类': ['backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'book', 'clock', 'vase', 'scissors'],
  '厨房用品类': ['bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'refrigerator', 'oven', 'microwave'],
  '电子设备类': ['tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone'],
  '交通工具类': ['bicycle', 'car', 'motorcycle', 'bus', 'train', 'truck'],
  '洗漱用品类': ['toothbrush', 'hair drier', 'sink', 'toilet'],
};

// 检测结果接口
export interface DetectionResult {
  class: string;
  label: string; // 中文标签
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

class RealtimeObjectDetectionService {
  private model: any = null;
  private isModelLoading = false;
  private isModelLoaded = false;

  /**
   * 加载 COCO-SSD 模型
   */
  async loadModel(): Promise<void> {
    if (this.isModelLoaded) {
      console.log('✅ 模型已加载');
      return;
    }

    if (this.isModelLoading) {
      console.log('⏳ 模型正在加载中...');
      // 等待模型加载完成
      while (this.isModelLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    try {
      this.isModelLoading = true;
      console.log('📦 开始加载 COCO-SSD 模型...');

      // 动态导入 TensorFlow.js 和 COCO-SSD
      const [tf, cocoSsd] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/coco-ssd'),
      ]);

      // 设置 TensorFlow.js 后端
      await tf.ready();
      console.log('✅ TensorFlow.js 已就绪，后端:', tf.getBackend());

      // 加载 COCO-SSD 模型
      this.model = await cocoSsd.load();
      this.isModelLoaded = true;
      this.isModelLoading = false;

      console.log('✅ COCO-SSD 模型加载成功');
    } catch (error) {
      this.isModelLoading = false;
      console.error('❌ 模型加载失败:', error);
      throw new Error('模型加载失败，请检查网络连接');
    }
  }

  /**
   * 检测图像中的物品
   * @param imageElement 图像元素（video 或 img）
   * @returns 检测结果数组
   */
  async detect(imageElement: HTMLVideoElement | HTMLImageElement): Promise<DetectionResult[]> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }

    try {
      const predictions = await this.model.detect(imageElement);

      // 转换为统一格式
      const results: DetectionResult[] = predictions.map((pred: any) => ({
        class: pred.class,
        label: OBJECT_LABELS[pred.class] || pred.class,
        score: pred.score,
        bbox: pred.bbox,
      }));

      return results;
    } catch (error) {
      console.error('❌ 物品检测失败:', error);
      return [];
    }
  }

  /**
   * 验证是否检测到目标物品
   * @param detections 检测结果
   * @param targetObjects 目标物品列表（英文类名）
   * @param minConfidence 最小置信度（0-1）
   * @returns 匹配结果
   */
  verifyObjects(
    detections: DetectionResult[],
    targetObjects: string[],
    minConfidence: number = 0.5
  ): {
    matched: boolean;
    matchedObjects: string[];
    unmatchedObjects: string[];
    detectedObjects: DetectionResult[];
  } {
    // 过滤低置信度的检测结果
    const validDetections = detections.filter(d => d.score >= minConfidence);

    // 检查每个目标物品是否被检测到
    const matchedObjects: string[] = [];
    const unmatchedObjects: string[] = [];

    for (const target of targetObjects) {
      const found = validDetections.some(d => d.class === target);
      if (found) {
        matchedObjects.push(target);
      } else {
        unmatchedObjects.push(target);
      }
    }

    return {
      matched: matchedObjects.length > 0,
      matchedObjects,
      unmatchedObjects,
      detectedObjects: validDetections,
    };
  }

  /**
   * 获取所有支持的物品列表
   */
  getSupportedObjects(): { class: string; label: string }[] {
    return Object.entries(OBJECT_LABELS).map(([cls, label]) => ({
      class: cls,
      label,
    }));
  }

  /**
   * 获取分类物品列表
   */
  getCategorizedObjects(): Record<string, { class: string; label: string }[]> {
    const result: Record<string, { class: string; label: string }[]> = {};

    for (const [category, classes] of Object.entries(OBJECT_CATEGORIES)) {
      result[category] = classes.map(cls => ({
        class: cls,
        label: OBJECT_LABELS[cls] || cls,
      }));
    }

    return result;
  }
}

// 导出单例
export const realtimeObjectDetection = new RealtimeObjectDetectionService();

