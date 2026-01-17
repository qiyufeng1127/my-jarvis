// ============================================================
// 情感语音引擎 - 使用多种免费 TTS 服务
// 自动选择最佳可用服务，支持情感表达
// ============================================================

const EmotionalVoice = {
    // 设置
    settings: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        emotion: 'neutral'  // neutral, happy, sad, angry, calm
    },
    
    // 情感映射到语音参数
    emotionMap: {
        'neutral': { rate: 1.0, pitch: 1.0, text: '' },
        'happy': { rate: 1.15, pitch: 1.15, text: '😊 ' },
        'excited': { rate: 1.25, pitch: 1.2, text: '🎉 ' },
        'sad': { rate: 0.85, pitch: 0.9, text: '😢 ' },
        'angry': { rate: 1.1, pitch: 1.05, text: '😠 ' },
        'calm': { rate: 0.9, pitch: 0.95, text: '😌 ' },
        'gentle': { rate: 0.95, pitch: 1.05, text: '🌸 ' },
        'encouraging': { rate: 1.05, pitch: 1.1, text: '💪 ' }
    },
    
    currentAudio: null,
    isPlaying: false,
    
    // 初始化
    init() {
        console.log('EmotionalVoice 初始化...');
        this.loadSettings();
        console.log('EmotionalVoice 初始化完成');
    },
    
    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('emotional_voice_settings');
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
        localStorage.setItem('emotional_voice_settings', JSON.stringify(this.settings));
    },
    
    // 播放语音 - 核心方法
    async speak(text, options = {}) {
        if (!text || text.trim().length === 0) return;
        
        // 停止之前的播放
        this.stop();
        
        // 合并选项
        const emotion = options.emotion || this.settings.emotion;
        const baseRate = options.rate || this.settings.rate;
        const basePitch = options.pitch || this.settings.pitch;
        const volume = options.volume || this.settings.volume;
        
        // 应用情感调整
        const emotionConfig = this.emotionMap[emotion] || this.emotionMap.neutral;
        const finalRate = baseRate * emotionConfig.rate;
        const finalPitch = basePitch * emotionConfig.pitch;
        
        console.log('🔊 情感语音播放:', {
            text: text.substring(0, 30) + '...',
            emotion,
            rate: finalRate.toFixed(2),
            pitch: finalPitch.toFixed(2),
            volume
        });
        
        // 尝试使用 Google TTS（免费，无需密钥）
        try {
            await this.speakWithGoogle(text, { rate: finalRate, pitch: finalPitch, volume });
        } catch (e) {
            console.warn('Google TTS 失败，使用浏览器 TTS:', e);
            await this.speakWithBrowser(text, { rate: finalRate, pitch: finalPitch, volume });
        }
    },
    
    // 使用 Google TTS
    async speakWithGoogle(text, options) {
        // Google Translate TTS API（免费，无需密钥）
        const encodedText = encodeURIComponent(text);
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodedText}`;
        
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            audio.volume = options.volume;
            
            // 使用 Web Audio API 调整语速和音调
            if (options.rate !== 1.0 || options.pitch !== 1.0) {
                this.applyAudioEffects(audio, options.rate, options.pitch);
            }
            
            audio.onplay = () => {
                console.log('✅ Google TTS 开始播放');
                this.isPlaying = true;
            };
            
            audio.onended = () => {
                console.log('✅ Google TTS 播放完成');
                this.isPlaying = false;
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = (e) => {
                console.error('❌ Google TTS 错误:', e);
                this.isPlaying = false;
                this.currentAudio = null;
                reject(e);
            };
            
            this.currentAudio = audio;
            audio.play().catch(reject);
        });
    },
    
    // 使用浏览器 TTS（回退方案）
    async speakWithBrowser(text, options) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.warn('浏览器不支持语音合成');
                resolve();
                return;
            }
            
            window.speechSynthesis.cancel();
            
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-CN';
                utterance.rate = Math.max(0.1, Math.min(10, options.rate));
                utterance.pitch = Math.max(0, Math.min(2, options.pitch));
                utterance.volume = options.volume;
                
                // 选择最佳中文语音
                const voices = window.speechSynthesis.getVoices();
                const preferredNames = ['Xiaoxiao', 'Yunxi', 'Yaoyao', '普通话', '國語'];
                let selectedVoice = null;
                
                for (const name of preferredNames) {
                    selectedVoice = voices.find(v => v.name.includes(name) && v.lang.includes('zh'));
                    if (selectedVoice) break;
                }
                
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang.includes('zh'));
                }
                
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    console.log('使用语音:', selectedVoice.name);
                }
                
                utterance.onstart = () => {
                    console.log('✅ 浏览器 TTS 开始播放');
                    this.isPlaying = true;
                };
                
                utterance.onend = () => {
                    console.log('✅ 浏览器 TTS 播放完成');
                    this.isPlaying = false;
                    resolve();
                };
                
                utterance.onerror = (e) => {
                    console.error('❌ 浏览器 TTS 错误:', e.error);
                    this.isPlaying = false;
                    resolve();
                };
                
                window.speechSynthesis.speak(utterance);
            }, 100);
        });
    },
    
    // 应用音频效果（语速和音调）
    applyAudioEffects(audio, rate, pitch) {
        // 注意：Web Audio API 的 playbackRate 可以改变语速
        // 但改变音调需要更复杂的处理，这里简化处理
        audio.playbackRate = rate;
        // 音调调整在浏览器 TTS 中实现
    },
    
    // 停止播放
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.isPlaying = false;
        console.log('⏹️ 已停止播放');
    },
    
    // 设置方法
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
    
    setEmotion(emotion) {
        this.settings.emotion = emotion;
        this.saveSettings();
    },
    
    // 获取可用情感
    getEmotions() {
        return Object.keys(this.emotionMap).map(key => ({
            id: key,
            name: this.emotionMap[key].text + key
        }));
    },
    
    // 测试
    test(emotion) {
        const testTexts = {
            'neutral': '你好，这是普通的语音测试。',
            'happy': '太棒了！你完成了任务，真是太开心了！',
            'excited': '哇！太厉害了！你真的做到了！',
            'sad': '很遗憾，这次没有成功。不过没关系，下次会更好的。',
            'angry': '警告！任务已经严重超时了！请立即处理！',
            'calm': '放松一下，深呼吸，一切都会好起来的。',
            'gentle': '慢慢来，不要着急，你做得很好。',
            'encouraging': '加油！你可以的！相信自己，继续努力！'
        };
        
        const testEmotion = emotion || this.settings.emotion;
        const text = testTexts[testEmotion] || testTexts.neutral;
        
        return this.speak(text, { emotion: testEmotion });
    }
};

// 导出到全局
window.EmotionalVoice = EmotionalVoice;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EmotionalVoice.init());
} else {
    EmotionalVoice.init();
}

console.log('✅ EmotionalVoice 模块已加载');

