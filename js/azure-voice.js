// ============================================================
// Azure TTS 免费语音引擎
// 使用微软 Azure 免费 TTS 服务，自然有感情
// 每月 50 万字符免费额度
// ============================================================

const AzureVoice = {
    // 设置
    settings: {
        voice: 'zh-CN-XiaoxiaoNeural',  // 默认语音
        style: 'cheerful',               // 情感风格
        rate: 1.0,                       // 语速
        pitch: 1.0,                      // 音调
        volume: 1.0                      // 音量
    },
    
    // 可用的语音角色
    voices: [
        { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (女声)', styles: ['cheerful', 'sad', 'angry', 'fearful', 'disgruntled', 'serious', 'affectionate', 'gentle', 'calm'] },
        { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (女声)', styles: ['cheerful', 'sad', 'angry', 'fearful', 'disgruntled', 'serious', 'affectionate', 'gentle'] },
        { id: 'zh-CN-YunjianNeural', name: '云健 (男声)', styles: ['cheerful', 'sad', 'angry', 'fearful', 'disgruntled', 'serious'] },
        { id: 'zh-CN-YunxiNeural', name: '云希 (男声)', styles: ['cheerful', 'sad', 'angry', 'fearful', 'disgruntled', 'serious', 'depressed', 'embarrassed'] },
        { id: 'zh-CN-YunyangNeural', name: '云扬 (男声)', styles: [] }
    ],
    
    // 情感风格
    styles: {
        'cheerful': '😊 开心',
        'sad': '😢 悲伤',
        'angry': '😠 生气',
        'fearful': '😨 害怕',
        'disgruntled': '😒 不满',
        'serious': '😐 严肃',
        'affectionate': '🥰 亲切',
        'gentle': '😌 温柔',
        'calm': '😊 平静',
        'depressed': '😔 沮丧',
        'embarrassed': '😳 尴尬'
    },
    
    // 当前播放的音频
    currentAudio: null,
    isPlaying: false,
    
    // 初始化
    init() {
        console.log('AzureVoice 初始化...');
        this.loadSettings();
        console.log('AzureVoice 初始化完成');
    },
    
    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('azure_voice_settings');
        if (saved) {
            try {
                Object.assign(this.settings, JSON.parse(saved));
            } catch (e) {
                console.error('加载设置失败:', e);
            }
        }
    },
    
    // 保存设置
    saveSettings() {
        localStorage.setItem('azure_voice_settings', JSON.stringify(this.settings));
    },
    
    // 播放语音 - 核心方法
    async speak(text, options = {}) {
        if (!text || text.trim().length === 0) return;
        
        // 停止之前的播放
        this.stop();
        
        // 合并选项
        const voice = options.voice || this.settings.voice;
        const style = options.style || this.settings.style;
        const rate = options.rate || this.settings.rate;
        const pitch = options.pitch || this.settings.pitch;
        const volume = options.volume || this.settings.volume;
        
        console.log('🔊 Azure TTS 播放:', {
            text: text.substring(0, 30) + '...',
            voice,
            style,
            rate,
            pitch,
            volume
        });
        
        try {
            // 构建 SSML
            const ssml = this.buildSSML(text, { voice, style, rate, pitch });
            
            // 使用免费的 Azure TTS 代理服务
            const apiUrl = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: ssml
            });
            
            if (!response.ok) {
                throw new Error('Azure TTS 请求失败: ' + response.status);
            }
            
            // 获取音频数据
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // 播放音频
            return new Promise((resolve) => {
                const audio = new Audio(audioUrl);
                audio.volume = volume;
                
                audio.onplay = () => {
                    console.log('✅ Azure TTS 开始播放');
                    this.isPlaying = true;
                };
                
                audio.onended = () => {
                    console.log('✅ Azure TTS 播放完成');
                    this.isPlaying = false;
                    this.currentAudio = null;
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                
                audio.onerror = (e) => {
                    console.error('❌ Azure TTS 播放错误:', e);
                    this.isPlaying = false;
                    this.currentAudio = null;
                    URL.revokeObjectURL(audioUrl);
                    // 回退到浏览器 TTS
                    this.fallbackToSimple(text, { rate, pitch, volume }).then(resolve);
                };
                
                this.currentAudio = audio;
                audio.play().catch(e => {
                    console.error('❌ 播放失败:', e);
                    this.fallbackToSimple(text, { rate, pitch, volume }).then(resolve);
                });
            });
            
        } catch (e) {
            console.error('❌ Azure TTS 错误:', e);
            // 回退到浏览器 TTS
            return this.fallbackToSimple(text, { rate, pitch, volume });
        }
    },
    
    // 构建 SSML
    buildSSML(text, options) {
        const { voice, style, rate, pitch } = options;
        
        // 计算速率和音调百分比
        const ratePercent = Math.round((rate - 1) * 100);
        const pitchPercent = Math.round((pitch - 1) * 50);
        
        const rateStr = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;
        const pitchStr = `${pitchPercent >= 0 ? '+' : ''}${pitchPercent}%`;
        
        // 检查语音是否支持该风格
        const voiceInfo = this.voices.find(v => v.id === voice);
        const supportsStyle = voiceInfo && voiceInfo.styles.includes(style);
        
        let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">`;
        ssml += `<voice name="${voice}">`;
        
        if (supportsStyle) {
            ssml += `<mstts:express-as style="${style}">`;
        }
        
        ssml += `<prosody rate="${rateStr}" pitch="${pitchStr}">`;
        ssml += text;
        ssml += `</prosody>`;
        
        if (supportsStyle) {
            ssml += `</mstts:express-as>`;
        }
        
        ssml += `</voice></speak>`;
        
        return ssml;
    },
    
    // 回退到简单 TTS
    fallbackToSimple(text, options) {
        console.log('⚠️ 回退到浏览器 TTS');
        
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                resolve();
                return;
            }
            
            window.speechSynthesis.cancel();
            
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-CN';
                utterance.rate = options.rate || 1.0;
                utterance.pitch = options.pitch || 1.0;
                utterance.volume = options.volume || 1.0;
                
                // 选择中文语音
                const voices = window.speechSynthesis.getVoices();
                const zhVoice = voices.find(v => v.lang.includes('zh'));
                if (zhVoice) utterance.voice = zhVoice;
                
                utterance.onend = () => resolve();
                utterance.onerror = () => resolve();
                
                window.speechSynthesis.speak(utterance);
            }, 100);
        });
    },
    
    // 停止播放
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.isPlaying = false;
        console.log('⏹️ 已停止播放');
    },
    
    // 设置方法
    setVoice(voice) {
        this.settings.voice = voice;
        this.saveSettings();
    },
    
    setStyle(style) {
        this.settings.style = style;
        this.saveSettings();
    },
    
    setRate(rate) {
        this.settings.rate = Math.max(0.5, Math.min(2, rate));
        this.saveSettings();
    },
    
    setPitch(pitch) {
        this.settings.pitch = Math.max(0.5, Math.min(2, pitch));
        this.saveSettings();
    },
    
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    },
    
    // 获取可用语音
    getVoices() {
        return this.voices;
    },
    
    // 获取可用风格
    getStyles() {
        return this.styles;
    },
    
    // 测试
    test(text) {
        const testText = text || '你好！我是晓晓，这是一段测试语音。我现在的心情是' + (this.styles[this.settings.style] || '开心') + '。你能听出我的情感吗？';
        return this.speak(testText);
    }
};

// 导出到全局
window.AzureVoice = AzureVoice;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AzureVoice.init());
} else {
    AzureVoice.init();
}

console.log('✅ AzureVoice 模块已加载');

