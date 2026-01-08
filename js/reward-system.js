// 奖励系统模块 - 真实奖励兑换 + 即时价值冲击
const RewardSystem = {
    // 奖励配置
    rewards: [],                    // 可兑换奖励列表
    redeemedHistory: [],            // 兑换历史
    
    // 金币兑换比率（可自定义）
    exchangeRate: {
        coinsPerYuan: 10,           // 10金币 = 1元真实价值
        enabled: false              // 是否启用真实兑换
    },
    
    // 初始化
    init() {
        this.loadData();
        console.log('奖励系统初始化完成');
    },
    
    // 加载数据
    loadData() {
        this.rewards = Storage.load('adhd_rewards', this.getDefaultRewards());
        this.redeemedHistory = Storage.load('adhd_redeemed_history', []);
        this.exchangeRate = Storage.load('adhd_exchange_rate', this.exchangeRate);
    },
    
    // 默认奖励列表
    getDefaultRewards() {
        return [
            { id: 1, name: '奶茶一杯', coins: 100, emoji: '🧋', category: 'food', description: '犒劳自己一杯奶茶' },
            { id: 2, name: '外卖加餐', coins: 200, emoji: '🍔', category: 'food', description: '点一份想吃的外卖' },
            { id: 3, name: '休息30分钟', coins: 50, emoji: '😴', category: 'rest', description: '无罪恶感地休息' },
            { id: 4, name: '看一集剧', coins: 80, emoji: '📺', category: 'entertainment', description: '追一集喜欢的剧' },
            { id: 5, name: '游戏时间1小时', coins: 150, emoji: '🎮', category: 'entertainment', description: '玩1小时游戏' },
            { id: 6, name: '购物基金+50', coins: 500, emoji: '🛍️', category: 'shopping', description: '存入购物基金' },
            { id: 7, name: '按摩/SPA', coins: 800, emoji: '💆', category: 'selfcare', description: '预约一次按摩' },
            { id: 8, name: '电影票', coins: 300, emoji: '🎬', category: 'entertainment', description: '看一场电影' },
            { id: 9, name: '新书一本', coins: 400, emoji: '📚', category: 'shopping', description: '买一本想看的书' },
            { id: 10, name: '大餐一顿', coins: 1000, emoji: '🍽️', category: 'food', description: '吃一顿大餐' }
        ];
    },
    
    // 保存数据
    saveData() {
        Storage.save('adhd_rewards', this.rewards);
        Storage.save('adhd_redeemed_history', this.redeemedHistory);
        Storage.save('adhd_exchange_rate', this.exchangeRate);
    },
    
    // 添加自定义奖励
    addReward(reward) {
        const newReward = {
            id: Date.now(),
            name: reward.name,
            coins: reward.coins || 100,
            emoji: reward.emoji || '🎁',
            category: reward.category || 'custom',
            description: reward.description || '',
            custom: true
        };
        this.rewards.push(newReward);
        this.saveData();
        return newReward;
    },
    
    // 删除奖励
    removeReward(rewardId) {
        this.rewards = this.rewards.filter(r => r.id !== rewardId);
        this.saveData();
    },
    
    // 兑换奖励
    redeemReward(rewardId) {
        const reward = this.rewards.find(r => r.id === rewardId);
        if (!reward) return { success: false, message: '奖励不存在' };
        
        const gameState = Storage.getGameState();
        if (gameState.coins < reward.coins) {
            return { 
                success: false, 
                message: `金币不足！需要 ${reward.coins} 🪙，当前只有 ${gameState.coins} 🪙` 
            };
        }
        
        // 扣除金币
        gameState.coins -= reward.coins;
        Storage.saveGameState(gameState);
        
        // 记录兑换历史
        const record = {
            rewardId: reward.id,
            rewardName: reward.name,
            coins: reward.coins,
            emoji: reward.emoji,
            redeemedAt: new Date().toISOString()
        };
        this.redeemedHistory.push(record);
        this.saveData();
        
        // 更新UI
        if (typeof App !== 'undefined') {
            App.updateGameStatus();
        }
        
        // 显示兑换成功动画
        this.showRedeemAnimation(reward);
        
        return { 
            success: true, 
            message: `🎉 成功兑换【${reward.emoji} ${reward.name}】！`,
            reward: reward
        };
    },
    
    // 显示兑换动画
    showRedeemAnimation(reward) {
        const container = document.getElementById('coinAnimationContainer');
        if (!container) return;
        
        // 创建大型奖励动画
        const anim = document.createElement('div');
        anim.className = 'reward-redeem-animation';
        anim.innerHTML = `
            <div class="reward-popup">
                <div class="reward-emoji">${reward.emoji}</div>
                <div class="reward-text">恭喜获得</div>
                <div class="reward-name">${reward.name}</div>
                <div class="reward-hint">记得兑现奖励哦~</div>
            </div>
        `;
        container.appendChild(anim);
        
        setTimeout(() => anim.remove(), 3000);
    },
    
    // 获取可兑换奖励（根据当前金币）
    getAvailableRewards() {
        const gameState = Storage.getGameState();
        const currentCoins = gameState.coins || 0;
        
        return this.rewards.map(r => ({
            ...r,
            canRedeem: currentCoins >= r.coins,
            progress: Math.min(100, Math.round((currentCoins / r.coins) * 100))
        })).sort((a, b) => a.coins - b.coins);
    },
    
    // 获取即将可兑换的奖励
    getUpcomingRewards() {
        const gameState = Storage.getGameState();
        const currentCoins = gameState.coins || 0;
        
        return this.rewards
            .filter(r => currentCoins < r.coins && currentCoins >= r.coins * 0.5)
            .map(r => ({
                ...r,
                coinsNeeded: r.coins - currentCoins,
                progress: Math.round((currentCoins / r.coins) * 100)
            }))
            .sort((a, b) => a.coinsNeeded - b.coinsNeeded)
            .slice(0, 3);
    },
    
    // 获取兑换历史
    getRedeemHistory(limit = 10) {
        return this.redeemedHistory.slice(-limit).reverse();
    },
    
    // 设置与朋友/家人的奖励约定
    setPartnerReward(config) {
        const partnerRewards = Storage.load('adhd_partner_rewards', []);
        partnerRewards.push({
            id: Date.now(),
            ...config,
            createdAt: new Date().toISOString(),
            completed: false
        });
        Storage.save('adhd_partner_rewards', partnerRewards);
        return true;
    },
    
    // 获取伙伴奖励
    getPartnerRewards() {
        return Storage.load('adhd_partner_rewards', []);
    },
    
    // 完成伙伴奖励
    completePartnerReward(rewardId) {
        const partnerRewards = Storage.load('adhd_partner_rewards', []);
        const reward = partnerRewards.find(r => r.id === rewardId);
        if (reward) {
            reward.completed = true;
            reward.completedAt = new Date().toISOString();
            Storage.save('adhd_partner_rewards', partnerRewards);
        }
    }
};

