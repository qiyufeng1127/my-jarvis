// ============================================
// 任务验证和启动系统
// ============================================

export interface TaskVerification {
  enabled: boolean;
  keywords: string[]; // AI生成的关键词
  startDeadline: Date; // 启动截止时间（2分钟）
  completionDeadline: Date; // 完成截止时间
  failedAttempts: number; // 失败次数
  status: 'pending' | 'started' | 'completed' | 'failed';
}

export interface TaskImage {
  id: string;
  url: string;
  type: 'cover' | 'attachment' | 'verification';
  uploadedAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// ============================================
// AI 生成验证关键词
// ============================================
export async function generateVerificationKeywords(
  taskTitle: string,
  taskType: string,
  apiKey: string,
  apiEndpoint: string
): Promise<string[]> {
  const prompt = `你是一个任务验证助手。请为以下任务生成3-5个验证关键词，用于图片识别验证。

任务标题：${taskTitle}
任务类型：${taskType}

要求：
1. 关键词应该是具体的、可视化的物体或场景
2. 关键词应该与任务完成状态相关
3. 返回JSON数组格式：["关键词1", "关键词2", "关键词3"]

示例：
- 任务"洗碗" → ["洗干净的碗", "水槽", "洗洁精", "干净的厨房"]
- 任务"跑步" → ["运动鞋", "室外", "跑道", "运动服"]
- 任务"学习" → ["书本", "笔记", "电脑屏幕", "书桌"]
- 任务"整理桌面" → ["整洁的桌面", "收纳盒", "干净的桌子"]

只返回JSON数组，不要其他文字。`;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个任务验证助手，专门生成任务验证关键词。只返回JSON数组。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error('AI生成失败');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // 提取JSON
    let jsonStr = aiResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    const keywords = JSON.parse(jsonStr);
    console.log('🔑 AI生成验证关键词:', keywords);
    
    return keywords;
  } catch (error) {
    console.error('AI生成关键词失败:', error);
    // 返回默认关键词
    return ['任务相关物品', '工作场景', '完成状态'];
  }
}

// ============================================
// AI 拆解子任务
// ============================================
export async function generateSubTasks(
  taskTitle: string,
  taskDescription: string,
  apiKey: string,
  apiEndpoint: string
): Promise<string[]> {
  const prompt = `你是一个任务拆解助手。请将以下大任务拆解成3-5个容易完成的小任务。

任务标题：${taskTitle}
任务描述：${taskDescription || '无'}

要求：
1. 每个子任务应该是具体的、可执行的
2. 子任务应该按照执行顺序排列
3. 子任务应该简洁明了
4. 返回JSON数组格式：["子任务1", "子任务2", "子任务3"]

示例：
- 任务"写报告" → ["收集资料", "整理大纲", "撰写初稿", "修改润色", "最终检查"]
- 任务"做饭" → ["准备食材", "清洗食材", "切菜", "烹饪", "装盘"]
- 任务"整理房间" → ["收拾桌面", "整理衣物", "打扫地面", "擦拭家具", "垃圾分类"]

只返回JSON数组，不要其他文字。`;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个任务拆解助手，专门将大任务拆解成小任务。只返回JSON数组。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('AI拆解失败');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // 提取JSON
    let jsonStr = aiResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    const subTasks = JSON.parse(jsonStr);
    console.log('📋 AI拆解子任务:', subTasks);
    
    return subTasks;
  } catch (error) {
    console.error('AI拆解失败:', error);
    // 返回默认子任务
    return ['开始准备', '执行任务', '完成收尾'];
  }
}

// ============================================
// 音效播放
// ============================================
export class SoundEffects {
  private static audioContext: AudioContext | null = null;

  // 初始化音频上下文
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // 播放成功音效（叮铃铃）
  static playSuccessSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // 创建三个音符（C-E-G和弦）
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      // 音量包络
      gainNode.gain.setValueAtTime(0, now + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.1 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.3);
      
      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.3);
    });
  }

  // 播放失败音效（低沉的嗡嗡声）
  static playFailSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 200; // 低音
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  // 播放警报音效（连续三次失败）
  static playAlarmSound() {
    const ctx = this.getAudioContext();
    let time = ctx.currentTime;

    // 播放10秒的警报声
    for (let i = 0; i < 20; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // 交替高低音
      oscillator.frequency.value = i % 2 === 0 ? 800 : 600;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.4, time);
      gainNode.gain.setValueAtTime(0, time + 0.25);
      
      oscillator.start(time);
      oscillator.stop(time + 0.25);
      
      time += 0.5;
    }
  }

  // 播放金币掉落音效
  static playCoinSound() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // 快速上升的音调
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
}

// ============================================
// 图片上传和处理
// ============================================
export class ImageUploader {
  // 上传图片到本地存储（实际项目中应该上传到服务器）
  static async uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve(dataUrl);
      };
      
      reader.onerror = () => {
        reject(new Error('图片上传失败'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // 压缩图片
  static async compressImage(file: File, maxWidth: number = 800): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('压缩失败'));
            }
          }, 'image/jpeg', 0.8);
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    });
  }
}

