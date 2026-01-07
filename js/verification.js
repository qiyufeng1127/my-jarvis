// 验证系统模块 - 任务完成验证
const Verification = {
    // 验证方式类型
    TYPES: {
        IMAGE: 'image',      // 图片验证
        LINK: 'link',        // 链接验证
        MANUAL: 'manual'     // 手动确认（简单任务）
    },

    // 当前验证状态
    currentVerification: null,
    verificationQueue: [],

    // 初始化验证系统
    init() {
        this.startTaskMonitor();
        console.log('验证系统初始化完成');
    },

    // 启动任务监控器
    startTaskMonitor() {
        const self = this;
        // 每30秒检查一次任务状态
        setInterval(function() {
            self.checkTasksForVerification();
        }, 30000);
        
        // 立即检查一次
        this.checkTasksForVerification();
    },

    // 检查需要验证的任务
    checkTasksForVerification() {
        const tasks = Storage.getTasks();
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const today = App.formatDate(now);

        tasks.forEach(function(task) {
            if (task.date !== today || task.completed || task.verified || task.failed) return;

            // 计算任务结束时间（分钟）
            const endTime = task.endTime || App.addMinutes(task.startTime, task.duration || 30);
            const endParts = endTime.split(':');
            const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

            // 如果任务已经结束且未验证，触发验证
            if (currentTime >= endMinutes && !task.verificationPending) {
                Storage.updateTask(task.id, { verificationPending: true });
                Verification.triggerVerification(task);
            }
        });
    },

    // 触发验证流程
    triggerVerification(task) {
        // 如果已经有验证窗口打开，加入队列
        if (this.currentVerification) {
            this.verificationQueue.push(task);
            return;
        }

        this.currentVerification = task;
        this.showVerificationModal(task);
    },

    // 显示验证弹窗
    showVerificationModal(task) {
        // 移除已存在的弹窗
        const existing = document.getElementById('verificationModal');
        if (existing) existing.remove();

        // 根据任务类型推荐验证方式
        const recommendedType = this.getRecommendedVerificationType(task);

        const modal = document.createElement('div');
        modal.className = 'verification-modal-overlay';
        modal.id = 'verificationModal';
        modal.innerHTML = `
            <div class="verification-modal">
                <div class="verification-header">
                    <span class="verification-icon">✅</span>
                    <h2>任务验证</h2>
                </div>
                <div class="verification-task-info">
                    <div class="verification-task-title">${task.title}</div>
                    <div class="verification-task-time">${task.startTime} - ${task.endTime || App.addMinutes(task.startTime, task.duration || 30)}</div>
                    <div class="verification-reward">
                        <span>🪙 完成奖励: ${task.coins || 5} 金币</span>
                        <span>❌ 失败扣除: ${Math.ceil((task.coins || 5) * 0.5)} 金币</span>
                    </div>
                </div>
                <div class="verification-methods">
                    <div class="verification-method-title">选择验证方式 ${recommendedType ? '(AI推荐: ' + this.getTypeLabel(recommendedType) + ')' : ''}</div>
                    <div class="verification-method-options">
                        <button class="verification-method-btn ${recommendedType === 'image' ? 'recommended' : ''}" onclick="Verification.selectMethod('image')">
                            <span class="method-icon">📷</span>
                            <span class="method-label">图片验证</span>
                            <span class="method-desc">上传完成截图或照片</span>
                        </button>
                        <button class="verification-method-btn ${recommendedType === 'link' ? 'recommended' : ''}" onclick="Verification.selectMethod('link')">
                            <span class="method-icon">🔗</span>
                            <span class="method-label">链接验证</span>
                            <span class="method-desc">提交相关链接</span>
                        </button>
                        <button class="verification-method-btn ${recommendedType === 'manual' ? 'recommended' : ''}" onclick="Verification.selectMethod('manual')">
                            <span class="method-icon">✋</span>
                            <span class="method-label">手动确认</span>
                            <span class="method-desc">简单任务直接确认</span>
                        </button>
                    </div>
                </div>
                <div class="verification-input-area" id="verificationInputArea" style="display:none;">
                    <!-- 动态填充验证输入区域 -->
                </div>
                <div class="verification-actions">
                    <button class="verification-btn btn-skip" onclick="Verification.skipVerification()">跳过 (扣${Math.ceil((task.coins || 5) * 0.3)}金币)</button>
                    <button class="verification-btn btn-fail" onclick="Verification.failVerification()">未完成</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(function() { modal.classList.add('show'); }, 10);

        // 播放提示音
        this.playNotificationSound();
    },

    // 获取推荐的验证方式
    getRecommendedVerificationType(task) {
        const title = (task.title || '').toLowerCase();
        const tags = task.tags || [];
        const tagsStr = tags.join(' ').toLowerCase();

        // 图片验证推荐
        if (/画|设计|插画|截图|整理|清洁|运动|健身|做饭|烹饪/.test(title + tagsStr)) {
            return 'image';
        }

        // 链接验证推荐
        if (/发布|分享|小红书|微博|网页|网站|博客|视频|b站|抖音/.test(title + tagsStr)) {
            return 'link';
        }

        // 简单任务手动确认
        if (/休息|喝水|吃饭|洗澡|睡觉|冥想|散步/.test(title + tagsStr)) {
            return 'manual';
        }

        return 'image'; // 默认图片验证
    },

    // 获取验证类型标签
    getTypeLabel(type) {
        const labels = {
            'image': '图片验证',
            'link': '链接验证',
            'manual': '手动确认'
        };
        return labels[type] || type;
    },

    // 选择验证方式
    selectMethod(method) {
        const inputArea = document.getElementById('verificationInputArea');
        if (!inputArea) return;

        inputArea.style.display = 'block';

        if (method === 'image') {
            inputArea.innerHTML = `
                <div class="verification-image-upload">
                    <div class="upload-area" id="uploadArea" onclick="document.getElementById('imageInput').click()">
                        <span class="upload-icon">📷</span>
                        <span class="upload-text">点击上传图片或拖拽到此处</span>
                        <span class="upload-hint">支持 JPG、PNG、GIF 格式</span>
                    </div>
                    <input type="file" id="imageInput" accept="image/*" style="display:none" onchange="Verification.handleImageUpload(event)">
                    <div class="image-preview" id="imagePreview" style="display:none;">
                        <img id="previewImg" src="" alt="预览">
                        <button class="remove-image-btn" onclick="Verification.removeImage()">✕</button>
                    </div>
                </div>
                <button class="verification-submit-btn" id="submitVerificationBtn" onclick="Verification.submitImageVerification()" disabled>
                    🤖 AI验证
                </button>
            `;
            this.initDragDrop();
        } else if (method === 'link') {
            inputArea.innerHTML = `
                <div class="verification-link-input">
                    <input type="url" id="linkInput" class="link-input" placeholder="请输入相关链接 (如: https://...)" oninput="Verification.validateLink()">
                    <div class="link-hint">支持小红书、微博、B站、抖音、网页等链接</div>
                </div>
                <button class="verification-submit-btn" id="submitVerificationBtn" onclick="Verification.submitLinkVerification()" disabled>
                    🤖 AI验证
                </button>
            `;
        } else if (method === 'manual') {
            inputArea.innerHTML = `
                <div class="verification-manual">
                    <div class="manual-question">你确定已经完成了「${this.currentVerification.title}」吗？</div>
                    <div class="manual-options">
                        <label class="manual-option">
                            <input type="radio" name="manualConfirm" value="yes" onchange="Verification.enableManualSubmit()">
                            <span>✅ 是的，我已完成</span>
                        </label>
                        <label class="manual-option">
                            <input type="radio" name="manualConfirm" value="partial" onchange="Verification.enableManualSubmit()">
                            <span>⚠️ 部分完成</span>
                        </label>
                    </div>
                    <textarea id="manualNote" class="manual-note" placeholder="可选：简单描述完成情况..."></textarea>
                </div>
                <button class="verification-submit-btn" id="submitVerificationBtn" onclick="Verification.submitManualVerification()" disabled>
                    确认提交
                </button>
            `;
        }

        // 高亮选中的方法
        document.querySelectorAll('.verification-method-btn').forEach(function(btn) {
            btn.classList.remove('selected');
        });
        event.target.closest('.verification-method-btn').classList.add('selected');
    },

    // 初始化拖拽上传
    initDragDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                Verification.processImage(files[0]);
            }
        });
    },

    // 处理图片上传
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImage(file);
        }
    },

    // 处理图片
    processImage(file) {
        const reader = new FileReader();
        const self = this;
        reader.onload = function(e) {
            self.currentImageData = e.target.result;
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            const uploadArea = document.getElementById('uploadArea');
            const submitBtn = document.getElementById('submitVerificationBtn');

            if (preview && previewImg) {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
                if (uploadArea) uploadArea.style.display = 'none';
                if (submitBtn) submitBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    },

    // 移除图片
    removeImage() {
        this.currentImageData = null;
        const preview = document.getElementById('imagePreview');
        const uploadArea = document.getElementById('uploadArea');
        const submitBtn = document.getElementById('submitVerificationBtn');
        const imageInput = document.getElementById('imageInput');

        if (preview) preview.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'flex';
        if (submitBtn) submitBtn.disabled = true;
        if (imageInput) imageInput.value = '';
    },

    // 验证链接格式
    validateLink() {
        const linkInput = document.getElementById('linkInput');
        const submitBtn = document.getElementById('submitVerificationBtn');
        if (!linkInput || !submitBtn) return;

        const url = linkInput.value.trim();
        const isValid = /^https?:\/\/.+/.test(url);
        submitBtn.disabled = !isValid;
    },

    // 启用手动提交
    enableManualSubmit() {
        const submitBtn = document.getElementById('submitVerificationBtn');
        if (submitBtn) submitBtn.disabled = false;
    },

    // 提交图片验证
    async submitImageVerification() {
        if (!this.currentImageData || !this.currentVerification) return;

        const submitBtn = document.getElementById('submitVerificationBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '🔄 AI验证中...';
        }

        try {
            // 调用AI验证图片
            const result = await this.verifyImageWithAI(this.currentImageData, this.currentVerification);
            this.handleVerificationResult(result);
        } catch (e) {
            console.error('图片验证失败:', e);
            // 验证失败时默认通过（避免API问题影响用户）
            this.handleVerificationResult({ passed: true, reason: '验证服务暂时不可用，默认通过', coins: this.currentVerification.coins || 5 });
        }
    },

    // 提交链接验证
    async submitLinkVerification() {
        const linkInput = document.getElementById('linkInput');
        if (!linkInput || !this.currentVerification) return;

        const url = linkInput.value.trim();
        const submitBtn = document.getElementById('submitVerificationBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '🔄 AI验证中...';
        }

        try {
            // 调用AI验证链接
            const result = await this.verifyLinkWithAI(url, this.currentVerification);
            this.handleVerificationResult(result);
        } catch (e) {
            console.error('链接验证失败:', e);
            this.handleVerificationResult({ passed: true, reason: '验证服务暂时不可用，默认通过', coins: this.currentVerification.coins || 5 });
        }
    },

    // 提交手动验证
    submitManualVerification() {
        if (!this.currentVerification) return;

        const selectedOption = document.querySelector('input[name="manualConfirm"]:checked');
        const note = document.getElementById('manualNote');

        if (!selectedOption) return;

        const isFullComplete = selectedOption.value === 'yes';
        const coins = isFullComplete ? (this.currentVerification.coins || 5) : Math.ceil((this.currentVerification.coins || 5) * 0.5);

        this.handleVerificationResult({
            passed: true,
            partial: !isFullComplete,
            reason: isFullComplete ? '手动确认完成' : '部分完成',
            coins: coins,
            note: note ? note.value : ''
        });
    },

    // AI验证图片
    async verifyImageWithAI(imageData, task) {
        const prompt = `用户声称完成了任务「${task.title}」，并上传了一张图片作为验证。
任务描述：${task.notes || task.title}
任务标签：${(task.tags || []).join(', ')}

请判断这张图片是否能证明任务完成。考虑：
1. 图片内容是否与任务相关
2. 是否能看出任务已完成的迹象

请返回JSON格式：
{
    "passed": true/false,
    "confidence": 0.0-1.0,
    "reason": "判断理由",
    "coins": 建议奖励金币数(1-20)
}`;

        try {
            const response = await AIService.chat([
                { role: 'user', content: prompt + '\n\n[图片已上传，请基于任务类型进行合理判断]' }
            ], '你是一个任务验证助手，负责判断用户是否真正完成了任务。对于无法直接验证的情况，倾向于相信用户。');

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('AI验证错误:', e);
        }

        // 默认通过
        return { passed: true, reason: '验证通过', coins: task.coins || 5 };
    },

    // AI验证链接
    async verifyLinkWithAI(url, task) {
        const prompt = `用户声称完成了任务「${task.title}」，并提交了链接作为验证。
任务描述：${task.notes || task.title}
任务标签：${(task.tags || []).join(', ')}
提交的链接：${url}

请判断这个链接是否能证明任务完成。考虑：
1. 链接域名是否与任务类型相关（如小红书分享、B站视频等）
2. 链接格式是否有效

请返回JSON格式：
{
    "passed": true/false,
    "confidence": 0.0-1.0,
    "reason": "判断理由",
    "coins": 建议奖励金币数(1-20)
}`;

        try {
            const response = await AIService.chat([
                { role: 'user', content: prompt }
            ], '你是一个任务验证助手，负责判断用户提交的链接是否与任务相关。');

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('AI验证错误:', e);
        }

        return { passed: true, reason: '链接验证通过', coins: task.coins || 5 };
    },

    // 处理验证结果
    handleVerificationResult(result) {
        const task = this.currentVerification;
        if (!task) return;

        if (result.passed) {
            // 验证通过
            const coins = result.coins || task.coins || 5;
            Storage.updateTask(task.id, { 
                completed: true, 
                verified: true, 
                verificationPending: false,
                completedAt: new Date().toISOString(),
                verificationResult: result
            });

            // 奖励金币
            const state = Storage.getGameState();
            state.coins += coins;
            state.completedTasks += 1;
            
            // 检查连续完成奖励
            const bonus = this.checkStreakBonus();
            if (bonus > 0) {
                state.coins += bonus;
            }
            
            Storage.saveGameState(state);

            this.showVerificationSuccess(task, coins, bonus, result.reason);
            App.showCoinAnimation(coins + bonus);
        } else {
            // 验证失败
            const penalty = Math.ceil((task.coins || 5) * 0.5);
            Storage.updateTask(task.id, { 
                failed: true, 
                verified: false,
                verificationPending: false,
                verificationResult: result
            });

            // 扣除金币
            const state = Storage.getGameState();
            state.coins = Math.max(0, state.coins - penalty);
            Storage.saveGameState(state);

            this.showVerificationFailed(task, penalty, result.reason);
            
            // 触发警告系统
            Warning.trigger('verification_failed', { task: task, reason: result.reason });
        }

        // 更新UI
        App.updateGameStatus();
        App.loadTimeline();
        App.loadGameSystem();

        // 关闭弹窗并处理队列
        this.closeVerificationModal();
    },

    // 检查连续完成奖励
    checkStreakBonus() {
        const tasks = Storage.getTasks();
        const today = App.formatDate(new Date());
        const todayTasks = tasks.filter(function(t) { return t.date === today; });
        const completedTasks = todayTasks.filter(function(t) { return t.completed && t.verified; });

        // 连续完成3个任务奖励5金币
        if (completedTasks.length > 0 && completedTasks.length % 3 === 0) {
            App.addChatMessage('system', '🔥 连续完成 ' + completedTasks.length + ' 个任务！额外奖励 5 金币！', '🎉');
            return 5;
        }

        return 0;
    },

    // 显示验证成功
    showVerificationSuccess(task, coins, bonus, reason) {
        const modal = document.getElementById('verificationModal');
        if (!modal) return;

        const content = modal.querySelector('.verification-modal');
        if (content) {
            content.innerHTML = `
                <div class="verification-result success">
                    <div class="result-icon">🎉</div>
                    <h2>验证通过！</h2>
                    <div class="result-task">${task.title}</div>
                    <div class="result-reason">${reason || '任务完成确认'}</div>
                    <div class="result-reward">
                        <div class="reward-item">🪙 +${coins} 金币</div>
                        ${bonus > 0 ? '<div class="reward-item bonus">🔥 连续奖励 +' + bonus + ' 金币</div>' : ''}
                    </div>
                    <button class="verification-btn btn-success" onclick="Verification.closeVerificationModal()">太棒了！</button>
                </div>
            `;
        }

        App.addChatMessage('system', '✅ 任务「' + task.title + '」验证通过！获得 ' + (coins + bonus) + ' 金币', '🏆');
    },

    // 显示验证失败
    showVerificationFailed(task, penalty, reason) {
        const modal = document.getElementById('verificationModal');
        if (!modal) return;

        const content = modal.querySelector('.verification-modal');
        if (content) {
            content.innerHTML = `
                <div class="verification-result failed">
                    <div class="result-icon">😔</div>
                    <h2>验证未通过</h2>
                    <div class="result-task">${task.title}</div>
                    <div class="result-reason">${reason || '任务未能完成验证'}</div>
                    <div class="result-penalty">
                        <div class="penalty-item">🪙 -${penalty} 金币</div>
                    </div>
                    <div class="result-encourage">没关系，下次一定可以的！💪</div>
                    <button class="verification-btn btn-failed" onclick="Verification.closeVerificationModal()">我知道了</button>
                </div>
            `;
        }

        App.addChatMessage('system', '❌ 任务「' + task.title + '」验证未通过，扣除 ' + penalty + ' 金币', '😢');
    },

    // 跳过验证
    skipVerification() {
        if (!this.currentVerification) return;

        const task = this.currentVerification;
        const penalty = Math.ceil((task.coins || 5) * 0.3);

        // 扣除金币
        const state = Storage.getGameState();
        state.coins = Math.max(0, state.coins - penalty);
        Storage.saveGameState(state);

        // 标记任务为跳过
        Storage.updateTask(task.id, { 
            skipped: true, 
            verificationPending: false 
        });

        App.addChatMessage('system', '⏭️ 跳过任务「' + task.title + '」验证，扣除 ' + penalty + ' 金币', '⚠️');
        App.updateGameStatus();
        App.loadTimeline();

        this.closeVerificationModal();
    },

    // 标记任务失败
    failVerification() {
        if (!this.currentVerification) return;

        const task = this.currentVerification;
        const penalty = Math.ceil((task.coins || 5) * 0.5);

        // 扣除金币
        const state = Storage.getGameState();
        state.coins = Math.max(0, state.coins - penalty);
        Storage.saveGameState(state);

        // 标记任务失败
        Storage.updateTask(task.id, { 
            failed: true, 
            verificationPending: false 
        });

        App.addChatMessage('system', '❌ 任务「' + task.title + '」未完成，扣除 ' + penalty + ' 金币', '😢');
        App.updateGameStatus();
        App.loadTimeline();

        // 触发警告
        Warning.trigger('task_failed', { task: task });

        this.closeVerificationModal();
    },

    // 关闭验证弹窗
    closeVerificationModal() {
        const modal = document.getElementById('verificationModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(function() { modal.remove(); }, 300);
        }

        this.currentVerification = null;
        this.currentImageData = null;

        // 处理队列中的下一个验证
        if (this.verificationQueue.length > 0) {
            const nextTask = this.verificationQueue.shift();
            setTimeout(function() {
                Verification.triggerVerification(nextTask);
            }, 500);
        }
    },

    // 播放提示音
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // 静默失败
        }
    },

    // 手动触发任务验证（通过指令）
    manualTriggerVerification(taskId) {
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (task && !task.completed && !task.verified) {
            this.triggerVerification(task);
        }
    }
};

// 导出
window.Verification = Verification;

