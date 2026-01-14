// 庆祝效果模块 - 撒彩带、金币动画、音效
const CelebrationEffects = {
    // 音频上下文
    audioContext: null,
    
    // 初始化
    init() {
        this.initAudioContext();
        console.log('庆祝效果模块初始化完成');
    },
    
    // 初始化音频上下文
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('无法创建音频上下文:', e);
        }
    },
    
    // 确保音频上下文已激活
    ensureAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        if (!this.audioContext) {
            this.initAudioContext();
        }
    },
    
    // ==================== 撒彩带动画 ====================
    
    // 触发全屏撒彩带
    triggerConfetti() {
        const container = this.getOrCreateContainer();
        
        // 创建彩带容器
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        container.appendChild(confettiContainer);
        
        // 彩带颜色
        const colors = ['#FF6B9D', '#4A90E2', '#27AE60', '#F1C40F', '#9B59B6', '#E74C3C', '#1ABC9C', '#FF9500'];
        
        // 创建多个彩带
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            
            // 随机属性
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 2 + Math.random() * 2;
            const size = 8 + Math.random() * 8;
            const rotation = Math.random() * 360;
            
            // 随机形状
            const shapes = ['square', 'rectangle', 'circle'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            
            confetti.style.cssText = `
                left: ${left}%;
                background: ${color};
                width: ${shape === 'rectangle' ? size * 0.4 : size}px;
                height: ${size}px;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
                transform: rotate(${rotation}deg);
                ${shape === 'circle' ? 'border-radius: 50%;' : ''}
            `;
            
            confettiContainer.appendChild(confetti);
        }
        
        // 添加庆祝文字
        const celebrationText = document.createElement('div');
        celebrationText.className = 'celebration-text';
        celebrationText.innerHTML = '🎉 太棒了！任务完成！ 🎉';
        container.appendChild(celebrationText);
        
        // 4秒后移除
        setTimeout(() => {
            confettiContainer.remove();
            celebrationText.remove();
        }, 4000);
    },
    
    // 播放彩带庆祝音效
    playConfettiSound() {
        this.ensureAudioContext();
        if (!this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            
            // 创建欢快的音效序列
            const playNote = (freq, startTime, duration, type = 'sine') => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = freq;
                osc.type = type;
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            
            // 胜利音效 - 上升音阶
            playNote(523, now, 0.15);        // C5
            playNote(587, now + 0.1, 0.15);  // D5
            playNote(659, now + 0.2, 0.15);  // E5
            playNote(698, now + 0.3, 0.15);  // F5
            playNote(784, now + 0.4, 0.15);  // G5
            playNote(880, now + 0.5, 0.15);  // A5
            playNote(988, now + 0.6, 0.15);  // B5
            playNote(1047, now + 0.7, 0.4);  // C6 (长音)
            
            // 添加和弦
            playNote(659, now + 0.7, 0.4);   // E5
            playNote(784, now + 0.7, 0.4);   // G5
            
        } catch (e) {
            console.warn('播放音效失败:', e);
        }
    },
    
    // ==================== 金币动画 ====================
    
    // 显示金币收获动画
    showCoinAnimation(amount = 5) {
        const container = this.getOrCreateContainer();
        
        // 创建金币雨
        for (let i = 0; i < Math.min(amount * 3, 30); i++) {
            const coin = document.createElement('div');
            coin.className = 'coin-rain-item';
            coin.innerHTML = '🪙';
            
            const left = 20 + Math.random() * 60;
            const delay = Math.random() * 0.5;
            const duration = 1 + Math.random() * 1;
            
            coin.style.cssText = `
                left: ${left}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
            `;
            
            container.appendChild(coin);
            
            setTimeout(() => coin.remove(), (delay + duration) * 1000 + 500);
        }
        
        // 显示金币数量
        const coinText = document.createElement('div');
        coinText.className = 'coin-amount-popup';
        coinText.innerHTML = `+${amount} 🪙`;
        container.appendChild(coinText);
        
        setTimeout(() => coinText.remove(), 2000);
    },
    
    // 显示大型金币冲击动画
    showBigCoinAnimation(amount, taskTitle) {
        const container = this.getOrCreateContainer();
        
        const overlay = document.createElement('div');
        overlay.className = 'coin-impact-overlay';
        overlay.innerHTML = `
            <div class="coin-impact-content">
                <div class="coin-burst-container">
                    <span class="coin-burst-item">🪙</span>
                    <span class="coin-burst-item">🪙</span>
                    <span class="coin-burst-item">🪙</span>
                    <span class="coin-burst-item">🪙</span>
                    <span class="coin-burst-item">🪙</span>
                </div>
                <div class="coin-impact-amount">+${amount}</div>
                <div class="coin-impact-task">${taskTitle || '任务完成'}</div>
                <div class="coin-impact-message">继续加油！💪</div>
            </div>
        `;
        
        container.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }, 2500);
    },
    
    // 播放金币音效
    playCoinSound() {
        this.ensureAudioContext();
        if (!this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            
            // 金币叮当声
            const playNote = (freq, startTime, duration) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            
            // 清脆的金币声
            playNote(1200, now, 0.1);
            playNote(1500, now + 0.08, 0.1);
            playNote(1800, now + 0.16, 0.15);
            
        } catch (e) {
            console.warn('播放金币音效失败:', e);
        }
    },
    
    // ==================== 任务完成一键效果 ====================
    
    // 一键完成任务的完整效果
    triggerTaskComplete(task) {
        // 1. 撒彩带
        this.triggerConfetti();
        
        // 2. 播放庆祝音效
        this.playConfettiSound();
        
        // 3. 显示金币动画
        setTimeout(() => {
            this.showBigCoinAnimation(task.coins || 5, task.title);
            this.playCoinSound();
        }, 500);
    },
    
    // 子任务完成效果（较小的庆祝）
    triggerSubtaskComplete(subtaskTitle) {
        this.showCoinAnimation(3);
        this.playCoinSound();
        
        // 显示小提示
        const container = this.getOrCreateContainer();
        const toast = document.createElement('div');
        toast.className = 'subtask-complete-toast';
        toast.innerHTML = `✅ ${subtaskTitle}`;
        container.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    },
    
    // 播放子任务完成音效（轻快的叮咚声）
    playSubtaskCompleteSound() {
        this.ensureAudioContext();
        if (!this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            
            // 轻快的两音符
            const playNote = (freq, startTime, duration) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            
            // 简单的两音符叮咚
            playNote(880, now, 0.1);       // A5
            playNote(1047, now + 0.1, 0.15); // C6
            
        } catch (e) {
            console.warn('播放子任务完成音效失败:', e);
        }
    },
    
    // ==================== 工具方法 ====================
    
    // 获取或创建动画容器
    getOrCreateContainer() {
        let container = document.getElementById('celebrationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'celebrationContainer';
            container.className = 'celebration-container';
            document.body.appendChild(container);
        }
        return container;
    },
    
    // 播放提示音
    playAlertSound() {
        this.ensureAudioContext();
        if (!this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            
        } catch (e) {}
    },
    
    // 播放警告音
    playWarningSound() {
        this.ensureAudioContext();
        if (!this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            
            // 警告音 - 两声短促的蜂鸣
            for (let i = 0; i < 2; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.value = 600;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.2, now + i * 0.3);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.15);
                osc.start(now + i * 0.3);
                osc.stop(now + i * 0.3 + 0.15);
            }
            
        } catch (e) {}
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    CelebrationEffects.init();
});

// 导出
window.CelebrationEffects = CelebrationEffects;

