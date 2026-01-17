// ==================== 情感语音设置面板 ====================

// 加载语音设置面板
App.loadVoiceSettingsPanel = function() {
    const container = document.getElementById("voiceSettingsBody");
    if (!container) return;
    
    // 获取当前设置
    const EV = typeof window.EmotionalVoice !== 'undefined' ? window.EmotionalVoice : null;
    const settings = EV ? EV.settings : {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        emotion: 'neutral'
    };
    
    // 情感选项
    const emotions = [
        { id: 'neutral', name: '😊 中性', desc: '正常语速和音调' },
        { id: 'happy', name: '😄 开心', desc: '语速快15%，音调高15%' },
        { id: 'excited', name: '🎉 兴奋', desc: '语速快25%，音调高20%' },
        { id: 'sad', name: '😢 悲伤', desc: '语速慢15%，音调低10%' },
        { id: 'angry', name: '😠 生气', desc: '语速快10%，音调高5%' },
        { id: 'calm', name: '😌 平静', desc: '语速慢10%，音调低5%' },
        { id: 'gentle', name: '🌸 温柔', desc: '语速慢5%，音调高5%' },
        { id: 'encouraging', name: '💪 鼓励', desc: '语速快5%，音调高10%' }
    ];
    
    const emotionOptions = emotions.map(e => 
        `<option value="${e.id}" ${settings.emotion === e.id ? 'selected' : ''}>${e.name}</option>`
    ).join('');
    
    const html = `
        <div style="padding:16px;">
            <!-- 语音状态卡片 -->
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:20px;color:white;margin-bottom:16px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:36px;">🎭</span>
                    <div>
                        <div style="font-size:14px;opacity:0.9;">情感语音引擎</div>
                        <div style="font-size:18px;font-weight:600;">自然有感情</div>
                    </div>
                </div>
                <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.2);font-size:12px;opacity:0.9;">
                    ✅ Google TTS + 浏览器 TTS · 8种情感 · 完全免费
                </div>
            </div>
            
            <!-- 情感选择 -->
            <div style="background:#F8F9FA;border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:12px;">🎭 情感风格</div>
                
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">选择情感</label>
                    <select id="emotionSelect" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;" onchange="App.updateVoiceSettings()">
                        ${emotionOptions}
                    </select>
                    <div style="font-size:11px;color:#999;margin-top:4px;" id="emotionDesc">
                        ${emotions.find(e => e.id === settings.emotion)?.desc || '正常语速和音调'}
                    </div>
                </div>
            </div>
            
            <!-- 语音参数 -->
            <div style="background:#F8F9FA;border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:12px;">⚙️ 语音参数</div>
                
                <div style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <label style="font-size:12px;color:#666;">基础语速</label>
                        <span id="rateValue" style="font-size:12px;color:#667eea;font-weight:600;">${settings.rate.toFixed(1)}x</span>
                    </div>
                    <input type="range" id="voiceRate" min="0.5" max="2" step="0.1" value="${settings.rate}" style="width:100%;" oninput="App.updateVoiceSettings()">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-top:2px;">
                        <span>0.5x 慢</span>
                        <span>1.0x 正常</span>
                        <span>2.0x 快</span>
                    </div>
                </div>
                
                <div style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <label style="font-size:12px;color:#666;">基础音调</label>
                        <span id="pitchValue" style="font-size:12px;color:#667eea;font-weight:600;">${settings.pitch.toFixed(1)}</span>
                    </div>
                    <input type="range" id="voicePitch" min="0.5" max="2" step="0.1" value="${settings.pitch}" style="width:100%;" oninput="App.updateVoiceSettings()">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-top:2px;">
                        <span>0.5 低</span>
                        <span>1.0 正常</span>
                        <span>2.0 高</span>
                    </div>
                </div>
                
                <div style="margin-bottom:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <label style="font-size:12px;color:#666;">音量</label>
                        <span id="volumeValue" style="font-size:12px;color:#667eea;font-weight:600;">${Math.round(settings.volume * 100)}%</span>
                    </div>
                    <input type="range" id="voiceVolume" min="0" max="1" step="0.1" value="${settings.volume}" style="width:100%;" oninput="App.updateVoiceSettings()">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-top:2px;">
                        <span>0% 静音</span>
                        <span>50%</span>
                        <span>100% 最大</span>
                    </div>
                </div>
                
                <div style="margin-top:12px;padding:10px;background:#E8F5E9;border-radius:8px;font-size:11px;color:#2E7D32;">
                    💡 提示：情感会自动调整语速和音调，基础参数会叠加到情感效果上
                </div>
            </div>
            
            <!-- 测试按钮 -->
            <div style="background:#F8F9FA;border-radius:12px;padding:16px;">
                <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:12px;">🎵 语音测试</div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                    <button onclick="App.testVoice('happy')" style="padding:10px;background:#FFF3E0;color:#F39C12;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
                        😄 开心
                    </button>
                    <button onclick="App.testVoice('sad')" style="padding:10px;background:#E3F2FD;color:#2196F3;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
                        😢 悲伤
                    </button>
                    <button onclick="App.testVoice('excited')" style="padding:10px;background:#FCE4EC;color:#E91E63;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
                        🎉 兴奋
                    </button>
                    <button onclick="App.testVoice('calm')" style="padding:10px;background:#E8F5E9;color:#4CAF50;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
                        😌 平静
                    </button>
                </div>
                
                <button onclick="App.testVoice()" style="width:100%;padding:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;margin-bottom:8px;">
                    🔊 测试当前设置
                </button>
                
                <button onclick="App.stopVoice()" style="width:100%;padding:10px;background:#E74C3C;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;">
                    ⏹️ 停止播放
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    setTimeout(function() { Canvas.reapplyBackground('voiceSettings'); }, 10);
};

// 更新语音设置
App.updateVoiceSettings = function() {
    const emotion = document.getElementById('emotionSelect')?.value || 'neutral';
    const rate = parseFloat(document.getElementById('voiceRate')?.value || 1);
    const pitch = parseFloat(document.getElementById('voicePitch')?.value || 1);
    const volume = parseFloat(document.getElementById('voiceVolume')?.value || 1);
    
    // 更新显示值
    const rateDisplay = document.getElementById('rateValue');
    const pitchDisplay = document.getElementById('pitchValue');
    const volumeDisplay = document.getElementById('volumeValue');
    if (rateDisplay) rateDisplay.textContent = rate.toFixed(1) + 'x';
    if (pitchDisplay) pitchDisplay.textContent = pitch.toFixed(1);
    if (volumeDisplay) volumeDisplay.textContent = Math.round(volume * 100) + '%';
    
    // 更新情感描述
    const emotionDesc = document.getElementById('emotionDesc');
    const emotions = {
        'neutral': '正常语速和音调',
        'happy': '语速快15%，音调高15%',
        'excited': '语速快25%，音调高20%',
        'sad': '语速慢15%，音调低10%',
        'angry': '语速快10%，音调高5%',
        'calm': '语速慢10%，音调低5%',
        'gentle': '语速慢5%，音调高5%',
        'encouraging': '语速快5%，音调高10%'
    };
    if (emotionDesc) emotionDesc.textContent = emotions[emotion] || '正常语速和音调';
    
    // 保存到EmotionalVoice
    if (typeof window.EmotionalVoice !== 'undefined') {
        window.EmotionalVoice.setEmotion(emotion);
        window.EmotionalVoice.setRate(rate);
        window.EmotionalVoice.setPitch(pitch);
        window.EmotionalVoice.setVolume(volume);
    }
    
    console.log('✅ 语音设置已更新:', { emotion, rate, pitch, volume });
};

// 测试语音
App.testVoice = function(emotion) {
    console.log('🔊 测试语音，情感:', emotion || '当前设置');
    
    if (typeof window.EmotionalVoice !== 'undefined') {
        if (emotion) {
            window.EmotionalVoice.test(emotion);
        } else {
            window.EmotionalVoice.test();
        }
    } else {
        console.error('❌ EmotionalVoice 未加载');
        alert('语音模块未加载，请刷新页面重试');
    }
};

// 停止语音
App.stopVoice = function() {
    if (typeof window.EmotionalVoice !== 'undefined') {
        window.EmotionalVoice.stop();
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    console.log('⏹️ 已停止语音');
};

console.log('✅ 情感语音设置面板已加载');

// 自动加载语音设置面板
if (typeof App !== 'undefined' && App.loadVoiceSettingsPanel) {
    // 等待 DOM 加载完成后再调用
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => App.loadVoiceSettingsPanel(), 100);
        });
    } else {
        setTimeout(() => App.loadVoiceSettingsPanel(), 100);
    }
}

