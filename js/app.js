// 主应用模块
const App = {
    isConnected: false,
    currentDate: new Date(),
    chatMessages: [],

    async init() {
        console.log("ADHD Focus 初始化中...");
        
        // 初始化画布
        Canvas.init();
        
        // 加载组件内容
        // this.loadSmartInput(); // 已合并到 BrainDump 组件
        this.loadTimeline();
        this.loadMemoryBank();
        this.loadPromptPanel();
        this.loadGameSystem();
        this.loadMonitorPanel();
        this.loadValuePanel();
        // this.loadVoiceSettingsPanel(); // 已移至 voice-settings.js，会自动加载
        
        // 初始化AI副驾驶模块
        if (typeof AICopilot !== 'undefined') {
            AICopilot.init();
        }
        
        // 初始化AI学习模块
        if (typeof AILearning !== 'undefined') {
            AILearning.init();
        }
        
        // 初始化AI预测模块
        if (typeof AIPrediction !== 'undefined') {
            AIPrediction.init();
        }
        
        // 初始化AI记忆模块
        if (typeof AIMemory !== 'undefined') {
            AIMemory.init();
        }
        
        // 初始化奖励系统模块
        if (typeof RewardSystem !== 'undefined') {
            RewardSystem.init();
        }
        
        // 初始化AI报告模块
        if (typeof AIReport !== 'undefined') {
            this.checkWeeklyReport();
        }
        
        // 初始化引导系统
        if (typeof GuidanceSystem !== 'undefined') {
            GuidanceSystem.init();
        }
        
        // 初始化步数验证模块
        if (typeof StepVerification !== 'undefined') {
            StepVerification.init();
        }
        
        // 初始化庆祝效果模块
        if (typeof CelebrationEffects !== 'undefined') {
            CelebrationEffects.init();
        }
        
        // 初始化自然语言时间轴控制模块
        if (typeof NaturalLanguageTimeline !== 'undefined') {
            NaturalLanguageTimeline.init();
        }
        
        // 初始化后台监控模块
        if (typeof BackgroundMonitor !== 'undefined') {
            BackgroundMonitor.init();
        }
        
        // 加载AI洞察面板
        this.loadAIInsightsPanel();
        
        // 加载KiiKii记忆面板
        this.loadAIMemoryPanel();
        
        // 更新游戏状态显示
        this.updateGameStatus();
        
        // 检查API连接
        await this.checkApiConnection();
        
        console.log("ADHD Focus 初始化完成！");
    },
    
    // 加载AI洞察面板
    loadAIInsightsPanel() {
        if (typeof AIInsightsPanel !== 'undefined') {
            AIInsightsPanel.render();
        }
    },
    
    // 加载KiiKii记忆面板
    loadAIMemoryPanel() {
        if (typeof AIMemoryPanel !== 'undefined') {
            AIMemoryPanel.render();
        }
    },
    
    // 加载语音设置面板（增强版 - 支持高质量TTS）
    loadVoiceSettingsPanel() {
        const container = document.getElementById("voiceSettingsBody");
        if (!container) return;
        
        // 获取当前设置
        const TTS = typeof window.SimpleVoice !== 'undefined' ? window.SimpleVoice : null;
        const settings = TTS ? TTS.settings : {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            voice: null
        };
        
        // 语音选项（高质量神经网络语音）
        const voiceOptions = [
            { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (女声-活泼自然)' },
            { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (女声-温柔甜美)' },
            { id: 'zh-CN-YunjianNeural', name: '云健 (男声-阳光开朗)' },
            { id: 'zh-CN-YunxiNeural', name: '云希 (男声-少年清澈)' },
            { id: 'zh-CN-YunyangNeural', name: '云扬 (男声-专业播音)' },
            { id: 'zh-CN-liaoning-XiaobeiNeural', name: '晓北 (东北话-亲切)' },
            { id: 'zh-TW-HsiaoChenNeural', name: '曉臻 (台湾女声-软萌)' }
        ].map(v => `<option value="${v.id}" ${settings.voice === v.id ? 'selected' : ''}>${v.name}</option>`).join('');
        
        // 情感选项
        const emotionOptions = [
            { id: 'friendly', name: '😊 友好亲切' },
            { id: 'happy', name: '😄 开心愉快' },
            { id: 'excited', name: '🎉 兴奋激动' },
            { id: 'calm', name: '😌 平静舒缓' },
            { id: 'serious', name: '😐 严肃认真' },
            { id: 'encouraging', name: '💪 鼓励加油' },
            { id: 'gentle', name: '🌸 温柔轻声' }
        ].map(e => `<option value="${e.id}" ${settings.emotion === e.id ? 'selected' : ''}>${e.name}</option>`).join('');
        
        const html = `
            <div style="padding:16px;">
                <!-- 语音状态卡片 -->
                <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:20px;color:white;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:36px;">🎙️</span>
                        <div>
                            <div style="font-size:14px;opacity:0.9;">增强语音引擎</div>
                            <div style="font-size:18px;font-weight:600;">自然真人语音</div>
                        </div>
                    </div>
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.2);font-size:12px;opacity:0.9;">
                        ✨ 支持情感表达 · 自动语速调节 · 多种音色选择
                    </div>
                </div>
                
                <!-- 语音选择 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:16px;margin-bottom:16px;">
                    <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:12px;">🎤 语音音色</div>
                    
                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">选择语音角色</label>
                        <select id="enhancedVoiceSelect" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;" onchange="App.updateEnhancedVoiceSettings()">
                            ${voiceOptions}
                        </select>
                    </div>
                    
                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px;color:#666;display:block;margin-bottom:6px;">情感风格</label>
                        <select id="enhancedEmotionSelect" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;" onchange="App.updateEnhancedVoiceSettings()">
                            ${emotionOptions}
                        </select>
                    </div>
                </div>
                
                <!-- 语音参数 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:16px;margin-bottom:16px;">
                    <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:12px;">⚙️ 语音参数</div>
                    
                    <div style="margin-bottom:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <label style="font-size:12px;color:#666;">语速</label>
                            <span id="rateValue" style="font-size:12px;color:#667eea;font-weight:600;">${settings.rate.toFixed(1)}x</span>
                        </div>
                        <input type="range" id="enhancedVoiceRate" min="0.5" max="1.5" step="0.1" value="${settings.rate}" 
                               style="width:100%;accent-color:#667eea;" onchange="App.updateEnhancedVoiceSettings()">
                        <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-top:2px;">
                            <span>慢速 0.5x</span><span>正常 1.0x</span><span>快速 1.5x</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <label style="font-size:12px;color:#666;">音调</label>
                            <span id="pitchValue" style="font-size:12px;color:#667eea;font-weight:600;">${settings.pitch.toFixed(1)}</span>
                        </div>
                        <input type="range" id="enhancedVoicePitch" min="0.7" max="1.3" step="0.1" value="${settings.pitch}" 
                               style="width:100%;accent-color:#667eea;" onchange="App.updateEnhancedVoiceSettings()">
                        <div style="display:flex;justify-content:space-between;font-size:10px;color:#999;margin-top:2px;">
                            <span>低沉</span><span>正常</span><span>清亮</span>
                        </div>
                    </div>
                    
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <label style="font-size:12px;color:#666;">音量</label>
                            <span id="volumeValue" style="font-size:12px;color:#667eea;font-weight:600;">${Math.round(settings.volume * 100)}%</span>
                        </div>
                        <input type="range" id="enhancedVoiceVolume" min="0" max="1" step="0.1" value="${settings.volume}" 
                               style="width:100%;accent-color:#667eea;" onchange="App.updateEnhancedVoiceSettings()">
                    </div>
                </div>
                
                <!-- 测试按钮 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:16px;margin-bottom:16px;">
                    <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:12px;">🔊 语音测试</div>
                    
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                        <button onclick="App.testEnhancedVoice('friendly')" style="padding:10px;background:#E8F5E9;color:#27AE60;border:none;border-radius:8px;font-size:13px;cursor:pointer;">
                            😊 友好问候
                        </button>
                        <button onclick="App.testEnhancedVoice('happy')" style="padding:10px;background:#FFF3E0;color:#F39C12;border:none;border-radius:8px;font-size:13px;cursor:pointer;">
                            🎉 任务完成
                        </button>
                        <button onclick="App.testEnhancedVoice('encouraging')" style="padding:10px;background:#E3F2FD;color:#2196F3;border:none;border-radius:8px;font-size:13px;cursor:pointer;">
                            💪 鼓励加油
                        </button>
                        <button onclick="App.testEnhancedVoice('angry')" style="padding:10px;background:#FFEBEE;color:#E74C3C;border:none;border-radius:8px;font-size:13px;cursor:pointer;">
                            ⚠️ 超时警告
                        </button>
                    </div>
                    
                    <button onclick="App.testEnhancedVoice()" style="width:100%;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">
                        🎙️ 测试当前设置
                    </button>
                </div>
                
                <!-- 高级设置 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:16px;">
                    <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:12px;">🔧 高级设置</div>
                    
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #E0E0E0;">
                        <div>
                            <span style="font-size:13px;color:#2C3E50;">智能情感识别</span>
                            <div style="font-size:11px;color:#999;">根据内容自动调整语气</div>
                        </div>
                        <div class="toggle-switch active" id="autoEmotionToggle" onclick="App.toggleAutoEmotion(this)"></div>
                    </div>
                    
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #E0E0E0;">
                        <div>
                            <span style="font-size:13px;color:#2C3E50;">自动语速调节</span>
                            <div style="font-size:11px;color:#999;">长文本加速，短文本放慢</div>
                        </div>
                        <div class="toggle-switch active" id="autoSpeedToggle" onclick="App.toggleAutoSpeed(this)"></div>
                    </div>
                    
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;">
                        <div>
                            <span style="font-size:13px;color:#2C3E50;">任务完成播报</span>
                            <div style="font-size:11px;color:#999;">完成任务时语音提示</div>
                        </div>
                        <div class="toggle-switch active" id="taskCompleteToggle" onclick="this.classList.toggle('active')"></div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        setTimeout(function() { Canvas.reapplyBackground('voiceSettings'); }, 10);
    },
    
    // 更新增强语音设置
    updateEnhancedVoiceSettings() {
        const voice = document.getElementById('enhancedVoiceSelect')?.value;
        const emotion = document.getElementById('enhancedEmotionSelect')?.value;
        const rate = parseFloat(document.getElementById('enhancedVoiceRate')?.value || 1);
        const pitch = parseFloat(document.getElementById('enhancedVoicePitch')?.value || 1);
        const volume = parseFloat(document.getElementById('enhancedVoiceVolume')?.value || 1);
        
        // 更新显示值
        const rateDisplay = document.getElementById('rateValue');
        const pitchDisplay = document.getElementById('pitchValue');
        const volumeDisplay = document.getElementById('volumeValue');
        if (rateDisplay) rateDisplay.textContent = rate.toFixed(1) + 'x';
        if (pitchDisplay) pitchDisplay.textContent = pitch.toFixed(1);
        if (volumeDisplay) volumeDisplay.textContent = Math.round(volume * 100) + '%';
        
        // 保存到EmotionalVoice
        if (typeof window.EmotionalVoice !== 'undefined') {
            if (emotion) window.EmotionalVoice.setEmotion(emotion);
            window.EmotionalVoice.setRate(rate);
            window.EmotionalVoice.setPitch(pitch);
            window.EmotionalVoice.setVolume(volume);
        }
        
        // 同时保存到localStorage作为备份
        Storage.save('enhanced_voice_settings', { voice, emotion, rate, pitch, volume });
    },
    
    // 测试增强语音
    testEnhancedVoice(emotion) {
        const testTexts = {
            friendly: '你好！我是你的智能助手，很高兴为你服务。有什么我可以帮助你的吗？',
            happy: '太棒了！你完成了今天的任务，获得了10个金币奖励！继续保持！',
            encouraging: '加油！你可以的，相信自己！每一步都是进步，坚持就是胜利！',
            angry: '警告！任务已经严重拖延，请立即开始执行！再不行动就要扣金币了！',
            calm: '温馨提醒：现在是休息时间，记得放松一下，喝杯水，活动活动身体。',
            sad: '很遗憾，这次任务没能按时完成。不过没关系，下次一定可以做得更好！',
            excited: '哇！太厉害了！你今天的效率超级高，已经完成了5个任务！'
        };
        
        const text = emotion ? testTexts[emotion] : testTexts.friendly;
        const finalEmotion = emotion || document.getElementById('enhancedEmotionSelect')?.value || 'neutral';
        
        // 获取当前设置
        const voice = document.getElementById('enhancedVoiceSelect')?.value;
        const rate = parseFloat(document.getElementById('enhancedVoiceRate')?.value || 1);
        const pitch = parseFloat(document.getElementById('enhancedVoicePitch')?.value || 1);
        const volume = parseFloat(document.getElementById('enhancedVoiceVolume')?.value || 1);
        
        console.log('测试语音，参数:', { emotion: finalEmotion, rate, pitch, volume });
        
        // 使用 EmotionalVoice
        if (typeof window.EmotionalVoice !== 'undefined') {
            window.EmotionalVoice.speak(text, { 
                emotion: finalEmotion,
                rate,
                pitch,
                volume
            });
        } else {
            console.warn('EmotionalVoice 未加载，使用浏览器TTS');
            // 回退到浏览器TTS
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-CN';
                utterance.rate = rate;
                utterance.pitch = pitch;
                utterance.volume = volume;
                window.speechSynthesis.speak(utterance);
            }
        }
    },
    
    // 切换自动情感识别
    toggleAutoEmotion(el) {
        el.classList.toggle('active');
        Storage.save('voice_auto_emotion', el.classList.contains('active'));
    },
    
    // 切换自动语速调节
    toggleAutoSpeed(el) {
        el.classList.toggle('active');
        const enabled = el.classList.contains('active');
        if (typeof EnhancedTTS !== 'undefined') {
            EnhancedTTS.settings.autoAdjustSpeed = enabled;
            EnhancedTTS.saveSettings();
        }
    },
    
    // 检查是否需要生成周报
    checkWeeklyReport() {
        const lastReport = Storage.load('adhd_last_report_date', null);
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayStr = today.toISOString().split('T')[0];
        
        // 每周一自动生成周报
        if (dayOfWeek === 1 && lastReport !== todayStr) {
            setTimeout(() => {
                this.showWeeklyReportNotification();
            }, 3000);
        }
        
        // 显示今日个性化建议
        setTimeout(() => {
            this.showTodaySuggestions();
        }, 5000);
    },
    
    // 显示周报通知
    showWeeklyReportNotification() {
        if (typeof Settings !== 'undefined') {
            Settings.showToast('info', '📊 周报已生成', '点击查看你的上周效率报告', 6000);
        }
        
        // 生成报告
        if (typeof AIReport !== 'undefined') {
            const report = AIReport.generateWeeklyReport();
            Storage.save('adhd_last_report_date', new Date().toISOString().split('T')[0]);
            
            // 在聊天中显示摘要
            this.showReportSummaryInChat(report);
        }
    },
    
    // 在聊天中显示报告摘要
    showReportSummaryInChat(report) {
        if (!report) return;
        
        const p = report.productivity;
        const suggestions = report.suggestions.slice(0, 2);
        
        let message = `📊 **上周效率报告**\n\n`;
        message += `✅ 完成任务: ${p.tasksCompleted}/${p.totalTasks} (${p.completionRate}%)\n`;
        message += `💰 总收入: ¥${p.totalEarned}\n`;
        
        if (p.bestDay) {
            message += `🌟 最佳日: ${p.bestDay.day} (¥${p.bestDay.earned})\n`;
        }
        
        message += `\n💡 **本周建议:**\n`;
        suggestions.forEach(s => {
            message += `${s.icon} ${s.content}\n`;
        });
        
        this.addChatMessage('system', message, '📊');
    },
    
    // 显示今日个性化建议
    showTodaySuggestions() {
        if (typeof AIReport === 'undefined') return;
        
        const suggestions = AIReport.getTodaySuggestions();
        if (suggestions.length === 0) return;
        
        // 创建建议浮窗
        const existing = document.querySelector('.today-suggestions');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.className = 'today-suggestions';
        container.innerHTML = `
            <div class="today-suggestions-header">
                <span class="today-suggestions-title">💡 今日建议</span>
                <button class="today-suggestions-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="today-suggestions-list">
                ${suggestions.map(s => `
                    <div class="today-suggestion-item">
                        <span class="today-suggestion-icon">${s.icon}</span>
                        <div class="today-suggestion-content">
                            <div class="today-suggestion-text">${s.text}</div>
                            <button class="today-suggestion-action" onclick="App.handleSuggestionAction('${s.actionType}')">${s.action}</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 30秒后自动隐藏
        setTimeout(() => {
            if (container.parentElement) {
                container.style.animation = 'suggestSlideIn 0.3s ease reverse';
                setTimeout(() => container.remove(), 300);
            }
        }, 30000);
    },
    
    // 处理建议操作
    handleSuggestionAction(actionType) {
        const suggestionsEl = document.querySelector('.today-suggestions');
        if (suggestionsEl) suggestionsEl.remove();
        
        switch (actionType) {
            case 'viewTasks':
                // 滚动到时间轴
                document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth' });
                break;
            case 'addTask':
                // 聚焦输入框
                document.getElementById('chatInput')?.focus();
                break;
            case 'takeBreak':
                this.addChatMessage('system', '😴 好的，休息一下吧！\n\n建议：\n• 离开屏幕5分钟\n• 喝杯水\n• 做几个深呼吸\n• 伸展一下身体\n\n休息好了再继续！', '🧘');
                break;
        }
    },
    
    // 显示奖励兑换面板
    showRewardsPanel() {
        if (typeof RewardSystem === 'undefined') return;
        
        const rewards = RewardSystem.getAvailableRewards();
        const gameState = Storage.getGameState();
        const currentCoins = gameState.coins || 0;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'rewardsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
                <div class="rewards-header">
                    <span class="rewards-title">🎁 奖励兑换</span>
                    <span class="rewards-balance">🪙 ${currentCoins}</span>
                </div>
                <div class="rewards-grid">
                    ${rewards.map(r => `
                        <div class="reward-card ${r.canRedeem ? 'can-redeem' : 'locked'}" 
                             onclick="${r.canRedeem ? `App.redeemReward(${r.id})` : ''}">
                            <div class="reward-emoji">${r.emoji}</div>
                            <div class="reward-name">${r.name}</div>
                            <div class="reward-cost">🪙 ${r.coins}</div>
                            ${!r.canRedeem ? `
                                <div class="reward-progress">
                                    <div class="reward-progress-fill" style="width: ${r.progress}%"></div>
                                </div>
                            ` : ''}
                            <div class="reward-description">${r.description || ''}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="add-reward-btn" onclick="App.showAddRewardForm()">
                    ➕ 添加自定义奖励
                </button>
                <div style="margin-top: 16px; text-align: center;">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('rewardsModal').remove()">关闭</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // 兑换奖励
    redeemReward(rewardId) {
        if (typeof RewardSystem === 'undefined') return;
        
        const result = RewardSystem.redeemReward(rewardId);
        
        if (result.success) {
            // 关闭面板
            document.getElementById('rewardsModal')?.remove();
            
            // 显示成功消息
            this.addChatMessage('system', result.message + '\n\n记得兑现你的奖励哦~', '🎉');
        } else {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '无法兑换', result.message);
            }
        }
    },
    
    // 显示添加奖励表单
    showAddRewardForm() {
        const form = document.createElement('div');
        form.className = 'modal-overlay show';
        form.id = 'addRewardModal';
        form.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <span class="modal-icon">🎁</span>
                    <h2>添加自定义奖励</h2>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 600;">奖励名称</label>
                        <input type="text" id="rewardName" class="api-key-input" placeholder="例如：看一场电影">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 600;">所需金币</label>
                        <input type="number" id="rewardCoins" class="api-key-input" placeholder="100" value="100">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 600;">图标</label>
                        <input type="text" id="rewardEmoji" class="api-key-input" placeholder="🎬" value="🎁">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-weight: 600;">描述（可选）</label>
                        <input type="text" id="rewardDesc" class="api-key-input" placeholder="奖励描述">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('addRewardModal').remove()">取消</button>
                    <button class="modal-btn btn-confirm" onclick="App.saveCustomReward()">添加</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(form);
    },
    
    // 保存自定义奖励
    saveCustomReward() {
        const name = document.getElementById('rewardName').value.trim();
        const coins = parseInt(document.getElementById('rewardCoins').value) || 100;
        const emoji = document.getElementById('rewardEmoji').value.trim() || '🎁';
        const description = document.getElementById('rewardDesc').value.trim();
        
        if (!name) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '请输入奖励名称', '');
            }
            return;
        }
        
        if (typeof RewardSystem !== 'undefined') {
            RewardSystem.addReward({ name, coins, emoji, description });
            
            document.getElementById('addRewardModal')?.remove();
            document.getElementById('rewardsModal')?.remove();
            
            // 重新打开奖励面板
            this.showRewardsPanel();
            
            if (typeof Settings !== 'undefined') {
                Settings.showToast('success', '奖励已添加', `${emoji} ${name}`);
            }
        }
    },
    
    // 显示AI使用报告
    showAIReport() {
        if (typeof AIReport === 'undefined') return;
        
        const reports = AIReport.getReports(1);
        let report = reports[0];
        
        // 如果没有报告，生成一个
        if (!report) {
            report = AIReport.generateWeeklyReport();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'reportModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px; max-height: 85vh; overflow-y: auto; padding: 0;">
                <div class="report-container">
                    <div class="report-header">
                        <div class="report-title">📊 效率报告</div>
                        <div class="report-period">${report.period}</div>
                    </div>
                    
                    <div class="report-section">
                        <div class="report-section-title">📈 效率概览</div>
                        <div class="report-stats">
                            <div class="report-stat">
                                <div class="report-stat-value">${report.productivity.tasksCompleted}</div>
                                <div class="report-stat-label">完成任务</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-value">${report.productivity.completionRate}%</div>
                                <div class="report-stat-label">完成率</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-value positive">¥${report.productivity.totalEarned}</div>
                                <div class="report-stat-label">总收入</div>
                            </div>
                            <div class="report-stat">
                                <div class="report-stat-value">¥${report.productivity.avgDailyEarned}</div>
                                <div class="report-stat-label">日均收入</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-section">
                        <div class="report-section-title">⏰ 时间模式</div>
                        ${report.timePatterns.peakHours.length > 0 ? `
                            <div style="margin-bottom: 12px;">
                                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">高效时段</div>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${report.timePatterns.peakHours.map(h => `
                                        <span style="background: rgba(102, 126, 234, 0.15); color: #667eea; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                                            ${h.label}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${report.timePatterns.peakDays.length > 0 ? `
                            <div>
                                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">高效日</div>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${report.timePatterns.peakDays.map(d => `
                                        <span style="background: rgba(39, 174, 96, 0.15); color: #27AE60; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                                            ${d.label}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <div style="margin-top: 12px; font-size: 13px; color: #888;">
                            拖延率: ${report.timePatterns.procrastinationRate}%
                        </div>
                    </div>
                    
                    <div class="report-section">
                        <div class="report-section-title">💡 个性化建议</div>
                        ${report.suggestions.map(s => `
                            <div class="suggestion-card ${s.priority}">
                                <span class="suggestion-icon">${s.icon}</span>
                                <div class="suggestion-content">
                                    <div class="suggestion-title">${s.title}</div>
                                    <div class="suggestion-text">${s.content}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button class="generate-report-btn" onclick="App.regenerateReport()">
                        🔄 重新生成报告
                    </button>
                    
                    <div style="margin-top: 12px; text-align: center;">
                        <button class="modal-btn btn-cancel" onclick="document.getElementById('reportModal').remove()">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // 重新生成报告
    regenerateReport() {
        document.getElementById('reportModal')?.remove();
        
        if (typeof AIReport !== 'undefined') {
            AIReport.generateWeeklyReport();
        }
        
        this.showAIReport();
        
        if (typeof Settings !== 'undefined') {
            Settings.showToast('success', '报告已更新', '');
        }
    },

    async checkApiConnection() {
        const statusDot = document.querySelector(".online-status");
        
        // 先检查是否有 API Key
        const apiKey = Storage.getApiKey();
        if (!apiKey) {
            this.isConnected = false;
            if (statusDot) {
                statusDot.className = "online-status disconnected";
            }
            this.updateConnectionUI(false);
            return;
        }
        
        // 有 API Key，尝试连接
        try {
            this.isConnected = await AIService.checkConnection();
        } catch (e) {
            console.error('API连接检查失败:', e);
            this.isConnected = false;
        }
        
        if (statusDot) {
            statusDot.className = "online-status " + (this.isConnected ? "connected" : "disconnected");
        }
        
        this.updateConnectionUI(this.isConnected);
    },
    
    // 更新连接状态UI
    updateConnectionUI(isConnected) {
        // 更新所有状态点
        const allStatusDots = document.querySelectorAll(".online-status");
        allStatusDots.forEach(dot => {
            dot.className = "online-status " + (isConnected ? "connected" : "disconnected");
        });
        
        // 更新用户信息区域的文字
        const userInfoSpan = document.querySelector(".user-info span");
        if (userInfoSpan) {
            userInfoSpan.textContent = isConnected ? '🤖 KiiKii 在线' : '未连接AI';
        }
    },

    showApiKeyModal() {
        document.getElementById("apiKeyModal").classList.add("show");
    },

    // 智能输入框
    loadSmartInput() {
        const container = document.getElementById("smartInputBody");
        
        // 🔧 修复：保存当前输入框的内容，避免刷新时丢失用户正在输入的内容
        const existingInput = document.getElementById("chatInput");
        const savedInputValue = existingInput ? existingInput.value : '';
        const isInputFocused = existingInput && document.activeElement === existingInput;
        
        // 如果用户正在输入（输入框有焦点且有内容），不刷新整个组件
        if (isInputFocused && savedInputValue.length > 0) {
            // 只更新头部信息，不重建整个组件
            this.updateSmartInputHeader();
            return;
        }
        
        const profile = Storage.getUserProfile();
        const state = Storage.getGameState();
        const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23E8F4F8' width='100' height='100'/%3E%3Ctext x='50' y='65' font-size='50' text-anchor='middle'%3E🦊%3C/text%3E%3C/svg%3E";
        
        container.innerHTML = 
            '<div class="smart-input-container">' +
                '<div class="chat-header">' +
                    '<div class="avatar-container">' +
                        '<img src="' + (profile.avatar || defaultAvatar) + '" class="user-avatar" onclick="App.changeAvatar()">' +
                        '<span class="online-status ' + (this.isConnected ? 'connected' : 'disconnected') + '"></span>' +
                    '</div>' +
                    '<div class="user-info">' +
                        '<h3>' + profile.name + '</h3>' +
                        '<span>' + (this.isConnected ? '🤖 KiiKii 在线' : '未连接AI') + '</span>' +
                    '</div>' +
                    '<div class="header-stats" id="headerStats">' +
                        '<div class="header-stat coins" onclick="App.showRewardsPanel()" title="点击兑换奖励">' +
                            '<span class="stat-emoji">🪙</span>' +
                            '<span class="stat-value" id="headerCoins">' + state.coins + '</span>' +
                        '</div>' +
                        
                    '</div>' +
                    '<button class="api-key-btn" onclick="App.showApiKeyModal()" title="设置API Key">🔑</button>' +
                    '<button class="settings-btn-header" onclick="toggleSettingsPanel()" title="全局设置">⚙️</button>' +
                '</div>' +
                '<div class="chat-messages" id="chatMessages">' +
                    '<!-- 消息将动态添加 -->' +
                    '</div>' +
                '<div class="quick-replies" id="quickReplies">' +
                    '<button class="quick-reply-btn" onclick="App.quickReply(\'今天做什么\')">📅 今天做什么</button>' +
                    '<button class="quick-reply-btn" onclick="App.showAddIncomeModal()">💰 记录收入</button>' +
                    '<button class="quick-reply-btn" onclick="App.quickReply(\'我有点累\')">😴 有点累</button>' +
                '</div>' +
                '<div class="chat-input-area">' +
                    '<div class="input-wrapper">' +
                        '<input type="text" class="chat-input" id="chatInput" placeholder="💬 告诉我你的收入/支出，或今天要做什么..." onkeypress="if(event.key===\'Enter\')App.sendMessage()">' +
                        '<button class="input-btn" onclick="App.addAttachment()" title="添加附件">➕</button>' +
                        '<button class="ai-parse-btn" onclick="App.aiParseInput()">AI拆解</button>' +
                        '<button class="input-btn" onclick="App.sendMessage()" title="发送">➡️</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        // 重新应用背景色并更新气泡颜色，加载聊天记录
        setTimeout(function() { 
            Canvas.reapplyBackground('smartInput'); 
            App.updateChatBubbleColors();
            App.loadChatMessages();
        }, 10);
    },
    
    // 🔧 新增：只更新头部信息，不重建整个组件（避免输入框内容丢失）
    updateSmartInputHeader() {
        const profile = Storage.getUserProfile();
        const state = Storage.getGameState();
        
        // 更新金币显示
        const coinsEl = document.getElementById('headerCoins');
        if (coinsEl) {
            coinsEl.textContent = state.coins;
        }
        
        // 更新在线状态
        const statusEl = document.querySelector('.online-status');
        if (statusEl) {
            statusEl.className = 'online-status ' + (this.isConnected ? 'connected' : 'disconnected');
        }
        
        // 更新用户名
        const userNameEl = document.querySelector('.user-info h3');
        if (userNameEl) {
            userNameEl.textContent = profile.name;
        }
        
        // 更新连接状态文字
        const statusTextEl = document.querySelector('.user-info span');
        if (statusTextEl) {
            statusTextEl.textContent = this.isConnected ? '🤖 KiiKii 在线' : '未连接AI';
        }
    },
    
    // 快捷回复
    quickReply(text) {
        const input = document.getElementById("chatInput");
        input.value = text;
        this.sendMessage();
    },
    
    // 更新快捷回复按钮（根据上下文动态变化）
    updateQuickReplies(context) {
        const container = document.getElementById("quickReplies");
        if (!container) return;
        
        let buttons = '';
        
        if (context === 'morning') {
            buttons = 
                '<button class="quick-reply-btn primary" onclick="App.quickReply(\'确认\')">✅ 确认安排</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'调整\')">✏️ 调整</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'我想先...\')">🗣️ 我想先...</button>';
        } else if (context === 'task_added') {
            buttons = 
                '<button class="quick-reply-btn" onclick="App.quickReply(\'拆解步骤\')">📋 拆解步骤</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'开始做\')">▶️ 开始做</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'还有别的\')">➕ 还有别的</button>';
        } else if (context === 'tired') {
            buttons = 
                '<button class="quick-reply-btn" onclick="App.quickReply(\'休息10分钟\')">😴 休息10分钟</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'做点轻松的\')">🎮 做点轻松的</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'继续坚持\')">💪 继续坚持</button>';
        } else if (context === 'income_recorded') {
            buttons = 
                '<button class="quick-reply-btn" onclick="App.showAddIncomeModal()">💰 继续记录</button>' +
                '<button class="quick-reply-btn" onclick="App.showAllIncomes()">📊 查看流水</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'今天做什么\')">📅 今天做什么</button>';
        } else {
            // 默认
            buttons = 
                '<button class="quick-reply-btn" onclick="App.quickReply(\'今天做什么\')">📅 今天做什么</button>' +
                '<button class="quick-reply-btn" onclick="App.showAddIncomeModal()">💰 记录收入</button>' +
                '<button class="quick-reply-btn" onclick="App.quickReply(\'我有点累\')">😴 有点累</button>';
        }
        
        container.innerHTML = buttons;
    },

    // 更新聊天气泡颜色（根据背景色自动计算对比色）
    updateChatBubbleColors() {
        const comp = document.getElementById('smartInput');
        if (!comp) return;
        
        const bgColor = comp.dataset.bgColor || '#ffffff';
        const brightness = Canvas.getColorBrightness(bgColor);
        const isDark = brightness < 128;
        
        // 计算AI气泡颜色（与背景形成对比）
        let aiBubbleBg, aiBubbleText, aiBubbleBorder;
        let userBubbleBg, userBubbleText, userBubbleBorder;
        let inputWrapperBg, inputWrapperBorder;
        
        if (isDark) {
            // 深色背景：使用亮色气泡
            aiBubbleBg = 'rgba(100, 200, 255, 0.3)';
            aiBubbleText = '#e0f4ff';
            aiBubbleBorder = 'rgba(100, 200, 255, 0.4)';
            
            userBubbleBg = 'rgba(255, 150, 200, 0.3)';
            userBubbleText = '#ffe0f0';
            userBubbleBorder = 'rgba(255, 150, 200, 0.4)';
            
            inputWrapperBg = 'rgba(255, 180, 220, 0.2)';
            inputWrapperBorder = 'rgba(255, 180, 220, 0.3)';
        } else {
            // 浅色背景：使用深色气泡
            aiBubbleBg = 'rgba(74, 144, 226, 0.25)';
            aiBubbleText = '#1a365d';
            aiBubbleBorder = 'rgba(74, 144, 226, 0.35)';
            
            userBubbleBg = 'rgba(255, 107, 157, 0.25)';
            userBubbleText = '#5d1a3a';
            userBubbleBorder = 'rgba(255, 107, 157, 0.35)';
            
            inputWrapperBg = 'rgba(74, 144, 226, 0.15)';
            inputWrapperBorder = 'rgba(74, 144, 226, 0.25)';
        }
        
        // 应用CSS变量
        const container = comp.querySelector('.smart-input-container');
        if (container) {
            container.style.setProperty('--ai-bubble-bg', aiBubbleBg);
            container.style.setProperty('--ai-bubble-text', aiBubbleText);
            container.style.setProperty('--ai-bubble-border', aiBubbleBorder);
            container.style.setProperty('--user-bubble-bg', userBubbleBg);
            container.style.setProperty('--user-bubble-text', userBubbleText);
            container.style.setProperty('--user-bubble-border', userBubbleBorder);
            container.style.setProperty('--input-wrapper-bg', inputWrapperBg);
            container.style.setProperty('--input-wrapper-border', inputWrapperBorder);
            
            // 直接应用到现有气泡
            const systemBubbles = container.querySelectorAll('.message.system .message-bubble');
            systemBubbles.forEach(function(bubble) {
                bubble.style.background = aiBubbleBg;
                bubble.style.color = aiBubbleText;
                bubble.style.border = '1px solid ' + aiBubbleBorder;
            });
            
            const userBubbles = container.querySelectorAll('.message.user .message-bubble');
            userBubbles.forEach(function(bubble) {
                bubble.style.background = userBubbleBg;
                bubble.style.color = userBubbleText;
                bubble.style.border = '1px solid ' + userBubbleBorder;
            });
            
            // 应用到输入框
            const inputWrapper = container.querySelector('.input-wrapper');
            if (inputWrapper) {
                inputWrapper.style.background = inputWrapperBg;
                inputWrapper.style.border = '1px solid ' + inputWrapperBorder;
            }
        }
    },

    async sendMessage() {
        const input = document.getElementById("chatInput");
        const text = input.value.trim();
        if (!text) return;
        
        this.addChatMessage("user", text, this.getEmoji(text, "user"));
        input.value = "";
        
        // 触发记忆学习事件
        if (typeof AIMemory !== 'undefined') {
            AIMemory.learnFromMessage(text, 'user');
        }
        
        // 广播用户消息事件
        document.dispatchEvent(new CustomEvent('userMessage', { detail: { message: text } }));
        
        // 尝试解析收入/支出记录（价值显化系统）
        if (typeof FinanceSystem !== 'undefined') {
            const financeResult = FinanceSystem.parseAndRecord(text);
            if (financeResult) {
                // 已识别为收入或支出，显示确认消息
                if (financeResult.type === 'income') {
                    const project = FinanceSystem.projects.find(p => p.id === financeResult.project);
                    this.addChatMessage('system', 
                        `💰 已记录收入 ¥${financeResult.amount}${project ? '（' + project.name + '）' : ''}\n` +
                        `📊 今日收入：¥${FinanceSystem.formatMoney(FinanceSystem.getTodayIncome())} | 本月：¥${FinanceSystem.formatMoney(FinanceSystem.getMonthIncome())}`,
                        '💰'
                    );
                    // 更新快捷回复为收入相关操作
                    this.updateQuickReplies('income_recorded');
                } else if (financeResult.type === 'expense') {
                    this.addChatMessage('system', 
                        `💸 已记录支出 ¥${financeResult.amount}\n` +
                        `📊 本月支出：¥${FinanceSystem.formatMoney(FinanceSystem.getMonthExpense())}`,
                        '💸'
                    );
                }
                // 不return，继续处理其他逻辑（用户可能还想说别的）
            }
        }
        
        // 先尝试自然语言时间轴控制
        if (typeof NaturalLanguageTimeline !== 'undefined') {
            const nlResult = await NaturalLanguageTimeline.parseAndExecute(text);
            if (nlResult) {
                this.addChatMessage("system", nlResult.message, nlResult.success ? "✅" : "❌");
                return;
            }
        }
        
        // 先让AI副驾驶理解输入
        if (typeof AICopilot !== 'undefined') {
            const understood = await AICopilot.understandInput(text);
            if (understood.handled) {
                // AI副驾驶已处理（如确认、调整等指令）
                return;
            }
        }
        
        // 显示AI思考动画
        this.showAIThinking();
        
        try {
            // 获取上下文增强
            let enrichedText = text;
            let contextInfo = null;
            if (typeof AICopilot !== 'undefined') {
                const understood = AICopilot.enrichWithContext(text);
                enrichedText = understood || text;
                contextInfo = AICopilot.getRelevantContext(text);
            }
            
            const result = await AIService.parseUserInput(enrichedText, contextInfo);
            
            // 隐藏思考动画
            this.hideAIThinking();
            
            // 处理多任务
            if (result.tasks && result.tasks.length > 0) {
                for (var i = 0; i < result.tasks.length; i++) {
                    this.addTaskToTimeline(result.tasks[i]);
                    // 记录到AI副驾驶上下文
                    if (typeof AICopilot !== 'undefined') {
                        AICopilot.recordTaskToContext(result.tasks[i]);
                    }
                }
            }
            
            // 处理多情绪/记忆
            if (result.memories && result.memories.length > 0) {
                for (var j = 0; j < result.memories.length; j++) {
                    var memory = result.memories[j];
                    this.addEmotionToMemory({
                        type: memory.emotion,
                        content: memory.content,
                        intensity: memory.intensity,
                        tags: memory.tags
                    });
                }
            }
            
            // 显示回复
            this.addChatMessage("system", result.reply || "好的，我记下了~", this.getEmoji(result.reply, "system"));
            
        } catch (e) {
            this.hideAIThinking();
            this.addChatMessage("system", "抱歉，我暂时无法处理，请检查API连接~", "😅");
        }
    },
    
    // 显示AI思考动画
    showAIThinking() {
        const container = document.getElementById("chatMessages");
        if (!container) return;
        
        const thinkingDiv = document.createElement("div");
        thinkingDiv.className = "ai-thinking";
        thinkingDiv.id = "aiThinkingIndicator";
        thinkingDiv.innerHTML = 
            '<div class="ai-thinking-dots">' +
                '<div class="ai-thinking-dot"></div>' +
                '<div class="ai-thinking-dot"></div>' +
                '<div class="ai-thinking-dot"></div>' +
            '</div>' +
            '<span class="ai-thinking-text">KiiKii 正在思考...</span>';
        container.appendChild(thinkingDiv);
        
        // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    },
    
    // 隐藏AI思考动画
    hideAIThinking() {
        const indicator = document.getElementById("aiThinkingIndicator");
        if (indicator) {
            indicator.remove();
        }
    },

    addChatMessage(type, text, emoji, skipSave = false) {
        const container = document.getElementById("chatMessages");
        if (!container) return;
        
        const msgDiv = document.createElement("div");
        msgDiv.className = "message " + type;
        msgDiv.innerHTML = '<span class="message-emoji">' + emoji + '</span><div class="message-bubble">' + text + '</div>';
        container.appendChild(msgDiv);
        
        // 只在用户发送消息或系统回复时才自动滚动到底部
        // 避免在输入时触发滚动
        if (type === 'user' || type === 'system') {
            // 使用 requestAnimationFrame 确保 DOM 更新后再滚动
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
        
        // 更新气泡颜色
        this.updateChatBubbleColors();
        
        // 保存聊天记录到本地存储（用于云同步）
        if (!skipSave) {
            this.saveChatMessage(type, text, emoji);
        }
    },
    
    // 保存聊天记录
    saveChatMessage(type, text, emoji) {
        const messages = Storage.load('adhd_chat_messages', []);
        const newMessage = {
            id: Date.now().toString(),
            type: type,
            text: text,
            emoji: emoji,
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        
        // 只保留最近100条消息
        if (messages.length > 100) {
            messages.splice(0, messages.length - 100);
        }
        
        Storage.save('adhd_chat_messages', messages);
    },
    
    // 加载聊天记录
    loadChatMessages() {
        const container = document.getElementById("chatMessages");
        if (!container) return;
        
        const messages = Storage.load('adhd_chat_messages', []);
        
        // 只显示今天的消息
        const today = new Date().toISOString().split('T')[0];
        const todayMessages = messages.filter(m => m.timestamp && m.timestamp.startsWith(today));
        
        // 清空现有消息
        container.innerHTML = '';
        
        // 重新渲染消息
        todayMessages.forEach(msg => {
            this.addChatMessage(msg.type, msg.text, msg.emoji, true);
        });
        
        // 不再显示欢迎消息，保持界面简洁
    },

    getEmoji(text, type) {
        if (!text) return type === "system" ? "🤖" : "😊";
        
        if (/开心|高兴|棒|好/.test(text)) return "😄";
        if (/烦|累|困|难/.test(text)) return "😓";
        if (/生气|愤怒/.test(text)) return "😤";
        if (/伤心|难过|哭/.test(text)) return "😢";
        if (/惊|哇|厉害/.test(text)) return "😮";
        if (/爱|喜欢|心/.test(text)) return "😍";
        if (/睡|休息|躺/.test(text)) return "😴";
        if (/吃|饭|食/.test(text)) return "🍽️";
        if (/运动|跑|健身/.test(text)) return "🏃";
        if (/学习|看书|读/.test(text)) return "📚";
        if (/工作|任务|做/.test(text)) return "💼";
        if (/洗|澡|清洁/.test(text)) return "🚿";
        
        return type === "system" ? "🤖" : "💭";
    },

    async aiParseInput() {
        const input = document.getElementById("chatInput");
        const text = input.value.trim();
        if (!text) {
            this.addChatMessage("system", "请先输入一些内容让我来拆解~", "🤔");
            return;
        }
        
        this.addChatMessage("user", text, this.getEmoji(text, "user"));
        this.addChatMessage("system", "正在分析中...", "🔄");
        input.value = "";
        
        try {
            const result = await AIService.parseUserInput(text);
            const messages = document.getElementById("chatMessages");
            messages.removeChild(messages.lastChild);
            
            var replyText = result.reply || "已为你解析完成~";
            
            // 处理多任务
            if (result.tasks && result.tasks.length > 0) {
                replyText += "\n\n📋 已添加 " + result.tasks.length + " 个任务：";
                for (var i = 0; i < result.tasks.length; i++) {
                    var task = result.tasks[i];
                    replyText += "\n  📌 " + task.title;
                    if (task.startTime) {
                        replyText += " (" + task.startTime + ")";
                    }
                    if (task.coins) {
                        replyText += " 🪙" + task.coins;
                    }
                    this.addTaskToTimeline(task);
                }
            }
            
            // 处理多情绪/记忆
            if (result.memories && result.memories.length > 0) {
                replyText += "\n\n💭 已记录 " + result.memories.length + " 条情绪：";
                for (var j = 0; j < result.memories.length; j++) {
                    var memory = result.memories[j];
                    replyText += "\n  " + this.getEmotionIcon(memory.emotion) + " " + memory.content;
                    this.addEmotionToMemory({
                        type: memory.emotion,
                        content: memory.content,
                        intensity: memory.intensity,
                        tags: memory.tags
                    });
                }
            }
            
            this.addChatMessage("system", replyText, "✨");
        } catch (e) {
            const messages = document.getElementById("chatMessages");
            messages.removeChild(messages.lastChild);
            this.addChatMessage("system", "解析失败，请检查API连接~", "😅");
        }
    },

    addAttachment() {
        alert("附件功能开发中~");
    },

    changeAvatar() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const profile = Storage.getUserProfile();
                    profile.avatar = ev.target.result;
                    Storage.saveUserProfile(profile);
                    // App.loadSmartInput(); // 已合并到 BrainDump 组件
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    // 时间轴 - 新设计（带可拖拽分隔线和展开/收缩功能）
    loadTimeline() {
        const container = document.getElementById("timelineBody");
        const tasks = Storage.getTasks();
        const today = this.formatDate(this.currentDate);
        const todayTasks = tasks.filter(function(t) { return t.date === today; })
            .sort(function(a, b) { return a.startTime.localeCompare(b.startTime); });
        const self = this;
        
        // 获取日历展开/收缩状态
        const isCalendarCollapsed = localStorage.getItem('calendarCollapsed') === 'true';
        
        // 生成日历HTML（根据状态显示整月或当周）
        const calendarHtml = isCalendarCollapsed ? this.generateWeekCalendarHtml() : this.generateCalendarHtml();
        
        // 生成智能时间轴HTML（只在有间隔时显示空白）
        var timeSlots = "";
        var lastEndMinutes = 0; // 上一个任务的结束时间（分钟）
        
        // 如果没有任务，显示简化的时间轴
        if (todayTasks.length === 0) {
            // 只显示整点时间标签和添加按钮
            for (var hour = 0; hour < 24; hour++) {
                timeSlots += 
                    '<div class="time-slot empty-slot" data-hour="' + hour + '" data-minutes="0">' +
                        '<span class="time-label">' + hour.toString().padStart(2, "0") + ':00</span>' +
                        '<div class="gap-add-section">' +
                            '<button class="gap-add-link" onclick="App.showGapMenu(event, ' + hour + ', 0)">' +
                                '<span>+</span> 添加任务' +
                            '</button>' +
                        '</div>' +
                    '</div>';
            }
        } else {
            // 有任务时，智能显示
            for (var i = 0; i < todayTasks.length; i++) {
                var task = todayTasks[i];
                var taskStartParts = task.startTime.split(':');
                var taskStartMinutes = parseInt(taskStartParts[0]) * 60 + parseInt(taskStartParts[1] || 0);
                var taskDuration = task.duration || 30;
                var taskEndMinutes = taskStartMinutes + taskDuration;
                
                // 计算与上一个任务的间隔
                var gapMinutes = taskStartMinutes - lastEndMinutes;
                
                // 如果有间隔（超过5分钟），显示间隔区域
                if (gapMinutes > 5) {
                    var gapStartHour = Math.floor(lastEndMinutes / 60);
                    var gapStartMin = lastEndMinutes % 60;
                    var gapEndHour = Math.floor(taskStartMinutes / 60);
                    var gapEndMin = taskStartMinutes % 60;
                    
                    // 显示间隔时间标签
                    var gapTimeLabel = '';
                    if (gapStartMin === 0 || lastEndMinutes === 0) {
                        gapTimeLabel = '<span class="time-label">' + gapStartHour.toString().padStart(2, "0") + ':' + gapStartMin.toString().padStart(2, "0") + '</span>';
                    }
                    
                    timeSlots += 
                        '<div class="time-slot gap-slot" data-hour="' + gapStartHour + '" data-minutes="' + gapStartMin + '" style="min-height: ' + Math.min(gapMinutes * 1.4, 80) + 'px;">' +
                            gapTimeLabel +
                            '<div class="gap-add-section">' +
                                '<button class="gap-add-link" onclick="App.showGapMenu(event, ' + gapStartHour + ', ' + gapStartMin + ')">' +
                                    '<span>+</span> ' + gapMinutes + '分钟空闲' +
                                '</button>' +
                            '</div>' +
                        '</div>';
                }
                
                // 显示任务时间标签
                var taskHour = parseInt(taskStartParts[0]);
                var taskMin = parseInt(taskStartParts[1] || 0);
                var taskTimeLabel = '<span class="time-label">' + taskHour.toString().padStart(2, "0") + ':' + taskMin.toString().padStart(2, "0") + '</span>';
                
                // 显示任务卡片
                timeSlots += 
                    '<div class="time-slot task-slot" data-hour="' + taskHour + '" data-minutes="' + taskMin + '">' +
                        taskTimeLabel +
                        this.renderEventCard(task, i) +
                    '</div>';
                
                lastEndMinutes = taskEndMinutes;
            }
            
            // 最后一个任务后面的空闲时间（到24:00）
            var remainingMinutes = 24 * 60 - lastEndMinutes;
            if (remainingMinutes > 30) {
                var lastHour = Math.floor(lastEndMinutes / 60);
                var lastMin = lastEndMinutes % 60;
                timeSlots += 
                    '<div class="time-slot gap-slot" data-hour="' + lastHour + '" data-minutes="' + lastMin + '">' +
                        '<span class="time-label">' + lastHour.toString().padStart(2, "0") + ':' + lastMin.toString().padStart(2, "0") + '</span>' +
                        '<div class="gap-add-section">' +
                            '<button class="gap-add-link" onclick="App.showGapMenu(event, ' + lastHour + ', ' + lastMin + ')">' +
                                '<span>+</span> 添加任务' +
                            '</button>' +
                        '</div>' +
                    '</div>';
            }
        }
        
        // 当前时间（初始位置会在 updateTimeIndicator 中精确计算）
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = currentHour.toString().padStart(2, "0") + ":" + currentMinute.toString().padStart(2, "0");
        // 初始位置设为0，稍后通过 updateTimeIndicator 精确定位
        const indicatorTop = 0;
        
        // 日历高度：收缩时只显示一行（约80px），展开时自动适应内容
        const calendarHeight = isCalendarCollapsed ? 'auto' : 'auto';
        
        container.innerHTML = 
            '<div class="timeline-container">' +
                // 顶部日历区（可展开/收缩）
                '<div class="calendar-section' + (isCalendarCollapsed ? ' collapsed' : ' expanded') + '" id="calendarSection">' +
                    '<div class="calendar-header">' +
                        '<span class="calendar-month">' + this.getMonthYearStr(this.currentDate) + '</span>' +
                        '<div class="calendar-nav">' +
                            '<button class="calendar-nav-btn" onclick="App.prevMonth()">◀</button>' +
                            '<button class="calendar-nav-btn" onclick="App.nextMonth()">▶</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="calendar-weekdays">' +
                        '<span class="weekday-label">一</span>' +
                        '<span class="weekday-label">二</span>' +
                        '<span class="weekday-label">三</span>' +
                        '<span class="weekday-label">四</span>' +
                        '<span class="weekday-label">五</span>' +
                        '<span class="weekday-label">六</span>' +
                        '<span class="weekday-label">日</span>' +
                    '</div>' +
                    '<div class="calendar-grid" id="calendarGrid">' +
                        calendarHtml +
                    '</div>' +
                    '<div class="calendar-footer">' +
                        '<button class="calendar-toggle-btn' + (isCalendarCollapsed ? ' collapsed' : '') + '" onclick="App.toggleCalendarView()">' +
                            (isCalendarCollapsed ? '▼ 展开月视图' : '▲ 收缩为周视图') +
                        '</button>' +
                        '<button class="add-event-btn" onclick="App.showAddEventForm()">+ 添加任务</button>' +
                    '</div>' +
                '</div>' +
                // 时间轴区
                '<div class="timeline-section" id="timelineSection">' +
                    '<div class="current-time-indicator" id="currentTimeIndicator" style="top: ' + indicatorTop + 'px;">' +
                        '<span class="current-time-label">Now ' + currentTimeStr + '</span>' +
                    '</div>' +
                    '<div class="timeline-track" id="timelineTrack">' +
                        timeSlots +
                    '</div>' +
                '</div>' +
            '</div>';
        
        this.initTaskDrag();
        this.scrollToCurrentTime();
        this.startTimeIndicatorUpdate();
        
        // 重新应用背景色 - 但不覆盖事件卡片的颜色
        setTimeout(function() { 
            Canvas.reapplyBackgroundExceptCards('timeline'); 
        }, 10);
        
        // 渲染语音助手按钮
        setTimeout(function() {
            if (typeof VoiceAssistant !== 'undefined') {
                VoiceAssistant.renderVoiceButton();
            }
        }, 100);
    },

    // 切换日历视图（展开/收缩）
    toggleCalendarView() {
        const isCollapsed = localStorage.getItem('calendarCollapsed') === 'true';
        localStorage.setItem('calendarCollapsed', !isCollapsed);
        this.loadTimeline();
    },
    
    // 切换子任务列表展开/折叠
    toggleSubsteps(event, taskId) {
        event.stopPropagation();
        const substepsContainer = document.getElementById('substeps_' + taskId);
        const toggleBtn = event.currentTarget;
        
        if (substepsContainer) {
            substepsContainer.classList.toggle('collapsed');
            // 更新按钮图标
            if (substepsContainer.classList.contains('collapsed')) {
                toggleBtn.innerHTML = toggleBtn.innerHTML.replace('▼', '▶');
            } else {
                toggleBtn.innerHTML = toggleBtn.innerHTML.replace('▶', '▼');
            }
        }
    },
    
    // 显示时间编辑器弹窗
    showTimeEditor(event, taskId) {
        event.stopPropagation();
        this.closeAllMenus();
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const endTime = task.endTime || this.addMinutes(task.startTime, task.duration || 30);
        const duration = task.duration || this.getMinutesDiff(task.startTime, endTime);
        
        const popup = document.createElement('div');
        popup.className = 'time-editor-popup';
        popup.innerHTML = `
            <div class="time-editor-header">
                <span class="time-editor-title">⏰ 编辑时间</span>
                <button class="time-editor-close" onclick="App.closeAllMenus()">×</button>
            </div>
            <div class="time-editor-body">
                <div class="time-editor-row">
                    <label>开始时间</label>
                    <input type="time" id="editStartTime" value="${task.startTime}" onchange="App.updateTaskTimePreview('${taskId}')">
                </div>
                <div class="time-editor-row">
                    <label>持续时间</label>
                    <div class="duration-input-group">
                        <input type="number" id="editDuration" value="${duration}" min="5" max="480" onchange="App.updateTaskTimePreview('${taskId}')">
                        <span class="duration-unit">分钟</span>
                    </div>
                </div>
                <div class="time-editor-row">
                    <label>结束时间</label>
                    <input type="time" id="editEndTime" value="${endTime}" onchange="App.updateTaskDurationFromEnd('${taskId}')">
                </div>
                <div class="time-editor-quick-durations">
                    <span class="quick-duration-label">快速设置：</span>
                    <button class="quick-duration-btn" onclick="App.setQuickDuration('${taskId}', 15)">15分</button>
                    <button class="quick-duration-btn" onclick="App.setQuickDuration('${taskId}', 30)">30分</button>
                    <button class="quick-duration-btn" onclick="App.setQuickDuration('${taskId}', 60)">1小时</button>
                    <button class="quick-duration-btn" onclick="App.setQuickDuration('${taskId}', 120)">2小时</button>
                </div>
            </div>
            <div class="time-editor-footer">
                <button class="time-editor-btn cancel" onclick="App.closeAllMenus()">取消</button>
                <button class="time-editor-btn confirm" onclick="App.saveTaskTime('${taskId}')">保存</button>
            </div>
        `;
        
        // 定位弹窗
        const rect = event.target.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
        popup.style.top = Math.min(rect.bottom + 5, window.innerHeight - 300) + 'px';
        popup.style.zIndex = '10000';
        
        document.body.appendChild(popup);
    },
    
    // 更新时间预览（当开始时间或持续时间改变时）
    updateTaskTimePreview(taskId) {
        const startTime = document.getElementById('editStartTime').value;
        const duration = parseInt(document.getElementById('editDuration').value) || 30;
        const endTimeInput = document.getElementById('editEndTime');
        
        if (startTime && duration) {
            endTimeInput.value = this.addMinutes(startTime, duration);
        }
    },
    
    // 从结束时间更新持续时间
    updateTaskDurationFromEnd(taskId) {
        const startTime = document.getElementById('editStartTime').value;
        const endTime = document.getElementById('editEndTime').value;
        const durationInput = document.getElementById('editDuration');
        
        if (startTime && endTime) {
            const duration = this.getMinutesDiff(startTime, endTime);
            if (duration > 0) {
                durationInput.value = duration;
            }
        }
    },
    
    // 快速设置持续时间
    setQuickDuration(taskId, minutes) {
        document.getElementById('editDuration').value = minutes;
        this.updateTaskTimePreview(taskId);
    },
    
    // 保存任务时间
    saveTaskTime(taskId) {
        const startTime = document.getElementById('editStartTime').value;
        const duration = parseInt(document.getElementById('editDuration').value) || 30;
        const endTime = document.getElementById('editEndTime').value;
        
        if (startTime && duration > 0) {
            Storage.updateTask(taskId, {
                startTime: startTime,
                duration: duration,
                endTime: endTime
            });
            
            this.closeAllMenus();
            this.loadTimeline();
            this.addChatMessage("system", "✅ 任务时间已更新", "⏰");
        }
    },
    
    // 任务拖拽开始
    onTaskDragStart(event, taskId) {
        event.dataTransfer.setData('text/plain', taskId);
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging');
        
        // 存储拖拽的任务ID
        this._draggingTaskId = taskId;
        
        // 显示拖放提示
        this.showDragDropHints();
    },
    
    // 任务拖拽结束
    onTaskDragEnd(event) {
        event.target.classList.remove('dragging');
        this._draggingTaskId = null;
        
        // 隐藏拖放提示
        this.hideDragDropHints();
    },
    
    // 显示拖放提示
    showDragDropHints() {
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.classList.add('drop-target');
            slot.addEventListener('dragover', this.onTimeSlotDragOver);
            slot.addEventListener('drop', this.onTimeSlotDrop.bind(this));
            slot.addEventListener('dragleave', this.onTimeSlotDragLeave);
        });
    },
    
    // 隐藏拖放提示
    hideDragDropHints() {
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.classList.remove('drop-target', 'drag-over');
            slot.removeEventListener('dragover', this.onTimeSlotDragOver);
            slot.removeEventListener('drop', this.onTimeSlotDrop);
            slot.removeEventListener('dragleave', this.onTimeSlotDragLeave);
        });
    },
    
    // 时间槽拖拽悬停
    onTimeSlotDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    },
    
    // 时间槽拖拽离开
    onTimeSlotDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    },
    
    // 时间槽放置
    onTimeSlotDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const taskId = event.dataTransfer.getData('text/plain');
        if (!taskId) return;
        
        // 获取目标时间槽的时间
        const slot = event.currentTarget;
        const hour = slot.dataset.hour;
        const minutes = slot.dataset.minutes || '00';
        const newStartTime = hour.padStart(2, '0') + ':' + minutes.padStart(2, '0');
        
        // 更新任务时间
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const duration = task.duration || 30;
            const newEndTime = this.addMinutes(newStartTime, duration);
            
            Storage.updateTask(taskId, {
                startTime: newStartTime,
                endTime: newEndTime
            });
            
            this.loadTimeline();
            this.addChatMessage("system", `✅ 已将「${task.title}」移动到 ${newStartTime}`, "🔄");
        }
    },

    // 生成当周日历HTML
    generateWeekCalendarHtml() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const day = this.currentDate.getDate();
        const today = new Date();
        const tasks = Storage.getTasks();
        
        // 获取当前日期是星期几（0=周日，转换为周一开始）
        let currentWeekday = this.currentDate.getDay() - 1;
        if (currentWeekday < 0) currentWeekday = 6;
        
        // 计算本周的开始日期（周一）
        const weekStart = new Date(year, month, day - currentWeekday);
        
        var html = "";
        
        // 生成本周7天
        for (var i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            
            const dayNum = currentDay.getDate();
            const dayMonth = currentDay.getMonth();
            const dayYear = currentDay.getFullYear();
            
            const dateStr = dayYear + "-" + (dayMonth + 1).toString().padStart(2, "0") + "-" + dayNum.toString().padStart(2, "0");
            const isToday = today.getFullYear() === dayYear && today.getMonth() === dayMonth && today.getDate() === dayNum;
            const isSelected = this.formatDate(this.currentDate) === dateStr;
            const hasEvents = tasks.some(function(t) { return t.date === dateStr; });
            const isOtherMonth = dayMonth !== month;
            
            var classes = "calendar-day";
            if (isToday) classes += " today";
            if (isSelected && !isToday) classes += " selected";
            if (hasEvents) classes += " has-events";
            if (isOtherMonth) classes += " other-month";
            
            html += '<button class="' + classes + '" onclick="App.selectDate(' + dayYear + ',' + dayMonth + ',' + dayNum + ')">' + dayNum + '</button>';
        }
        
        return html;
    },
    
    // 初始化日历高度拖拽调整
    initCalendarResize() {
        const handle = document.getElementById('calendarResizeHandle');
        const calendarSection = document.getElementById('calendarSection');
        if (!handle || !calendarSection) return;
        
        let isDragging = false;
        let startY = 0;
        let startHeight = 0;
        
        handle.addEventListener('mousedown', function(e) {
            isDragging = true;
            startY = e.clientY;
            startHeight = calendarSection.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            const dy = e.clientY - startY;
            const newHeight = Math.max(60, Math.min(300, startHeight + dy));
            calendarSection.style.height = newHeight + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                // 保存高度到localStorage
                localStorage.setItem('calendarHeight', calendarSection.offsetHeight);
            }
        });
    },

    // 生成日历网格HTML
    generateCalendarHtml() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        const tasks = Storage.getTasks();
        
        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 获取第一天是星期几（0=周日，转换为周一开始）
        let startWeekday = firstDay.getDay() - 1;
        if (startWeekday < 0) startWeekday = 6;
        
        // 获取上个月的最后几天
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        var html = "";
        var dayCount = 1;
        var nextMonthDay = 1;
        
        // 生成6行日历
        for (var row = 0; row < 6; row++) {
            for (var col = 0; col < 7; col++) {
                const cellIndex = row * 7 + col;
                
                if (cellIndex < startWeekday) {
                    // 上个月的日期
                    const day = prevMonthLastDay - startWeekday + cellIndex + 1;
                    html += '<button class="calendar-day other-month" onclick="App.selectDate(' + year + ',' + (month - 1) + ',' + day + ')">' + day + '</button>';
                } else if (dayCount <= lastDay.getDate()) {
                    // 当月日期
                    const dateStr = year + "-" + (month + 1).toString().padStart(2, "0") + "-" + dayCount.toString().padStart(2, "0");
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayCount;
                    const isSelected = this.formatDate(this.currentDate) === dateStr;
                    const hasEvents = tasks.some(function(t) { return t.date === dateStr; });
                    
                    var classes = "calendar-day";
                    if (isToday) classes += " today";
                    if (isSelected && !isToday) classes += " selected";
                    if (hasEvents) classes += " has-events";
                    
                    html += '<button class="' + classes + '" onclick="App.selectDate(' + year + ',' + month + ',' + dayCount + ')">' + dayCount + '</button>';
                    dayCount++;
                } else {
                    // 下个月的日期
                    html += '<button class="calendar-day other-month" onclick="App.selectDate(' + year + ',' + (month + 1) + ',' + nextMonthDay + ')">' + nextMonthDay + '</button>';
                    nextMonthDay++;
                }
            }
        }
        
        return html;
    },

    // 预设卡片颜色（智能换色）- 更鲜艳的颜色
    cardColors: [
        { bg: '#E3F2FD' },  // 浅蓝
        { bg: '#FCE4EC' },  // 浅粉
        { bg: '#E8F5E9' },  // 浅绿
        { bg: '#FFF3E0' },  // 浅橙
        { bg: '#F3E5F5' },  // 浅紫
        { bg: '#E0F7FA' },  // 浅青
        { bg: '#FFFDE7' },  // 浅黄
        { bg: '#FFEBEE' },  // 浅红
        { bg: '#E8EAF6' },  // 浅靛蓝
        { bg: '#F1F8E9' },  // 浅黄绿
        { bg: '#4A90E2' },  // 蓝色
        { bg: '#FF6B9D' },  // 粉色
        { bg: '#27AE60' },  // 绿色
        { bg: '#F39C12' },  // 橙色
        { bg: '#9B59B6' },  // 紫色
        { bg: '#1ABC9C' },  // 青色
        { bg: '#E74C3C' },  // 红色
        { bg: '#34495E' },  // 深灰
    ],

    // 渲染事件卡片（支持自定义颜色和大金币图标）
    renderEventCard(task, index) {
        const endTime = task.endTime || this.addMinutes(task.startTime, task.duration || 30);
        const duration = this.getMinutesDiff(task.startTime, endTime);
        
        // 获取卡片颜色（优先使用任务自定义颜色，否则智能分配）
        var cardBg;
        if (task.cardColor) {
            cardBg = task.cardColor;
        } else {
            // 根据任务ID智能分配颜色
            const colorIndex = parseInt(task.id) % this.cardColors.length;
            cardBg = this.cardColors[colorIndex].bg;
        }
        
        // 根据背景色自动计算文字颜色（纯黑或纯白）
        var cardText = this.getContrastColor(cardBg);
        
        // 根据任务类型选择图标 - 放大emoji
        const iconMap = {
            "运动": "🏃",
            "健身": "💪",
            "会议": "👥",
            "工作": "💼",
            "学习": "📚",
            "休息": "☕",
            "吃饭": "🍽",
            "洗澡": "🚿",
            "睡觉": "😴",
            "娱乐": "🎮",
            "购物": "🛒",
            "default": "📌"
        };
        
        var icon = iconMap.default;
        if (task.tags && task.tags.length > 0) {
            for (var key in iconMap) {
                if (task.tags.some(function(tag) { return tag.indexOf(key) !== -1; })) {
                    icon = iconMap[key];
                    break;
                }
            }
        }
        if (task.title) {
            for (var key in iconMap) {
                if (task.title.indexOf(key) !== -1) {
                    icon = iconMap[key];
                    break;
                }
            }
        }
        
        // 标签HTML
        var tagsHtml = "";
        if (task.tags && task.tags.length > 0) {
            tagsHtml = '<div class="event-tags" style="color:' + cardText + ';">';
            for (var i = 0; i < Math.min(task.tags.length, 2); i++) {
                tagsHtml += '<span class="event-tag" style="background:rgba(' + (cardText === '#FFFFFF' ? '255,255,255' : '0,0,0') + ',0.15);">' + task.tags[i] + '</span>';
            }
            tagsHtml += '</div>';
        }
        
        // 步数验证标识
        var stepBadgeHtml = '';
        if (task.verificationType === 'steps' && task.targetSteps) {
            stepBadgeHtml = '<span class="event-step-badge" style="color:' + cardText + '; background:rgba(' + (cardText === '#FFFFFF' ? '76,175,80' : '76,175,80') + ',0.3);">' +
                '<span class="step-icon">🚶</span>' +
                '<span class="step-value">' + task.targetSteps + '步</span>' +
            '</span>';
        }
        
        // 大金币图标显示（使用$符号代替emoji，避免乱码）
        var coinBadgeHtml = '';
        if (task.coins) {
            coinBadgeHtml = '<span class="event-coin-badge" style="color:' + cardText + '; background:rgba(' + (cardText === '#FFFFFF' ? '255,215,0' : '255,215,0') + ',0.3); border-color:rgba(' + (cardText === '#FFFFFF' ? '255,215,0' : '218,165,32') + ',0.5);">' +
                '<span class="coin-icon-large">$</span>' +
                '<span class="coin-value">' + task.coins + '</span>' +
            '</span>';
        }
        
        // 地点显示
        var locationHtml = task.location ? '<div class="event-location" style="color:' + cardText + ';">@ ' + task.location + '</div>' : '';
        
        // 完成状态
        var completedClass = task.completed ? ' completed task-completed' : '';
        
        // 一键完成圆圈HTML
        var quickCompleteCircle = '<div class="task-complete-circle' + (task.completed ? ' completed' : '') + '" onclick="App.quickCompleteTask(event, \'' + task.id + '\')" title="点击完成任务"></div>';
        
        // 卡片样式 - 确保背景色和文字色都正确应用
        var cardStyle = 'background-color: ' + cardBg + ' !important; color: ' + cardText + ' !important; position: relative; margin-left: 20px;';
        
        // 按钮背景色 - 与卡片背景色一致（透明）
        var btnStyle = 'background: transparent; color: ' + cardText + ';';
        
        // 子步骤HTML（默认折叠，点击展开按钮才显示）
        var substepsHtml = '';
        var hasSubsteps = task.substeps && task.substeps.length > 0;
        if (hasSubsteps) {
            substepsHtml = '<div class="event-substeps collapsed" id="substeps_' + task.id + '">';
            for (var j = 0; j < task.substeps.length; j++) {
                var step = task.substeps[j];
                var checkedClass = step.completed ? ' checked' : '';
                substepsHtml += '<div class="event-substep" style="color:' + cardText + '; border-left-color: rgba(' + (cardText === '#FFFFFF' ? '255,255,255' : '0,0,0') + ',0.3);">' +
                    '<span class="event-substep-checkbox' + checkedClass + '" onclick="App.toggleSubstep(event, \'' + task.id + '\', ' + j + ')" style="border-color:' + cardText + ';"></span>' +
                    '<span class="event-substep-title">' + step.title + '</span>' +
                    '<span class="event-substep-duration">' + (step.duration || 5) + 'min</span>' +
                '</div>';
            }
            substepsHtml += '</div>';
        }
        
        // 子任务展开按钮（仅当有子任务时显示）
        var substepsToggleBtn = hasSubsteps ? 
            '<button class="event-substeps-toggle" style="' + btnStyle + '" onclick="App.toggleSubsteps(event, \'' + task.id + '\')" title="展开/收起子任务">' +
                '<span class="substeps-count">' + task.substeps.length + '</span>▶' +
            '</button>' : '';
        
        return quickCompleteCircle + '<div class="event-card' + completedClass + '" data-task-id="' + task.id + '" draggable="true" ondragstart="App.onTaskDragStart(event, \'' + task.id + '\')" ondragend="App.onTaskDragEnd(event)" style="' + cardStyle + '" onclick="App.toggleEventDetails(event, \'' + task.id + '\')">' +
                   '<div class="event-icon">' + icon + '</div>' +
                   '<div class="event-content">' +
                       '<div class="event-title" style="color:' + cardText + ';">' + task.title + coinBadgeHtml + stepBadgeHtml + '</div>' +
                       '<div class="event-time" style="color:' + cardText + ';" onclick="App.showTimeEditor(event, \'' + task.id + '\')" title="点击编辑时间">' + task.startTime + ' - ' + endTime + ' <span class="duration-badge">(' + duration + 'min)</span></div>' +
                       locationHtml +
                       tagsHtml +
                       substepsHtml +
                       '<div class="event-details" id="eventDetails_' + task.id + '" style="color:' + cardText + ';">' +
                           '<div class="event-detail-row">' +
                               '<span class="event-detail-label">奖励</span>' +
                               '<span class="event-detail-value">$ ' + (task.coins || 5) + ' 金币</span>' +
                           '</div>' +
                           '<div class="event-detail-row">' +
                               '<span class="event-detail-label">精力消耗</span>' +
                               '<span class="event-detail-value">⚡ ' + (task.energyCost || 2) + '</span>' +
                           '</div>' +
                           (task.verificationType === 'steps' ? '<div class="event-detail-row"><span class="event-detail-label">验证方式</span><span class="event-detail-value">🚶 步数验证 (' + task.targetSteps + '步)</span></div>' : '') +
                           (task.notes ? '<div class="event-detail-row"><span class="event-detail-label">备注</span><span class="event-detail-value">' + task.notes + '</span></div>' : '') +
                           '<div class="event-actions">' +
                               '<button class="event-action-btn edit" style="' + btnStyle + '" onclick="App.editTask(event, \'' + task.id + '\')">✏ 编辑</button>' +
                               '<button class="event-action-btn" style="' + btnStyle + '" onclick="App.showCardColorPicker(event, \'' + task.id + '\')">🎨 换色</button>' +
                               (task.verificationType === 'steps' ? '<button class="event-action-btn step-verify" style="' + btnStyle + '" onclick="App.startStepVerification(\'' + task.id + '\')">🚶 开始验证</button>' : '') +
                               '<button class="event-action-btn complete" onclick="App.completeTask(\'' + task.id + '\')">✓ 完成</button>' +
                               '<button class="event-action-btn delete" onclick="App.deleteTask(\'' + task.id + '\')">✕ 删除</button>' +
                           '</div>' +
                       '</div>' +
                   '</div>' +
                   substepsToggleBtn +
                   '<button class="event-color-btn" style="' + btnStyle + '" onclick="App.showCardColorPicker(event, \'' + task.id + '\')" title="换颜色">🎨</button>' +
                   '<button class="event-ai-btn" style="' + btnStyle + '" onclick="App.aiBreakdownTask(\'' + task.id + '\')" title="AI拆解">🔧</button>' +
                   '<button class="event-expand-btn" style="' + btnStyle + '" onclick="App.toggleEventDetails(event, \'' + task.id + '\')">▼</button>' +
               '</div>';
    },

    // 切换子步骤完成状态
    toggleSubstep(event, taskId, stepIndex) {
        event.stopPropagation();
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task || !task.substeps || !task.substeps[stepIndex]) return;
        
        const wasCompleted = task.substeps[stepIndex].completed;
        task.substeps[stepIndex].completed = !wasCompleted;
        Storage.updateTask(taskId, { substeps: task.substeps });
        
        // 如果子任务被标记为完成，触发子任务完成事件 - 通知监控系统
        if (!wasCompleted) {
            // 触发子任务完成事件
            document.dispatchEvent(new CustomEvent('subtaskCompleted', { 
                detail: { taskId: taskId, subtaskIndex: stepIndex, task: task } 
            }));
            
            // 触发价值收入
            this.onStepComplete(task, stepIndex);
            
            // 播放小庆祝音效
            if (typeof CelebrationEffects !== 'undefined') {
                CelebrationEffects.playSubtaskCompleteSound();
            }
        }
        
        this.loadTimeline();
    },
    
    // 根据背景色计算对比文字颜色（纯黑或纯白）
    getContrastColor(hexColor) {
        // 移除#号
        var hex = hexColor.replace('#', '');
        
        // 处理3位hex
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        // 转换为RGB
        var r = parseInt(hex.substr(0, 2), 16);
        var g = parseInt(hex.substr(2, 2), 16);
        var b = parseInt(hex.substr(4, 2), 16);
        
        // 计算亮度 (YIQ公式)
        var brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // 亮度大于140返回纯黑，否则返回纯白（更明显的对比）
        return brightness > 140 ? '#000000' : '#FFFFFF';
    },
    
    // 显示卡片颜色选择器
    showCardColorPicker(event, taskId) {
        event.stopPropagation();
        this.closeAllMenus();
        
        var colorsHtml = '';
        for (var i = 0; i < this.cardColors.length; i++) {
            var color = this.cardColors[i];
            colorsHtml += '<div class="color-picker-item" style="background: ' + color.bg + ';" onclick="App.setCardColor(\'' + taskId + '\', \'' + color.bg + '\')"></div>';
        }
        
        const popup = document.createElement('div');
        popup.className = 'color-picker-popup';
        popup.innerHTML = 
            '<div class="color-picker-popup-title">选择卡片颜色</div>' +
            '<div class="color-picker-grid">' + colorsHtml + '</div>' +
            '<div class="color-picker-custom">' +
                '<span style="font-size:12px;">自定义:</span>' +
                '<input type="color" id="customCardColor" onchange="App.setCardColor(\'' + taskId + '\', this.value)">' +
            '</div>';
        
        popup.style.left = event.pageX + 'px';
        popup.style.top = event.pageY + 'px';
        document.body.appendChild(popup);
        
        // 确保弹窗在视口内
        const rect = popup.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            popup.style.left = (window.innerWidth - rect.width - 10) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            popup.style.top = (window.innerHeight - rect.height - 10) + 'px';
        }
        
        setTimeout(function() {
            document.addEventListener('click', App.closeAllMenus, { once: true });
        }, 10);
    },
    
    // 设置卡片颜色
    setCardColor(taskId, color) {
        Storage.updateTask(taskId, { cardColor: color });
        this.loadTimeline();
        this.closeAllMenus();
    },

    // 切换事件详情展开/收起
    toggleEventDetails(event, taskId) {
        event.stopPropagation();
        const details = document.getElementById("eventDetails_" + taskId);
        const btn = event.currentTarget.querySelector('.event-expand-btn') || event.currentTarget;
        
        if (details) {
            details.classList.toggle("show");
            if (btn.classList) {
                btn.classList.toggle("expanded");
            }
        }
    },

    // 编辑任务
    editTask(event, taskId) {
        event.stopPropagation();
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        const newTitle = prompt("编辑任务名称:", task.title);
        if (newTitle && newTitle !== task.title) {
            Storage.updateTask(taskId, { title: newTitle });
            this.loadTimeline();
        }
    },

    // 选择日期
    selectDate(year, month, day) {
        this.currentDate = new Date(year, month, day);
        this.loadTimeline();
    },

    // 上个月
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.loadTimeline();
    },

    // 下个月
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.loadTimeline();
    },

    // 获取月份年份字符串
    getMonthYearStr(date) {
        const months = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
        return months[date.getMonth()] + " " + date.getFullYear();
    },

    // 显示添加事件表单
    showAddEventForm() {
        // 创建表单弹窗
        var existingModal = document.getElementById("eventFormModal");
        if (existingModal) existingModal.remove();
        
        const now = new Date();
        const defaultTime = now.getHours().toString().padStart(2, "0") + ":" + (Math.ceil(now.getMinutes() / 30) * 30).toString().padStart(2, "0");
        
        const modal = document.createElement("div");
        modal.className = "event-form-modal";
        modal.id = "eventFormModal";
        modal.innerHTML = 
            '<div class="event-form">' +
                '<div class="event-form-title">添加新事件</div>' +
                '<div class="event-form-group">' +
                    '<label class="event-form-label">事件名称</label>' +
                    '<input type="text" class="event-form-input" id="eventTitleInput" placeholder="输入事件名称...">' +
                '</div>' +
                '<div class="event-form-row">' +
                    '<div class="event-form-group">' +
                        '<label class="event-form-label">开始时间</label>' +
                        '<input type="time" class="event-form-input" id="eventStartInput" value="' + defaultTime + '">' +
                    '</div>' +
                    '<div class="event-form-group">' +
                        '<label class="event-form-label">结束时间</label>' +
                        '<input type="number" class="event-form-input" id="eventDurationInput" value="30" min="5" step="5" placeholder="30">' +
                    '</div>' +
                '</div>' +
                '<div class="event-form-group">' +
                    '<label class="event-form-label">地点（可选）</label>' +
                    '<input type="text" class="event-form-input" id="eventLocationInput" placeholder="输入地点...">' +
                '</div>' +
                '<div class="event-form-group">' +
                    '<label class="event-form-label">备注（可选）</label>' +
                    '<input type="text" class="event-form-input" id="eventNotesInput" placeholder="输入备注...">' +
                '</div>' +
                '<div class="event-form-actions">' +
                    '<button class="event-form-btn cancel" onclick="App.closeEventForm()">取消</button>' +
                    '<button class="event-form-btn submit" onclick="App.submitEventForm()">添加</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(modal);
        setTimeout(function() { modal.classList.add("show"); }, 10);
        document.getElementById("eventTitleInput").focus();
    },

    // 关闭事件表单
    closeEventForm() {
        const modal = document.getElementById("eventFormModal");
        if (modal) {
            modal.classList.remove("show");
            setTimeout(function() { modal.remove(); }, 300);
        }
    },

    // 提交事件表单
    submitEventForm() {
        const title = document.getElementById("eventTitleInput").value.trim();
        const startTime = document.getElementById("eventStartInput").value;
        const duration = parseInt(document.getElementById("eventDurationInput").value) || 30; const endTime = this.addMinutes(startTime, duration);
        const location = document.getElementById("eventLocationInput").value.trim();
        const notes = document.getElementById("eventNotesInput").value.trim();
        
        if (!title) {
            alert("请输入事件名称");
            return;
        }
        
        if (!startTime) {
            alert("请选择开始时间");
            return;
        }
        
        const task = {
            title: title,
            date: this.formatDate(this.currentDate),
            startTime: startTime,
            endTime: endTime, duration: duration,
            location: location || null,
            notes: notes || null,
            coins: 5,
            energyCost: 2,
            tags: []
        };
        
        this.addTaskToTimeline(task);
        this.closeEventForm();
        this.addChatMessage("system", "已添加事件「" + title + "」到 " + startTime, "📅");
    },

    // 旧的时间指示器更新函数已移除，使用文件末尾的新版本

    addTaskToTimeline(task) {
        if (!task.date) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.date = this.formatDate(tomorrow);
        }
        if (!task.endTime && task.startTime) {
            var duration = task.duration || 30;
            task.endTime = this.addMinutes(task.startTime, duration);
        }
        
        // 设置默认值
        task.coins = task.coins || 5;
        task.energyCost = task.energyCost || 2;
        task.tags = task.tags || [];
        if (task.type && task.tags.indexOf(task.type) === -1) {
            task.tags.push(task.type);
        }
        
        // 如果是步数验证任务，显示提示
        if (task.verificationType === 'steps' && task.targetSteps) {
            setTimeout(() => {
                this.addChatMessage('system', 
                    `🚶 任务【${task.title}】已设置步数验证\n` +
                    `目标步数：${task.targetSteps} 步\n` +
                    `原因：${task.verificationReason || '活动类任务'}\n` +
                    `💡 任务开始时将自动启动步数监控`,
                    '🚶'
                );
            }, 500);
        }
        
        const savedTask = Storage.addTask(task);
        this.loadTimeline();
        this.showCoinAnimation(2);
        return savedTask;
    },

    initTaskDrag() {
        const track = document.getElementById("timelineTrack");
        if (!track) return;
        
        var draggedTask = null;
        var startY = 0;
        var startTop = 0;
        const self = this;
        
        track.addEventListener("mousedown", function(e) {
            const taskBlock = e.target.closest(".task-block");
            if (taskBlock && !e.target.closest(".task-tag")) {
                draggedTask = taskBlock;
                startY = e.clientY;
                startTop = parseInt(taskBlock.style.top) || 0;
                taskBlock.classList.add("dragging");
                e.preventDefault();
            }
        });
        
        document.addEventListener("mousemove", function(e) {
            if (draggedTask) {
                const dy = e.clientY - startY;
                const newTop = Math.max(0, Math.min(59, startTop + dy));
                draggedTask.style.top = newTop + "px";
            }
        });
        
        document.addEventListener("mouseup", function() {
            if (draggedTask) {
                const taskId = draggedTask.dataset.taskId;
                const slot = draggedTask.closest(".time-slot");
                const hour = parseInt(slot.dataset.hour);
                const minutes = Math.round(parseInt(draggedTask.style.top) / 30) * 30;
                const newTime = hour.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
                
                Storage.updateTask(taskId, { startTime: newTime });
                draggedTask.classList.remove("dragging");
                draggedTask = null;
                self.loadTimeline();
            }
        });
    },

    showGapMenu(event, hour, minutes) {
        event.stopPropagation();
        this.closeAllMenus();
        
        minutes = minutes || 0;
        const timeStr = hour.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
        
        const menu = document.createElement("div");
        menu.className = "gap-menu";
        menu.id = "gapMenu";
        menu.innerHTML = 
            '<div class="gap-menu-item" onclick="App.addManualTask(' + hour + ', ' + minutes + ')">' +
                '<span class="menu-icon">✏️</span>手动添加任务' +
            '</div>' +
            '<div class="gap-menu-item" onclick="App.getAISuggestion(' + hour + ', ' + minutes + ')">' +
                '<span class="menu-icon">🤖</span>AI推荐任务' +
            '</div>' +
            '<div class="gap-menu-item" onclick="App.addRestTask(' + hour + ', ' + minutes + ')">' +
                '<span class="menu-icon">☕</span>添加休息时间' +
            '</div>' +
            '<div class="gap-menu-item" onclick="App.addCustomDuration(' + hour + ', ' + minutes + ')">' +
                '<span class="menu-icon">⏱️</span>自定义时长' +
            '</div>';
        
        menu.style.left = event.pageX + "px";
        menu.style.top = event.pageY + "px";
        document.body.appendChild(menu);
        
        setTimeout(function() {
            document.addEventListener("click", App.closeAllMenus, { once: true });
        }, 10);
    },

    addManualTask(hour, minutes) {
        minutes = minutes || 0;
        const title = prompt("请输入任务名称:");
        if (title) {
            this.addTaskToTimeline({
                title: title,
                date: this.formatDate(this.currentDate),
                startTime: hour.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0"),
                duration: 30,
                tags: []
            });
        }
        this.closeAllMenus();
    },

    addCustomDuration(hour, minutes) {
        minutes = minutes || 0;
        const title = prompt("请输入任务名称:");
        if (!title) {
            this.closeAllMenus();
            return;
        }
        
        const duration = prompt("请输入任务时长（分钟）:", "30");
        if (duration && !isNaN(parseInt(duration))) {
            this.addTaskToTimeline({
                title: title,
                date: this.formatDate(this.currentDate),
                startTime: hour.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0"),
                duration: parseInt(duration),
                tags: []
            });
        }
        this.closeAllMenus();
    },

    async getAISuggestion(hour, minutes) {
        this.closeAllMenus();
        minutes = minutes || 0;
        const tasks = Storage.getTasks();
        const today = this.formatDate(this.currentDate);
        const todayTasks = tasks.filter(function(t) { return t.date === today; });
        
        // 查找前后任务
        const currentSlotMinutes = hour * 60 + minutes;
        var beforeTask = null;
        var afterTask = null;
        
        todayTasks.forEach(function(t) {
            const taskMinutes = parseInt(t.startTime.split(":")[0]) * 60 + parseInt(t.startTime.split(":")[1] || 0);
            if (taskMinutes < currentSlotMinutes && (!beforeTask || taskMinutes > parseInt(beforeTask.startTime.split(":")[0]) * 60 + parseInt(beforeTask.startTime.split(":")[1] || 0))) {
                beforeTask = t;
            }
            if (taskMinutes > currentSlotMinutes && (!afterTask || taskMinutes < parseInt(afterTask.startTime.split(":")[0]) * 60 + parseInt(afterTask.startTime.split(":")[1] || 0))) {
                afterTask = t;
            }
        });
        
        this.addChatMessage("system", "正在获取AI建议...", "🤔");
        
        try {
            const suggestion = await AIService.suggestGapActivity(beforeTask, afterTask, 30);
            
            // 移除加载消息
            const messages = document.getElementById("chatMessages");
            messages.removeChild(messages.lastChild);
            
            // 构建建议消息
            var msgText = "💡 AI为你推荐了间隙活动：\n\n";
            
            if (suggestion.allSuggestions && suggestion.allSuggestions.length > 0) {
                var typeNames = { rest: "🛋️ 休息", transition: "🔄 过渡", micro: "⚡ 微任务" };
                for (var i = 0; i < suggestion.allSuggestions.length; i++) {
                    var s = suggestion.allSuggestions[i];
                    var typeName = typeNames[s.type] || "📌 活动";
                    msgText += (i + 1) + ". " + typeName + "：" + s.title + "\n";
                    msgText += "   ⏱️ " + s.duration + "分钟";
                    if (s.energyEffect > 0) {
                        msgText += " | 精力 +" + s.energyEffect;
                    } else if (s.energyEffect < 0) {
                        msgText += " | 精力 " + s.energyEffect;
                    }
                    msgText += "\n   💬 " + s.reason + "\n\n";
                }
            } else {
                msgText += "📌 " + suggestion.title + "\n";
                msgText += "💬 " + suggestion.reason;
            }
            
            this.addChatMessage("system", msgText, "💡");
            
            if (confirm("是否添加「" + suggestion.title + "」到时间轴？\n\n理由：" + suggestion.reason)) {
                var newTask = {
                    title: suggestion.title,
                    date: today,
                    startTime: hour.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0"),
                    duration: suggestion.duration || 30,
                    tags: ["AI建议", suggestion.type === "rest" ? "休息" : "任务"],
                    coins: suggestion.type === "rest" ? 2 : 3,
                    energyCost: suggestion.type === "rest" ? -suggestion.energyEffect : 1
                };
                this.addTaskToTimeline(newTask);
                
                // 如果是休息类，恢复精力
                if (suggestion.type === "rest" && suggestion.energyEffect > 0) {
                    Storage.restoreEnergy(suggestion.energyEffect);
                    this.updateGameStatus();
                }
            }
        } catch (e) {
            const messages = document.getElementById("chatMessages");
            messages.removeChild(messages.lastChild);
            this.addChatMessage("system", "获取AI建议失败，请检查API连接", "😅");
        }
    },

    addRestTask(hour, minutes) {
        minutes = minutes || 0;
        this.addTaskToTimeline({
            title: "休息时间 ☕",
            date: this.formatDate(this.currentDate),
            startTime: hour.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0"),
            duration: 30,
            tags: ["休息"],
            coins: 2,
            energyCost: -3
        });
        this.closeAllMenus();
    },

    showTaskContextMenu(event, taskId) {
        event.preventDefault();
        event.stopPropagation();
        this.closeAllMenus();
        
        const menu = document.createElement("div");
        menu.className = "context-menu";
        menu.id = "contextMenu";
        menu.innerHTML = 
            '<div class="context-menu-item" onclick="App.copyTask(\'' + taskId + '\')">' +
                '<span>📋</span>复制任务' +
            '</div>' +
            '<div class="context-menu-item" onclick="App.aiBreakdownTask(\'' + taskId + '\')">' +
                '<span>🔧</span>AI拆解' +
            '</div>' +
            '<div class="context-menu-item danger" onclick="App.deleteTask(\'' + taskId + '\')">' +
                '<span>🗑️</span>删除任务' +
            '</div>';
        
        menu.style.left = event.pageX + "px";
        menu.style.top = event.pageY + "px";
        document.body.appendChild(menu);
        
        setTimeout(function() {
            document.addEventListener("click", App.closeAllMenus, { once: true });
        }, 10);
    },

    closeAllMenus() {
        document.querySelectorAll(".gap-menu, .context-menu, .task-detail-popup, .color-picker-popup, .energy-menu, .energy-menu-overlay").forEach(function(el) {
            el.remove();
        });
    },

    deleteTask(taskId) {
        if (confirm("确定删除这个任务吗?")) {
            Storage.deleteTask(taskId);
            this.loadTimeline();
        }
        this.closeAllMenus();
    },

    copyTask(taskId) {
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (task) {
            const newTask = Object.assign({}, task);
            delete newTask.id;
            delete newTask.createdAt;
            Storage.addTask(newTask);
            this.loadTimeline();
        }
        this.closeAllMenus();
    },

    async aiBreakdownTask(taskId) {
        this.closeAllMenus();
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        // 如果已经有子步骤，提示用户
        if (task.substeps && task.substeps.length > 0) {
            if (!confirm('该任务已有拆解步骤，是否重新拆解？')) {
                return;
            }
        }
        
        this.addChatMessage("system", "正在AI拆解任务「" + task.title + "」...", "🔧");
        
        try {
            const steps = await AIService.breakdownTask(task);
            if (steps.length > 0) {
                // 将子步骤保存到任务中，而不是创建新任务
                const substeps = steps.map(function(step) {
                    return {
                        title: step.title,
                        duration: step.duration || 10,
                        difficulty: step.difficulty || 2,
                        tip: step.tip || '',
                        completed: false
                    };
                });
                
                Storage.updateTask(taskId, { substeps: substeps });
                this.loadTimeline();
                
                // 移除加载消息并显示成功消息
                const messages = document.getElementById("chatMessages");
                if (messages.lastChild) messages.removeChild(messages.lastChild);
                
                var stepsText = "✅ 已将「" + task.title + "」拆解为 " + steps.length + " 个子步骤：\n";
                for (var i = 0; i < steps.length; i++) {
                    stepsText += "\n" + (i + 1) + ". " + steps[i].title + " (" + steps[i].duration + "分钟)";
                    if (steps[i].tip) {
                        stepsText += "\n   💡 " + steps[i].tip;
                    }
                }
                this.addChatMessage("system", stepsText, "🎯");
            } else {
                const messages = document.getElementById("chatMessages");
                if (messages.lastChild) messages.removeChild(messages.lastChild);
                this.addChatMessage("system", "AI拆解未返回有效步骤，请稍后重试~", "😅");
            }
        } catch (e) {
            const messages = document.getElementById("chatMessages");
            if (messages.lastChild) messages.removeChild(messages.lastChild);
            this.addChatMessage("system", "AI拆解失败，请检查API连接~", "😅");
        }
    },

    showTaskDetail(event, taskId) {
        if (event.button === 2) return;
        event.stopPropagation();
        this.closeAllMenus();
        
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        var tagsRow = "";
        if (task.tags && task.tags.length > 0) {
            tagsRow = '<div class="task-detail-row"><span class="task-detail-label">标签</span><span class="task-detail-value">' + task.tags.join(", ") + '</span></div>';
        }
        
        var notesRow = "";
        if (task.notes) {
            notesRow = '<div class="task-detail-row"><span class="task-detail-label">备注</span><span class="task-detail-value">' + task.notes + '</span></div>';
        }
        
        var coinsRow = '<div class="task-detail-row"><span class="task-detail-label">奖励</span><span class="task-detail-value">🪙 ' + (task.coins || 5) + ' 金币 | ⚡ -' + (task.energyCost || 2) + ' 精力</span></div>';
        
        const popup = document.createElement("div");
        popup.className = "task-detail-popup";
        popup.innerHTML = 
            '<div class="task-detail-header">' +
                '<span class="task-detail-title">' + task.title + '</span>' +
                '<button class="task-detail-close" onclick="App.closeAllMenus()">✕</button>' +
            '</div>' +
            '<div class="task-detail-body">' +
                '<div class="task-detail-row">' +
                    '<span class="task-detail-label">时间</span>' +
                    '<span class="task-detail-value">' + task.startTime + ' - ' + (task.endTime || '未设置') + '</span>' +
                '</div>' +
                '<div class="task-detail-row">' +
                    '<span class="task-detail-label">日期</span>' +
                    '<span class="task-detail-value">' + task.date + '</span>' +
                '</div>' +
                coinsRow +
                tagsRow +
                notesRow +
            '</div>' +
            '<button class="task-complete-btn" onclick="App.completeTask(\'' + taskId + '\')">✅ 完成任务 (+' + (task.coins || 5) + '🪙)</button>';
        
        popup.style.left = event.pageX + "px";
        popup.style.top = event.pageY + "px";
        document.body.appendChild(popup);
    },

    // 一键快速完成任务（点击圆圈）
    quickCompleteTask(event, taskId) {
        event.stopPropagation();
        this.completeTask(taskId, true); // true 表示触发庆祝效果
    },

    completeTask(taskId, triggerCelebration = false) {
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        // 如果任务已完成，不重复处理
        if (task.completed) return;
        
        // 使用任务自带的金币，或默认值
        const coinsEarned = task.coins || 5;
        
        // 智能计算精力消耗：2小时任务消耗5点精力，按比例计算
        // 默认30分钟任务消耗约1.25点精力
        const taskDuration = task.duration || 30; // 分钟
        const energyCost = task.energyCost || Math.max(1, Math.round(taskDuration / 24)); // 120分钟 = 5点
        
        // 记录实际完成时间
        const now = new Date();
        const actualEndTime = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0');
        
        Storage.updateTask(taskId, { 
            completed: true, 
            completedAt: now.toISOString(),
            actualEndTime: actualEndTime
        });
        
        const state = Storage.getGameState();
        state.coins += coinsEarned;
        state.energy = Math.max(0, state.energy - energyCost);
        state.completedTasks += 1;
        
        // 检查升级
        if (state.completedTasks >= state.level * 5) {
            state.level += 1;
            // 升级不再增加最大精力值，保持用户设置的值
            this.addChatMessage("system", "🎉 恭喜升级！你现在是 Lv." + state.level + " 了！", "🌟");
        }
        
        Storage.saveGameState(state);
        
        // 触发任务完成事件 - 通知监控系统立即终止
        document.dispatchEvent(new CustomEvent('taskCompleted', { 
            detail: { taskId: taskId, task: task } 
        }));
        
        // 触发庆祝效果（撒彩带 + 音效）
        if (triggerCelebration && typeof CelebrationEffects !== 'undefined') {
            CelebrationEffects.triggerTaskComplete(task);
        } else {
        this.showCoinAnimation(coinsEarned);
        }
        
        // 语音播报（仅在语音助手开启时播报完成庆祝）
        if (typeof VoiceAssistant !== 'undefined' && VoiceAssistant.isEnabled) {
            VoiceAssistant.speak('太棒了！' + task.title + '已完成！');
        }
        
        // 触发价值显化器
        if (typeof ValueVisualizer !== 'undefined') {
            this.onTaskComplete(task);
        }
        
        this.updateGameStatus();
        this.loadTimeline();
        this.loadGameSystem();
        // this.loadSmartInput(); // 刷新头部显示 - 已合并到 BrainDump 组件
        this.closeAllMenus();
        
        this.addChatMessage("system", "太棒了！「" + task.title + "」完成！获得 " + coinsEarned + " 金币 🎉\n精力 -" + energyCost, "🏆");
    },

    // 开始步数验证
    startStepVerification(taskId) {
        event && event.stopPropagation();
        
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        if (typeof StepVerification === 'undefined') {
            this.addChatMessage('system', '步数验证模块未加载', '❌');
            return;
        }
        
        // 开始步数验证
        StepVerification.startVerification(task);
        this.closeAllMenus();
    },

    // 记忆库
    loadMemoryBank() {
        const container = document.getElementById("memoryBankBody");
        const memories = Storage.getMemories();
        const self = this;
        
        var cardsHtml = "";
        if (memories.length === 0) {
            cardsHtml = '<p style="text-align:center;color:#999;grid-column:1/-1;">还没有记忆~开始记录吧！</p>';
        } else {
            for (var i = 0; i < memories.length; i++) {
                cardsHtml += this.renderMemoryCard(memories[i]);
            }
        }
        
        container.innerHTML = 
            '<div class="memory-container">' +
                '<div class="memory-header">' +
                    '<div class="memory-search">' +
                        '<input type="text" class="memory-search-input" placeholder="🔍 搜索记忆..." oninput="App.searchMemories(this.value)">' +
                    '</div>' +
                    '<div class="category-tags">' +
                        '<span class="tag-label">📁 类别：</span>' +
                        '<button class="category-tag active" data-category="all" onclick="App.filterMemoriesByCategory(\'all\')">全部</button>' +
                        '<button class="category-tag" data-category="work" onclick="App.filterMemoriesByCategory(\'work\')">💼 工作</button>' +
                        '<button class="category-tag" data-category="housework" onclick="App.filterMemoriesByCategory(\'housework\')">🏠 家务</button>' +
                        '<button class="category-tag" data-category="life" onclick="App.filterMemoriesByCategory(\'life\')">🌟 生活</button>' +
                        '<button class="category-tag" data-category="study" onclick="App.filterMemoriesByCategory(\'study\')">📚 学习</button>' +
                        '<button class="category-tag" data-category="health" onclick="App.filterMemoriesByCategory(\'health\')">💪 健康</button>' +
                    '</div>' +
                    '<div class="emotion-tags">' +
                        '<span class="tag-label">😊 情绪：</span>' +
                        '<button class="emotion-tag active" onclick="App.filterMemories(\'all\')">全部</button>' +
                        '<button class="emotion-tag happy" onclick="App.filterMemories(\'happy\')">😊 开心</button>' +
                        '<button class="emotion-tag calm" onclick="App.filterMemories(\'calm\')">😌 平静</button>' +
                        '<button class="emotion-tag anxious" onclick="App.filterMemories(\'anxious\')">😰 烦躁</button>' +
                        '<button class="emotion-tag sad" onclick="App.filterMemories(\'sad\')">😢 难过</button>' +
                        '<button class="emotion-tag angry" onclick="App.filterMemories(\'angry\')">😤 生气</button>' +
                    '</div>' +
                '</div>' +
                '<div class="memory-grid" id="memoryGrid">' +
                    cardsHtml +
                '</div>' +
            '</div>';
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('memoryBank'); }, 10);
    },

    renderMemoryCard(memory) {
        const typeIcons = {
            emotion: this.getEmotionIcon(memory.emotionType),
            idea: "💡",
            achievement: "🏆",
            reflection: "❓"
        };
        
        const typeColors = {
            emotion: "#FF6B8A",
            idea: "#F1C40F",
            achievement: "#27AE60",
            reflection: "#9B59B6"
        };
        
        const borderColor = typeColors[memory.type] || "#CCC";
        const icon = typeIcons[memory.type] || "📝";
        
        var taskLink = "";
        if (memory.taskId) {
            taskLink = '<div class="memory-task-link">🔗 关联任务</div>';
        }
        
        return '<div class="memory-card ' + memory.type + '" style="border-left-color: ' + borderColor + ';" data-emotion="' + (memory.emotionType || '') + '" data-categories="' + (memory.categories ? JSON.stringify(memory.categories).replace(/"/g, '&quot;') : '') + '" data-content="' + (memory.content || '').replace(/"/g, '&quot;') + '">' +
                   '<div class="memory-card-header">' +
                       '<span class="memory-type-icon">' + icon + '</span>' +
                       '<span class="memory-time">' + this.formatTime(memory.createdAt) + '</span>' +
                   '</div>' +
                   '<div class="memory-content">' + memory.content + '</div>' +
                   this.renderMemoryCategoryTags(memory) +
                   this.renderMemoryTags(memory) +
                   taskLink +
               '</div>';
    },

    getEmotionIcon(type) {
        const icons = {
            happy: "😊",
            calm: "😌",
            anxious: "😰",
            sad: "😢",
            angry: "😤"
        };
        return icons[type] || "😐";
    },

    addEmotionToMemory(emotion) {
        // 转换emotion格式
        var emotionType = emotion.type;
        if (emotionType === 'negative') emotionType = 'anxious';
        if (emotionType === 'positive') emotionType = 'happy';
        if (emotionType === 'neutral') emotionType = 'calm';
        
        // 自动识别内容并添加类别标签
        var content = emotion.content || ("记录了" + emotionType + "的情绪");
        var autoTags = this.autoTagMemoryContent(content);
        
        // 合并标签
        var tags = emotion.tags || [];
        if (autoTags.tags.length > 0) {
            tags = tags.concat(autoTags.tags);
        }
        if (tags.length === 0) {
            tags = ["情绪"];
        }
        
        Storage.addMemory({
            type: "emotion",
            emotionType: emotionType,
            content: content,
            intensity: emotion.intensity || 0.5,
            tags: tags,
            categories: autoTags.categories
        });
        this.loadMemoryBank();
    },

    filterMemories(filter) {
        const grid = document.getElementById("memoryGrid");
        const cards = grid.querySelectorAll(".memory-card");
        const tags = document.querySelectorAll(".emotion-tag");
        
        tags.forEach(function(tag) { tag.classList.remove("active"); });
        event.target.classList.add("active");
        
        // 保存当前筛选状态
        this.memoryEmotionFilter = filter;
        
        this.applyMemoryFilters();
    },
    
    // 按类别筛选记忆
    filterMemoriesByCategory(category) {
        const tags = document.querySelectorAll(".category-tag");
        tags.forEach(function(tag) { tag.classList.remove("active"); });
        event.target.classList.add("active");
        
        // 保存当前筛选状态
        this.memoryCategoryFilter = category;
        
        this.applyMemoryFilters();
    },
    
    // 搜索记忆
    searchMemories(keyword) {
        this.memorySearchKeyword = keyword.toLowerCase();
        this.applyMemoryFilters();
    },
    
    // 应用所有筛选条件
    applyMemoryFilters() {
        const grid = document.getElementById("memoryGrid");
        if (!grid) return;
        
        const cards = grid.querySelectorAll(".memory-card");
        const emotionFilter = this.memoryEmotionFilter || 'all';
        const categoryFilter = this.memoryCategoryFilter || 'all';
        const searchKeyword = this.memorySearchKeyword || '';
        
        cards.forEach(function(card) {
            var showByEmotion = (emotionFilter === 'all' || card.dataset.emotion === emotionFilter);
            var showByCategory = true;
            var showBySearch = true;
            
            // 类别筛选
            if (categoryFilter !== 'all') {
                var categories = card.dataset.categories;
                if (categories) {
                    try {
                        var catArray = JSON.parse(categories);
                        showByCategory = catArray.some(function(cat) {
                            return cat.main === categoryFilter;
                        });
                    } catch(e) {
                        showByCategory = false;
                    }
                } else {
                    showByCategory = false;
                }
            }
            
            // 搜索筛选
            if (searchKeyword) {
                var content = (card.dataset.content || '').toLowerCase();
                showBySearch = content.indexOf(searchKeyword) !== -1;
            }
            
            if (showByEmotion && showByCategory && showBySearch) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    },
    
    // 渲染记忆的类别标签
    renderMemoryCategoryTags(memory) {
        if (!memory.categories || memory.categories.length === 0) return '';
        
        const categoryIcons = {
            work: "💼",
            housework: "🏠",
            life: "🌟",
            study: "📚",
            health: "💪"
        };
        
        var html = '<div class="memory-categories">';
        for (var i = 0; i < memory.categories.length; i++) {
            var cat = memory.categories[i];
            var catIcon = categoryIcons[cat.main] || '📁';
            var catLabel = cat.sub ? (this.getCategoryLabel(cat.main) + '/' + cat.sub) : this.getCategoryLabel(cat.main);
            html += '<span class="memory-category-tag">' + catIcon + ' ' + catLabel + '</span>';
        }
        html += '</div>';
        return html;
    },
    
    // 获取类别中文标签
    getCategoryLabel(category) {
        const labels = {
            work: "工作",
            housework: "家务",
            life: "生活",
            study: "学习",
            health: "健康"
        };
        return labels[category] || category;
    },
    
    // 渲染记忆的自定义标签
    renderMemoryTags(memory) {
        if (!memory.tags || memory.tags.length === 0) return '';
        
        var html = '<div class="memory-tags">';
        for (var i = 0; i < memory.tags.length; i++) {
            html += '<span class="memory-tag">#' + memory.tags[i] + '</span>';
        }
        html += '</div>';
        return html;
    },
    
    // 自动识别内容并添加类别标签
    autoTagMemoryContent(content) {
        var categories = [];
        var tags = [];
        
        // 工作相关关键词
        const workKeywords = ['客户', '设计', '项目', '会议', '报告', '方案', '合同', '订单', '拍摄', '修图', '插画', '约稿', '运营', '小红书', '抖音', '直播', '文案', '策划', '开发', '代码', '上线', '发布', '交付', '验收', '照相馆', '摄影', '工作室'];
        // 家务相关关键词
        const houseworkKeywords = ['打扫', '洗衣', '做饭', '买菜', '收拾', '整理', '清洁', '拖地', '洗碗', '晾衣', '倒垃圾', '换床单', '擦窗', '修理'];
        // 生活相关关键词
        const lifeKeywords = ['购物', '逛街', '聚餐', '约会', '旅行', '电影', '游戏', '休息', '睡觉', '娱乐', '朋友', '家人', '聚会', '生日', '节日'];
        // 学习相关关键词
        const studyKeywords = ['学习', '看书', '课程', '培训', '考试', '练习', '笔记', '复习', '教程', '技能', '知识', '阅读'];
        // 健康相关关键词
        const healthKeywords = ['运动', '健身', '跑步', '瑜伽', '锻炼', '体检', '医院', '吃药', '睡眠', '早起', '饮食', '减肥', '养生'];
        
        var contentLower = content.toLowerCase();
        
        // 检测工作类别
        for (var i = 0; i < workKeywords.length; i++) {
            if (content.indexOf(workKeywords[i]) !== -1) {
                var subTag = workKeywords[i];
                categories.push({ main: 'work', sub: subTag });
                tags.push(subTag);
                break;
            }
        }
        
        // 检测家务类别
        for (var j = 0; j < houseworkKeywords.length; j++) {
            if (content.indexOf(houseworkKeywords[j]) !== -1) {
                categories.push({ main: 'housework', sub: houseworkKeywords[j] });
                tags.push(houseworkKeywords[j]);
                break;
            }
        }
        
        // 检测生活类别
        for (var k = 0; k < lifeKeywords.length; k++) {
            if (content.indexOf(lifeKeywords[k]) !== -1) {
                categories.push({ main: 'life', sub: lifeKeywords[k] });
                tags.push(lifeKeywords[k]);
                break;
            }
        }
        
        // 检测学习类别
        for (var l = 0; l < studyKeywords.length; l++) {
            if (content.indexOf(studyKeywords[l]) !== -1) {
                categories.push({ main: 'study', sub: studyKeywords[l] });
                tags.push(studyKeywords[l]);
                break;
            }
        }
        
        // 检测健康类别
        for (var m = 0; m < healthKeywords.length; m++) {
            if (content.indexOf(healthKeywords[m]) !== -1) {
                categories.push({ main: 'health', sub: healthKeywords[m] });
                tags.push(healthKeywords[m]);
                break;
            }
        }
        
        return { categories: categories, tags: tags };
    },

    // 提示词面板
    loadPromptPanel() {
        const container = document.getElementById("promptPanelBody");
        const prompts = Storage.getPrompts();
        
        container.innerHTML = 
            '<div class="prompt-container">' +
                // 语言操控时间轴提示词（置顶，可编辑）
                '<div class="prompt-section timeline-control-section">' +
                    '<div class="prompt-label">🗣️ 语言操控时间轴</div>' +
                    '<div class="prompt-description">直接在对话框用自然语言控制时间轴，支持添加、删除、移动、顺延任务等操作</div>' +
                    '<textarea class="prompt-textarea timeline-control-textarea" id="promptTimelineControl" onchange="App.savePrompt(\'timelineControl\', this.value)">' + (prompts.timelineControl || '') + '</textarea>' +
                    '<div class="prompt-preset">' +
                        '<span class="preset-tag" onclick="App.resetPrompt(\'timelineControl\')">重置默认</span>' +
                        '<span class="preset-tag example-tag" onclick="App.toggleTimelineExamples()">📋 查看示例指令</span>' +
                    '</div>' +
                    '<div class="timeline-examples-panel" id="timelineExamplesPanel" style="display:none;">' +
                        '<div class="examples-grid">' +
                            '<div class="example-group">' +
                                '<div class="example-category">➕ 添加任务</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'下午3点去健身房锻炼1小时\')">下午3点去健身房锻炼1小时</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'明天上午10点开会\')">明天上午10点开会</div>' +
                            '</div>' +
                            '<div class="example-group">' +
                                '<div class="example-category">🗑️ 删除任务</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'把今天下午2点之后的任务全部删掉\')">把今天下午2点之后的任务全部删掉</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'删除明天所有任务\')">删除明天所有任务</div>' +
                            '</div>' +
                            '<div class="example-group">' +
                                '<div class="example-category">📅 移动任务</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'把3点的会议改到4点半\')">把3点的会议改到4点半</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'把洗澡移到晚上9点\')">把洗澡移到晚上9点</div>' +
                            '</div>' +
                            '<div class="example-group">' +
                                '<div class="example-category">⏰ 顺延任务</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'2点之后的所有任务都顺延1小时\')">2点之后的所有任务都顺延1小时</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'把今天所有任务都延后30分钟\')">把今天所有任务都延后30分钟</div>' +
                            '</div>' +
                            '<div class="example-group">' +
                                '<div class="example-category">➕ 插入并顺延</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'在下午2点和3点之间加一个15分钟的休息\')">在2点和3点之间加15分钟休息</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'在3点插入一个开会，后面的任务顺延\')">在3点插入开会，后面顺延</div>' +
                            '</div>' +
                            '<div class="example-group">' +
                                '<div class="example-category">⚡ 解决冲突</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'把所有时间重叠的任务自动分开\')">把所有时间重叠的任务自动分开</div>' +
                                '<div class="example-item" onclick="App.useNLCommand(\'优化今天的时间安排\')">优化今天的时间安排</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="prompt-section">' +
                    '<div class="prompt-label">🎯 自然语言解析（多任务+情绪）</div>' +
                    '<textarea class="prompt-textarea" id="promptTaskParse" onchange="App.savePrompt(\'taskParse\', this.value)">' + prompts.taskParse + '</textarea>' +
                    '<div class="prompt-preset">' +
                        '<span class="preset-tag" onclick="App.resetPrompt(\'taskParse\')">重置默认</span>' +
                    '</div>' +
                '</div>' +
                '<div class="prompt-section">' +
                    '<div class="prompt-label">🔧 任务拆解（ADHD友好）</div>' +
                    '<textarea class="prompt-textarea" id="promptTaskBreakdown" onchange="App.savePrompt(\'taskBreakdown\', this.value)">' + prompts.taskBreakdown + '</textarea>' +
                    '<div class="prompt-preset">' +
                        '<span class="preset-tag" onclick="App.resetPrompt(\'taskBreakdown\')">重置默认</span>' +
                    '</div>' +
                '</div>' +
                '<div class="prompt-section">' +
                    '<div class="prompt-label">💡 间隙填充（3种建议）</div>' +
                    '<textarea class="prompt-textarea" id="promptGapSuggestion" onchange="App.savePrompt(\'gapSuggestion\', this.value)">' + prompts.gapSuggestion + '</textarea>' +
                    '<div class="prompt-preset">' +
                        '<span class="preset-tag" onclick="App.resetPrompt(\'gapSuggestion\')">重置默认</span>' +
                    '</div>' +
                '</div>' +
                '<div class="prompt-section">' +
                    '<div class="prompt-label">💭 情绪分析</div>' +
                    '<textarea class="prompt-textarea" id="promptEmotionAnalysis" onchange="App.savePrompt(\'emotionAnalysis\', this.value)">' + prompts.emotionAnalysis + '</textarea>' +
                    '<div class="prompt-preset">' +
                        '<span class="preset-tag" onclick="App.resetPrompt(\'emotionAnalysis\')">重置默认</span>' +
                    '</div>' +
                '</div>' +
                '<div class="prompt-section">' +
                    '<div class="prompt-label">🪙 金币分配</div>' +
                    '<textarea class="prompt-textarea" id="promptCoinAllocation" onchange="App.savePrompt(\'coinAllocation\', this.value)">' + (prompts.coinAllocation || '') + '</textarea>' +
                    '<div class="prompt-preset">' +
                        '<span class="preset-tag" onclick="App.resetPrompt(\'coinAllocation\')">重置默认</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('promptPanel'); }, 10);
    },
    
    // 切换时间轴示例面板显示
    toggleTimelineExamples() {
        const panel = document.getElementById('timelineExamplesPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    // 使用自然语言指令
    useNLCommand(command) {
        const input = document.getElementById("chatInput");
        if (input) {
            input.value = command;
            input.focus();
            // 切换到智能对话视图（移动端）
            if (typeof MobileApp !== 'undefined' && MobileApp.isMobile) {
                MobileApp.switchView('smartInput');
            }
        }
    },

    savePrompt(key, value) {
        const prompts = Storage.getPrompts();
        prompts[key] = value;
        Storage.savePrompts(prompts);
    },

    resetPrompt(key) {
        // 清除保存的提示词，让它使用默认值
        Storage.remove(Storage.KEYS.PROMPTS);
        this.loadPromptPanel();
        this.addChatMessage("system", "提示词已重置为默认值~", "✅");
    },

    // 游戏化系统
    loadGameSystem() {
        const container = document.getElementById("gameSystemBody");
        const state = Storage.getGameState();
        
        container.innerHTML = 
            '<div class="game-container">' +
                '<div class="game-stats">' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon">🪙</div>' +
                        '<div class="stat-value">' + state.coins + '</div>' +
                        '<div class="stat-label">金币</div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon">⚡</div>' +
                        '<div class="stat-value">' + state.energy + '/' + state.maxEnergy + '</div>' +
                        '<div class="stat-label">精力值</div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon">📊</div>' +
                        '<div class="stat-value">Lv.' + state.level + '</div>' +
                        '<div class="stat-label">等级</div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon">✅</div>' +
                        '<div class="stat-value">' + state.completedTasks + '</div>' +
                        '<div class="stat-label">已完成</div>' +
                    '</div>' +
                '</div>' +
                '<div class="game-progress">' +
                    '<div class="progress-title">今日进度</div>' +
                    '<div class="progress-bar-container">' +
                        '<div class="progress-bar-fill" style="width: ' + Math.min(100, state.completedTasks * 20) + '%"></div>' +
                        '<span class="progress-text">' + state.completedTasks + '/5 任务</span>' +
                    '</div>' +
                '</div>' +
                '<div class="achievements">' +
                    '<div class="achievement-badge ' + (state.completedTasks >= 1 ? '' : 'locked') + '" title="完成第一个任务">🌟</div>' +
                    '<div class="achievement-badge ' + (state.completedTasks >= 5 ? '' : 'locked') + '" title="完成5个任务">🏅</div>' +
                    '<div class="achievement-badge ' + (state.coins >= 50 ? '' : 'locked') + '" title="累计50金币">💰</div>' +
                    '<div class="achievement-badge ' + (state.level >= 2 ? '' : 'locked') + '" title="达到2级">🎖️</div>' +
                    '<div class="achievement-badge locked" title="连续7天打卡">🔥</div>' +
                '</div>' +
            '</div>';
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('gameSystem'); }, 10);
    },

    updateGameStatus() {
        const state = Storage.getGameState();
        
        // 更新智能对话头部的金币和精力显示
        const headerCoins = document.getElementById("headerCoins");
        const headerEnergy = document.getElementById("headerEnergy");
        
        if (headerCoins) {
            headerCoins.textContent = state.coins;
        }
        if (headerEnergy) {
            headerEnergy.textContent = state.energy + "/" + state.maxEnergy;
        }
    },
    
    // 显示精力恢复菜单
    showEnergyMenu(event) {
        event.stopPropagation();
        this.closeAllMenus();
        
        const state = Storage.getGameState();
        
        const menu = document.createElement("div");
        menu.className = "energy-menu";
        menu.id = "energyMenu";
        menu.innerHTML = 
            '<div class="energy-menu-header">' +
                '<span class="energy-menu-title">⚡ 精力管理</span>' +
                '<span class="energy-menu-current">' + state.energy + '/' + state.maxEnergy + '</span>' +
            '</div>' +
            '<div class="energy-menu-desc">选择活动恢复精力：</div>' +
            '<div class="energy-menu-item" onclick="App.restoreEnergy(\'medicine\', 8)">' +
                '<span class="menu-icon">💊</span>' +
                '<span class="menu-text">吃药</span>' +
                '<span class="menu-effect">+8 ⚡</span>' +
            '</div>' +
            '<div class="energy-menu-item" onclick="App.restoreEnergy(\'toilet\', 3)">' +
                '<span class="menu-icon">🚽</span>' +
                '<span class="menu-text">上厕所</span>' +
                '<span class="menu-effect">+3 ⚡</span>' +
            '</div>' +
            '<div class="energy-menu-item" onclick="App.restoreEnergy(\'eat\', 5)">' +
                '<span class="menu-icon">🍽️</span>' +
                '<span class="menu-text">吃东西</span>' +
                '<span class="menu-effect">+5 ⚡</span>' +
            '</div>' +
            '<div class="energy-menu-item" onclick="App.restoreEnergy(\'drink\', 2)">' +
                '<span class="menu-icon">🥤</span>' +
                '<span class="menu-text">喝水</span>' +
                '<span class="menu-effect">+2 ⚡</span>' +
            '</div>' +
            '<div class="energy-menu-item" onclick="App.restoreEnergy(\'rest\', 4)">' +
                '<span class="menu-icon">😴</span>' +
                '<span class="menu-text">休息一下</span>' +
                '<span class="menu-effect">+4 ⚡</span>' +
            '</div>' +
            '<div class="energy-menu-item" onclick="App.restoreEnergy(\'walk\', 3)">' +
                '<span class="menu-icon">🚶</span>' +
                '<span class="menu-text">走动一下</span>' +
                '<span class="menu-effect">+3 ⚡</span>' +
            '</div>' +
            '<div class="energy-menu-footer">' +
                '<button class="energy-edit-btn" onclick="App.showEnergySettings()">⚙️ 设置每日精力</button>' +
            '</div>';
        
        // 定位菜单
        const rect = event.target.closest('.header-stat').getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
        
        document.body.appendChild(menu);
        
        setTimeout(function() {
            document.addEventListener("click", App.closeAllMenus, { once: true });
        }, 10);
    },
    
    // 恢复精力
    restoreEnergy(type, amount) {
        const state = Storage.getGameState();
        const oldEnergy = state.energy;
        state.energy = Math.min(state.maxEnergy, state.energy + amount);
        const actualGain = state.energy - oldEnergy;
        Storage.saveGameState(state);
        
        this.updateGameStatus();
        this.loadGameSystem();
        this.closeAllMenus();
        
        const typeNames = {
            medicine: '💊 吃药',
            toilet: '🚽 上厕所',
            eat: '🍽️ 吃东西',
            drink: '🥤 喝水',
            rest: '😴 休息',
            walk: '🚶 走动'
        };
        
        if (actualGain > 0) {
            this.addChatMessage("system", typeNames[type] + " 恢复了 " + actualGain + " 点精力！\n当前精力：" + state.energy + "/" + state.maxEnergy, "⚡");
        } else {
            this.addChatMessage("system", "精力已满，无需恢复~", "✨");
        }
    },
    
    // 显示精力设置
    showEnergySettings() {
        this.closeAllMenus();
        
        const state = Storage.getGameState();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'energySettingsModal';
        modal.innerHTML = 
            '<div class="modal-content" style="max-width: 380px;">' +
                '<div class="modal-header">' +
                    '<span class="modal-icon">⚡</span>' +
                    '<h2>精力设置</h2>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-group">' +
                        '<label style="display:block;margin-bottom:8px;font-weight:600;">每日最大精力值</label>' +
                        '<input type="number" id="maxEnergyInput" class="api-key-input" value="' + state.maxEnergy + '" min="10" max="100">' +
                        '<p style="font-size:12px;color:#888;margin-top:6px;">建议设置为 25，2小时任务消耗约5点精力</p>' +
                    '</div>' +
                    '<div class="form-group" style="margin-top:16px;">' +
                        '<label style="display:block;margin-bottom:8px;font-weight:600;">当前精力值</label>' +
                        '<input type="number" id="currentEnergyInput" class="api-key-input" value="' + state.energy + '" min="0" max="100">' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="modal-btn btn-cancel" onclick="document.getElementById(\'energySettingsModal\').remove()">取消</button>' +
                    '<button class="modal-btn btn-confirm" onclick="App.saveEnergySettings()">保存</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(modal);
    },
    
    // 保存精力设置
    saveEnergySettings() {
        const maxEnergy = parseInt(document.getElementById('maxEnergyInput').value) || 25;
        const currentEnergy = parseInt(document.getElementById('currentEnergyInput').value) || maxEnergy;
        
        const state = Storage.getGameState();
        state.maxEnergy = Math.max(10, Math.min(100, maxEnergy));
        state.energy = Math.max(0, Math.min(state.maxEnergy, currentEnergy));
        Storage.saveGameState(state);
        
        document.getElementById('energySettingsModal').remove();
        this.updateGameStatus();
        this.loadGameSystem();
        // this.loadSmartInput(); // 已合并到 BrainDump 组件
        
        if (typeof Settings !== 'undefined') {
            Settings.showToast('success', '精力设置已保存', '每日最大精力：' + state.maxEnergy);
        }
    },

    showCoinAnimation(amount) {
        const container = document.getElementById("coinAnimationContainer");
        for (var i = 0; i < amount; i++) {
            (function(index) {
                setTimeout(function() {
                    const coin = document.createElement("div");
                    coin.className = "coin-animation";
                    coin.textContent = "🪙";
                    coin.style.left = (Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1) + "px";
                    coin.style.top = (Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.3) + "px";
                    container.appendChild(coin);
                    setTimeout(function() { coin.remove(); }, 1000);
                }, index * 100);
            })(i);
        }
    },

    // 复盘面板
    loadReviewPanel() {
        const container = document.getElementById("reviewPanelBody");
        const tasks = Storage.getTasks();
        const memories = Storage.getMemories();
        const state = Storage.getGameState();
        
        const completedToday = tasks.filter(function(t) {
            return t.completed && t.completedAt && 
                new Date(t.completedAt).toDateString() === new Date().toDateString();
        }).length;
        
        const emotionCounts = { happy: 0, calm: 0, anxious: 0, sad: 0, angry: 0 };
        memories.forEach(function(m) {
            if (m.emotionType && emotionCounts[m.emotionType] !== undefined) {
                emotionCounts[m.emotionType]++;
            }
        });
        const maxEmotion = Math.max(emotionCounts.happy, emotionCounts.calm, emotionCounts.anxious, emotionCounts.sad, emotionCounts.angry, 1);
        
        container.innerHTML = 
            '<div class="review-container">' +
                '<div class="review-summary">' +
                    '<div class="summary-item">' +
                        '<div class="summary-value">' + completedToday + '</div>' +
                        '<div class="summary-label">今日完成</div>' +
                    '</div>' +
                    '<div class="summary-item">' +
                        '<div class="summary-value">' + state.coins + '</div>' +
                        '<div class="summary-label">累计金币</div>' +
                    '</div>' +
                    '<div class="summary-item">' +
                        '<div class="summary-value">' + memories.length + '</div>' +
                        '<div class="summary-label">记忆条数</div>' +
                    '</div>' +
                '</div>' +
                '<div class="review-chart">' +
                    '<div class="chart-title">情绪分布</div>' +
                    '<div class="emotion-chart">' +
                        '<div style="text-align:center;">' +
                            '<div class="emotion-bar" style="height: ' + (emotionCounts.happy / maxEmotion * 60) + 'px; background: linear-gradient(180deg, #FFF3CD, #FFE066);"></div>' +
                            '<div style="font-size:12px;">😊</div>' +
                        '</div>' +
                        '<div style="text-align:center;">' +
                            '<div class="emotion-bar" style="height: ' + (emotionCounts.calm / maxEmotion * 60) + 'px; background: linear-gradient(180deg, #D4EDDA, #90EE90);"></div>' +
                            '<div style="font-size:12px;">😌</div>' +
                        '</div>' +
                        '<div style="text-align:center;">' +
                            '<div class="emotion-bar" style="height: ' + (emotionCounts.anxious / maxEmotion * 60) + 'px; background: linear-gradient(180deg, #F8D7DA, #FF9999);"></div>' +
                            '<div style="font-size:12px;">😰</div>' +
                        '</div>' +
                        '<div style="text-align:center;">' +
                            '<div class="emotion-bar" style="height: ' + (emotionCounts.sad / maxEmotion * 60) + 'px; background: linear-gradient(180deg, #D1ECF1, #87CEEB);"></div>' +
                            '<div style="font-size:12px;">😢</div>' +
                        '</div>' +
                        '<div style="text-align:center;">' +
                            '<div class="emotion-bar" style="height: ' + (emotionCounts.angry / maxEmotion * 60) + 'px; background: linear-gradient(180deg, #FFE4E1, #FF6B6B);"></div>' +
                            '<div style="font-size:12px;">😤</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('reviewPanel'); }, 10);
    },

    // 工具方法
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + "-" + 
               (d.getMonth() + 1).toString().padStart(2, "0") + "-" + 
               d.getDate().toString().padStart(2, "0");
    },

    formatDateDisplay(date) {
        const d = new Date(date);
        const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        return (d.getMonth() + 1) + "月" + d.getDate() + "日 " + weekdays[d.getDay()];
    },

    formatTime(isoString) {
        const d = new Date(isoString);
        return (d.getMonth() + 1) + "/" + d.getDate() + " " + 
               d.getHours().toString().padStart(2, "0") + ":" + 
               d.getMinutes().toString().padStart(2, "0");
    },

    addMinutes(timeStr, minutes) {
        const parts = timeStr.split(":");
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return newH.toString().padStart(2, "0") + ":" + newM.toString().padStart(2, "0");
    },

    getMinutesDiff(start, end) {
        const startParts = start.split(":");
        const endParts = end.split(":");
        const sh = parseInt(startParts[0]);
        const sm = parseInt(startParts[1]);
        const eh = parseInt(endParts[0]);
        const em = parseInt(endParts[1]);
        return (eh * 60 + em) - (sh * 60 + sm);
    },

    prevDay() {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.loadTimeline();
    },

    nextDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.loadTimeline();
    },

    goToday() {
        this.currentDate = new Date();
        this.loadTimeline();
    },

    scrollToCurrentTime() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const scroll = document.getElementById("timelineSection");
        if (scroll) {
            // 每个时间槽50px高度，每小时2个槽
            const scrollTop = (hour * 2 + Math.floor(minute / 30)) * 50 - 100;
            scroll.scrollTop = Math.max(0, scrollTop);
        }
    },

    // ==================== 合并监控面板功能 ====================
    
    // 当前监控面板的活动标签
    monitorActiveTab: 'procrastination',
    
    // 加载合并监控面板（使用新的MonitorSystem或回退到旧版）
    loadMonitorPanel() {
        const container = document.getElementById("monitorBody");
        if (!container) return;
        
        // 使用新的MonitorSystem
        const MS = typeof MonitorSystem !== 'undefined' ? MonitorSystem : null;
        
        if (!MS) {
            // 回退到旧版拖延监控
            this.loadMonitorPanelFallback();
            return;
        }
        
        const settings = MS.settings;
        const stats = MS.getStats();
        const currentTask = MS.currentTask;
        
        // 启用/禁用开关
        const enabledToggle = `
            <div class="monitor-toggle-row">
                <span class="toggle-label">自动监控</span>
                <div class="toggle-switch ${settings.enabled ? 'active' : ''}" 
                     onclick="MonitorSystem.toggleEnabled()"></div>
            </div>
        `;
        
        let html = '';
        
        if (!currentTask) {
            // 无任务监控中
            const tasks = Storage.getTasks();
            const today = this.formatDate(new Date());
            const availableTasks = tasks.filter(t => t.date === today && !t.completed);
            
            let taskListHtml = '';
            if (availableTasks.length > 0) {
                taskListHtml = `
                    <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.08);">
                        <div style="font-size:12px;color:#888;margin-bottom:8px;">📋 今日待完成任务：</div>
                        ${availableTasks.slice(0, 5).map(task => `
                            <div class="select-task-row">
                                <span class="task-name">${task.title}</span>
                                <span class="task-time">⏰ ${task.startTime}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            html = `
                <div class="monitor-card">
                    ${enabledToggle}
                    <div class="monitor-empty">
                        <div class="monitor-empty-icon">⏰</div>
                        <div class="monitor-empty-text">
                            ${settings.enabled ? '等待任务时间到达...<br>任务开始时自动监控' : '监控已暂停<br>开启后自动监控任务'}
                        </div>
                    </div>
                    ${taskListHtml}
                    <div class="monitor-stats" style="margin-top:16px;">
                        <div class="stat-item">
                            <span class="stat-label">本周成功</span>
                            <span class="stat-value" style="color:#27AE60;">${stats.weeklySuccess}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">本周延迟</span>
                            <span class="stat-value" style="color:#E74C3C;">${stats.weeklyDelays}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">累计扣币</span>
                            <span class="stat-value" style="color:#F39C12;">🪙 ${stats.totalSpent}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 有任务正在监控
            const remaining = Math.max(0, settings.gracePeriod - MS.elapsedSeconds);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            const progress = Math.min(100, (MS.elapsedSeconds / settings.gracePeriod) * 100);
            
            let statusClass = 'good';
            let statusText = '专注中';
            if (MS.elapsedSeconds >= settings.gracePeriod) {
                statusClass = 'danger';
                statusText = '已超时';
            } else if (progress >= 75) {
                statusClass = 'warning';
                statusText = '即将超时';
        }
        
            const currentStep = currentTask.substeps?.[0]?.title || '开始执行';
            
            html = `
                <div class="monitor-card ${MS.elapsedSeconds >= settings.gracePeriod ? 'alert-active' : ''}">
                    ${enabledToggle}
                    <div class="monitor-task-name">
                        <span class="task-icon">📌</span>
                        <span>${currentTask.title}</span>
                    </div>
                    <div class="monitor-current-step">
                        当前步骤：<strong>【${currentStep}】</strong>
                    </div>
                    <div class="monitor-countdown" id="monitorCountdown" style="font-size:48px;font-weight:700;text-align:center;margin:20px 0;color:${statusClass === 'danger' ? '#E74C3C' : statusClass === 'warning' ? '#F39C12' : '#27AE60'};">
                        ${mins}:${secs.toString().padStart(2, '0')}
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar ${statusClass}" style="width:${progress}%"></div>
                    </div>
                    <div class="monitor-status-row" style="margin-top:12px;">
                        <span class="status-tag ${statusClass}">${statusText}</span>
                        <span>第 ${MS.currentCycle} 轮 | 已扣 🪙${MS.totalPaidCoins}</span>
                    </div>
                    <div class="monitor-actions" style="margin-top:16px;display:flex;gap:10px;">
                        <button class="monitor-btn primary" onclick="MonitorSystem.completeStep()">
                            ✅ 已完成启动
                        </button>
                        <button class="monitor-btn ghost" onclick="MonitorSystem.pauseWithCoins()">
                            ⏸️ 暂停 (${settings.pauseCost}币)
                        </button>
                        <button class="monitor-btn ghost" onclick="MonitorSystem.skipTask()">
                            ⏭️ 跳过
                        </button>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('monitorPanel'); }, 10);
    },
    
    // 监控面板回退版本（不依赖MonitorSystem）
    loadMonitorPanelFallback() {
        const container = document.getElementById("monitorBody");
        if (!container) return;
        
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        
        // 获取今日任务
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const todayTasks = tasks.filter(t => t.date === today);
        const completedTasks = todayTasks.filter(t => t.completed);
        const pendingTasks = todayTasks.filter(t => !t.completed);
        
        let taskListHtml = '';
        if (pendingTasks.length > 0) {
            taskListHtml = pendingTasks.slice(0, 5).map(task => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(102,126,234,0.05);border-radius:8px;margin-bottom:8px;">
                    <span style="font-size:14px;color:#2C3E50;">${task.title}</span>
                    <span style="font-size:12px;color:#667eea;">⏰ ${task.startTime}</span>
                </div>
            `).join('');
        } else {
            taskListHtml = '<div style="text-align:center;color:#999;padding:20px;">今日暂无待办任务</div>';
        }
        
        const html = `
            <div style="padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <span style="font-size:14px;color:#666;">📊 今日任务监控</span>
                    <span style="font-size:12px;color:#27AE60;">✅ ${completedTasks.length}/${todayTasks.length} 已完成</span>
                </div>
                
                <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:20px;color:white;margin-bottom:16px;">
                    <div style="font-size:12px;opacity:0.9;margin-bottom:8px;">今日完成率</div>
                    <div style="font-size:36px;font-weight:700;">${todayTasks.length > 0 ? Math.round(completedTasks.length / todayTasks.length * 100) : 0}%</div>
                    <div style="height:6px;background:rgba(255,255,255,0.3);border-radius:3px;margin-top:12px;overflow:hidden;">
                        <div style="height:100%;background:white;border-radius:3px;width:${todayTasks.length > 0 ? (completedTasks.length / todayTasks.length * 100) : 0}%;"></div>
                    </div>
                </div>
                
                <div style="margin-bottom:12px;">
                    <div style="font-size:13px;color:#888;margin-bottom:10px;">📋 待完成任务</div>
                    ${taskListHtml}
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
                    <div style="background:#E8F5E9;border-radius:10px;padding:14px;text-align:center;">
                        <div style="font-size:24px;font-weight:700;color:#27AE60;">${completedTasks.length}</div>
                        <div style="font-size:12px;color:#666;margin-top:4px;">已完成</div>
                    </div>
                    <div style="background:#FFF3E0;border-radius:10px;padding:14px;text-align:center;">
                        <div style="font-size:24px;font-weight:700;color:#F39C12;">${pendingTasks.length}</div>
                        <div style="font-size:12px;color:#666;margin-top:4px;">待完成</div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        setTimeout(function() { Canvas.reapplyBackground('monitorPanel'); }, 10);
    },
    
    // 渲染拖延监控内容
    renderProcrastinationContent() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) return '<div class="monitor-empty">拖延监控模块未加载</div>';
        
        var monitorHtml = this.renderProcrastinationMonitor();
        var statsHtml = this.renderProcrastinationStats();
        var historyHtml = this.renderProcrastinationHistory();
        
        return '<div class="procrastination-container">' +
            '<div class="procrastination-monitor">' + monitorHtml + '</div>' +
            '<div class="procrastination-stats">' + statsHtml + '</div>' +
            '<div class="procrastination-history">' +
                '<div class="history-title">📜 拖延历史记录</div>' +
                '<div class="history-timeline" id="procrastinationHistoryList">' + historyHtml + '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 渲染低效率监控内容
    renderInefficiencyContent() {
        const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        if (!IM) return '<div class="monitor-empty">低效率监控模块未加载</div>';
        
        var monitorHtml = this.renderInefficiencyMonitor();
        var analysisHtml = this.renderInefficiencyAnalysis();
        var historyHtml = this.renderInefficiencyHistory();
        
        return '<div class="inefficiency-container">' +
            '<div class="inefficiency-monitor">' + monitorHtml + '</div>' +
            '<div class="inefficiency-analysis">' + analysisHtml + '</div>' +
            '<div class="inefficiency-history">' +
                '<div class="history-title">📊 卡顿事件分析</div>' +
                '<div class="history-timeline" id="inefficiencyHistoryList">' + historyHtml + '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 显示合并监控设置弹窗
    showMonitorSettingsModal() {
        if (this.monitorActiveTab === 'procrastination') {
            this.showProcrastinationSettingsModal();
        } else {
            this.showInefficiencySettingsModal();
        }
    },

    // ==================== 拖延面板功能 ====================
    
    // 加载拖延面板（保留兼容性，实际刷新合并面板）
    loadProcrastinationPanel() {
        // 刷新合并监控面板
        this.loadMonitorPanel();
        return;
        
        // 以下为原有代码，保留但不执行
        const container = document.getElementById("procrastinationBody");
        if (!container) return;
        
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">拖延监控模块加载中...</div>';
            return;
        }
        
        // 生成监控区HTML
        var monitorHtml = this.renderProcrastinationMonitor();
        
        // 生成历史记录HTML
        var historyHtml = this.renderProcrastinationHistory();
        
        // 生成本周统计HTML
        var statsHtml = this.renderProcrastinationStats();
        
        container.innerHTML = 
            '<div class="procrastination-container">' +
                '<div class="procrastination-monitor">' +
                    monitorHtml +
                '</div>' +
                '<div class="procrastination-stats">' +
                    statsHtml +
                '</div>' +
                '<div class="procrastination-history">' +
                    '<div class="history-title">📜 拖延历史记录</div>' +
                    '<div class="history-timeline" id="procrastinationHistoryList">' +
                        historyHtml +
                    '</div>' +
                '</div>' +
            '</div>';
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('procrastinationPanel'); }, 10);
    },
    
    // 渲染监控区
    renderProcrastinationMonitor() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) return '';
        
        // 显示启用/禁用状态
        var enabledToggle = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<span style="font-size:13px;color:#666;">自动监控</span>' +
            '<button class="monitor-btn ' + (PM.settings.enabled ? 'primary' : 'ghost') + '" style="padding:6px 12px;min-width:auto;" onclick="ProcrastinationMonitor.toggleEnabled()">' +
                (PM.settings.enabled ? '✅ 已启用' : '⏸️ 已暂停') +
            '</button>' +
        '</div>';
        
        if (!PM.currentTask) {
            // 获取今天待执行的任务
            const tasks = Storage.getTasks();
            const today = this.formatDate(new Date());
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            
            const upcomingTasks = tasks.filter(function(t) { 
                if (t.date !== today || t.completed) return false;
                const timeParts = t.startTime.split(':');
                const taskMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
                return taskMinutes > currentTime;
            }).sort(function(a, b) {
                return a.startTime.localeCompare(b.startTime);
            });
            
            var upcomingHtml = '';
            if (upcomingTasks.length > 0) {
                upcomingHtml = '<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.08);">' +
                    '<div style="font-size:12px;color:#888;margin-bottom:8px;">📋 今日待监控任务：</div>';
                for (var i = 0; i < Math.min(upcomingTasks.length, 3); i++) {
                    const task = upcomingTasks[i];
                    upcomingHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;">' +
                        '<span>' + task.title + '</span>' +
                        '<span style="color:#4A90E2;">⏰ ' + task.startTime + '</span>' +
                    '</div>';
                }
                if (upcomingTasks.length > 3) {
                    upcomingHtml += '<div style="font-size:11px;color:#999;text-align:center;">还有 ' + (upcomingTasks.length - 3) + ' 个任务...</div>';
                }
                upcomingHtml += '</div>';
            }
            
            return '<div class="monitor-card">' +
                enabledToggle +
                '<div class="monitor-empty">' +
                    '<div class="monitor-empty-icon">⏰</div>' +
                    '<div class="monitor-empty-text">' + 
                        (PM.settings.enabled ? '等待任务时间到达...<br>任务开始时将自动触发监控' : '监控已暂停<br>点击上方按钮启用') + 
                    '</div>' +
                '</div>' +
                upcomingHtml +
            '</div>';
        }
        
        // 有任务正在监控
        const task = PM.currentTask;
        const settings = PM.settings;
        
        // 计算倒计时显示
        const remainingSeconds = Math.max(0, settings.gracePeriod - PM.elapsedSeconds);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const timeStr = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
        const totalTimeStr = Math.floor(settings.gracePeriod / 60) + '分钟';
        
        // 倒计时状态样式
        var countdownClass = '';
        if (remainingSeconds <= 10 && remainingSeconds > 0) {
            countdownClass = 'danger';
        } else if (remainingSeconds <= settings.preAlertTime) {
            countdownClass = 'warning';
        }
        
        // 状态标签
        var statusTag = PM.isAlertActive ? 
            '<span class="status-tag alert">🚨 超时扣币中</span>' :
            '<span class="status-tag countdown">🟢 启动倒计时</span>';
        
        // 计算当前需要支付的金币
        const currentCost = PM.calculateCurrentCost();
        
        // 启动步骤
        const startupStep = task.substeps && task.substeps.length > 0 ? 
            task.substeps[0].title : '开始执行';
        
        var html = '<div class="monitor-card' + (PM.isAlertActive ? ' alert-active' : '') + '">' +
            enabledToggle +
            '<div class="monitor-task-name">' +
                '<span class="task-icon">📌</span>' +
                '<span>' + task.title + '</span>' +
            '</div>' +
            '<div class="monitor-startup-step">' +
                '启动步骤：<strong>【' + startupStep + '】</strong>' +
            '</div>' +
            '<div class="monitor-countdown">' +
                '<div class="countdown-time ' + countdownClass + '">' + 
                    (PM.isAlertActive ? '⏰ 已超时' : timeStr) + 
                '</div>' +
                '<div class="countdown-total">宽限期：' + totalTimeStr + '</div>' +
            '</div>' +
            '<div class="monitor-status">' +
                statusTag +
                '<span class="status-tag cycle">第' + PM.currentCycle + '次循环</span>' +
                '<span class="status-tag cost">已扣：🪙 ' + PM.totalPaidCoins + '</span>' +
            '</div>';
        
        // 警报区域
        if (PM.isAlertActive) {
            html += '<div class="alert-section">' +
                '<div class="alert-header">🚨 启动超时！每 ' + (settings.gracePeriod / 60) + ' 分钟扣 ' + currentCost + ' 金币</div>' +
                '<div class="alert-message">请立即完成【' + startupStep + '】停止扣币！</div>' +
            '</div>';
        }
        
        // 操作按钮
        html += '<div class="monitor-actions">' +
            '<button class="monitor-btn primary" onclick="ProcrastinationMonitor.completeStep()">' +
                '✅ 已完成启动步骤' +
            '</button>' +
        '</div>' +
        '<div class="monitor-actions" style="margin-top:8px;">' +
            '<button class="monitor-btn secondary" onclick="App.aiBreakdownStartupStep()">' +
                '🤖 AI拆解' +
            '</button>' +
            '<button class="monitor-btn ghost" onclick="ProcrastinationMonitor.skipCurrentTask()">' +
                '⏭️ 跳过此任务' +
            '</button>' +
        '</div>' +
        '</div>';
        
        return html;
    },
    
    // 渲染历史记录
    renderProcrastinationHistory() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) return '';
        
        const history = PM.history;
        
        if (history.length === 0) {
            return '<div class="history-empty">暂无拖延记录<br>任务监控后会在这里显示</div>';
        }
        
        var html = '';
        const recentHistory = history.slice(0, 10);
        
        for (var i = 0; i < recentHistory.length; i++) {
            const item = recentHistory[i];
            const statusClass = item.status === 'success' ? 'success' : (item.status === 'paid' ? 'paid' : 'delayed');
            const statusText = item.status === 'success' ? '✅ 成功启动' : (item.status === 'paid' ? '💰 扣币完成' : '⏰ 延迟完成');
            
            html += '<div class="history-item ' + statusClass + '">' +
                '<div class="history-item-header">' +
                    '<span class="history-item-time">' + this.formatDateTime(item.timestamp) + '</span>' +
                    '<span class="history-item-status ' + statusClass + '">' + statusText + '</span>' +
                '</div>' +
                '<div class="history-item-task">【' + item.taskTitle + '】</div>' +
                '<div class="history-item-details">' +
                    '<span class="history-item-detail">⏱ ' + item.duration + '</span>' +
                    '<span class="history-item-detail">' + (item.coins >= 0 ? '🪙 +' + item.coins : '🪙 ' + item.coins) + '</span>' +
                    '<span class="history-item-detail">🔄 ' + item.cycles + '次</span>' +
                '</div>' +
            '</div>';
        }
        
        return html;
    },
    
    // 渲染本周统计
    renderProcrastinationStats() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) return '';
        
        const stats = PM.getStats();
        
        return '<div class="settings-section">' +
            '<div class="settings-title">📊 本周统计</div>' +
            '<div class="stats-grid">' +
                '<div class="stat-mini">' +
                    '<div class="stat-mini-value" style="color:#27AE60;">' + stats.weeklySuccess + '</div>' +
                    '<div class="stat-mini-label">成功启动</div>' +
                '</div>' +
                '<div class="stat-mini">' +
                    '<div class="stat-mini-value" style="color:#E74C3C;">' + stats.weeklyDelays + '</div>' +
                    '<div class="stat-mini-label">拖延次数</div>' +
                '</div>' +
                '<div class="stat-mini">' +
                    '<div class="stat-mini-value" style="color:#F39C12;">' + stats.totalSpent + '</div>' +
                    '<div class="stat-mini-label">扣除金币</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 显示拖延监控设置弹窗
    showProcrastinationSettingsModal() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) return;
        
        const settings = PM.settings;
        
        // 声音设置
        const soundEnabled = settings.soundEnabled !== false;
        const soundVolume = settings.soundVolume || 0.7;
        const volumePercent = Math.round(soundVolume * 100);
        
        // 语音提醒设置
        const useVoiceAlert = settings.useVoiceAlert !== false;
        const voiceLoopEnabled = settings.voiceLoopEnabled !== false;
        const voiceLoopInterval = settings.voiceLoopInterval || 10;
        
        // 金币暂停设置
        const pauseEnabled = settings.pauseEnabled !== false;
        const pauseCost = settings.pauseCost || 10;
        const pauseDuration = settings.pauseDuration || 1800;
        
        const modal = document.createElement('div');
        modal.id = 'procrastinationSettingsModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; max-height: 85vh; overflow-y: auto;">
                <div class="modal-header">
                    <span class="modal-icon">⚙️</span>
                    <h2>拖延监控设置</h2>
                </div>
                <div class="modal-body">
                    <!-- 声音提醒 -->
                    <div class="settings-section">
                        <div class="settings-title">🔊 声音提醒</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">声音提醒</span>
                                <button class="setting-toggle ${soundEnabled ? 'active' : ''}" onclick="ProcrastinationMonitor.toggleSound(); App.refreshProcrastinationSettingsModal();">
                                    ${soundEnabled ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">音量大小</span>
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <input type="range" min="0" max="100" value="${volumePercent}" style="width:100px;" onchange="ProcrastinationMonitor.setVolume(this.value/100); this.nextElementSibling.textContent=this.value+'%'">
                                    <span style="font-size:12px;color:#666;min-width:35px;">${volumePercent}%</span>
                                </div>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">测试声音</span>
                                <div style="display:flex;gap:6px;">
                                    <button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound('chime')" title="任务开始">🔔</button>
                                    <button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound('warning')" title="预警">⚠️</button>
                                    <button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound('alarm')" title="超时">🚨</button>
                                    <button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound('success')" title="成功">✅</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 监控设置 -->
                    <div class="settings-section">
                        <div class="settings-title">⚙️ 监控设置</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">启动宽限期</span>
                                <select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting('gracePeriod', parseInt(this.value))">
                                    <option value="60"${settings.gracePeriod === 60 ? ' selected' : ''}>1分钟</option>
                                    <option value="120"${settings.gracePeriod === 120 ? ' selected' : ''}>2分钟</option>
                                    <option value="180"${settings.gracePeriod === 180 ? ' selected' : ''}>3分钟</option>
                                    <option value="300"${settings.gracePeriod === 300 ? ' selected' : ''}>5分钟</option>
                                </select>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">预警提前时间</span>
                                <select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting('preAlertTime', parseInt(this.value))">
                                    <option value="10"${settings.preAlertTime === 10 ? ' selected' : ''}>10秒</option>
                                    <option value="20"${settings.preAlertTime === 20 ? ' selected' : ''}>20秒</option>
                                    <option value="30"${settings.preAlertTime === 30 ? ' selected' : ''}>30秒</option>
                                </select>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">成功奖励</span>
                                <span class="setting-value">🪙 ${settings.successReward} 金币</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 扣币规则 -->
                    <div class="settings-section">
                        <div class="settings-title">🪙 扣币规则</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">首次扣除</span>
                                <span class="setting-value">${settings.baseCost} 金币</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">递增比率</span>
                                <span class="setting-value">+${Math.round((settings.costIncrement - 1) * 100)}%/次</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">最高上限</span>
                                <span class="setting-value">${settings.maxCost} 金币</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 拖延警告设置 -->
                    <div class="settings-section">
                        <div class="settings-title">🔔 拖延警告设置</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">语音播报</span>
                                <button class="setting-toggle ${useVoiceAlert ? 'active' : ''}" onclick="ProcrastinationMonitor.updateSetting('useVoiceAlert', ${!useVoiceAlert}); App.refreshProcrastinationSettingsModal();">
                                    ${useVoiceAlert ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">循环播放</span>
                                <button class="setting-toggle ${voiceLoopEnabled ? 'active' : ''}" onclick="ProcrastinationMonitor.updateSetting('voiceLoopEnabled', ${!voiceLoopEnabled}); App.refreshProcrastinationSettingsModal();">
                                    ${voiceLoopEnabled ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">循环间隔</span>
                                <select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting('voiceLoopInterval', parseInt(this.value))">
                                    <option value="5"${voiceLoopInterval === 5 ? ' selected' : ''}>5秒</option>
                                    <option value="10"${voiceLoopInterval === 10 ? ' selected' : ''}>10秒</option>
                                    <option value="15"${voiceLoopInterval === 15 ? ' selected' : ''}>15秒</option>
                                    <option value="20"${voiceLoopInterval === 20 ? ' selected' : ''}>20秒</option>
                                    <option value="30"${voiceLoopInterval === 30 ? ' selected' : ''}>30秒</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 金币暂停功能 -->
                    <div class="settings-section">
                        <div class="settings-title">💰 金币暂停功能</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">启用暂停</span>
                                <button class="setting-toggle ${pauseEnabled ? 'active' : ''}" onclick="ProcrastinationMonitor.updateSetting('pauseEnabled', ${!pauseEnabled}); App.refreshProcrastinationSettingsModal();">
                                    ${pauseEnabled ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">暂停费用</span>
                                <select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting('pauseCost', parseInt(this.value))">
                                    <option value="5"${pauseCost === 5 ? ' selected' : ''}>5 金币</option>
                                    <option value="10"${pauseCost === 10 ? ' selected' : ''}>10 金币</option>
                                    <option value="15"${pauseCost === 15 ? ' selected' : ''}>15 金币</option>
                                    <option value="20"${pauseCost === 20 ? ' selected' : ''}>20 金币</option>
                                </select>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">暂停时长</span>
                                <select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting('pauseDuration', parseInt(this.value))">
                                    <option value="900"${pauseDuration === 900 ? ' selected' : ''}>15分钟</option>
                                    <option value="1800"${pauseDuration === 1800 ? ' selected' : ''}>30分钟</option>
                                    <option value="3600"${pauseDuration === 3600 ? ' selected' : ''}>1小时</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 自定义提示语 -->
                    <div class="settings-section">
                        <div class="settings-title">💬 自定义提示语</div>
                        <div class="settings-content">
                            <div class="setting-row" style="flex-direction:column;align-items:stretch;">
                                <span class="setting-label" style="margin-bottom:6px;">预警提示（可用变量：{seconds}, {task}, {step}）</span>
                                <input type="text" class="setting-input" style="width:100%;" value="${settings.preAlertMessage || ''}" onchange="ProcrastinationMonitor.updateSetting('preAlertMessage', this.value)">
                            </div>
                            <div class="setting-row" style="flex-direction:column;align-items:stretch;margin-top:10px;">
                                <span class="setting-label" style="margin-bottom:6px;">超时提示（可用变量：{step}）</span>
                                <input type="text" class="setting-input" style="width:100%;" value="${settings.alertMessage || ''}" onchange="ProcrastinationMonitor.updateSetting('alertMessage', this.value)">
                            </div>
                            <div class="setting-row" style="flex-direction:column;align-items:stretch;margin-top:10px;">
                                <span class="setting-label" style="margin-bottom:6px;">预警语音（可用变量：{seconds}, {task}, {step}）</span>
                                <input type="text" class="setting-input" style="width:100%;" value="${settings.customPreAlertText || ''}" onchange="ProcrastinationMonitor.updateSetting('customPreAlertText', this.value)">
                                <button class="monitor-btn ghost" style="padding:6px 12px;margin-top:6px;" onclick="App.testVoiceAlert('procrastination', 'pre')">🔊 试听预警语音</button>
                            </div>
                            <div class="setting-row" style="flex-direction:column;align-items:stretch;margin-top:10px;">
                                <span class="setting-label" style="margin-bottom:6px;">超时语音（可用变量：{task}, {step}）</span>
                                <input type="text" class="setting-input" style="width:100%;" value="${settings.customAlertText || ''}" onchange="ProcrastinationMonitor.updateSetting('customAlertText', this.value)">
                                <button class="monitor-btn ghost" style="padding:6px 12px;margin-top:6px;" onclick="App.testVoiceAlert('procrastination', 'alert')">🔊 试听超时语音</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-confirm" onclick="App.closeProcrastinationSettingsModal()">完成</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 刷新拖延监控设置弹窗
    refreshProcrastinationSettingsModal() {
        this.closeProcrastinationSettingsModal();
        this.showProcrastinationSettingsModal();
    },
    
    // 关闭拖延监控设置弹窗
    closeProcrastinationSettingsModal() {
        const modal = document.getElementById('procrastinationSettingsModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
        // 刷新面板
        this.loadProcrastinationPanel();
    },
    
    // 渲染设置区（保留但不再直接显示在面板上）
    renderProcrastinationSettings() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) return '';
        
        const settings = PM.settings;
        const stats = PM.getStats();
        
        // 声音设置
        const soundEnabled = settings.soundEnabled !== false;
        const soundVolume = settings.soundVolume || 0.7;
        const volumePercent = Math.round(soundVolume * 100);
        
        return '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">🔊 声音提醒 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content">' +
                '<div class="setting-row">' +
                    '<span class="setting-label">声音提醒</span>' +
                    '<button class="monitor-btn ' + (soundEnabled ? 'primary' : 'ghost') + '" style="padding:6px 12px;min-width:auto;" onclick="ProcrastinationMonitor.toggleSound(); App.loadProcrastinationPanel();">' +
                        (soundEnabled ? '🔊 已开启' : '🔇 已关闭') +
                    '</button>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">音量大小</span>' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<input type="range" min="0" max="100" value="' + volumePercent + '" style="width:100px;" onchange="ProcrastinationMonitor.setVolume(this.value/100); document.getElementById(\'volumeValue\').textContent=this.value+\'%\'">' +
                        '<span id="volumeValue" style="font-size:12px;color:#666;min-width:35px;">' + volumePercent + '%</span>' +
                    '</div>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">测试声音</span>' +
                    '<div style="display:flex;gap:6px;">' +
                        '<button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound(\'chime\')" title="任务开始">🔔</button>' +
                        '<button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound(\'warning\')" title="预警">⚠️</button>' +
                        '<button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound(\'alarm\')" title="超时">🚨</button>' +
                        '<button class="monitor-btn ghost" style="padding:4px 8px;font-size:11px;" onclick="ProcrastinationMonitor.testSound(\'success\')" title="成功">✅</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">⚙️ 监控设置 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content">' +
                '<div class="setting-row">' +
                    '<span class="setting-label">启动宽限期</span>' +
                    '<select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting(\'gracePeriod\', parseInt(this.value))">' +
                        '<option value="60"' + (settings.gracePeriod === 60 ? ' selected' : '') + '>1分钟</option>' +
                        '<option value="120"' + (settings.gracePeriod === 120 ? ' selected' : '') + '>2分钟</option>' +
                        '<option value="180"' + (settings.gracePeriod === 180 ? ' selected' : '') + '>3分钟</option>' +
                        '<option value="300"' + (settings.gracePeriod === 300 ? ' selected' : '') + '>5分钟</option>' +
                    '</select>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">预警提前时间</span>' +
                    '<select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting(\'preAlertTime\', parseInt(this.value))">' +
                        '<option value="10"' + (settings.preAlertTime === 10 ? ' selected' : '') + '>10秒</option>' +
                        '<option value="20"' + (settings.preAlertTime === 20 ? ' selected' : '') + '>20秒</option>' +
                        '<option value="30"' + (settings.preAlertTime === 30 ? ' selected' : '') + '>30秒</option>' +
                    '</select>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">成功奖励</span>' +
                    '<span class="setting-value">🪙 ' + settings.successReward + ' 金币</span>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">🪙 扣币规则 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content">' +
                '<div class="setting-row">' +
                    '<span class="setting-label">首次扣除</span>' +
                    '<span class="setting-value">' + settings.baseCost + ' 金币</span>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">递增比率</span>' +
                    '<span class="setting-value">+' + Math.round((settings.costIncrement - 1) * 100) + '%/次</span>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">最高上限</span>' +
                    '<span class="setting-value">' + settings.maxCost + ' 金币</span>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title">📊 本周统计</div>' +
            '<div class="stats-grid">' +
                '<div class="stat-mini">' +
                    '<div class="stat-mini-value" style="color:#27AE60;">' + stats.weeklySuccess + '</div>' +
                    '<div class="stat-mini-label">成功启动</div>' +
                '</div>' +
                '<div class="stat-mini">' +
                    '<div class="stat-mini-value" style="color:#E74C3C;">' + stats.weeklyDelays + '</div>' +
                    '<div class="stat-mini-label">拖延次数</div>' +
                '</div>' +
                '<div class="stat-mini">' +
                    '<div class="stat-mini-value" style="color:#F39C12;">' + stats.totalSpent + '</div>' +
                    '<div class="stat-mini-label">扣除金币</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">💬 自定义提示语 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content collapsed">' +
                '<div class="setting-row" style="flex-direction:column;align-items:stretch;">' +
                    '<span class="setting-label" style="margin-bottom:6px;">预警提示（可用变量：{seconds}, {task}, {step}）</span>' +
                    '<input type="text" class="setting-input" style="width:100%;" value="' + settings.preAlertMessage + '" onchange="ProcrastinationMonitor.updateSetting(\'preAlertMessage\', this.value)">' +
                '</div>' +
                '<div class="setting-row" style="flex-direction:column;align-items:stretch;margin-top:10px;">' +
                    '<span class="setting-label" style="margin-bottom:6px;">超时提示（可用变量：{step}）</span>' +
                    '<input type="text" class="setting-input" style="width:100%;" value="' + settings.alertMessage + '" onchange="ProcrastinationMonitor.updateSetting(\'alertMessage\', this.value)">' +
                '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 渲染拖延警告设置（仿照低效率监控的效率设置）
    renderProcrastinationWarningSettings() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM) return '';
        
        const settings = PM.settings;
        
        // 语音提醒设置
        const useVoiceAlert = settings.useVoiceAlert !== false;
        const voiceLoopEnabled = settings.voiceLoopEnabled !== false;
        const voiceLoopInterval = settings.voiceLoopInterval || 10;
        
        // 金币暂停设置
        const pauseEnabled = settings.pauseEnabled !== false;
        const pauseCost = settings.pauseCost || 10;
        const pauseDuration = settings.pauseDuration || 1800;
        const pauseMinutes = Math.floor(pauseDuration / 60);
        
        return '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">🔔 拖延警告设置 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content">' +
                '<div class="setting-row">' +
                    '<span class="setting-label">语音播报</span>' +
                    '<button class="setting-toggle ' + (useVoiceAlert ? 'active' : '') + '" onclick="ProcrastinationMonitor.updateSetting(\'useVoiceAlert\', ' + !useVoiceAlert + '); App.loadProcrastinationPanel();">' +
                        (useVoiceAlert ? '✅ 开启' : '❌ 关闭') +
                    '</button>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">循环播放</span>' +
                    '<button class="setting-toggle ' + (voiceLoopEnabled ? 'active' : '') + '" onclick="ProcrastinationMonitor.updateSetting(\'voiceLoopEnabled\', ' + !voiceLoopEnabled + '); App.loadProcrastinationPanel();">' +
                        (voiceLoopEnabled ? '✅ 开启' : '❌ 关闭') +
                    '</button>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">循环间隔</span>' +
                    '<select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting(\'voiceLoopInterval\', parseInt(this.value))">' +
                        '<option value="5"' + (voiceLoopInterval === 5 ? ' selected' : '') + '>5秒</option>' +
                        '<option value="10"' + (voiceLoopInterval === 10 ? ' selected' : '') + '>10秒</option>' +
                        '<option value="15"' + (voiceLoopInterval === 15 ? ' selected' : '') + '>15秒</option>' +
                        '<option value="20"' + (voiceLoopInterval === 20 ? ' selected' : '') + '>20秒</option>' +
                        '<option value="30"' + (voiceLoopInterval === 30 ? ' selected' : '') + '>30秒</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">💰 金币暂停功能 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content">' +
                '<div class="setting-row">' +
                    '<span class="setting-label">启用暂停</span>' +
                    '<button class="setting-toggle ' + (pauseEnabled ? 'active' : '') + '" onclick="ProcrastinationMonitor.updateSetting(\'pauseEnabled\', ' + !pauseEnabled + '); App.loadProcrastinationPanel();">' +
                        (pauseEnabled ? '✅ 开启' : '❌ 关闭') +
                    '</button>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">暂停费用</span>' +
                    '<select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting(\'pauseCost\', parseInt(this.value))">' +
                        '<option value="5"' + (pauseCost === 5 ? ' selected' : '') + '>5 金币</option>' +
                        '<option value="10"' + (pauseCost === 10 ? ' selected' : '') + '>10 金币</option>' +
                        '<option value="15"' + (pauseCost === 15 ? ' selected' : '') + '>15 金币</option>' +
                        '<option value="20"' + (pauseCost === 20 ? ' selected' : '') + '>20 金币</option>' +
                    '</select>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">暂停时长</span>' +
                    '<select class="setting-input" style="width:auto;" onchange="ProcrastinationMonitor.updateSetting(\'pauseDuration\', parseInt(this.value))">' +
                        '<option value="900"' + (pauseDuration === 900 ? ' selected' : '') + '>15分钟</option>' +
                        '<option value="1800"' + (pauseDuration === 1800 ? ' selected' : '') + '>30分钟</option>' +
                        '<option value="3600"' + (pauseDuration === 3600 ? ' selected' : '') + '>1小时</option>' +
                    '</select>' +
                '</div>' +
                (PM.isPaused ? 
                    '<div class="setting-row" style="background:rgba(39,174,96,0.1);padding:8px;border-radius:8px;margin-top:8px;">' +
                        '<span class="setting-label" style="color:#27AE60;">⏸️ 当前已暂停</span>' +
                        '<span class="setting-value" style="color:#27AE60;">至 ' + PM.formatTime(PM.pauseEndTime) + '</span>' +
                    '</div>' : 
                    (PM.isAlertActive && pauseEnabled ? 
                        '<button class="monitor-btn primary" style="width:100%;margin-top:10px;" onclick="ProcrastinationMonitor.pauseWithCoins()">' +
                            '💰 支付 ' + pauseCost + ' 金币暂停 ' + pauseMinutes + ' 分钟' +
                        '</button>' : '')
                ) +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">🎤 自定义语音内容 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content collapsed">' +
                '<div class="setting-row" style="flex-direction:column;align-items:stretch;">' +
                    '<span class="setting-label" style="margin-bottom:6px;">预警语音（可用变量：{seconds}, {task}, {step}）</span>' +
                    '<input type="text" class="setting-input" style="width:100%;" value="' + (settings.customPreAlertText || '') + '" onchange="ProcrastinationMonitor.updateSetting(\'customPreAlertText\', this.value)">' +
                '</div>' +
                '<div class="setting-row" style="flex-direction:column;align-items:stretch;margin-top:10px;">' +
                    '<span class="setting-label" style="margin-bottom:6px;">超时语音（可用变量：{task}, {step}）</span>' +
                    '<input type="text" class="setting-input" style="width:100%;" value="' + (settings.customAlertText || '') + '" onchange="ProcrastinationMonitor.updateSetting(\'customAlertText\', this.value)">' +
                '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 切换设置区折叠
    toggleSettingsSection(titleEl) {
        titleEl.classList.toggle('collapsed');
        const content = titleEl.nextElementSibling;
        if (content) {
            content.classList.toggle('collapsed');
        }
    },
    
    // AI拆解启动步骤
    async aiBreakdownStartupStep() {
        const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        if (!PM || !PM.currentTask) return;
        
        const task = PM.currentTask;
        const startupStep = task.substeps && task.substeps.length > 0 ? 
            task.substeps[0].title : task.title;
        
        this.addChatMessage("system", "正在AI拆解【" + startupStep + "】...", "🤖");
        
        try {
            const microTask = {
                title: startupStep,
                duration: 5
            };
            const steps = await AIService.breakdownTask(microTask);
            
            if (steps.length > 0) {
                var stepsText = "🔧 已将【" + startupStep + "】拆解为微步骤：\n";
                for (var i = 0; i < steps.length; i++) {
                    stepsText += "\n" + (i + 1) + ". " + steps[i].title;
                    if (steps[i].tip) {
                        stepsText += "\n   💡 " + steps[i].tip;
                    }
                }
                stepsText += "\n\n从第1步开始，你可以的！💪";
                
                const messages = document.getElementById("chatMessages");
                if (messages.lastChild) messages.removeChild(messages.lastChild);
                this.addChatMessage("system", stepsText, "🎯");
            }
        } catch (e) {
            const messages = document.getElementById("chatMessages");
            if (messages.lastChild) messages.removeChild(messages.lastChild);
            this.addChatMessage("system", "AI拆解失败，请检查API连接~", "😅");
        }
    },
    
    // 格式化日期时间
    formatDateTime(isoString) {
        const d = new Date(isoString);
        return (d.getMonth() + 1) + '-' + d.getDate() + ' ' + 
               d.getHours().toString().padStart(2, '0') + ':' + 
               d.getMinutes().toString().padStart(2, '0');
    },

    // ==================== 低效率面板功能 ====================
    
    // 加载低效率面板（保留兼容性，实际刷新合并面板）
    loadInefficiencyPanel() {
        // 刷新合并监控面板
        this.loadMonitorPanel();
        return;
        
        // 以下为原有代码，保留但不执行
        const container = document.getElementById("inefficiencyBody");
        if (!container) return;
        
        const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        if (!IM) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">低效率监控模块加载中...</div>';
            return;
        }
        
        // 生成监控区HTML（原有代码保留）
        var monitorHtml = this.renderInefficiencyMonitor();
        
        // 生成历史记录HTML
        var historyHtml = this.renderInefficiencyHistory();
        
        // 生成效率分析HTML
        var analysisHtml = this.renderInefficiencyAnalysis();
        
        container.innerHTML = 
            '<div class="inefficiency-container">' +
                '<div class="inefficiency-monitor">' +
                    monitorHtml +
                '</div>' +
                '<div class="inefficiency-analysis">' +
                    analysisHtml +
                '</div>' +
                '<div class="inefficiency-history">' +
                    '<div class="history-title">📊 卡顿事件分析</div>' +
                    '<div class="history-timeline" id="inefficiencyHistoryList">' +
                        historyHtml +
                    '</div>' +
                '</div>' +
            '</div>';
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('inefficiencyPanel'); }, 10);
    },
    
    // 渲染低效率监控区
    renderInefficiencyMonitor() {
        const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        if (!IM) return '';
        
        // 显示启用/禁用状态
        var enabledToggle = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<span style="font-size:13px;color:#666;">效率监控</span>' +
            '<button class="monitor-btn ' + (IM.settings.enabled ? 'primary' : 'ghost') + '" style="padding:6px 12px;min-width:auto;" onclick="InefficiencyMonitor.toggleEnabled()">' +
                (IM.settings.enabled ? '✅ 已启用' : '⏸️ 已暂停') +
            '</button>' +
        '</div>';
        
        if (!IM.currentTask) {
            // 获取今天可监控的任务
            const tasks = Storage.getTasks();
            const today = this.formatDate(new Date());
            const availableTasks = tasks.filter(function(t) { 
                return t.date === today && !t.completed; 
            });
            
            var taskListHtml = '';
            if (availableTasks.length > 0) {
                taskListHtml = '<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.08);">' +
                    '<div style="font-size:12px;color:#888;margin-bottom:8px;">📋 选择任务开始监控：</div>';
                for (var i = 0; i < Math.min(availableTasks.length, 5); i++) {
                    const task = availableTasks[i];
                    taskListHtml += '<div class="select-task-row" onclick="InefficiencyMonitor.startMonitoring(Storage.getTasks().find(function(t){return t.id===\'' + task.id + '\'}))">' +
                        '<span class="task-name">' + task.title + '</span>' +
                        '<span class="task-time">⏰ ' + task.startTime + '</span>' +
                    '</div>';
                }
                taskListHtml += '</div>';
            }
            
            return '<div class="monitor-card">' +
                enabledToggle +
                '<div class="monitor-empty">' +
                    '<div class="monitor-empty-icon">📉</div>' +
                    '<div class="monitor-empty-text">暂无监控任务<br>选择一个任务开始效率监控</div>' +
                '</div>' +
                taskListHtml +
            '</div>';
        }
        
        // 有任务正在监控
        const task = IM.currentTask;
        const settings = IM.settings;
        const currentStep = IM.getCurrentStep();
        
        // 计算时间显示
        const thresholdSeconds = settings.thresholdMinutes * 60;
        const remainingSeconds = Math.max(0, thresholdSeconds - IM.elapsedSeconds);
        const elapsedStr = IM.formatCountdown(IM.elapsedSeconds);
        const thresholdStr = IM.formatCountdown(thresholdSeconds);
        
        // 进度百分比
        const progress = Math.min(100, (IM.elapsedSeconds / thresholdSeconds) * 100);
        
        // 状态样式
        var statusClass = '';
        var statusText = '';
        var statusIcon = '🟢';
        
        if (IM.isAlertActive || IM.elapsedSeconds >= thresholdSeconds) {
            statusClass = 'danger';
            statusText = '深度卡顿';
            statusIcon = '🔴';
        } else if (progress >= 75) {
            statusClass = 'warning';
            statusText = '效率下降';
            statusIcon = '🟡';
        } else if (progress >= 50) {
            statusClass = 'caution';
            statusText = '注意时间';
            statusIcon = '🟡';
        } else {
            statusClass = 'good';
            statusText = '专注中';
            statusIcon = '🟢';
        }
        
        // 效率评分颜色
        var scoreColor = '#27AE60';
        if (IM.efficiencyScore < 40) scoreColor = '#E74C3C';
        else if (IM.efficiencyScore < 70) scoreColor = '#F39C12';
        
        // 计算当前需要支付的金币
        const currentCost = IM.calculateCurrentCost();
        
        var html = '<div class="monitor-card' + (IM.isAlertActive ? ' alert-active' : '') + '">' +
            enabledToggle +
            '<div class="monitor-task-name">' +
                '<span class="task-icon">📌</span>' +
                '<span>' + task.title + '</span>' +
            '</div>' +
            '<div class="monitor-current-step">' +
                '当前步骤：<strong>【' + currentStep + '】</strong>' +
            '</div>' +
            '<div class="monitor-time-display">' +
                '<div class="time-elapsed">' +
                    '<span class="time-label">停留时长</span>' +
                    '<span class="time-value ' + statusClass + '">⏱️ ' + elapsedStr + '</span>' +
                '</div>' +
                '<div class="time-separator">/</div>' +
                '<div class="time-threshold">' +
                    '<span class="time-value">' + thresholdStr + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="progress-bar-container">' +
                '<div class="progress-bar ' + statusClass + '" style="width:' + progress + '%"></div>' +
            '</div>' +
            '<div class="monitor-status-row">' +
                '<span class="status-tag ' + statusClass + '">' + statusIcon + ' ' + statusText + '</span>' +
                '<span class="efficiency-score" style="color:' + scoreColor + '">效率：' + IM.efficiencyScore + '/100</span>' +
            '</div>';
        
        // 警报区域
        if (IM.isAlertActive || IM.currentCycle > 1) {
            html += '<div class="alert-section inefficiency-alert">' +
                '<div class="alert-header">🚨 警报级别：深度卡顿</div>' +
                '<div class="alert-message">您在此步骤已停留较长时间，可能陷入低效循环</div>' +
                '<div class="alert-cost">第 ' + IM.currentCycle + ' 次循环 | 累计扣除：🪙 ' + IM.totalPaidCoins + '</div>' +
                '<div class="assist-options">' +
                    '<button class="assist-btn primary" onclick="InefficiencyMonitor.payToReset()">' +
                        '🪙 支付' + currentCost + '金币重置' +
                    '</button>' +
                    '<button class="assist-btn" onclick="InefficiencyMonitor.aiAdjustStep()">' +
                        '🤖 AI微调步骤' +
                    '</button>' +
                    '<button class="assist-btn" onclick="InefficiencyMonitor.startMindfulness()">' +
                        '🧘 5分钟正念' +
                    '</button>' +
                    '<button class="assist-btn" onclick="App.showRelatedTasks()">' +
                        '🔄 切换轻松任务' +
                    '</button>' +
                '</div>' +
            '</div>';
        }
        
        // 操作按钮
        html += '<div class="monitor-actions">' +
            '<button class="monitor-btn primary" onclick="InefficiencyMonitor.completeStep()">' +
                '✅ 完成此步骤' +
            '</button>' +
            '<button class="monitor-btn warning" onclick="InefficiencyMonitor.markStuck()">' +
                '⏸️ 标记卡顿' +
            '</button>' +
            '<button class="monitor-btn secondary" onclick="InefficiencyMonitor.moveToNextStep()">' +
                '🔄 跳到下一步' +
            '</button>' +
        '</div>' +
        '<button class="monitor-btn ghost" style="width:100%;margin-top:8px;" onclick="InefficiencyMonitor.stopMonitoring()">' +
            '⏹️ 停止监控' +
        '</button>' +
        '</div>';
        
        return html;
    },
    
    // 渲染低效率历史记录
    renderInefficiencyHistory() {
        const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        if (!IM) return '';
        
        const history = IM.history;
        
        if (history.length === 0) {
            return '<div class="history-empty">暂无卡顿记录<br>开始监控任务后会在这里显示</div>';
        }
        
        var html = '';
        const recentHistory = history.slice(0, 8);
        
        for (var i = 0; i < recentHistory.length; i++) {
            const item = recentHistory[i];
            const statusClass = item.status === 'completed' ? 'success' : 'stopped';
            const statusText = item.status === 'completed' ? 
                (item.cycles > 1 ? '卡顿后完成' : '正常完成') : '中途停止';
            
            html += '<div class="history-item ' + statusClass + '">' +
                '<div class="history-item-header">' +
                    '<span class="history-item-time">' + this.formatDateTime(item.timestamp) + '</span>' +
                    '<span class="history-item-status ' + statusClass + '">' + statusText + '</span>' +
                '</div>' +
                '<div class="history-item-task">【' + item.taskTitle + '】</div>' +
                '<div class="history-item-step">卡顿步骤：' + item.stepName + '</div>' +
                '<div class="history-item-details">' +
                    '<span class="history-item-detail">⏱️ ' + item.duration + '</span>' +
                    '<span class="history-item-detail">🔄 ' + item.cycles + '次</span>' +
                    '<span class="history-item-detail">' + (item.coins >= 0 ? '🪙 +' + item.coins : '🪙 ' + item.coins) + '</span>' +
                '</div>' +
            '</div>';
        }
        
        return html;
    },
    
    // 渲染效率分析
    renderInefficiencyAnalysis() {
        const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        if (!IM) return '';
        
        const stats = IM.getStats();
        
        return '<div class="settings-section">' +
            '<div class="settings-title">📈 效率分析</div>' +
            '<div class="stats-analysis">' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">本周卡顿</span>' +
                    '<span class="analysis-value" style="color:#E74C3C;">' + stats.weeklyStuck + ' 次</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">正常完成</span>' +
                    '<span class="analysis-value" style="color:#27AE60;">' + stats.completedCount + ' 次</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">累计扣币</span>' +
                    '<span class="analysis-value" style="color:#F39C12;">🪙 ' + stats.totalSpent + '</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">常见卡顿点</span>' +
                    '<span class="analysis-value" style="font-size:11px;">' + stats.commonStuck + '</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">高效时间段</span>' +
                    '<span class="analysis-value">' + stats.bestHour + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 显示低效率监控设置弹窗
    showInefficiencySettingsModal() {
        const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        if (!IM) return;
        
        const settings = IM.settings;
        
        // 语音提醒设置
        const useVoiceAlert = settings.useVoiceAlert !== false;
        const voiceLoopEnabled = settings.voiceLoopEnabled !== false;
        const voiceLoopInterval = settings.voiceLoopInterval || 15;
        
        // 金币暂停设置
        const pauseEnabled = settings.pauseEnabled !== false;
        const pauseCost = settings.pauseCost || 10;
        const pauseDuration = settings.pauseDuration || 1800;
        
        const modal = document.createElement('div');
        modal.id = 'inefficiencySettingsModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; max-height: 85vh; overflow-y: auto;">
                <div class="modal-header">
                    <span class="modal-icon">⚙️</span>
                    <h2>低效率监控设置</h2>
                </div>
                <div class="modal-body">
                    <!-- 效率设置 -->
                    <div class="settings-section">
                        <div class="settings-title">⚙️ 效率设置</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">判定时长</span>
                                <select class="setting-input" style="width:auto;" onchange="InefficiencyMonitor.updateSetting('thresholdMinutes', parseInt(this.value))">
                                    <option value="30"${settings.thresholdMinutes === 30 ? ' selected' : ''}>30分钟</option>
                                    <option value="45"${settings.thresholdMinutes === 45 ? ' selected' : ''}>45分钟</option>
                                    <option value="60"${settings.thresholdMinutes === 60 ? ' selected' : ''}>1小时</option>
                                    <option value="90"${settings.thresholdMinutes === 90 ? ' selected' : ''}>1.5小时</option>
                                    <option value="120"${settings.thresholdMinutes === 120 ? ' selected' : ''}>2小时</option>
                                </select>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">半程提醒</span>
                                <button class="setting-toggle ${settings.halfwayAlert ? 'active' : ''}" onclick="InefficiencyMonitor.updateSetting('halfwayAlert', ${!settings.halfwayAlert}); App.refreshInefficiencySettingsModal();">
                                    ${settings.halfwayAlert ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 金币规则 -->
                    <div class="settings-section">
                        <div class="settings-title">🪙 金币规则</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">首次解除</span>
                                <span class="setting-value">${settings.baseCost} 金币</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">递增比率</span>
                                <span class="setting-value">+${Math.round((settings.costIncrement - 1) * 100)}%/次</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">最高上限</span>
                                <span class="setting-value">${settings.maxCost} 金币</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 语音警告设置 -->
                    <div class="settings-section">
                        <div class="settings-title">🔔 语音警告设置</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">语音播报</span>
                                <button class="setting-toggle ${useVoiceAlert ? 'active' : ''}" onclick="InefficiencyMonitor.updateSetting('useVoiceAlert', ${!useVoiceAlert}); App.refreshInefficiencySettingsModal();">
                                    ${useVoiceAlert ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">循环播放</span>
                                <button class="setting-toggle ${voiceLoopEnabled ? 'active' : ''}" onclick="InefficiencyMonitor.updateSetting('voiceLoopEnabled', ${!voiceLoopEnabled}); App.refreshInefficiencySettingsModal();">
                                    ${voiceLoopEnabled ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">循环间隔</span>
                                <select class="setting-input" style="width:auto;" onchange="InefficiencyMonitor.updateSetting('voiceLoopInterval', parseInt(this.value))">
                                    <option value="10"${voiceLoopInterval === 10 ? ' selected' : ''}>10秒</option>
                                    <option value="15"${voiceLoopInterval === 15 ? ' selected' : ''}>15秒</option>
                                    <option value="20"${voiceLoopInterval === 20 ? ' selected' : ''}>20秒</option>
                                    <option value="30"${voiceLoopInterval === 30 ? ' selected' : ''}>30秒</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 金币暂停功能 -->
                    <div class="settings-section">
                        <div class="settings-title">💰 金币暂停功能</div>
                        <div class="settings-content">
                            <div class="setting-row">
                                <span class="setting-label">启用暂停</span>
                                <button class="setting-toggle ${pauseEnabled ? 'active' : ''}" onclick="InefficiencyMonitor.updateSetting('pauseEnabled', ${!pauseEnabled}); App.refreshInefficiencySettingsModal();">
                                    ${pauseEnabled ? '✅ 开启' : '❌ 关闭'}
                                </button>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">暂停费用</span>
                                <select class="setting-input" style="width:auto;" onchange="InefficiencyMonitor.updateSetting('pauseCost', parseInt(this.value))">
                                    <option value="5"${pauseCost === 5 ? ' selected' : ''}>5 金币</option>
                                    <option value="10"${pauseCost === 10 ? ' selected' : ''}>10 金币</option>
                                    <option value="15"${pauseCost === 15 ? ' selected' : ''}>15 金币</option>
                                    <option value="20"${pauseCost === 20 ? ' selected' : ''}>20 金币</option>
                                </select>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">暂停时长</span>
                                <select class="setting-input" style="width:auto;" onchange="InefficiencyMonitor.updateSetting('pauseDuration', parseInt(this.value))">
                                    <option value="900"${pauseDuration === 900 ? ' selected' : ''}>15分钟</option>
                                    <option value="1800"${pauseDuration === 1800 ? ' selected' : ''}>30分钟</option>
                                    <option value="3600"${pauseDuration === 3600 ? ' selected' : ''}>1小时</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 自定义提示语 -->
                    <div class="settings-section">
                        <div class="settings-title">💬 自定义提示语</div>
                        <div class="settings-content">
                            <div class="setting-row" style="flex-direction:column;align-items:stretch;">
                                <span class="setting-label" style="margin-bottom:6px;">半程提示（可用变量：{minutes}）</span>
                                <input type="text" class="setting-input" style="width:100%;" value="${settings.halfwayMessage || ''}" onchange="InefficiencyMonitor.updateSetting('halfwayMessage', this.value)">
                            </div>
                            <div class="setting-row" style="flex-direction:column;align-items:stretch;margin-top:10px;">
                                <span class="setting-label" style="margin-bottom:6px;">超时提示（可用变量：{minutes}）</span>
                                <input type="text" class="setting-input" style="width:100%;" value="${settings.alertMessage || ''}" onchange="InefficiencyMonitor.updateSetting('alertMessage', this.value)">
                            </div>
                            <div class="setting-row" style="flex-direction:column;align-items:stretch;margin-top:10px;">
                                <span class="setting-label" style="margin-bottom:6px;">超时语音（可用变量：{minutes}）</span>
                                <input type="text" class="setting-input" style="width:100%;" value="${settings.customAlertText || ''}" onchange="InefficiencyMonitor.updateSetting('customAlertText', this.value)">
                                <button class="monitor-btn ghost" style="padding:6px 12px;margin-top:6px;" onclick="App.testVoiceAlert('inefficiency', 'alert')">🔊 试听超时语音</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-confirm" onclick="App.closeInefficiencySettingsModal()">完成</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 刷新低效率监控设置弹窗
    refreshInefficiencySettingsModal() {
        this.closeInefficiencySettingsModal();
        this.showInefficiencySettingsModal();
    },
    
    // 关闭低效率监控设置弹窗
    closeInefficiencySettingsModal() {
        const modal = document.getElementById('inefficiencySettingsModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
        // 刷新面板
        this.loadInefficiencyPanel();
    },
    
    // 试听语音警告
    testVoiceAlert(type, alertType) {
        let text = '';
        let emotion = 'neutral';
        const testTask = '示例任务';
        const testStep = '当前步骤';
        
        if (type === 'procrastination') {
            const PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
            if (!PM) return;
            
            if (alertType === 'pre') {
                // 预警语音
                const input = document.getElementById('procrastinationPreAlertText');
                text = input ? input.value : (PM.settings.customPreAlertText || '注意！{task}的{step}还有{seconds}秒就要超时了！');
                text = text.replace('{task}', testTask).replace('{step}', testStep).replace('{seconds}', '30');
                emotion = 'calm'; // 预警用平静的语气
            } else {
                // 超时语音
                const input = document.getElementById('procrastinationAlertText');
                text = input ? input.value : (PM.settings.customAlertText || '{task}的{step}已严重拖延，请立即处理！');
                text = text.replace('{task}', testTask).replace('{step}', testStep);
                emotion = 'angry'; // 超时用生气的语气
            }
        } else if (type === 'inefficiency') {
            const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
            if (!IM) return;
            
            // 超时语音
            text = IM.settings.customAlertText || '你已经在{task}上花费了{minutes}分钟，效率可能较低，请检查是否需要调整方向！';
            text = text.replace('{task}', testTask).replace('{minutes}', '60');
            emotion = 'calm'; // 效率警告用平静的语气
        }
        
        if (!text) {
            text = '这是一条测试语音警告';
        }
        
        console.log('🔊 测试语音警告:', { type, alertType, emotion, text: text.substring(0, 30) + '...' });
        
        // 使用 EmotionalVoice（优先）
        if (typeof window.EmotionalVoice !== 'undefined') {
            window.EmotionalVoice.speak(text, { emotion });
            this.showToast('🔊 正在播放 (' + emotion + '): ' + text.substring(0, 30) + (text.length > 30 ? '...' : ''));
        } else {
            // 回退到浏览器语音合成
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
                setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
                    
                    // 根据情感调整参数
                    if (emotion === 'angry') {
                        utterance.rate = 1.1;
                        utterance.pitch = 1.05;
                    } else if (emotion === 'calm') {
                        utterance.rate = 0.9;
                        utterance.pitch = 0.95;
                    } else {
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
                    }
            utterance.volume = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const chineseVoice = voices.find(v => v.lang.includes('zh'));
            if (chineseVoice) {
                utterance.voice = chineseVoice;
            }
            
            window.speechSynthesis.speak(utterance);
                }, 100);
            
            this.showToast('🔊 正在播放: ' + text.substring(0, 30) + (text.length > 30 ? '...' : ''));
        } else {
            this.showToast('❌ 您的浏览器不支持语音合成');
            }
        }
    },
    
    // 显示提示消息
    showToast(message) {
        // 移除已有的toast
        const existing = document.querySelector('.app-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'app-toast';
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:12px 24px;border-radius:8px;z-index:10000;font-size:14px;max-width:80%;text-align:center;';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // 渲染低效率设置区（保留但不再直接显示在面板上）
    renderInefficiencySettings() {
        const IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        if (!IM) return '';
        
        const settings = IM.settings;
        const stats = IM.getStats();
        
        return '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">⚙️ 效率设置 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content">' +
                '<div class="setting-row">' +
                    '<span class="setting-label">判定时长</span>' +
                    '<select class="setting-input" style="width:auto;" onchange="InefficiencyMonitor.updateSetting(\'thresholdMinutes\', parseInt(this.value))">' +
                        '<option value="30"' + (settings.thresholdMinutes === 30 ? ' selected' : '') + '>30分钟</option>' +
                        '<option value="45"' + (settings.thresholdMinutes === 45 ? ' selected' : '') + '>45分钟</option>' +
                        '<option value="60"' + (settings.thresholdMinutes === 60 ? ' selected' : '') + '>1小时</option>' +
                        '<option value="90"' + (settings.thresholdMinutes === 90 ? ' selected' : '') + '>1.5小时</option>' +
                        '<option value="120"' + (settings.thresholdMinutes === 120 ? ' selected' : '') + '>2小时</option>' +
                    '</select>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">半程提醒</span>' +
                    '<button class="setting-toggle ' + (settings.halfwayAlert ? 'active' : '') + '" onclick="InefficiencyMonitor.updateSetting(\'halfwayAlert\', !' + settings.halfwayAlert + '); App.loadInefficiencyPanel();">' +
                        (settings.halfwayAlert ? '✅ 开启' : '❌ 关闭') +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title" onclick="App.toggleSettingsSection(this)">🪙 金币规则 <span class="toggle-icon">▼</span></div>' +
            '<div class="settings-content">' +
                '<div class="setting-row">' +
                    '<span class="setting-label">首次解除</span>' +
                    '<span class="setting-value">' + settings.baseCost + ' 金币</span>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">递增比率</span>' +
                    '<span class="setting-value">+' + Math.round((settings.costIncrement - 1) * 100) + '%/次</span>' +
                '</div>' +
                '<div class="setting-row">' +
                    '<span class="setting-label">最高上限</span>' +
                    '<span class="setting-value">' + settings.maxCost + ' 金币</span>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-section">' +
            '<div class="settings-title">📈 效率分析</div>' +
            '<div class="stats-analysis">' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">本周卡顿</span>' +
                    '<span class="analysis-value" style="color:#E74C3C;">' + stats.weeklyStuck + ' 次</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">正常完成</span>' +
                    '<span class="analysis-value" style="color:#27AE60;">' + stats.completedCount + ' 次</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">累计扣币</span>' +
                    '<span class="analysis-value" style="color:#F39C12;">🪙 ' + stats.totalSpent + '</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">常见卡顿点</span>' +
                    '<span class="analysis-value" style="font-size:11px;">' + stats.commonStuck + '</span>' +
                '</div>' +
                '<div class="analysis-row">' +
                    '<span class="analysis-label">高效时间段</span>' +
                    '<span class="analysis-value">' + stats.bestHour + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 显示关联轻松任务
    showRelatedTasks() {
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const simpleTasks = tasks.filter(function(t) { 
            return t.date === today && !t.completed && t.duration && t.duration <= 30;
        });
        
        if (simpleTasks.length === 0) {
            this.addChatMessage("system", "暂无可切换的轻松任务，建议休息5分钟后继续~", "💡");
            return;
        }
        
        var msg = "🔄 可切换的轻松任务：\n";
        for (var i = 0; i < Math.min(simpleTasks.length, 3); i++) {
            msg += "\n• " + simpleTasks[i].title + " (" + simpleTasks[i].duration + "分钟)";
        }
        msg += "\n\n完成一个小任务后再回来继续~";
        
        this.addChatMessage("system", msg, "🔄");
    },

    // ==================== 价值显化器功能 ====================
    
    // 加载价值显化器面板（真实收入记录系统）
    loadValuePanel() {
        const container = document.getElementById("valueBody");
        if (!container) return;
        
        // 获取财务数据
        const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
        
        if (!FS) {
            this.loadValuePanelFallback();
            return;
        }
        
        // 获取统计数据
        const todayIncome = FS.getTodayIncome();
        const monthIncome = FS.getMonthIncome();
        const monthExpense = FS.getMonthExpense();
        const balance = FS.state.balance;
        const goalProgress = FS.getGoalProgress();
        const projectRanking = FS.getProjectRanking();
        const incomeDistribution = FS.getIncomeDistribution();
        const recentIncomes = FS.getRecentIncomes(5);
        const incomeTrend = FS.getIncomeTrend();
        
        // 余额显示（正数绿色，负数红色）
        const balanceColor = balance >= 0 ? '#27AE60' : '#E74C3C';
        const balanceText = balance >= 0 ? `¥${FS.formatMoney(balance)}` : `-¥${FS.formatMoney(Math.abs(balance))}`;
        const balanceLabel = balance >= 0 ? '当前余额' : '当前负债';
        
        // 生成趋势图SVG
        const trendSvg = this.generateTrendSvg(incomeTrend);
        
        // 生成效率排行HTML
        let rankingHtml = '';
        if (projectRanking.length > 0) {
            const maxRate = projectRanking[0].hourlyRate || 1;
            rankingHtml = projectRanking.slice(0, 4).map((p, i) => {
                const medals = ['🥇', '🥈', '🥉', '4'];
                const barWidth = Math.round((p.hourlyRate / maxRate) * 100);
                return `
                    <div style="margin-bottom:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                            <span style="font-size:13px;">${medals[i]} ${p.icon} ${p.name}</span>
                            <span style="font-size:13px;font-weight:600;color:#667eea;">¥${p.hourlyRate}/h</span>
                        </div>
                        <div style="height:8px;background:#E0E0E0;border-radius:4px;overflow:hidden;">
                            <div style="height:100%;width:${barWidth}%;background:linear-gradient(90deg,${p.color},${p.color}88);border-radius:4px;transition:width 0.5s;"></div>
                        </div>
                        <div style="font-size:11px;color:#999;margin-top:2px;">累计 ¥${FS.formatMoney(p.totalIncome)} · ${p.totalHours.toFixed(1)}小时</div>
                    </div>
                `;
            }).join('');
        } else {
            rankingHtml = '<div style="text-align:center;color:#999;padding:20px;font-size:13px;">暂无数据，记录收入后显示</div>';
        }
        
        // 生成收入分布饼图
        const pieChart = this.generatePieChart(incomeDistribution, monthIncome);
        
        // 生成最近流水
        let recentHtml = '';
        if (recentIncomes.length > 0) {
            recentHtml = recentIncomes.map(inc => {
                const date = new Date(inc.date);
                const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F0F0F0;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:20px;">${inc.projectIcon}</span>
                            <div>
                                <div style="font-size:13px;color:#2C3E50;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${inc.description || inc.projectName}</div>
                                <div style="font-size:11px;color:#999;">${timeStr} · ${inc.hours}h · ¥${inc.hourlyRate}/h</div>
                            </div>
                        </div>
                        <span style="font-size:15px;font-weight:600;color:#27AE60;">+¥${FS.formatMoney(inc.amount)}</span>
                    </div>
                `;
            }).join('');
        } else {
            recentHtml = '<div style="text-align:center;color:#999;padding:20px;font-size:13px;">暂无收入记录<br>在智能对话中说"赚了xxx元"即可记录</div>';
        }
        
        const html = `
            <div style="padding:12px;max-height:100%;overflow-y:auto;">
                <!-- 系统说明横幅 -->
                <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px;color:white;">
                    <span style="font-size:28px;">💎</span>
                    <div style="flex:1;">
                        <div style="font-size:13px;font-weight:600;margin-bottom:2px;">价值显化器 - 真实财富追踪</div>
                        <div style="font-size:11px;opacity:0.9;">记录真实收入支出，与游戏金币🪙独立运作</div>
                    </div>
                </div>
                
                <!-- 财富仪表盘 -->
                <div style="background:linear-gradient(135deg,${balance >= 0 ? '#27AE60' : '#E74C3C'},${balance >= 0 ? '#2ECC71' : '#E57373'});border-radius:16px;padding:20px;color:white;margin-bottom:12px;position:relative;overflow:hidden;">
                    <div style="position:absolute;right:-20px;top:-20px;font-size:100px;opacity:0.1;">💰</div>
                    <div style="font-size:12px;opacity:0.9;">${balanceLabel}</div>
                    <div style="font-size:36px;font-weight:700;margin:8px 0;" id="balanceDisplay">${balanceText}</div>
                    <div style="display:flex;gap:20px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.2);">
                        <div>
                            <div style="font-size:11px;opacity:0.8;">今日收入</div>
                            <div style="font-size:18px;font-weight:600;">+¥${FS.formatMoney(todayIncome)}</div>
                        </div>
                        <div>
                            <div style="font-size:11px;opacity:0.8;">本月收入</div>
                            <div style="font-size:18px;font-weight:600;">¥${FS.formatMoney(monthIncome)}</div>
                        </div>
                        <div>
                            <div style="font-size:11px;opacity:0.8;">本月支出</div>
                            <div style="font-size:18px;font-weight:600;">¥${FS.formatMoney(monthExpense)}</div>
                        </div>
                    </div>
                </div>
                
                <!-- 目标进度 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:14px;margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:13px;font-weight:600;color:#2C3E50;">🎯 本月目标</span>
                        <span style="font-size:12px;color:#667eea;cursor:pointer;" onclick="App.showSetGoalModal()">¥${FS.formatMoney(goalProgress.goal)} ✏️</span>
                    </div>
                    <div style="height:12px;background:#E0E0E0;border-radius:6px;overflow:hidden;margin-bottom:8px;">
                        <div style="height:100%;width:${goalProgress.progress}%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:6px;transition:width 0.5s;"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;">
                        <span>${goalProgress.progress}% · ¥${FS.formatMoney(goalProgress.current)}</span>
                        <span>${goalProgress.progress >= 100 ? '🎉 已达成！' : `还差 ¥${FS.formatMoney(goalProgress.remaining)}`}</span>
                    </div>
                    ${goalProgress.progress < 100 ? `<div style="font-size:11px;color:#999;margin-top:6px;">📊 日均 ¥${goalProgress.dailyAverage}，预计 ${goalProgress.daysToGoal} 天达成</div>` : ''}
                </div>
                
                <!-- 收入趋势图 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:14px;margin-bottom:12px;">
                    <div style="font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:10px;">📈 收入趋势</div>
                    ${trendSvg}
                </div>
                
                <!-- 赚钱效率排行 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:14px;margin-bottom:12px;">
                    <div style="font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:12px;">🏆 赚钱效率排行 (时薪)</div>
                    ${rankingHtml}
                </div>
                
                <!-- 收入来源分布 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:14px;margin-bottom:12px;">
                    <div style="font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:10px;">📊 本月收入来源</div>
                    ${pieChart}
                </div>
                
                <!-- 最近收入流水 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:14px;margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:13px;font-weight:600;color:#2C3E50;">📝 最近收入</span>
                        <span style="font-size:11px;color:#667eea;cursor:pointer;" onclick="App.showAllIncomes()">查看全部 →</span>
                    </div>
                    ${recentHtml}
                </div>
                
                <!-- 快捷操作 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                    <button onclick="App.showAddIncomeModal()" style="padding:12px;background:linear-gradient(135deg,#27AE60,#2ECC71);color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;">
                        💰 记录收入
                    </button>
                    <button onclick="App.showAddExpenseModal()" style="padding:12px;background:linear-gradient(135deg,#E74C3C,#E57373);color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;">
                        💸 记录支出
                    </button>
                </div>
                
                <!-- 固定支出提醒 -->
                <div style="background:linear-gradient(135deg,#FFF3E0,#FFE0B2);border-radius:12px;padding:14px;margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:13px;font-weight:600;color:#E65100;">📅 每月固定支出</span>
                        <span style="font-size:12px;color:#F57C00;">¥${FS.formatMoney(FS.getTotalFixedExpenses())}</span>
                    </div>
                    <div style="font-size:12px;color:#666;">
                        ${FS.fixedExpenses.length > 0 ? 
                            FS.fixedExpenses.slice(0,3).map(f => `${f.icon} ${f.name} ¥${f.amount}`).join(' · ') :
                            '点击添加固定支出项目'
                        }
                    </div>
                    <button onclick="App.showFixedExpenseModal()" style="margin-top:10px;width:100%;padding:8px;background:rgba(230,81,0,0.1);color:#E65100;border:1px dashed #E65100;border-radius:8px;font-size:12px;cursor:pointer;">
                        ⚙️ 管理固定支出
                    </button>
                </div>
                
                <!-- 项目想法库 -->
                <div style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-radius:12px;padding:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="font-size:13px;font-weight:600;color:#2E7D32;">💡 项目想法库</span>
                        <span style="font-size:11px;color:#43A047;">${FS.ideas.length} 个想法</span>
                    </div>
                    ${FS.ideas.length > 0 ? `
                        <div style="margin-bottom:10px;">
                            ${FS.ideas.slice(0, 3).map(idea => {
                                const statusIcons = {
                                    'thinking': '💭',
                                    'researching': '🔍',
                                    'started': '🚀',
                                    'achieved': '✅'
                                };
                                const icon = statusIcons[idea.status] || '💭';
                                return `
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(46,125,50,0.1);">
                                        <div style="flex:1;overflow:hidden;">
                                            <div style="font-size:12px;color:#2C3E50;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${icon} ${idea.title}</div>
                                            ${idea.estimatedIncome > 0 ? `<div style="font-size:10px;color:#27AE60;">预估 ¥${FS.formatMoney(idea.estimatedIncome)}</div>` : ''}
                                        </div>
                                        <span style="font-size:10px;color:#999;">⭐${'⭐'.repeat(idea.feasibility)}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div style="text-align:center;color:#666;padding:12px 0;font-size:12px;">
                            还没有想法？<br>记录你的赚钱点子吧！
                        </div>
                    `}
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <button onclick="App.showAddIdeaModal()" style="padding:8px;background:rgba(46,125,50,0.1);color:#2E7D32;border:1px dashed #2E7D32;border-radius:8px;font-size:12px;cursor:pointer;">
                            ➕ 添加想法
                        </button>
                        <button onclick="App.showAllIdeas()" style="padding:8px;background:rgba(46,125,50,0.1);color:#2E7D32;border:1px solid #2E7D32;border-radius:8px;font-size:12px;cursor:pointer;">
                            📋 查看全部
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('valuePanel'); }, 10);
    },
    
    // 生成趋势图SVG
    generateTrendSvg(data) {
        if (!data || data.length === 0) {
            return '<div style="text-align:center;color:#999;padding:20px;">暂无数据</div>';
        }
        
        const width = 280;
        const height = 100;
        const padding = 20;
        const maxValue = Math.max(...data.map(d => d.value), 1);
        
        // 生成路径点
        const points = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - (d.value / maxValue) * (height - padding * 2);
            return `${x},${y}`;
        });
        
        // 生成填充区域
        const areaPoints = [
            `${padding},${height - padding}`,
            ...points,
            `${width - padding},${height - padding}`
        ].join(' ');
        
        // 生成标签
        const labels = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            return `<text x="${x}" y="${height - 5}" text-anchor="middle" style="font-size:10px;fill:#999;">${d.label}</text>`;
        }).join('');
        
        // 生成数据点
        const dots = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - (d.value / maxValue) * (height - padding * 2);
            return `<circle cx="${x}" cy="${y}" r="4" fill="#667eea" stroke="white" stroke-width="2"/>`;
        }).join('');
        
        return `
            <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3"/>
                        <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.05"/>
                    </linearGradient>
                </defs>
                <polygon points="${areaPoints}" fill="url(#areaGradient)"/>
                <polyline points="${points.join(' ')}" fill="none" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                ${dots}
                ${labels}
            </svg>
        `;
    },
    
    // 生成饼图
    generatePieChart(distribution, total) {
        if (!distribution || distribution.length === 0 || total === 0) {
            return '<div style="text-align:center;color:#999;padding:20px;">暂无数据</div>';
        }
        
        const size = 120;
        const center = size / 2;
        const radius = 45;
        
        let currentAngle = -90;
        const slices = distribution.map(d => {
            const percentage = d.amount / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            
            // 计算弧线路径
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = ((startAngle + angle) * Math.PI) / 180;
            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);
            const largeArc = angle > 180 ? 1 : 0;
            
            return {
                ...d,
                percentage: Math.round(percentage * 100),
                path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
            };
        });
        
        const svgSlices = slices.map(s => 
            `<path d="${s.path}" fill="${s.color}" stroke="white" stroke-width="2"/>`
        ).join('');
        
        const legend = slices.slice(0, 4).map(s => `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <div style="width:10px;height:10px;border-radius:2px;background:${s.color};"></div>
                <span style="font-size:11px;color:#666;">${s.icon} ${s.name}</span>
                <span style="font-size:11px;color:#2C3E50;font-weight:600;margin-left:auto;">¥${FinanceSystem.formatMoney(s.amount)}</span>
                <span style="font-size:10px;color:#999;">${s.percentage}%</span>
            </div>
        `).join('');
        
        return `
            <div style="display:flex;align-items:center;gap:16px;">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    ${svgSlices}
                    <circle cx="${center}" cy="${center}" r="25" fill="white"/>
                    <text x="${center}" y="${center - 5}" text-anchor="middle" style="font-size:10px;fill:#999;">本月</text>
                    <text x="${center}" y="${center + 10}" text-anchor="middle" style="font-size:12px;fill:#2C3E50;font-weight:600;">¥${FinanceSystem.formatMoney(total)}</text>
                </svg>
                <div style="flex:1;">
                    ${legend}
                </div>
            </div>
        `;
    },
    
    // 价值显化器回退版本（不依赖FinanceSystem）
    loadValuePanelFallback() {
        const container = document.getElementById("valueBody");
        if (!container) return;
        
        // 从本地存储获取游戏状态
        const gameState = Storage.getGameState();
        const coins = gameState.coins || 0;
        
        // 获取今日完成的任务
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const completedToday = tasks.filter(t => t.date === today && t.completed);
        
        // 计算今日获得的金币（估算）
        const todayCoins = completedToday.length * 5;
        
        const html = `
            <div style="padding:16px;">
                <!-- 金币余额卡片 -->
                <div style="background:linear-gradient(135deg,#FFF8E1,#FFECB3);border-radius:12px;padding:20px;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:40px;">🪙</span>
                        <div>
                            <div style="font-size:12px;color:#888;">金币余额</div>
                            <div style="font-size:32px;font-weight:700;color:#D4A017;">${coins}</div>
                        </div>
                    </div>
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.1);">
                        <span style="font-size:12px;color:#666;">今日获得: <strong style="color:#27AE60;">+${todayCoins}</strong></span>
                    </div>
                </div>
                
                <!-- 今日成就 -->
                <div style="background:#F8F9FA;border-radius:12px;padding:16px;margin-bottom:16px;">
                    <div style="font-size:13px;color:#888;margin-bottom:12px;">📊 今日成就</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <div style="background:white;border-radius:8px;padding:12px;text-align:center;">
                            <div style="font-size:24px;font-weight:700;color:#667eea;">${completedToday.length}</div>
                            <div style="font-size:11px;color:#999;">完成任务</div>
                        </div>
                        <div style="background:white;border-radius:8px;padding:12px;text-align:center;">
                            <div style="font-size:24px;font-weight:700;color:#27AE60;">+${todayCoins}</div>
                            <div style="font-size:11px;color:#999;">获得金币</div>
                        </div>
                    </div>
                </div>
                
                <!-- 快捷操作 -->
                <div style="display:flex;gap:10px;">
                    <button onclick="App.showRewardsPanel()" style="flex:1;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">
                        🎁 兑换奖励
                    </button>
                    <button onclick="App.showGameStatus()" style="flex:1;padding:12px;background:#F5F5F5;color:#666;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">
                        📈 查看统计
                    </button>
                </div>
                
                <!-- 提示 -->
                <div style="margin-top:16px;padding:12px;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-radius:10px;">
                    <div style="font-size:12px;color:#2E7D32;">
                        💡 <strong>获得金币的方式：</strong><br>
                        • 按时完成任务 +5金币<br>
                        • 快速启动任务 +2金币<br>
                        • 连续完成任务 额外奖励
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        setTimeout(function() { Canvas.reapplyBackground('valuePanel'); }, 10);
    },
    
    // 显示游戏状态
    showGameStatus() {
        const gameState = Storage.getGameState();
        const msg = `📊 **游戏状态**\n\n` +
            `🪙 金币: ${gameState.coins || 0}\n` +
            `⚡ 能量: ${gameState.energy || 100}/${gameState.maxEnergy || 100}\n` +
            `🔥 连击: ${gameState.streak || 0}\n` +
            `⭐ 等级: ${gameState.level || 1}\n` +
            `📈 经验: ${gameState.exp || 0}/${(gameState.level || 1) * 100}`;
        this.addChatMessage('system', msg, '📊');
    },
    
    // 渲染财务紧急看板
    renderFinanceDashboard() {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV) return '';
        
        const finance = VV.finance;
        const progress = VV.getTodayProgress();
        const todayRemaining = Math.max(0, finance.dailyTarget - VV.todayEarned);
        
        // 紧急程度判断
        var urgencyClass = 'normal';
        var urgencyText = '状态良好';
        if (finance.daysRemaining <= 3 && finance.totalRequired > 0) {
            urgencyClass = 'critical';
            urgencyText = '⚠️ 紧急！';
        } else if (finance.daysRemaining <= 7 && finance.totalRequired > finance.dailyTarget * 3) {
            urgencyClass = 'warning';
            urgencyText = '需要加油';
        }
        
        return '<div class="finance-dashboard ' + urgencyClass + '">' +
            '<div class="dashboard-header">' +
                '<span class="dashboard-title">🔥 财务紧急看板</span>' +
                '<button class="dashboard-edit-btn" onclick="ValueVisualizer.showSetupModal()">⚙️</button>' +
            '</div>' +
            '<div class="dashboard-grid">' +
                '<div class="dashboard-item debt">' +
                    '<div class="item-label">💳 欠款</div>' +
                    '<div class="item-value">' + VV.formatMoney(finance.debt) + '</div>' +
                '</div>' +
                '<div class="dashboard-item expense">' +
                    '<div class="item-label">🏠 月支出</div>' +
                    '<div class="item-value">' + VV.formatMoney(finance.monthlyExpense) + '</div>' +
                '</div>' +
                '<div class="dashboard-item daily-target">' +
                    '<div class="item-label">🎯 今日必赚</div>' +
                    '<div class="item-value highlight">' + VV.formatMoney(finance.dailyTarget) + '</div>' +
                '</div>' +
                '<div class="dashboard-item countdown">' +
                    '<div class="item-label">⏰ 本月剩余</div>' +
                    '<div class="item-value">' + finance.daysRemaining + '天</div>' +
                '</div>' +
            '</div>' +
            '<div class="dashboard-progress">' +
                '<div class="progress-header">' +
                    '<span>今日进度</span>' +
                    '<span class="progress-percent">' + progress + '%</span>' +
                '</div>' +
                '<div class="progress-bar-wrapper">' +
                    '<div class="progress-bar-fill" style="width:' + progress + '%;background:' + 
                        (progress >= 100 ? 'linear-gradient(90deg, #27AE60, #2ECC71)' : 
                         progress >= 50 ? 'linear-gradient(90deg, #F1C40F, #F39C12)' : 
                         'linear-gradient(90deg, #E74C3C, #C0392B)') + '"></div>' +
                '</div>' +
                '<div class="progress-footer">' +
                    (progress >= 100 ? 
                        '<span class="progress-complete">🎉 今日目标已达成！</span>' :
                        '<span class="progress-remaining">还差 ' + VV.formatMoney(todayRemaining) + '</span>'
                    ) +
                '</div>' +
            '</div>' +
        '</div>';
    },
    
    // 渲染今日收入
    renderTodayEarnings() {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV) return '';
        
        var completedHtml = '';
        if (VV.completedToday.length === 0) {
            completedHtml = '<div class="no-earnings">还没有收入，开始干活吧！💪</div>';
        } else {
            const recent = VV.completedToday.slice(0, 5);
            for (var i = 0; i < recent.length; i++) {
                const item = recent[i];
                const time = new Date(item.time);
                const timeStr = time.getHours().toString().padStart(2, '0') + ':' + 
                               time.getMinutes().toString().padStart(2, '0');
                completedHtml += '<div class="earning-item">' +
                    '<div class="earning-info">' +
                        '<span class="earning-task">' + item.taskTitle + '</span>' +
                        '<span class="earning-time">' + timeStr + '</span>' +
                    '</div>' +
                    '<div class="earning-value">+' + VV.formatMoney(item.value) + '</div>' +
                '</div>';
            }
        }
        
        // 收入流统计
        var streamsHtml = '';
        const streams = VV.getStreamStats();
        if (streams.length > 0) {
            streamsHtml = '<div class="income-streams">' +
                '<div class="streams-title">📊 收入来源</div>' +
                '<div class="streams-list">';
            for (var j = 0; j < Math.min(streams.length, 4); j++) {
                const stream = streams[j];
                streamsHtml += '<div class="stream-item">' +
                    '<span class="stream-name">' + stream.name + '</span>' +
                    '<span class="stream-total">' + VV.formatMoney(stream.total) + '</span>' +
                '</div>';
            }
            streamsHtml += '</div></div>';
        }
        
        return '<div class="today-earnings">' +
            '<div class="earnings-header">' +
                '<span class="earnings-title">💵 今日已赚</span>' +
                '<span class="earnings-total">' + VV.formatMoney(VV.todayEarned) + '</span>' +
            '</div>' +
            '<div class="earnings-list">' +
                completedHtml +
            '</div>' +
            streamsHtml +
        '</div>';
    },
    
    // 渲染AI赚钱排行榜
    renderEarningRanking() {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV) return '';
        
        const ranking = VV.getEarningRanking();
        
        if (ranking.length === 0) {
            return '<div class="earning-ranking">' +
                '<div class="ranking-header">' +
                    '<span class="ranking-title">🎯 现在做什么最赚钱？</span>' +
                '</div>' +
                '<div class="no-tasks">添加任务后，AI会帮你排序</div>' +
            '</div>';
        }
        
        var rankingHtml = '';
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        
        for (var i = 0; i < ranking.length; i++) {
            const task = ranking[i];
            const dueText = task.daysUntilDue <= 0 ? '今天截止！' : 
                           task.daysUntilDue === 1 ? '明天截止' : 
                           task.daysUntilDue + '天后';
            
            rankingHtml += '<div class="ranking-item" onclick="App.scrollToTask(\'' + task.id + '\')">' +
                '<div class="ranking-medal">' + medals[i] + '</div>' +
                '<div class="ranking-info">' +
                    '<div class="ranking-task-name">' + task.title + '</div>' +
                    '<div class="ranking-details">' +
                        '<span class="ranking-duration">' + (task.duration || 60) + '分钟</span>' +
                        '<span class="ranking-due ' + (task.daysUntilDue <= 1 ? 'urgent' : '') + '">' + dueText + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="ranking-value">' +
                    '<div class="ranking-money">' + VV.formatMoney(task.value) + '</div>' +
                    '<div class="ranking-hourly">' + VV.formatMoney(task.hourlyRate) + '/时</div>' +
                '</div>' +
            '</div>';
        }
        
        return '<div class="earning-ranking">' +
            '<div class="ranking-header">' +
                '<span class="ranking-title">🎯 现在做什么最赚钱？</span>' +
                '<span class="ranking-subtitle">AI实时排序</span>' +
            '</div>' +
            '<div class="ranking-list">' +
                rankingHtml +
            '</div>' +
        '</div>';
    },
    
    // 滚动到指定任务
    scrollToTask(taskId) {
        const taskEl = document.querySelector('[data-task-id="' + taskId + '"]');
        if (taskEl) {
            taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskEl.classList.add('highlight-task');
            setTimeout(() => taskEl.classList.remove('highlight-task'), 2000);
        }
    },
    
    // 为任务添加价值标签（在时间轴渲染时调用）
    getTaskValueBadge(task) {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV) return '';
        
        const value = task.value || VV.estimateTaskValue(task);
        if (value <= 0) return '';
        
        return '<span class="task-value-badge">💰 ' + VV.formatMoney(value) + '</span>';
    },
    
    // 完成任务步骤时触发价值收入
    onStepComplete(task, stepIndex) {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV) return;
        
        // 计算步骤价值
        const totalValue = task.value || VV.estimateTaskValue(task);
        const substeps = task.substeps || [];
        
        if (substeps.length > 0 && stepIndex < substeps.length) {
            const stepsWithValue = VV.breakdownTaskValue(task, totalValue, substeps);
            const stepValue = stepsWithValue[stepIndex]?.value || Math.round(totalValue / substeps.length);
            VV.earnFromStep(task, stepIndex, stepValue);
        }
    },
    
    // 完成整个任务时触发
    onTaskComplete(task) {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV) return;
        
        // 如果没有子步骤，整个任务价值一次性到账
        if (!task.substeps || task.substeps.length === 0) {
            const value = task.value || VV.estimateTaskValue(task);
            VV.earnFromStep(task, 0, value);
        }
        
        // 刷新价值面板
        this.loadValuePanel();
    },
    
    // 获取拖延损失提示
    getProcrastinationLossWarning(task) {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV || !VV.settings.showLossWarning) return '';
        
        const hourlyLoss = VV.calculateProcrastinationLoss(task);
        if (hourlyLoss <= 0) return '';
        
        return '⚠️ 正在损失 ' + VV.formatMoney(hourlyLoss) + '/小时！';
    },
    
    // 获取低效率损失提示
    getInefficiencyLossWarning(task) {
        const VV = typeof ValueVisualizer !== 'undefined' ? ValueVisualizer : null;
        if (!VV || !VV.settings.showLossWarning) return '';
        
        const minuteLoss = VV.calculateInefficiencyLoss(task);
        if (minuteLoss <= 0) return '';
        
        return '⚠️ 效率损失：每分钟少赚 ' + VV.formatMoney(minuteLoss) + '！';
    },
    
    // ==================== 时间指示器功能 ====================
    
    // 滚动到当前时间位置
    scrollToCurrentTime() {
        const timelineSection = document.getElementById('timelineSection');
        const indicator = document.getElementById('currentTimeIndicator');
        if (!timelineSection || !indicator) return;
        
        // 获取指示器位置
        const indicatorTop = parseFloat(indicator.style.top) || 0;
        
        // 滚动到指示器位置（居中显示）
        const sectionHeight = timelineSection.clientHeight;
        const scrollTarget = Math.max(0, indicatorTop - sectionHeight / 3);
        
        timelineSection.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });
    },
    
    // 启动时间指示器实时更新
    startTimeIndicatorUpdate() {
        // 清除之前的定时器
        if (this._timeIndicatorTimer) {
            clearInterval(this._timeIndicatorTimer);
        }
        
        const self = this;
        
        // 延迟执行，确保 DOM 已渲染完成
        setTimeout(function() {
            // 立即更新一次
            self.updateTimeIndicator();
        }, 100);
        
        // 每分钟更新一次
        this._timeIndicatorTimer = setInterval(function() {
            self.updateTimeIndicator();
        }, 60000); // 60秒
        
        // 计算到下一分钟的时间，确保在整分钟时更新
        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        
        setTimeout(function() {
            self.updateTimeIndicator();
            // 重新设置定时器，确保每分钟整点更新
            if (self._timeIndicatorTimer) {
                clearInterval(self._timeIndicatorTimer);
            }
            self._timeIndicatorTimer = setInterval(function() {
                self.updateTimeIndicator();
            }, 60000);
        }, msUntilNextMinute);
    },
    
    // 更新时间指示器位置和时间
    updateTimeIndicator() {
        const indicator = document.getElementById('currentTimeIndicator');
        const timeLabel = indicator ? indicator.querySelector('.current-time-label') : null;
        const timelineTrack = document.getElementById('timelineTrack');
        if (!indicator || !timelineTrack) return;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        
        // 获取所有时间槽
        const slots = timelineTrack.querySelectorAll('.time-slot');
        if (slots.length === 0) return;
        
        // 找到当前时间应该在的位置
        let indicatorTop = 0;
        let foundPosition = false;
        
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const slotHour = parseInt(slot.dataset.hour) || 0;
            const slotMinutes = parseInt(slot.dataset.minutes) || 0;
            const slotTotalMinutes = slotHour * 60 + slotMinutes;
            
            // 获取下一个槽的时间
            let nextSlotTotalMinutes = 24 * 60; // 默认到24:00
            if (i + 1 < slots.length) {
                const nextSlot = slots[i + 1];
                const nextHour = parseInt(nextSlot.dataset.hour) || 0;
                const nextMin = parseInt(nextSlot.dataset.minutes) || 0;
                nextSlotTotalMinutes = nextHour * 60 + nextMin;
            }
            
            // 当前时间在这个槽的范围内
            if (currentTotalMinutes >= slotTotalMinutes && currentTotalMinutes < nextSlotTotalMinutes) {
                // 计算在这个槽内的相对位置
                const slotTop = slot.offsetTop;
                const slotHeight = slot.offsetHeight;
                const slotDuration = nextSlotTotalMinutes - slotTotalMinutes;
                const minutesIntoSlot = currentTotalMinutes - slotTotalMinutes;
                
                if (slotDuration > 0) {
                    const ratio = minutesIntoSlot / slotDuration;
                    indicatorTop = slotTop + (slotHeight * ratio);
                } else {
                    indicatorTop = slotTop;
                }
                foundPosition = true;
                break;
            }
            
            // 当前时间在这个槽之前（时间轴从较晚时间开始的情况）
            if (currentTotalMinutes < slotTotalMinutes && i === 0) {
                indicatorTop = 0;
                foundPosition = true;
                break;
            }
        }
        
        // 如果没找到位置（当前时间在最后一个槽之后）
        if (!foundPosition && slots.length > 0) {
            const lastSlot = slots[slots.length - 1];
            indicatorTop = lastSlot.offsetTop + lastSlot.offsetHeight;
        }
        
        // 更新位置（带平滑动画）
        indicator.style.transition = 'top 0.5s ease-out';
        indicator.style.top = indicatorTop + 'px';
        
        // 更新时间标签
        const currentTimeStr = currentHour.toString().padStart(2, "0") + ":" + currentMinute.toString().padStart(2, "0");
        if (timeLabel) {
            timeLabel.textContent = 'Now ' + currentTimeStr;
        }
        
        console.log('⏰ Now线更新:', currentTimeStr, '位置:', indicatorTop + 'px');
    },
    
    // 停止时间指示器更新（页面卸载时调用）
    stopTimeIndicatorUpdate() {
        if (this._timeIndicatorTimer) {
            clearInterval(this._timeIndicatorTimer);
            this._timeIndicatorTimer = null;
        }
    }
};

// API Key 相关全局函数
function closeApiKeyModal() {
    const modal = document.getElementById("apiKeyModal");
    if (modal) {
        modal.classList.remove("show");
    }
}

function saveApiKey() {
    const input = document.getElementById("apiKeyInput");
    if (!input) return;
    
    const key = input.value.trim();
    if (key) {
        Storage.setApiKey(key);
        closeApiKeyModal();
        App.checkApiConnection().then(function() {
            // App.loadSmartInput(); // 已合并到 BrainDump 组件
            if (App.isConnected) {
                App.addChatMessage("system", "API连接成功！现在可以开始使用AI功能了~", "🎉");
            } else {
                App.addChatMessage("system", "API Key已保存，但连接似乎有问题，请检查Key是否正确", "⚠️");
            }
        });
    }
}

// ==================== 价值显化器弹窗函数 ====================

// 显示添加收入弹窗
App.showAddIncomeModal = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) {
        this.addChatMessage('system', '财务系统未加载', '⚠️');
        return;
    }
    
    const projectOptions = FS.projects.map(p => 
        `<option value="${p.id}">${p.icon} ${p.name}</option>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'addIncomeModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <span class="modal-icon">💰</span>
                <h2>记录收入</h2>
                <button class="modal-close-btn" onclick="document.getElementById('addIncomeModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:20px;">
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">金额 (元)</label>
                    <input type="number" id="incomeAmount" placeholder="输入金额" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:16px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">项目类型</label>
                    <select id="incomeProject" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;box-sizing:border-box;">
                        ${projectOptions}
                    </select>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">耗时 (小时)</label>
                    <input type="number" id="incomeHours" placeholder="投入时间" value="1" step="0.5" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">备注说明</label>
                    <input type="text" id="incomeDesc" placeholder="例如：完成XX项目" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;box-sizing:border-box;">
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-cancel" onclick="document.getElementById('addIncomeModal').remove()">取消</button>
                <button class="modal-btn btn-confirm" onclick="App.confirmAddIncome()">确认记录</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('incomeAmount').focus();
};