// 即时价值冲击模块
const ValueImpact = {
    // 显示大型收入动画
    showBigEarnAnimation(amount, taskTitle) {
        const container = document.getElementById('coinAnimationContainer');
        if (!container) return;
        
        // 创建全屏冲击动画
        const overlay = document.createElement('div');
        overlay.className = 'value-impact-overlay';
        overlay.innerHTML = `
            <div class="value-impact-content">
                <div class="impact-coins">
                    <span class="coin-burst">🪙</span>
                    <span class="coin-burst">🪙</span>
                    <span class="coin-burst">🪙</span>
                </div>
                <div class="impact-amount">+¥${amount}</div>
                <div class="impact-task">${taskTitle || '任务完成'}</div>
                <div class="impact-message">太棒了！继续加油！💪</div>
            </div>
        `;
        
        container.appendChild(overlay);
        
        // 播放音效
        this.playImpactSound();
        
        // 3秒后移除
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }, 2500);
    },
    
    // 播放冲击音效
    playImpactSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建更丰富的音效
            const playNote = (freq, startTime, duration) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            
            const now = audioContext.currentTime;
            // 上升音阶 C-E-G-C
            playNote(523, now, 0.15);        // C5
            playNote(659, now + 0.1, 0.15);  // E5
            playNote(784, now + 0.2, 0.15);  // G5
            playNote(1047, now + 0.3, 0.3);  // C6
            
        } catch (e) {
            // 静默失败
        }
    },
    
    // 在任务卡片上显示双重价值（金币+人民币）
    formatDualValue(coins, moneyValue) {
        return `<span class="dual-value">
            <span class="coin-value">🪙${coins}</span>
            <span class="money-value">≈¥${moneyValue}</span>
        </span>`;
    },
    
    // 计算金币对应的人民币价值
    coinsToMoney(coins) {
        const rate = RewardSystem.exchangeRate.coinsPerYuan || 10;
        return Math.round(coins / rate);
    }
};

// 导出
window.RewardSystem = RewardSystem;
window.ValueImpact = ValueImpact;

