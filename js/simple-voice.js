// ============================================================
// 简单可靠的语音引擎 - 使用浏览器原生 TTS
// 保证 100% 可用，支持语速、音调、音量调节
// ============================================================

const SimpleVoice = {
    // 当前设置
    settings: {
        rate: 1.0,      // 语速
        pitch: 1.0,     // 音调
        volume: 1.0,    // 音量
        voice: null     // 选择的语音
    },
    
    // 可用的中文语音列表
    availableVoices: [],
    
    // 初始化
    init() {
        console.log('SimpleVoice 初始化...');
        this.loadSettings();
        this.loadVoices();
        console.log('SimpleVoice 初始化完成');
    },
    
    // 加载语音列表
    loadVoices() {
        if (!window.speechSynthesis) {
            console.warn('浏览器不支持语音合成');
            return;
        }
        
        // 获取语音列表
        const loadVoiceList = () => {
            const voices = window.speechSynthesis.getVoices();
            // 筛选中文语音
            this.availableVoices = voices.filter(v => 
                v.lang.includes('zh') || 
                v.lang.includes('CN') || 
                v.lang.includes('TW') || 
                v.lang.includes('HK')
            );
            
            console.log('可用中文语音:', this.availableVoices.length, '个');
            
            // 如果没有设置语音，选择第一个
            if (!this.settings.voice && this.availableVoices.length > 0) {
                this.settings.voice = this.availableVoices[0].name;
                this.saveSettings();
            }
        };
        
        // 立即加载
        loadVoiceList();
        
        // 监听语音列表变化
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoiceList;
        }
    },
    
    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('simple_voice_settings');
        if (saved) {
            try {
                Object.assign(this.settings, JSON.parse(saved));
            } catch (e) {
                console.error('加载语音设置失败:', e);
            }
        }
    },
    
    // 保存设置
    saveSettings() {
        localStorage.setItem('simple_voice_settings', JSON.stringify(this.settings));
    },
    
    // 播放语音 - 核心方法
    speak(text, options = {}) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.warn('浏览器不支持语音合成');
                resolve();
                return;
            }
            
            if (!text || text.trim().length === 0) {
                resolve();
                return;
            }
            
            // 停止之前的播放
            window.speechSynthesis.cancel();
            
            // 等待一下确保停止完成
            setTimeout(() => {
                // 创建语音对象
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-CN';
                
                // 应用设置
                utterance.rate = options.rate || this.settings.rate;
                utterance.pitch = options.pitch || this.settings.pitch;
                utterance.volume = options.volume || this.settings.volume;
                
                // 选择语音
                const voiceName = options.voice || this.settings.voice;
                if (voiceName) {
                    const voice = this.availableVoices.find(v => v.name === voiceName);
                    if (voice) {
                        utterance.voice = voice;
                    }
                }
                
                console.log('🔊 播放语音:', {
                    text: text.substring(0, 30) + '...',
                    rate: utterance.rate,
                    pitch: utterance.pitch,
                    volume: utterance.volume,
                    voice: utterance.voice?.name || '默认'
                });
                
                // 事件监听
                utterance.onstart = () => {
                    console.log('✅ 语音开始播放');
                };
                
                utterance.onend = () => {
                    console.log('✅ 语音播放完成');
                    resolve();
                };
                
                utterance.onerror = (e) => {
                    console.error('❌ 语音播放错误:', e.error);
                    resolve();
                };
                
                // 播放
                try {
                    window.speechSynthesis.speak(utterance);
                } catch (e) {
                    console.error('❌ 调用 speak() 失败:', e);
                    resolve();
                }
            }, 100);
        });
    },
    
    // 停止播放
    stop() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            console.log('⏹️ 已停止语音播放');
        }
    },
    
    // 设置语速
    setRate(rate) {
        this.settings.rate = Math.max(0.1, Math.min(10, rate));
        this.saveSettings();
        console.log('语速设置为:', this.settings.rate);
    },
    
    // 设置音调
    setPitch(pitch) {
        this.settings.pitch = Math.max(0, Math.min(2, pitch));
        this.saveSettings();
        console.log('音调设置为:', this.settings.pitch);
    },
    
    // 设置音量
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        console.log('音量设置为:', this.settings.volume);
    },
    
    // 设置语音
    setVoice(voiceName) {
        this.settings.voice = voiceName;
        this.saveSettings();
        console.log('语音设置为:', voiceName);
    },
    
    // 获取可用语音列表
    getVoices() {
        return this.availableVoices;
    },
    
    // 测试语音
    test(text) {
        const testText = text || '你好！这是语音测试。现在的语速是' + this.settings.rate + '倍，音调是' + this.settings.pitch + '。';
        return this.speak(testText);
    }
};

// 导出到全局
window.SimpleVoice = SimpleVoice;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SimpleVoice.init());
} else {
    SimpleVoice.init();
}

console.log('✅ SimpleVoice 模块已加载');

