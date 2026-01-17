// ============================================================
// 增强语音引擎 v1.0
// 支持多种高质量TTS服务，更自然、有感情的语音
// ============================================================

const EnhancedTTS = {
    version: '1.0.0',
    
    // 当前引擎
    currentEngine: 'browser', // browser, edge, azure, elevenlabs
    
    // 设置
    settings: {
        engine: 'edge',           // 默认使用Edge TTS（免费且高质量）
        voice: 'zh-CN-XiaoxiaoNeural',  // 默认语音
        rate: 1.0,                // 语速 0.5-2.0
        pitch: 1.0,               // 音调 0.5-2.0
        volume: 1.0,              // 音量 0-1
        emotion: 'friendly',      // 情感风格
        emotionIntensity: 1.0,    // 情感强度 0.5-2.0
        useSSML: true,            // 使用SSML增强表达
        autoAdjustSpeed: true     // 根据内容自动调整语速
    },
    
    // Edge TTS 语音列表（免费高质量）
    edgeVoices: [
        { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (女声-活泼)', gender: 'female', style: ['cheerful', 'angry', 'sad', 'fearful'] },
        { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (女声-温柔)', gender: 'female', style: ['cheerful', 'sad', 'angry'] },
        { id: 'zh-CN-YunjianNeural', name: '云健 (男声-阳光)', gender: 'male', style: ['cheerful', 'sad', 'angry'] },
        { id: 'zh-CN-YunxiNeural', name: '云希 (男声-少年)', gender: 'male', style: ['cheerful', 'sad', 'angry', 'fearful'] },
        { id: 'zh-CN-YunxiaNeural', name: '云夏 (男声-儿童)', gender: 'male', style: [] },
        { id: 'zh-CN-YunyangNeural', name: '云扬 (男声-新闻)', gender: 'male', style: [] },
        { id: 'zh-CN-liaoning-XiaobeiNeural', name: '晓北 (东北话)', gender: 'female', style: [] },
        { id: 'zh-CN-shaanxi-XiaoniNeural', name: '晓妮 (陕西话)', gender: 'female', style: [] },
        { id: 'zh-TW-HsiaoChenNeural', name: '曉臻 (台湾女声)', gender: 'female', style: [] },
        { id: 'zh-TW-YunJheNeural', name: '雲哲 (台湾男声)', gender: 'male', style: [] }
    ],
    
    // 情感映射
    emotionMap: {
        'happy': { style: 'cheerful', rate: 1.1, pitch: 1.1 },
        'excited': { style: 'cheerful', rate: 1.2, pitch: 1.15 },
        'friendly': { style: 'friendly', rate: 1.0, pitch: 1.0 },
        'calm': { style: 'calm', rate: 0.9, pitch: 0.95 },
        'serious': { style: 'serious', rate: 0.95, pitch: 0.9 },
        'sad': { style: 'sad', rate: 0.85, pitch: 0.85 },
        'angry': { style: 'angry', rate: 1.1, pitch: 1.05 },
        'fearful': { style: 'fearful', rate: 1.15, pitch: 1.1 },
        'gentle': { style: 'gentle', rate: 0.9, pitch: 1.0 },
        'encouraging': { style: 'cheerful', rate: 1.05, pitch: 1.05 }
    },
    
    // 音频队列
    audioQueue: [],
    isPlaying: false,
    currentAudio: null,
    
    // ==================== 初始化 ====================
    
    init() {
        console.log('EnhancedTTS 初始化...');
        this.loadSettings();
        console.log('EnhancedTTS 初始化完成，当前引擎:', this.settings.engine);
    },
    
    loadSettings() {
        const saved = localStorage.getItem('enhanced_tts_settings');
        if (saved) {
            Object.assign(this.settings, JSON.parse(saved));
        }
    },
    
    saveSettings() {
        localStorage.setItem('enhanced_tts_settings', JSON.stringify(this.settings));
    },
    
    // ==================== 主要API ====================
    
    /**
     * 智能语音播报 - 根据内容自动调整情感和语速
     * @param {string} text - 要播报的文本
     * @param {object} options - 可选参数
     */
    async speak(text, options = {}) {
        if (!text || text.trim().length === 0) return;
        
        // 分析文本情感
        const analysis = this.analyzeText(text);
        
        // 合并选项
        const finalOptions = {
            ...this.settings,
            ...analysis,
            ...options
        };
        
        console.log('EnhancedTTS 播报:', text.substring(0, 50), '情感:', finalOptions.emotion);
        
        // 根据引擎选择播报方式
        switch (this.settings.engine) {
            case 'edge':
                return this.speakWithEdge(text, finalOptions);
            case 'browser':
            default:
                return this.speakWithBrowser(text, finalOptions);
        }
    },
    
    /**
     * 分析文本，自动识别情感和调整参数
     */
    analyzeText(text) {
        const result = {
            emotion: 'friendly',
            rate: this.settings.rate,
            pitch: this.settings.pitch
        };
        
        // 情感关键词检测
        const emotionKeywords = {
            happy: ['太棒了', '恭喜', '成功', '完成', '获得', '奖励', '厉害', '优秀', '加油'],
            excited: ['哇', '太好了', '超级', '非常棒', '惊喜', '激动'],
            sad: ['抱歉', '遗憾', '失败', '错过', '可惜'],
            angry: ['警告', '超时', '拖延', '扣除', '惩罚', '严重'],
            fearful: ['紧急', '马上', '立即', '快', '还有', '秒'],
            encouraging: ['继续', '坚持', '相信', '可以的', '没关系', '下次'],
            calm: ['提醒', '注意', '建议', '温馨'],
            gentle: ['晚安', '早安', '休息', '放松']
        };
        
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    result.emotion = emotion;
                    const emotionConfig = this.emotionMap[emotion];
                    if (emotionConfig) {
                        result.rate = this.settings.rate * emotionConfig.rate;
                        result.pitch = this.settings.pitch * emotionConfig.pitch;
                    }
                    break;
                }
            }
        }
        
        // 根据文本长度调整语速
        if (this.settings.autoAdjustSpeed) {
            if (text.length > 50) {
                result.rate *= 1.1; // 长文本稍快
            } else if (text.length < 10) {
                result.rate *= 0.95; // 短文本稍慢
            }
        }
        
        // 检测标点符号调整
        if (text.includes('！') || text.includes('!')) {
            result.pitch *= 1.05;
        }
        if (text.includes('？') || text.includes('?')) {
            result.pitch *= 1.08;
        }
        
        return result;
    },
    
    // ==================== Edge TTS（推荐）====================
    
    /**
     * 使用Edge TTS播报（通过免费API）
     */
    async speakWithEdge(text, options) {
        try {
            console.log('尝试使用 Edge TTS，语音:', options.voice, '情感:', options.emotion);
            
            // 使用免费的Edge TTS API
            const voice = options.voice || this.settings.voice;
            const rate = Math.round((options.rate - 1) * 100);
            const pitch = Math.round((options.pitch - 1) * 50);
            
            // 编码参数
            const params = new URLSearchParams({
                text: text,
                voice: voice,
                rate: `${rate >= 0 ? '+' : ''}${rate}%`,
                pitch: `${pitch >= 0 ? '+' : ''}${pitch}Hz`
            });
            
            // 使用公共Edge TTS服务
            const apiUrl = `https://api.tts.quest/v1/tts?${params.toString()}`;
            console.log('Edge TTS API URL:', apiUrl);
            
            // 创建音频并播放
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.volume = options.volume || this.settings.volume;
                
                // 设置超时（5秒）
                const timeout = setTimeout(() => {
                    console.warn('Edge TTS 超时，回退到浏览器TTS');
                    audio.src = '';
                    this.speakWithBrowser(text, options).then(resolve).catch(reject);
                }, 5000);
                
                audio.onended = () => {
                    clearTimeout(timeout);
                    this.isPlaying = false;
                    this.currentAudio = null;
                    console.log('Edge TTS 播放完成');
                    resolve();
                };
                
                audio.onerror = (e) => {
                    clearTimeout(timeout);
                    console.warn('Edge TTS失败，回退到浏览器TTS:', e);
                    this.speakWithBrowser(text, options).then(resolve).catch(reject);
                };
                
                audio.onloadstart = () => {
                    console.log('Edge TTS 开始加载音频');
                };
                
                audio.oncanplay = () => {
                    clearTimeout(timeout);
                    console.log('Edge TTS 音频可以播放');
                };
                
                audio.src = apiUrl;
                this.currentAudio = audio;
                this.isPlaying = true;
                audio.play().catch(e => {
                    clearTimeout(timeout);
                    console.warn('播放失败，回退到浏览器TTS:', e);
                    this.speakWithBrowser(text, options).then(resolve).catch(reject);
                });
            });
        } catch (e) {
            console.warn('Edge TTS错误，回退到浏览器TTS:', e);
            return this.speakWithBrowser(text, options);
        }
    },
    
    /**
     * 构建SSML标记语言（用于更丰富的表达）
     */
    buildSSML(text, options) {
        const voice = options.voice || this.settings.voice;
        const rate = options.rate || 1.0;
        const pitch = options.pitch || 1.0;
        const emotion = options.emotion || 'friendly';
        
        // 获取情感风格
        const emotionConfig = this.emotionMap[emotion] || {};
        const style = emotionConfig.style || 'general';
        
        // 检查语音是否支持该风格
        const voiceInfo = this.edgeVoices.find(v => v.id === voice);
        const supportsStyle = voiceInfo && voiceInfo.style && voiceInfo.style.includes(style);
        
        let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">`;
        ssml += `<voice name="${voice}">`;
        
        if (supportsStyle) {
            ssml += `<mstts:express-as style="${style}" styledegree="${options.emotionIntensity || 1.0}">`;
        }
        
        ssml += `<prosody rate="${Math.round(rate * 100)}%" pitch="${Math.round((pitch - 1) * 50)}%">`;
        ssml += this.addBreaksToText(text);
        ssml += `</prosody>`;
        
        if (supportsStyle) {
            ssml += `</mstts:express-as>`;
        }
        
        ssml += `</voice></speak>`;
        
        return ssml;
    },
    
    /**
     * 在文本中添加自然停顿
     */
    addBreaksToText(text) {
        return text
            .replace(/([，,])/g, '$1<break time="200ms"/>')
            .replace(/([。.！!？?])/g, '$1<break time="400ms"/>')
            .replace(/([：:])/g, '$1<break time="300ms"/>')
            .replace(/(\n)/g, '<break time="500ms"/>');
    },
    
    // ==================== 浏览器TTS（回退）====================
    
    /**
     * 使用浏览器内置TTS（增强版）
     */
    speakWithBrowser(text, options) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.warn('浏览器不支持语音合成');
                resolve();
                return;
            }
            
            console.log('使用浏览器 TTS，参数:', {
                rate: options.rate,
                pitch: options.pitch,
                volume: options.volume,
                emotion: options.emotion
            });
            
            // 取消之前的播报
            window.speechSynthesis.cancel();
            
            // 等待一小段时间，确保之前的语音已停止
            setTimeout(() => {
                this._speakWithBrowserInternal(text, options, resolve);
            }, 100);
        });
    },
    
    /**
     * 浏览器 TTS 内部实现
     */
    _speakWithBrowserInternal(text, options, resolve) {
        if (!window.speechSynthesis) {
            resolve();
            return;
        }
    /**
     * 浏览器 TTS 内部实现
     */
    _speakWithBrowserInternal(text, options, resolve) {
        if (!window.speechSynthesis) {
            resolve();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        
        // 应用语速、音调、音量设置
        utterance.rate = Math.max(0.5, Math.min(2, options.rate || 1.0));
        utterance.pitch = Math.max(0.5, Math.min(2, options.pitch || 1.0));
        utterance.volume = Math.max(0, Math.min(1, options.volume || 1.0));
        
        console.log('实际应用的参数:', {
            rate: utterance.rate,
            pitch: utterance.pitch,
            volume: utterance.volume
        });
        
        // 选择最佳中文语音
        const voices = window.speechSynthesis.getVoices();
        console.log('可用语音数量:', voices.length);
        
        const preferredVoices = [
            'Microsoft Xiaoxiao Online',
            'Microsoft Yunxi Online',
            'Microsoft Yaoyao Online',
            'Google 普通话（中国大陆）',
            'Google 國語（臺灣）',
            'Ting-Ting',
            'Sin-Ji'
        ];
        
        let selectedVoice = null;
        for (const preferred of preferredVoices) {
            selectedVoice = voices.find(v => v.name.includes(preferred));
            if (selectedVoice) {
                console.log('选择语音:', selectedVoice.name);
                break;
            }
        }
        
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('zh'));
            if (selectedVoice) {
                console.log('使用备选中文语音:', selectedVoice.name);
            }
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            console.warn('未找到中文语音，使用默认语音');
        }
        
        utterance.onstart = () => {
            console.log('浏览器 TTS 开始播放');
            this.isPlaying = true;
        };
        
        utterance.onend = () => {
            this.isPlaying = false;
            console.log('浏览器 TTS 播放完成');
            resolve();
        };
        
        utterance.onerror = (e) => {
            this.isPlaying = false;
            console.error('浏览器 TTS 错误:', e.error, e);
            // 即使出错也 resolve，避免卡住
            resolve();
        };
        
        // 确保语音列表已加载
        if (voices.length === 0) {
            console.log('等待语音列表加载...');
            window.speechSynthesis.onvoiceschanged = () => {
                console.log('语音列表已加载，重新尝试');
                this._speakWithBrowserInternal(text, options, resolve);
            };
        } else {
            try {
                window.speechSynthesis.speak(utterance);
                console.log('已调用 speechSynthesis.speak()');
            } catch (e) {
                console.error('调用 speak() 失败:', e);
                this.isPlaying = false;
                resolve();
            }
        }
    },
    
    // ==================== 控制方法 ====================
    
    /**
     * 停止播报
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.isPlaying = false;
        this.audioQueue = [];
    },
    
    /**
     * 暂停播报
     */
    pause() {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.pause();
        }
    },
    
    /**
     * 继续播报
     */
    resume() {
        if (this.currentAudio) {
            this.currentAudio.play();
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.resume();
        }
    },
    
    // ==================== 设置方法 ====================
    
    /**
     * 设置语音引擎
     */
    setEngine(engine) {
        this.settings.engine = engine;
        this.saveSettings();
    },
    
    /**
     * 设置语音
     */
    setVoice(voiceId) {
        this.settings.voice = voiceId;
        this.saveSettings();
    },
    
    /**
     * 设置语速
     */
    setRate(rate) {
        this.settings.rate = Math.max(0.5, Math.min(2, rate));
        this.saveSettings();
    },
    
    /**
     * 设置音调
     */
    setPitch(pitch) {
        this.settings.pitch = Math.max(0.5, Math.min(2, pitch));
        this.saveSettings();
    },
    
    /**
     * 设置音量
     */
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    },
    
    /**
     * 设置默认情感
     */
    setEmotion(emotion) {
        this.settings.emotion = emotion;
        this.saveSettings();
    },
    
    /**
     * 获取可用语音列表
     */
    getAvailableVoices() {
        return this.edgeVoices;
    },
    
    /**
     * 测试语音
     */
    async testVoice(voiceId, emotion = 'friendly') {
        const testTexts = {
            happy: '太棒了！你完成了今天的任务，获得了10个金币奖励！',
            sad: '很遗憾，任务超时了，下次要加油哦。',
            angry: '警告！任务已经严重拖延，请立即开始！',
            encouraging: '加油！你可以的，相信自己！',
            calm: '温馨提醒：现在是休息时间，记得放松一下。',
            friendly: '你好！我是你的智能助手，很高兴为你服务。'
        };
        
        const text = testTexts[emotion] || testTexts.friendly;
        
        await this.speak(text, {
            voice: voiceId,
            emotion: emotion
        });
    }
};

// 导出
window.EnhancedTTS = EnhancedTTS;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EnhancedTTS.init());
} else {
    EnhancedTTS.init();
}

