// ==================== 简单语音系统函数 ====================

// 更新语音设置
App.updateSimpleVoiceSettings = function() {
    const voice = document.getElementById('simpleVoiceSelect')?.value;
    const rate = parseFloat(document.getElementById('simpleVoiceRate')?.value || 1);
    const pitch = parseFloat(document.getElementById('simpleVoicePitch')?.value || 1);
    const volume = parseFloat(document.getElementById('simpleVoiceVolume')?.value || 1);
    
    // 更新显示值
    const rateDisplay = document.getElementById('rateValue');
    const pitchDisplay = document.getElementById('pitchValue');
    const volumeDisplay = document.getElementById('volumeValue');
    if (rateDisplay) rateDisplay.textContent = rate.toFixed(1) + 'x';
    if (pitchDisplay) pitchDisplay.textContent = pitch.toFixed(1);
    if (volumeDisplay) volumeDisplay.textContent = Math.round(volume * 100) + '%';
    
    // 保存到SimpleVoice
    if (typeof window.SimpleVoice !== 'undefined') {
        if (voice) window.SimpleVoice.setVoice(voice);
        window.SimpleVoice.setRate(rate);
        window.SimpleVoice.setPitch(pitch);
        window.SimpleVoice.setVolume(volume);
    }
    
    console.log('✅ 语音设置已更新:', { voice, rate, pitch, volume });
};

// 测试语音
App.testSimpleVoice = function() {
    console.log('🔊 测试语音...');
    
    if (typeof window.SimpleVoice !== 'undefined') {
        const testText = '你好！这是语音测试。现在的语速是' + window.SimpleVoice.settings.rate.toFixed(1) + '倍，音调是' + window.SimpleVoice.settings.pitch.toFixed(1) + '。如果你能听到明显的变化，说明设置生效了！';
        window.SimpleVoice.speak(testText);
    } else {
        console.error('❌ SimpleVoice 未加载');
        alert('语音模块未加载，请刷新页面重试');
    }
};

// 停止语音
App.stopVoice = function() {
    if (typeof window.SimpleVoice !== 'undefined') {
        window.SimpleVoice.stop();
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    console.log('⏹️ 已停止语音');
};

console.log('✅ 简单语音系统函数已加载');

