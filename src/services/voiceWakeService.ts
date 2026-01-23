// ============================================
// 语音唤醒和识别服务
// ============================================

export type WakeState = 'sleeping' | 'activated' | 'listening' | 'processing';

export interface VoiceWakeService {
  state: WakeState;
  timer: number;
  transcript: string;
  isListening: boolean;
}

// ============================================
// 唤醒词检测
// ============================================
export class WakeWordDetector {
  private recognition: any = null;
  private isActive = false;
  private wakeWord = 'kiki宝宝';
  private onWakeCallback: (() => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('浏览器不支持语音识别');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'zh-CN';

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
        .toLowerCase()
        .replace(/\s/g, '');

      if (transcript.includes(this.wakeWord.replace(/\s/g, ''))) {
        this.handleWake();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
    };
  }

  private handleWake() {
    if (this.onWakeCallback) {
      this.onWakeCallback();
    }
  }

  start(onWake: () => void) {
    this.onWakeCallback = onWake;
    if (this.recognition && !this.isActive) {
      try {
        this.recognition.start();
        this.isActive = true;
      } catch (error) {
        console.error('启动唤醒词检测失败:', error);
      }
    }
  }

  stop() {
    if (this.recognition && this.isActive) {
      try {
        this.recognition.stop();
        this.isActive = false;
      } catch (error) {
        console.error('停止唤醒词检测失败:', error);
      }
    }
  }
}

// ============================================
// 语音识别服务
// ============================================
export class VoiceRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'zh-CN';

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');

      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      this.isListening = false;
    };
  }

  startListening(onResult: (text: string) => void, onEnd: () => void) {
    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;

    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (error) {
        console.error('启动语音识别失败:', error);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (error) {
        console.error('停止语音识别失败:', error);
      }
    }
  }

  getIsListening() {
    return this.isListening;
  }
}

// ============================================
// 语音合成服务
// ============================================
export class VoiceSynthesisService {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.synth) {
      console.warn('浏览器不支持语音合成');
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      // 停止当前播放
      this.synth!.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      this.synth!.speak(utterance);
    });
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  getIsSpeaking() {
    return this.isSpeaking;
  }
}

// ============================================
// 语音反馈策略
// ============================================
export interface FeedbackStrategy {
  templates: string[];
  animation: string;
  color: string;
  duration: number;
}

export const feedbackStrategies: Record<string, FeedbackStrategy> = {
  success: {
    templates: [
      '太棒了！{action}已完成',
      '完美完成{action}',
      '干得漂亮！{action}搞定了',
      '成功！{action}已经处理好了',
    ],
    animation: 'success',
    color: '#10B981',
    duration: 2000,
  },
  failure: {
    templates: [
      '这次没成功，下次加油',
      '我们再来一次？',
      '别灰心，再试试看',
      '没关系，失败是成功之母',
    ],
    animation: 'warning',
    color: '#F59E0B',
    duration: 3000,
  },
  important: {
    templates: [
      '注意！{message}',
      '重要提醒：{message}',
      '请注意：{message}',
    ],
    animation: 'alert',
    color: '#EF4444',
    duration: 3000,
  },
  confirm: {
    templates: [
      '请确认：{message}',
      '需要你确认一下：{message}',
      '确定要{message}吗？',
    ],
    animation: 'question',
    color: '#3B82F6',
    duration: 4000,
  },
};

export class VoiceFeedbackService {
  private voiceSynthesis: VoiceSynthesisService;

  constructor() {
    this.voiceSynthesis = new VoiceSynthesisService();
  }

  async provideFeedback(
    type: keyof typeof feedbackStrategies,
    params: Record<string, string> = {}
  ): Promise<{ text: string; strategy: FeedbackStrategy }> {
    const strategy = feedbackStrategies[type];
    
    // 随机选择一个模板
    const template = strategy.templates[Math.floor(Math.random() * strategy.templates.length)];
    
    // 替换参数
    let text = template;
    Object.entries(params).forEach(([key, value]) => {
      text = text.replace(`{${key}}`, value);
    });

    // 播放语音
    await this.voiceSynthesis.speak(text);

    return { text, strategy };
  }

  stop() {
    this.voiceSynthesis.stop();
  }
}

// ============================================
// 设备反馈（震动、提示音）
// ============================================
export class DeviceFeedbackService {
  // 震动
  vibrate(pattern: number | number[] = 200) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // 播放提示音
  playSound(type: 'wake' | 'success' | 'error' | 'warning') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 不同类型的提示音
    const sounds = {
      wake: { frequency: 800, duration: 0.1 },
      success: { frequency: 600, duration: 0.15 },
      error: { frequency: 300, duration: 0.2 },
      warning: { frequency: 500, duration: 0.15 },
    };

    const sound = sounds[type];
    oscillator.frequency.value = sound.frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
  }
}

