/**
 * 百度语音识别服务
 * 支持实时语音识别和语音合成
 */

interface BaiduVoiceConfig {
  apiKey: string;
  secretKey: string;
}

interface RecognitionResult {
  success: boolean;
  text?: string;
  error?: string;
}

class BaiduVoiceRecognitionService {
  private config: BaiduVoiceConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  /**
   * 配置百度语音API
   */
  configure(apiKey: string, secretKey: string) {
    this.config = { apiKey, secretKey };
    this.accessToken = null;
    this.tokenExpireTime = 0;
    
    // 保存到 localStorage
    localStorage.setItem('baidu_voice_api_key', apiKey);
    localStorage.setItem('baidu_voice_secret_key', secretKey);
    
    console.log('✅ 百度语音API配置已保存');
  }

  /**
   * 从 localStorage 加载配置
   */
  loadConfig() {
    const apiKey = localStorage.getItem('baidu_voice_api_key');
    const secretKey = localStorage.getItem('baidu_voice_secret_key');
    
    if (apiKey && secretKey) {
      this.config = { apiKey, secretKey };
      console.log('✅ 已加载百度语音API配置');
      return true;
    }
    
    return false;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config !== null;
  }

  /**
   * 获取 Access Token
   */
  private async getAccessToken(): Promise<string> {
    // 如果 token 还有效，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    if (!this.config) {
      throw new Error('百度语音API未配置');
    }

    try {
      const response = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.config.apiKey}&client_secret=${this.config.secretKey}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        // token 有效期 30 天，提前 1 天刷新
        this.tokenExpireTime = Date.now() + (data.expires_in - 86400) * 1000;
        console.log('✅ 获取百度语音 Access Token 成功');
        return this.accessToken;
      } else {
        throw new Error(data.error_description || '获取 Access Token 失败');
      }
    } catch (error) {
      console.error('❌ 获取百度语音 Access Token 失败:', error);
      throw error;
    }
  }

  /**
   * 语音识别（将音频转为文字）
   * @param audioBlob 音频 Blob 对象
   * @param format 音频格式（pcm, wav, amr, m4a）
   * @param rate 采样率（8000 或 16000）
   */
  async recognize(audioBlob: Blob, format: string = 'wav', rate: number = 16000): Promise<RecognitionResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: '百度语音API未配置，请在设置中配置API Key和Secret Key'
        };
      }

      const token = await this.getAccessToken();

      // 将 Blob 转为 Base64
      const base64Audio = await this.blobToBase64(audioBlob);

      // 调用百度语音识别API
      const response = await fetch(
        `https://vop.baidu.com/server_api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format,
            rate,
            channel: 1,
            cuid: 'manifestos_user',
            token,
            speech: base64Audio,
            len: audioBlob.size,
          }),
        }
      );

      const data = await response.json();

      if (data.err_no === 0 && data.result && data.result.length > 0) {
        const text = data.result[0];
        console.log('✅ 语音识别成功:', text);
        return {
          success: true,
          text,
        };
      } else {
        const errorMsg = this.getErrorMessage(data.err_no);
        console.error('❌ 语音识别失败:', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('❌ 语音识别异常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 将 Blob 转为 Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 获取错误信息
   */
  private getErrorMessage(errNo: number): string {
    const errorMap: Record<number, string> = {
      3300: '输入参数不正确',
      3301: '音频质量过差',
      3302: '鉴权失败',
      3303: '语音服务器后端问题',
      3304: '用户的请求QPS超限制',
      3305: '用户的日pv（日请求量）超限制',
      3307: '语音服务器后端识别出错问题',
      3308: '音频过长',
      3309: '音频数据问题',
      3310: '输入的音频文件过大',
      3311: '采样率rate参数不在选项里',
      3312: '音频格式format参数不在选项里',
    };

    return errorMap[errNo] || `未知错误 (${errNo})`;
  }

  /**
   * 语音合成（将文字转为语音）
   * 注意：百度语音合成需要单独的API，这里使用浏览器内置的 TTS 作为备选
   */
  async synthesize(text: string): Promise<void> {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * 停止语音播报
   */
  stopSynthesis() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const baiduVoiceRecognition = new BaiduVoiceRecognitionService();