// 确认添加收入
App.confirmAddIncome = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const project = document.getElementById('incomeProject').value;
    const hours = parseFloat(document.getElementById('incomeHours').value) || 1;
    const desc = document.getElementById('incomeDesc').value;
    
    if (!amount || amount <= 0) {
        alert('请输入有效金额');
        return;
    }
    
    FS.addIncome({
        amount,
        project,
        hours,
        description: desc
    });
    
    document.getElementById('addIncomeModal').remove();
    this.addChatMessage('system', `💰 已记录收入 ¥${amount}，项目：${FS.projects.find(p=>p.id===project)?.name || '其他'}`, '💰');
};

// 显示添加支出弹窗
App.showAddExpenseModal = function() {
    const categories = [
        { id: 'rent', name: '🏠 房租' },
        { id: 'food', name: '🍜 餐饮' },
        { id: 'transport', name: '🚗 交通' },
        { id: 'subscription', name: '📱 订阅' },
        { id: 'utilities', name: '💡 水电' },
        { id: 'phone', name: '📞 话费' },
        { id: 'shopping', name: '🛒 购物' },
        { id: 'entertainment', name: '🎮 娱乐' },
        { id: 'other', name: '📦 其他' }
    ];
    
    const categoryOptions = categories.map(c => 
        `<option value="${c.id}">${c.name}</option>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'addExpenseModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <span class="modal-icon">💸</span>
                <h2>记录支出</h2>
                <button class="modal-close-btn" onclick="document.getElementById('addExpenseModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:20px;">
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">金额 (元)</label>
                    <input type="number" id="expenseAmount" placeholder="输入金额" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:16px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">支出类别</label>
                    <select id="expenseCategory" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;box-sizing:border-box;">
                        ${categoryOptions}
                    </select>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">备注说明</label>
                    <input type="text" id="expenseDesc" placeholder="例如：买了XX" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;box-sizing:border-box;">
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-cancel" onclick="document.getElementById('addExpenseModal').remove()">取消</button>
                <button class="modal-btn btn-confirm" style="background:#E74C3C;" onclick="App.confirmAddExpense()">确认记录</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('expenseAmount').focus();
};

// 确认添加支出
App.confirmAddExpense = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const desc = document.getElementById('expenseDesc').value;
    
    if (!amount || amount <= 0) {
        alert('请输入有效金额');
        return;
    }
    
    FS.addExpense({
        amount,
        category,
        description: desc
    });
    
    document.getElementById('addExpenseModal').remove();
    this.addChatMessage('system', `💸 已记录支出 ¥${amount}`, '💸');
};

// 显示设置目标弹窗
App.showSetGoalModal = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    const currentGoal = FS ? FS.state.monthlyGoal : 10000;
    const currentBalance = FS ? FS.state.balance : 0;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'setGoalModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <span class="modal-icon">🎯</span>
                <h2>财务设置</h2>
                <button class="modal-close-btn" onclick="document.getElementById('setGoalModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:20px;">
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">本月收入目标 (元)</label>
                    <input type="number" id="monthlyGoal" value="${currentGoal}" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:16px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">当前余额 (元，负数表示负债)</label>
                    <input type="number" id="currentBalance" value="${currentBalance}" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:16px;box-sizing:border-box;">
                </div>
                <div style="padding:12px;background:#F0F4FF;border-radius:8px;font-size:12px;color:#666;">
                    💡 提示：余额会根据你记录的收入和支出自动更新。你也可以在这里手动调整初始余额。
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-cancel" onclick="document.getElementById('setGoalModal').remove()">取消</button>
                <button class="modal-btn btn-confirm" onclick="App.confirmSetGoal()">保存设置</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// 确认设置目标
App.confirmSetGoal = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const goal = parseFloat(document.getElementById('monthlyGoal').value) || 10000;
    const balance = parseFloat(document.getElementById('currentBalance').value) || 0;
    
    FS.setMonthlyGoal(goal);
    FS.setBalance(balance);
    
    document.getElementById('setGoalModal').remove();
    this.addChatMessage('system', `🎯 已设置本月目标 ¥${goal}，当前余额 ¥${balance}`, '🎯');
};

// 显示固定支出管理弹窗
App.showFixedExpenseModal = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const fixedList = FS.fixedExpenses.map(f => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#F8F9FA;border-radius:8px;margin-bottom:8px;">
            <div>
                <span style="font-size:16px;">${f.icon}</span>
                <span style="font-size:14px;margin-left:8px;">${f.name}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:14px;font-weight:600;color:#E74C3C;">¥${f.amount}</span>
                <span style="font-size:11px;color:#999;">每月${f.dayOfMonth}号</span>
                <button onclick="App.removeFixedExpense('${f.id}')" style="background:none;border:none;color:#999;cursor:pointer;font-size:16px;">×</button>
            </div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:20px;">暂无固定支出</div>';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'fixedExpenseModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <span class="modal-icon">📅</span>
                <h2>固定支出管理</h2>
                <button class="modal-close-btn" onclick="document.getElementById('fixedExpenseModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:20px;max-height:400px;overflow-y:auto;">
                <div style="margin-bottom:16px;">
                    <div style="font-size:13px;color:#666;margin-bottom:8px;">已添加的固定支出</div>
                    <div id="fixedExpenseList">
                        ${fixedList}
                    </div>
                </div>
                <div style="border-top:1px solid #E0E0E0;padding-top:16px;">
                    <div style="font-size:13px;color:#666;margin-bottom:8px;">添加新的固定支出</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
                        <input type="text" id="fixedName" placeholder="名称（如：房租）" style="padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;">
                        <input type="number" id="fixedAmount" placeholder="金额" style="padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;">
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
                        <select id="fixedIcon" style="padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;">
                            <option value="🏠">🏠 房租</option>
                            <option value="💡">💡 水电</option>
                            <option value="📱">📱 话费</option>
                            <option value="🎵">🎵 订阅</option>
                            <option value="🍜">🍜 伙食</option>
                            <option value="🚗">🚗 交通</option>
                            <option value="📦">📦 其他</option>
                        </select>
                        <input type="number" id="fixedDay" placeholder="扣款日（1-31）" min="1" max="31" value="1" style="padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;">
                    </div>
                    <button onclick="App.addFixedExpenseItem()" style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
                        + 添加固定支出
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-confirm" onclick="document.getElementById('fixedExpenseModal').remove()">完成</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// 添加固定支出项
App.addFixedExpenseItem = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const name = document.getElementById('fixedName').value;
    const amount = parseFloat(document.getElementById('fixedAmount').value);
    const icon = document.getElementById('fixedIcon').value;
    const day = parseInt(document.getElementById('fixedDay').value) || 1;
    
    if (!name || !amount) {
        alert('请填写名称和金额');
        return;
    }
    
    FS.addFixedExpense({
        name,
        amount,
        icon,
        dayOfMonth: day
    });
    
    // 刷新弹窗
    document.getElementById('fixedExpenseModal').remove();
    this.showFixedExpenseModal();
    this.loadValuePanel();
};

// 删除固定支出
App.removeFixedExpense = function(id) {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    FS.fixedExpenses = FS.fixedExpenses.filter(f => f.id !== id);
    FS.saveFixedExpenses();
    
    // 刷新弹窗
    document.getElementById('fixedExpenseModal').remove();
    this.showFixedExpenseModal();
    this.loadValuePanel();
};

// 显示添加项目想法弹窗
App.showAddIdeaModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'addIdeaModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <span class="modal-icon">💡</span>
                <h2>添加赚钱想法</h2>
                <button class="modal-close-btn" onclick="document.getElementById('addIdeaModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:20px;">
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">想法标题</label>
                    <input type="text" id="ideaTitle" placeholder="例如：开发一个小程序" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">预估收入 (元)</label>
                    <input type="number" id="ideaIncome" placeholder="预计能赚多少" style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:14px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">可行性评分</label>
                    <div style="display:flex;gap:8px;justify-content:space-between;">
                        <button class="feasibility-btn" data-score="1" onclick="App.selectFeasibility(1)" style="flex:1;padding:10px;border:2px solid #E0E0E0;border-radius:8px;background:white;cursor:pointer;font-size:12px;">⭐<br>很难</button>
                        <button class="feasibility-btn" data-score="2" onclick="App.selectFeasibility(2)" style="flex:1;padding:10px;border:2px solid #E0E0E0;border-radius:8px;background:white;cursor:pointer;font-size:12px;">⭐⭐<br>较难</button>
                        <button class="feasibility-btn active" data-score="3" onclick="App.selectFeasibility(3)" style="flex:1;padding:10px;border:2px solid #667eea;border-radius:8px;background:#F0F4FF;cursor:pointer;font-size:12px;">⭐⭐⭐<br>中等</button>
                        <button class="feasibility-btn" data-score="4" onclick="App.selectFeasibility(4)" style="flex:1;padding:10px;border:2px solid #E0E0E0;border-radius:8px;background:white;cursor:pointer;font-size:12px;">⭐⭐⭐⭐<br>较易</button>
                        <button class="feasibility-btn" data-score="5" onclick="App.selectFeasibility(5)" style="flex:1;padding:10px;border:2px solid #E0E0E0;border-radius:8px;background:white;cursor:pointer;font-size:12px;">⭐⭐⭐⭐⭐<br>很容易</button>
                    </div>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:13px;color:#666;margin-bottom:6px;">备注说明</label>
                    <textarea id="ideaNotes" placeholder="记录你的想法、计划、需要的资源等..." style="width:100%;padding:12px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px;min-height:80px;box-sizing:border-box;resize:vertical;"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-cancel" onclick="document.getElementById('addIdeaModal').remove()">取消</button>
                <button class="modal-btn btn-confirm" onclick="App.confirmAddIdea()">添加想法</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('ideaTitle').focus();
};

// 选择可行性评分
App.selectFeasibility = function(score) {
    const buttons = document.querySelectorAll('.feasibility-btn');
    buttons.forEach(btn => {
        if (parseInt(btn.dataset.score) === score) {
            btn.style.border = '2px solid #667eea';
            btn.style.background = '#F0F4FF';
            btn.classList.add('active');
        } else {
            btn.style.border = '2px solid #E0E0E0';
            btn.style.background = 'white';
            btn.classList.remove('active');
        }
    });
};

// 确认添加想法
App.confirmAddIdea = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const title = document.getElementById('ideaTitle').value.trim();
    const income = parseFloat(document.getElementById('ideaIncome').value) || 0;
    const notes = document.getElementById('ideaNotes').value.trim();
    const feasibilityBtn = document.querySelector('.feasibility-btn.active');
    const feasibility = feasibilityBtn ? parseInt(feasibilityBtn.dataset.score) : 3;
    
    if (!title) {
        alert('请输入想法标题');
        return;
    }
    
    FS.addIdea({
        title,
        estimatedIncome: income,
        feasibility,
        notes
    });
    
    document.getElementById('addIdeaModal').remove();
    this.addChatMessage('system', `💡 已添加赚钱想法：${title}`, '💡');
};

// 显示所有项目想法
App.showAllIdeas = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const ideas = FS.ideas;
    
    const statusMap = {
        'thinking': { label: '💭 构思中', color: '#95A5A6' },
        'researching': { label: '🔍 调研中', color: '#3498DB' },
        'started': { label: '🚀 已启动', color: '#F39C12' },
        'achieved': { label: '✅ 已实现', color: '#27AE60' }
    };
    
    const listHtml = ideas.map(idea => {
        const status = statusMap[idea.status] || statusMap.thinking;
        const date = new Date(idea.createdAt);
        const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
        const stars = '⭐'.repeat(idea.feasibility);
        
        return `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;border:1px solid #E0E0E0;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:600;color:#2C3E50;margin-bottom:4px;">${idea.title}</div>
                        <div style="font-size:11px;color:#999;">${dateStr} · ${stars}</div>
                    </div>
                    <span style="font-size:11px;padding:4px 8px;background:${status.color}22;color:${status.color};border-radius:6px;white-space:nowrap;">${status.label}</span>
                </div>
                ${idea.estimatedIncome > 0 ? `<div style="font-size:13px;color:#27AE60;margin-bottom:8px;">💰 预估收入：¥${FS.formatMoney(idea.estimatedIncome)}</div>` : ''}
                ${idea.notes ? `<div style="font-size:12px;color:#666;line-height:1.5;margin-bottom:10px;">${idea.notes}</div>` : ''}
                <div style="display:flex;gap:8px;">
                    <button onclick="App.updateIdeaStatus('${idea.id}', 'researching')" style="flex:1;padding:6px;background:#3498DB22;color:#3498DB;border:none;border-radius:6px;font-size:11px;cursor:pointer;">🔍 调研</button>
                    <button onclick="App.updateIdeaStatus('${idea.id}', 'started')" style="flex:1;padding:6px;background:#F39C1222;color:#F39C12;border:none;border-radius:6px;font-size:11px;cursor:pointer;">🚀 启动</button>
                    <button onclick="App.updateIdeaStatus('${idea.id}', 'achieved')" style="flex:1;padding:6px;background:#27AE6022;color:#27AE60;border:none;border-radius:6px;font-size:11px;cursor:pointer;">✅ 完成</button>
                    <button onclick="App.removeIdea('${idea.id}')" style="padding:6px 10px;background:#E74C3C22;color:#E74C3C;border:none;border-radius:6px;font-size:11px;cursor:pointer;">🗑️</button>
                </div>
            </div>
        `;
    }).join('') || '<div style="text-align:center;color:#999;padding:40px;">暂无想法记录<br>点击下方按钮添加你的赚钱想法</div>';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'allIdeasModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <span class="modal-icon">💡</span>
                <h2>项目想法库</h2>
                <button class="modal-close-btn" onclick="document.getElementById('allIdeasModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:16px;max-height:500px;overflow-y:auto;background:#F8F9FA;">
                ${listHtml}
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-confirm" onclick="document.getElementById('allIdeasModal').remove(); App.showAddIdeaModal();">+ 添加新想法</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// 更新想法状态
App.updateIdeaStatus = function(ideaId, status) {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    FS.updateIdeaStatus(ideaId, status);
    
    // 刷新弹窗
    document.getElementById('allIdeasModal').remove();
    this.showAllIdeas();
};

// 删除想法
App.removeIdea = function(ideaId) {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    if (!confirm('确定要删除这个想法吗？')) return;
    
    FS.removeIdea(ideaId);
    
    // 刷新弹窗
    document.getElementById('allIdeasModal').remove();
    this.showAllIdeas();
};

// 显示所有收入记录
App.showAllIncomes = function() {
    const FS = typeof FinanceSystem !== 'undefined' ? FinanceSystem : null;
    if (!FS) return;
    
    const incomes = FS.incomes.slice(0, 50);
    
    const listHtml = incomes.map(inc => {
        const project = FS.projects.find(p => p.id === inc.project) || { name: '其他', icon: '📦' };
        const date = new Date(inc.date);
        const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #F0F0F0;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:20px;">${project.icon}</span>
                    <div>
                        <div style="font-size:13px;color:#2C3E50;">${inc.description || project.name}</div>
                        <div style="font-size:11px;color:#999;">${dateStr} · ${inc.hours}h</div>
                    </div>
                </div>
                <span style="font-size:15px;font-weight:600;color:#27AE60;">+¥${FS.formatMoney(inc.amount)}</span>
            </div>
        `;
    }).join('') || '<div style="text-align:center;color:#999;padding:40px;">暂无收入记录</div>';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'allIncomesModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <span class="modal-icon">📝</span>
                <h2>收入记录</h2>
                <button class="modal-close-btn" onclick="document.getElementById('allIncomesModal').remove()">×</button>
            </div>
            <div class="modal-body" style="padding:0;max-height:500px;overflow-y:auto;">
                ${listHtml}
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-confirm" onclick="document.getElementById('allIncomesModal').remove()">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// 显示监控设置模态框（统一的设置界面）
App.showMonitorSettingsModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'monitorSettingsModal';
    
    // 获取拖延监控和低效率监控的设置HTML（带回退）
    let procrastinationSettings = this.renderProcrastinationSettings();
    let inefficiencySettings = this.renderInefficiencySettings();
    
    // 如果模块不存在，显示回退内容
    if (!procrastinationSettings) {
        procrastinationSettings = this.renderProcrastinationSettingsFallback();
    }
    if (!inefficiencySettings) {
        inefficiencySettings = this.renderInefficiencySettingsFallback();
    }
    
    modal.innerHTML = `
        <div class="modal-content monitor-settings-modal">
            <div class="modal-header">
                <span class="modal-icon">⚙️</span>
                <h2>监控设置</h2>
                <button class="modal-close-btn" onclick="App.closeMonitorSettingsModal()">×</button>
            </div>
            <div class="modal-body monitor-settings-body">
                <div class="monitor-settings-tabs">
                    <button class="monitor-tab active" data-tab="procrastination" onclick="App.switchMonitorTab('procrastination')">
                        ⏰ 拖延监控
                    </button>
                    <button class="monitor-tab" data-tab="inefficiency" onclick="App.switchMonitorTab('inefficiency')">
                        📉 低效率监控
                    </button>
                </div>
                <div class="monitor-settings-content">
                    <div class="monitor-tab-content active" id="procrastinationSettings">
                        ${procrastinationSettings}
                    </div>
                    <div class="monitor-tab-content" id="inefficiencySettings">
                        ${inefficiencySettings}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-confirm" onclick="App.closeMonitorSettingsModal()">完成</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 阻止模态框内的滚动事件冒泡
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
    }
};

// 拖延监控设置回退版本
App.renderProcrastinationSettingsFallback = function() {
    // 从localStorage读取设置
    const savedSettings = localStorage.getItem('monitor_settings_v4');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
        enabled: true,
        gracePeriod: 120,
        preAlertTime: 20,
        baseCost: 5,
        costIncrement: 1.5,
        maxCost: 50,
        successReward: 3,
        soundEnabled: true
    };
    
    const soundEnabled = settings.soundEnabled !== false;
    const soundVolume = settings.soundVolume || 0.7;
    const volumePercent = Math.round(soundVolume * 100);
    
    return `
        <div class="settings-section">
            <div class="settings-title">🔊 声音提醒</div>
            <div class="settings-content">
                <div class="setting-row">
                    <span class="setting-label">声音提醒</span>
                    <span class="setting-value">${soundEnabled ? '🔊 已开启' : '🔇 已关闭'}</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">音量大小</span>
                    <span class="setting-value">${volumePercent}%</span>
                </div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-title">⚙️ 监控设置</div>
            <div class="settings-content">
                <div class="setting-row">
                    <span class="setting-label">启动宽限期</span>
                    <span class="setting-value">${settings.gracePeriod / 60} 分钟</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">预警提前时间</span>
                    <span class="setting-value">${settings.preAlertTime} 秒</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">成功奖励</span>
                    <span class="setting-value">🪙 ${settings.successReward} 金币</span>
                </div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-title">🪙 扣币规则</div>
            <div class="settings-content">
                <div class="setting-row">
                    <span class="setting-label">首次扣除</span>
                    <span class="setting-value">${settings.baseCost} 金币</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">递增比率</span>
                    <span class="setting-value">+${Math.round((settings.costIncrement - 1) * 100)}%/次</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">最高上限</span>
                    <span class="setting-value">${settings.maxCost} 金币</span>
                </div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-title">📊 功能说明</div>
            <div class="settings-content">
                <div style="padding:12px;background:rgba(102,126,234,0.05);border-radius:8px;font-size:13px;color:#666;line-height:1.6;">
                    <p style="margin:0 0 8px 0;">⏰ <strong>拖延监控</strong>帮助你按时开始任务：</p>
                    <ul style="margin:0;padding-left:20px;">
                        <li>任务时间到达时自动提醒</li>
                        <li>在宽限期内完成启动可获得金币奖励</li>
                        <li>超时未启动会扣除金币</li>
                        <li>支持声音和语音提醒</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
};

// 低效率监控设置回退版本
App.renderInefficiencySettingsFallback = function() {
    // 从localStorage读取设置
    const savedSettings = localStorage.getItem('inefficiency_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
        enabled: true,
        thresholdMinutes: 60,
        halfwayAlert: true,
        baseCost: 5,
        costIncrement: 1.5,
        maxCost: 30
    };
    
    return `
        <div class="settings-section">
            <div class="settings-title">⚙️ 效率设置</div>
            <div class="settings-content">
                <div class="setting-row">
                    <span class="setting-label">判定时长</span>
                    <span class="setting-value">${settings.thresholdMinutes} 分钟</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">半程提醒</span>
                    <span class="setting-value">${settings.halfwayAlert ? '✅ 开启' : '❌ 关闭'}</span>
                </div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-title">🪙 金币规则</div>
            <div class="settings-content">
                <div class="setting-row">
                    <span class="setting-label">首次解除</span>
                    <span class="setting-value">${settings.baseCost} 金币</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">递增比率</span>
                    <span class="setting-value">+${Math.round((settings.costIncrement - 1) * 100)}%/次</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">最高上限</span>
                    <span class="setting-value">${settings.maxCost} 金币</span>
                </div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-title">📈 效率分析</div>
            <div class="settings-content">
                <div class="setting-row">
                    <span class="setting-label">本周卡顿</span>
                    <span class="setting-value" style="color:#E74C3C;">0 次</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">正常完成</span>
                    <span class="setting-value" style="color:#27AE60;">0 次</span>
                </div>
                <div class="setting-row">
                    <span class="setting-label">累计扣币</span>
                    <span class="setting-value" style="color:#F39C12;">🪙 0</span>
                </div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-title">📊 功能说明</div>
            <div class="settings-content">
                <div style="padding:12px;background:rgba(102,126,234,0.05);border-radius:8px;font-size:13px;color:#666;line-height:1.6;">
                    <p style="margin:0 0 8px 0;">📉 <strong>低效率监控</strong>帮助你避免在单个任务上花费过多时间：</p>
                    <ul style="margin:0;padding-left:20px;">
                        <li>当任务执行时间超过设定阈值时提醒</li>
                        <li>半程提醒帮助你检查进度</li>
                        <li>分析常见卡顿点和高效时间段</li>
                        <li>帮助识别需要拆分的复杂任务</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
};

// 关闭监控设置模态框
App.closeMonitorSettingsModal = function() {
    const modal = document.getElementById('monitorSettingsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
    // 刷新监控面板显示
    this.loadMonitorPanel();
};

// 切换监控设置标签
App.switchMonitorTab = function(tabName) {
    // 更新标签按钮状态
    const tabs = document.querySelectorAll('.monitor-tab');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // 更新内容显示
    const contents = document.querySelectorAll('.monitor-tab-content');
    contents.forEach(content => {
        if (content.id === tabName + 'Settings') {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
};

// ==================== 辅助方法（供智能对话使用） ====================

// 获取今日任务列表
App.getTodayTasks = function() {
    const today = this.formatDate(new Date());
    const allTasks = Storage.getTasks();
    return allTasks.filter(task => task.date === today);
};

// 获取明天任务列表
App.getTomorrowTasks = function() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = this.formatDate(tomorrow);
    const allTasks = Storage.getTasks();
    return allTasks.filter(task => task.date === tomorrowStr);
};

// 获取本周任务列表
App.getThisWeekTasks = function() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 周日
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 周六
    
    const allTasks = Storage.getTasks();
    return allTasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
    });
};

// 获取今日进度
App.getTodayProgress = function() {
    const tasks = this.getTodayTasks();
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const coins = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.coins || 0), 0);
    
    return {
        completed,
        total,
        percentage,
        coins
    };
};

// 添加任务到时间轴
App.addTaskToTimeline = function(task) {
    // 确保任务有必要的字段
    if (!task.date) {
        task.date = this.formatDate(new Date());
    }
    if (!task.id) {
        task.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
    
    Storage.addTask(task);
    this.loadTimeline();
    
    return task;
};

// 删除今天的任务
App.deleteTodayTasks = function() {
    const today = this.formatDate(new Date());
    const allTasks = Storage.getTasks();
    const tasksToKeep = allTasks.filter(task => task.date !== today);
    const deletedCount = allTasks.length - tasksToKeep.length;
    
    localStorage.setItem('tasks', JSON.stringify(tasksToKeep));
    this.loadTimeline();
    
    return deletedCount;
};

// 删除明天的任务
App.deleteTomorrowTasks = function() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = this.formatDate(tomorrow);
    
    const allTasks = Storage.getTasks();
    const tasksToKeep = allTasks.filter(task => task.date !== tomorrowStr);
    const deletedCount = allTasks.length - tasksToKeep.length;
    
    localStorage.setItem('tasks', JSON.stringify(tasksToKeep));
    this.loadTimeline();
    
    return deletedCount;
};

// 删除今天和明天的任务
App.deleteTodayAndTomorrowTasks = function() {
    const today = this.formatDate(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = this.formatDate(tomorrow);
    
    const allTasks = Storage.getTasks();
    const todayCount = allTasks.filter(task => task.date === today).length;
    const tomorrowCount = allTasks.filter(task => task.date === tomorrowStr).length;
    const tasksToKeep = allTasks.filter(task => task.date !== today && task.date !== tomorrowStr);
    
    localStorage.setItem('tasks', JSON.stringify(tasksToKeep));
    this.loadTimeline();
    
    return {
        today: todayCount,
        tomorrow: tomorrowCount,
        total: todayCount + tomorrowCount
    };
};

// 删除本周的任务
App.deleteThisWeekTasks = function() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const allTasks = Storage.getTasks();
    const tasksToKeep = allTasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate < startOfWeek || taskDate > endOfWeek;
    });
    const deletedCount = allTasks.length - tasksToKeep.length;
    
    localStorage.setItem('tasks', JSON.stringify(tasksToKeep));
    this.loadTimeline();
    
    return deletedCount;
};

// 删除未完成的任务
App.deleteIncompleteTasks = function() {
    const allTasks = Storage.getTasks();
    const tasksToKeep = allTasks.filter(task => task.completed);
    const deletedCount = allTasks.length - tasksToKeep.length;
    
    localStorage.setItem('tasks', JSON.stringify(tasksToKeep));
    this.loadTimeline();
    
    return deletedCount;
};

// 删除已完成的任务
App.deleteCompletedTasks = function() {
    const allTasks = Storage.getTasks();
    const tasksToKeep = allTasks.filter(task => !task.completed);
    const deletedCount = allTasks.length - tasksToKeep.length;
    
    localStorage.setItem('tasks', JSON.stringify(tasksToKeep));
    this.loadTimeline();
    
    return deletedCount;
};

// 根据关键词删除任务
App.deleteTasksByKeyword = function(keyword) {
    const allTasks = Storage.getTasks();
    const tasksToKeep = allTasks.filter(task => !task.title.toLowerCase().includes(keyword.toLowerCase()));
    const deletedCount = allTasks.length - tasksToKeep.length;
    
    localStorage.setItem('tasks', JSON.stringify(tasksToKeep));
    this.loadTimeline();
    
    return deletedCount;
};

// 搜索任务
App.searchTasks = function(keyword) {
    const allTasks = Storage.getTasks();
    return allTasks.filter(task => 
        task.title.toLowerCase().includes(keyword.toLowerCase())
    );
};

// 完成所有今天的任务
App.completeAllTodayTasks = function() {
    const today = this.formatDate(new Date());
    const allTasks = Storage.getTasks();
    let count = 0;
    
    allTasks.forEach(task => {
        if (task.date === today && !task.completed) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
            count++;
            
            // 记录习惯
            this.recordTaskHabit(task.title);
        }
    });
    
    localStorage.setItem('tasks', JSON.stringify(allTasks));
    this.loadTimeline();
    
    return count;
};

// 取消完成所有今天的任务
App.uncompleteAllTodayTasks = function() {
    const today = this.formatDate(new Date());
    const allTasks = Storage.getTasks();
    let count = 0;
    
    allTasks.forEach(task => {
        if (task.date === today && task.completed) {
            task.completed = false;
            delete task.completedAt;
            count++;
        }
    });
    
    localStorage.setItem('tasks', JSON.stringify(allTasks));
    this.loadTimeline();
    
    return count;
};

// 记录任务完成习惯
App.recordTaskHabit = function(taskTitle) {
    if (typeof BrainDump !== 'undefined' && BrainDump.recordTaskHabit) {
        BrainDump.recordTaskHabit(taskTitle);
    }
};

// 查看习惯统计
App.getHabitStats = function() {
    if (typeof BrainDump !== 'undefined' && BrainDump.loadHabits) {
        const habits = BrainDump.loadHabits();
        
        // 统计最常做的任务
        const taskFrequency = {};
        habits.forEach(h => {
            const key = h.task.toLowerCase();
            taskFrequency[key] = (taskFrequency[key] || 0) + 1;
        });
        
        // 排序
        const topTasks = Object.entries(taskFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        // 统计每个时间段的活跃度
        const hourActivity = new Array(24).fill(0);
        habits.forEach(h => {
            hourActivity[h.hour]++;
        });
        
        return {
            totalRecords: habits.length,
            topTasks: topTasks,
            hourActivity: hourActivity,
            mostActiveHour: hourActivity.indexOf(Math.max(...hourActivity))
        };
    }
    return null;
};

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", function() {
    App.init();
});







// Override showEnergyMenu to add overlay and close button
App.showEnergyMenu = function(event) {
    event.stopPropagation();
    this.closeAllMenus();
    
    const state = Storage.getGameState();
    
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "energy-menu-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:9998;";
    overlay.onclick = function() { App.closeAllMenus(); };
    document.body.appendChild(overlay);
    
    const menu = document.createElement("div");
    menu.className = "energy-menu";
    menu.id = "energyMenu";
    menu.style.zIndex = "9999";
    menu.innerHTML = 
        '<div class="energy-menu-header" style="position:relative;">' +
            '<span class="energy-menu-title">Energy Management</span>' +
            '<button class="energy-menu-close" onclick="App.closeAllMenus()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.2);border:none;color:white;width:28px;height:28px;border-radius:50%;font-size:18px;cursor:pointer;">x</button>' +
        '</div>' +
        '<div class="energy-menu-current-display" style="padding:12px 16px;background:rgba(52,152,219,0.05);">' +
            '<span style="font-size:12px;color:#888;display:block;margin-bottom:6px;">Current Energy</span>' +
            '<div style="height:8px;background:#E0E0E0;border-radius:4px;overflow:hidden;margin-bottom:4px;">' +
                '<div style="height:100%;background:linear-gradient(90deg,#3498DB,#2ECC71);border-radius:4px;width:' + (state.energy / state.maxEnergy * 100) + '%;"></div>' +
            '</div>' +
            '<span style="font-size:13px;font-weight:600;color:#3498DB;">' + state.energy + '/' + state.maxEnergy + '</span>' +
        '</div>' +
        '<div class="energy-menu-desc">Select activity to restore energy:</div>' +
        '<div class="energy-menu-item" onclick="App.restoreEnergy(\'medicine\', 8)">' +
            '<span class="menu-icon">馃拪</span>' +
            '<span class="menu-text">Take Medicine</span>' +
            '<span class="menu-effect">+8 鈿?/span>' +
        '</div>' +
        '<div class="energy-menu-item" onclick="App.restoreEnergy(\'toilet\', 3)">' +
            '<span class="menu-icon">馃毥</span>' +
            '<span class="menu-text">Bathroom</span>' +
            '<span class="menu-effect">+3 鈿?/span>' +
        '</div>' +
        '<div class="energy-menu-item" onclick="App.restoreEnergy(\'eat\', 5)">' +
            '<span class="menu-icon">馃嵔锔?/span>' +
            '<span class="menu-text">Eat</span>' +
            '<span class="menu-effect">+5 鈿?/span>' +
        '</div>' +
        '<div class="energy-menu-item" onclick="App.restoreEnergy(\'drink\', 2)">' +
            '<span class="menu-icon">馃イ</span>' +
            '<span class="menu-text">Drink Water</span>' +
            '<span class="menu-effect">+2 鈿?/span>' +
        '</div>' +
        '<div class="energy-menu-item" onclick="App.restoreEnergy(\'rest\', 4)">' +
            '<span class="menu-icon">馃槾</span>' +
            '<span class="menu-text">Rest</span>' +
            '<span class="menu-effect">+4 鈿?/span>' +
        '</div>' +
        '<div class="energy-menu-item" onclick="App.restoreEnergy(\'walk\', 3)">' +
            '<span class="menu-icon">馃毝</span>' +
            '<span class="menu-text">Walk</span>' +
            '<span class="menu-effect">+3 鈿?/span>' +
        '</div>' +
        '<div class="energy-menu-footer">' +
            '<button class="energy-edit-btn" onclick="App.showEnergySettings()">鈿欙笍 Settings</button>' +
        '</div>';
    
    // Position menu - center on mobile, near button on desktop
    if (window.innerWidth <= 768) {
        menu.style.position = 'fixed';
        menu.style.top = '50%';
        menu.style.left = '50%';
        menu.style.transform = 'translate(-50%, -50%)';
        menu.style.right = 'auto';
        menu.style.maxWidth = '90vw';
    } else {
        const rect = event.target.closest('.header-stat').getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
    }
    
    document.body.appendChild(menu);
};
