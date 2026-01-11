// AI副驾驶模块 - 从"工具"到"主动服务"
const AICopilot = {
    // 用户画像
    userProfile: {
        name: '主人',
        workTypes: [],           // 工作类型：摄影、插画、运营等
        workHours: {             // 工作时段
            morning: false,
            afternoon: true,
            evening: false
        },
        peakHours: [],           // 高效时间段
        incomeStreams: [],       // 收入来源
        challenges: [],          // 效率挑战
        housework: [],           // 家务列表
        ideas: [],               // 新想法
        initialized: false,
        lastWeeklySetup: null
    },
    
    // 上下文记忆
    context: {
        recentTasks: [],         // 最近提到的任务
        recentProjects: [],      // 最近的项目
        conversationHistory: [], // 对话历史
        todayMood: null,         // 今日心情
        lastInteraction: null    // 上次交互时间
    },
    
    // AI秘书名字
    secretaryName: 'KiiKii',
    
    // 初始化
    init() {
        // 加载用户画像
        const savedProfile = Storage.load('adhd_user_profile', null);
        if (savedProfile) {
            Object.assign(this.userProfile, savedProfile);
        }
        
        // 加载上下文
        const savedContext = Storage.load('adhd_ai_context', null);
        if (savedContext) {
            Object.assign(this.context, savedContext);
        }
        
        // 检查是否需要每周设置
        this.checkWeeklySetup();
        
        // 启动主动服务
        this.startProactiveService();
    },
    
    // 检查是否需要每周设置
    checkWeeklySetup() {
        // 禁用每周设置弹窗，用户可以通过对话自行设置
        // 直接显示每日问候
        setTimeout(() => this.showDailyGreeting(), 1000);
        
        /* 原有逻辑已禁用
        const now = new Date();
        const dayOfWeek = now.getDay();
        const lastSetup = this.userProfile.lastWeeklySetup ? 
            new Date(this.userProfile.lastWeeklySetup) : null;
        
        // 周一且本周还没设置过
        const isMonday = dayOfWeek === 1;
        const needsSetup = !lastSetup || 
            (now - lastSetup) > 6 * 24 * 60 * 60 * 1000;
        
        if ((isMonday && needsSetup) || !this.userProfile.initialized) {
            setTimeout(() => this.showWeeklySetupModal(), 1500);
        } else {
            // 显示每日问候
            setTimeout(() => this.showDailyGreeting(), 1000);
        }
        */
    },
    
    // 显示每周设置弹窗
    showWeeklySetupModal() {
        const modal = document.createElement('div');
        modal.className = 'ai-copilot-modal';
        modal.id = 'weeklySetupModal';
        
        const isFirstTime = !this.userProfile.initialized;
        const greeting = isFirstTime ? 
            '你好呀！我是你的专属AI秘书 ' + this.secretaryName + ' 🎀' :
            '主人，新的一周开始啦！让我们一起赚钱吧~ 💰';
        
        modal.innerHTML = 
            '<div class="copilot-modal-content weekly-setup">' +
                '<div class="setup-header">' +
                    '<div class="secretary-avatar">🤖</div>' +
                    '<div class="secretary-greeting">' +
                        '<h2>' + greeting + '</h2>' +
                        '<p>' + (isFirstTime ? '先让我了解一下你吧~' : '告诉我这周的计划~') + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="setup-questions">' +
                    '<div class="setup-question">' +
                        '<label>1️⃣ 这一周的主要工作是？</label>' +
                        '<input type="text" id="setupWorkTypes" placeholder="如：拍照、画插画、写文案" value="' + (this.userProfile.workTypes.join('、') || '') + '" inputmode="text">' +
                    '</div>' +
                    '<div class="setup-question">' +
                        '<label>2️⃣ 习惯什么时候工作？</label>' +
                        '<div class="time-options">' +
                            '<label class="time-option"><input type="checkbox" id="setupMorning" ' + (this.userProfile.workHours.morning ? 'checked' : '') + '> 🌅 上午</label>' +
                            '<label class="time-option"><input type="checkbox" id="setupAfternoon" ' + (this.userProfile.workHours.afternoon ? 'checked' : '') + '> ☀️ 下午</label>' +
                            '<label class="time-option"><input type="checkbox" id="setupEvening" ' + (this.userProfile.workHours.evening ? 'checked' : '') + '> 🌙 晚上</label>' +
                        '</div>' +
                    '</div>' +
                    '<div class="setup-question">' +
                        '<label>3️⃣ 主要收入来源有哪些？</label>' +
                        '<input type="text" id="setupIncomeStreams" placeholder="如：摄影工作室、插画约稿、小红书" value="' + (this.userProfile.incomeStreams.join('、') || '') + '" inputmode="text">' +
                    '</div>' +
                    '<div class="setup-question">' +
                        '<label>4️⃣ 最大的效率挑战是什么？</label>' +
                        '<input type="text" id="setupChallenges" placeholder="如：容易分心、难以开始、完美主义" value="' + (this.userProfile.challenges.join('、') || '') + '" inputmode="text">' +
                    '</div>' +
                    '<div class="setup-question">' +
                        '<label>5️⃣ 最近有什么新想法吗？</label>' +
                        '<input type="text" id="setupIdeas" placeholder="如：想学新技能、想开拓新业务" inputmode="text">' +
                    '</div>' +
                    '<div class="setup-question">' +
                        '<label>6️⃣ 这一周的家务有哪些？</label>' +
                        '<input type="text" id="setupHousework" placeholder="如：打扫卫生、洗衣服、买菜" inputmode="text">' +
                    '</div>' +
                '</div>' +
                '<div class="setup-footer">' +
                    '<button class="setup-btn skip" type="button" id="weeklySetupSkipBtn">稍后再说</button>' +
                    '<button class="setup-btn confirm" type="button" id="weeklySetupConfirmBtn">开始这一周！🚀</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(modal);
        
        // 使用事件监听器替代onclick，确保移动端可点击
        const self = this;
        
        document.getElementById('weeklySetupSkipBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.skipWeeklySetup();
        });
        
        document.getElementById('weeklySetupSkipBtn').addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.skipWeeklySetup();
        });
        
        document.getElementById('weeklySetupConfirmBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.saveWeeklySetup();
        });
        
        document.getElementById('weeklySetupConfirmBtn').addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.saveWeeklySetup();
        });
        
        // 阻止弹窗内容区域的触摸事件冒泡影响滚动
        const content = modal.querySelector('.copilot-modal-content');
        content.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
        
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 保存每周设置
    saveWeeklySetup() {
        // 获取输入值
        const workTypes = document.getElementById('setupWorkTypes').value;
        const morning = document.getElementById('setupMorning').checked;
        const afternoon = document.getElementById('setupAfternoon').checked;
        const evening = document.getElementById('setupEvening').checked;
        const incomeStreams = document.getElementById('setupIncomeStreams').value;
        const challenges = document.getElementById('setupChallenges').value;
        const ideas = document.getElementById('setupIdeas').value;
        const housework = document.getElementById('setupHousework').value;
        
        // 更新用户画像
        this.userProfile.workTypes = workTypes.split(/[,，、]/).map(s => s.trim()).filter(s => s);
        this.userProfile.workHours = { morning, afternoon, evening };
        this.userProfile.incomeStreams = incomeStreams.split(/[,，、]/).map(s => s.trim()).filter(s => s);
        this.userProfile.challenges = challenges.split(/[,，、]/).map(s => s.trim()).filter(s => s);
        this.userProfile.ideas = ideas.split(/[,，、]/).map(s => s.trim()).filter(s => s);
        this.userProfile.housework = housework.split(/[,，、]/).map(s => s.trim()).filter(s => s);
        this.userProfile.initialized = true;
        this.userProfile.lastWeeklySetup = new Date().toISOString();
        
        // 计算高效时间段
        this.userProfile.peakHours = this.calculatePeakHours();
        
        // 保存
        Storage.save('adhd_user_profile', this.userProfile);
        
        // 关闭弹窗
        this.closeModal('weeklySetupModal');
        
        // 自动配置系统
        this.autoConfigureSystem();
        
        // 智能安排家务
        if (this.userProfile.housework.length > 0) {
            this.scheduleHousework();
        }
        
        // 显示欢迎消息
        this.showWelcomeMessage();
    },
    
    // 跳过每周设置
    skipWeeklySetup() {
        this.closeModal('weeklySetupModal');
        this.showDailyGreeting();
    },
    
    // 关闭弹窗
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 计算高效时间段
    calculatePeakHours() {
        const peaks = [];
        if (this.userProfile.workHours.morning) {
            peaks.push({ start: '09:00', end: '11:30', label: '上午高效期' });
        }
        if (this.userProfile.workHours.afternoon) {
            peaks.push({ start: '14:00', end: '17:00', label: '下午高效期' });
        }
        if (this.userProfile.workHours.evening) {
            peaks.push({ start: '19:00', end: '22:00', label: '晚间高效期' });
        }
        return peaks;
    },
    
    // 自动配置系统
    autoConfigureSystem() {
        // 根据工作类型预设价值范围
        if (typeof ValueVisualizer !== 'undefined') {
            this.userProfile.workTypes.forEach(type => {
                if (type.includes('摄影') || type.includes('拍照')) {
                    ValueVisualizer.priceReference['摄影'] = { min: 500, max: 5000, avgHourly: 300 };
                }
                if (type.includes('插画') || type.includes('画')) {
                    ValueVisualizer.priceReference['插画'] = { min: 200, max: 2000, avgHourly: 150 };
                }
                if (type.includes('运营') || type.includes('小红书')) {
                    ValueVisualizer.priceReference['运营'] = { min: 100, max: 500, avgHourly: 80 };
                }
            });
        }
        
        // 根据效率挑战调整监控参数
        if (typeof ProcrastinationMonitor !== 'undefined') {
            if (this.userProfile.challenges.some(c => c.includes('难以开始') || c.includes('拖延'))) {
                ProcrastinationMonitor.settings.gracePeriod = 60; // 缩短到1分钟
                ProcrastinationMonitor.settings.preAlertTime = 15;
            }
        }
        
        if (typeof InefficiencyMonitor !== 'undefined') {
            if (this.userProfile.challenges.some(c => c.includes('分心') || c.includes('注意力'))) {
                InefficiencyMonitor.settings.thresholdMinutes = 45; // 缩短判定时间
                InefficiencyMonitor.settings.halfwayAlert = true;
            }
        }
    },
    
    // 智能安排家务
    scheduleHousework() {
        const housework = this.userProfile.housework;
        const today = new Date();
        const weekDays = 7;
        
        // 将家务分散到一周
        housework.forEach((task, index) => {
            const dayOffset = Math.floor((index / housework.length) * weekDays);
            const taskDate = new Date(today);
            taskDate.setDate(taskDate.getDate() + dayOffset);
            
            // 安排在非高效时段
            const startTime = this.userProfile.workHours.morning ? '08:00' : 
                             this.userProfile.workHours.evening ? '18:00' : '12:00';
            
            const newTask = {
                id: 'housework_' + Date.now() + '_' + index,
                title: '🏠 ' + task,
                date: this.formatDate(taskDate),
                startTime: startTime,
                duration: 30,
                category: '家务',
                value: 0,
                completed: false
            };
            
            // 添加到任务列表
            const tasks = Storage.getTasks();
            tasks.push(newTask);
            Storage.saveTasks(tasks);
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
    },
    
    // 显示欢迎消息
    showWelcomeMessage() {
        const workTypesStr = this.userProfile.workTypes.join('、') || '工作';
        const peakStr = this.userProfile.peakHours.map(p => p.label).join('、') || '全天';
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "🎉 太棒了！我已经了解你了~\n\n" +
                "📋 本周主要工作：" + workTypesStr + "\n" +
                "⏰ 高效时间段：" + peakStr + "\n" +
                (this.userProfile.housework.length > 0 ? 
                    "🏠 家务已智能安排到时间轴\n" : "") +
                "\n我会根据这些信息主动为你服务！\n" +
                "有什么想做的，直接告诉我就好~",
                "🤖"
            );
        }
    },
    
    // 显示每日问候
    showDailyGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        let emoji = '';
        
        if (hour < 12) {
            greeting = '早上好';
            emoji = '🌅';
        } else if (hour < 18) {
            greeting = '下午好';
            emoji = '☀️';
        } else {
            greeting = '晚上好';
            emoji = '🌙';
        }
        
        // 获取今日任务统计
        const todayStats = this.getTodayStats();
        
        // 获取AI建议日程
        const suggestedSchedule = this.generateDailySuggestion();
        
        if (typeof App !== 'undefined') {
            let message = emoji + ' ' + greeting + '，主人！\n\n';
            message += '📊 今日概览：\n';
            message += '• 待完成任务：' + todayStats.pendingCount + ' 个\n';
            message += '• 预计收入：' + todayStats.expectedIncome + ' 元\n';
            
            if (todayStats.yesterdayHighlight) {
                message += '• 昨日亮点：' + todayStats.yesterdayHighlight + '\n';
            }
            
            if (suggestedSchedule.length > 0) {
                message += '\n📅 我为你建议的今日安排：\n';
                suggestedSchedule.forEach(item => {
                    message += item.time + ' ' + item.task + '\n';
                });
                message += '\n回复"确认"采用这个安排，或告诉我你想怎么调整~';
            }
            
            App.addChatMessage("system", message, "🤖");
        }
    },
    
    // 获取今日统计
    getTodayStats() {
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const todayTasks = tasks.filter(t => t.date === today);
        
        const pendingCount = todayTasks.filter(t => !t.completed).length;
        const expectedIncome = todayTasks.reduce((sum, t) => {
            if (!t.completed && t.value) return sum + t.value;
            if (!t.completed && typeof ValueVisualizer !== 'undefined') {
                return sum + ValueVisualizer.estimateTaskValue(t);
            }
            return sum;
        }, 0);
        
        // 昨日亮点
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.formatDate(yesterday);
        const yesterdayTasks = tasks.filter(t => t.date === yesterdayStr && t.completed);
        const yesterdayHighlight = yesterdayTasks.length > 0 ? 
            '完成了' + yesterdayTasks.length + '个任务' : null;
        
        return { pendingCount, expectedIncome, yesterdayHighlight };
    },
    
    // 生成每日建议
    generateDailySuggestion() {
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const todayTasks = tasks.filter(t => t.date === today && !t.completed);
        
        // 按价值和紧急度排序
        const sortedTasks = todayTasks.map(t => {
            const value = t.value || (typeof ValueVisualizer !== 'undefined' ? 
                ValueVisualizer.estimateTaskValue(t) : 100);
            return { ...t, estimatedValue: value };
        }).sort((a, b) => b.estimatedValue - a.estimatedValue);
        
        // 根据高效时间段安排
        const schedule = [];
        let currentTime = this.userProfile.peakHours[0]?.start || '09:00';
        
        sortedTasks.slice(0, 5).forEach(task => {
            schedule.push({
                time: '🕐 ' + currentTime,
                task: task.title + (task.estimatedValue > 0 ? 
                    '（预计¥' + task.estimatedValue + '）' : '')
            });
            // 增加时间
            currentTime = this.addMinutes(currentTime, task.duration || 60);
        });
        
        return schedule;
    },
    
    // 启动主动服务
    startProactiveService() {
        // 每5分钟检查一次是否需要主动提醒
        setInterval(() => this.checkProactiveReminders(), 5 * 60 * 1000);
    },
    
    // 检查主动提醒
    checkProactiveReminders() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // 检查是否在高效时间段开始时
        this.userProfile.peakHours.forEach(peak => {
            const [peakHour, peakMin] = peak.start.split(':').map(Number);
            if (hour === peakHour && minute >= peakMin && minute < peakMin + 5) {
                this.remindPeakHourStart(peak);
            }
        });
        
        // 检查是否有即将开始的任务
        this.checkUpcomingTasks();
    },
    
    // 提醒高效时间段开始
    remindPeakHourStart(peak) {
        if (typeof App !== 'undefined') {
            const suggestion = this.getTopPriorityTask();
            let message = '⏰ ' + peak.label + '开始了！\n\n';
            
            if (suggestion) {
                message += '建议现在做：【' + suggestion.title + '】\n';
                message += '预计收入：¥' + (suggestion.value || suggestion.estimatedValue) + '\n\n';
                message += '要开始吗？回复"开始"我帮你启动监控~';
            } else {
                message += '这是你的高效时间，有什么想做的吗？';
            }
            
            App.addChatMessage("system", message, "⏰");
        }
    },
    
    // 获取最高优先级任务
    getTopPriorityTask() {
        if (typeof ValueVisualizer !== 'undefined') {
            const ranking = ValueVisualizer.getEarningRanking();
            return ranking[0] || null;
        }
        return null;
    },
    
    // 检查即将开始的任务
    checkUpcomingTasks() {
        const tasks = Storage.getTasks();
        const now = new Date();
        const today = this.formatDate(now);
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        tasks.filter(t => t.date === today && !t.completed).forEach(task => {
            // 提前10分钟提醒
            const taskMinutes = this.timeToMinutes(task.startTime);
            const currentMinutes = this.timeToMinutes(currentTime);
            const diff = taskMinutes - currentMinutes;
            
            if (diff > 0 && diff <= 10) {
                this.remindUpcomingTask(task, diff);
            }
        });
    },
    
    // 提醒即将开始的任务
    remindUpcomingTask(task, minutesLeft) {
        // 避免重复提醒
        const remindKey = 'reminded_' + task.id + '_' + this.formatDate(new Date());
        if (Storage.load(remindKey, false)) return;
        Storage.save(remindKey, true);
        
        // 显示主动提醒弹窗
        this.showProactiveReminder({
            title: '任务即将开始',
            content: '【' + task.title + '】还有 ' + minutesLeft + ' 分钟开始！\n准备好了吗？',
            actions: [
                { text: '准备好了', primary: true, action: () => this.startTaskNow(task) },
                { text: '推迟10分钟', action: () => this.postponeTask(task, 10) }
            ]
        });
    },
    
    // 显示主动提醒弹窗
    showProactiveReminder(options) {
        // 移除已有的提醒
        const existing = document.querySelector('.proactive-reminder');
        if (existing) existing.remove();
        
        const reminder = document.createElement('div');
        reminder.className = 'proactive-reminder';
        
        let actionsHtml = '';
        if (options.actions) {
            actionsHtml = '<div class="reminder-actions">';
            options.actions.forEach((action, index) => {
                actionsHtml += '<button class="reminder-btn ' + (action.primary ? 'primary' : 'secondary') + 
                    '" onclick="AICopilot.handleReminderAction(' + index + ')">' + action.text + '</button>';
            });
            actionsHtml += '</div>';
        }
        
        reminder.innerHTML = 
            '<button class="reminder-close" onclick="this.parentElement.remove()">×</button>' +
            '<div class="reminder-header">' +
                '<div class="reminder-avatar">🤖</div>' +
                '<div class="reminder-title">' + options.title + '</div>' +
            '</div>' +
            '<div class="reminder-content">' + options.content.replace(/\n/g, '<br>') + '</div>' +
            actionsHtml;
        
        // 保存actions供后续调用
        this._currentReminderActions = options.actions;
        
        document.body.appendChild(reminder);
        
        // 播放提示音
        this.playNotificationSound();
        
        // 10秒后自动消失
        setTimeout(() => {
            if (reminder.parentElement) {
                reminder.classList.add('fade-out');
                setTimeout(() => reminder.remove(), 300);
            }
        }, 10000);
    },
    
    // 处理提醒按钮点击
    handleReminderAction(index) {
        if (this._currentReminderActions && this._currentReminderActions[index]) {
            const action = this._currentReminderActions[index];
            if (action.action) action.action();
        }
        // 关闭提醒
        const reminder = document.querySelector('.proactive-reminder');
        if (reminder) reminder.remove();
    },
    
    // 立即开始任务
    startTaskNow(task) {
        if (typeof ProcrastinationMonitor !== 'undefined') {
            ProcrastinationMonitor.startMonitoring(task);
        }
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "✅ 好的！已为【" + task.title + "】启动监控~\n\n加油，你可以的！💪",
                "✅"
            );
        }
    },
    
    // 推迟任务
    postponeTask(task, minutes) {
        // 更新任务开始时间
        const newStartTime = this.addMinutes(task.startTime, minutes);
        task.startTime = newStartTime;
        if (task.duration) {
            task.endTime = this.addMinutes(newStartTime, task.duration);
        }
        
        // 保存更新
        const tasks = Storage.getTasks();
        const index = tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            tasks[index] = task;
            Storage.saveTasks(tasks);
        }
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
            App.addChatMessage("system", 
                "⏰ 好的，【" + task.title + "】已推迟到 " + newStartTime + "\n\n" +
                "我会在新时间前再提醒你~",
                "⏰"
            );
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
    
    // 智能理解用户输入
    async understandInput(input) {
        // 检查是否是确认指令
        if (['确认', '好的', '可以', 'ok', '开始'].includes(input.trim().toLowerCase())) {
            return this.handleConfirmation();
        }
        
        // 检查是否是调整指令
        if (input.includes('调整') || input.includes('改') || input.includes('换')) {
            return this.handleAdjustment(input);
        }
        
        // 上下文补全
        const enrichedInput = this.enrichWithContext(input);
        
        // 返回增强后的输入供AI处理
        return {
            originalInput: input,
            enrichedInput: enrichedInput,
            context: this.getRelevantContext(input)
        };
    },
    
    // 用上下文丰富输入
    enrichWithContext(input) {
        let enriched = input;
        
        // 检查是否提到"那个"、"这个"等指代词
        if (input.includes('那个') || input.includes('这个')) {
            // 查找最近提到的任务/项目
            if (this.context.recentTasks.length > 0) {
                const recent = this.context.recentTasks[0];
                enriched = input.replace(/那个|这个/g, recent.title);
            }
        }
        
        // 检查是否提到"明天"、"后天"等时间词但没有具体时间
        if ((input.includes('明天') || input.includes('后天')) && 
            !input.match(/\d{1,2}[点:：]/)) {
            // 根据用户习惯补充时间
            const defaultTime = this.userProfile.peakHours[0]?.start || '14:00';
            enriched += '，安排在' + defaultTime;
        }
        
        return enriched;
    },
    
    // 获取相关上下文
    getRelevantContext(input) {
        const context = {
            recentTasks: this.context.recentTasks.slice(0, 3),
            userWorkTypes: this.userProfile.workTypes,
            peakHours: this.userProfile.peakHours,
            todayTasks: []
        };
        
        // 获取今日任务
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        context.todayTasks = tasks.filter(t => t.date === today);
        
        return context;
    },
    
    // 处理确认指令
    handleConfirmation() {
        // 确认今日建议安排
        const suggestion = this.generateDailySuggestion();
        if (suggestion.length > 0) {
            if (typeof App !== 'undefined') {
                App.addChatMessage("system", 
                    "✅ 好的！今日安排已确认~\n\n" +
                    "我会在每个任务开始前提醒你，并自动启动监控。\n" +
                    "加油赚钱！💪",
                    "✅"
                );
            }
        }
        return { handled: true };
    },
    
    // 处理调整指令
    handleAdjustment(input) {
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "好的，你想怎么调整呢？\n\n" +
                "你可以说：\n" +
                "• \"把XX改到下午3点\"\n" +
                "• \"先做XX再做YY\"\n" +
                "• \"今天不想做XX\"",
                "✏️"
            );
        }
        return { handled: true, needsMoreInput: true };
    },
    
    // 记录任务到上下文
    recordTaskToContext(task) {
        this.context.recentTasks.unshift(task);
        if (this.context.recentTasks.length > 10) {
            this.context.recentTasks = this.context.recentTasks.slice(0, 10);
        }
        Storage.save('adhd_ai_context', this.context);
    },
    
    // 工具方法
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + "-" + 
               (d.getMonth() + 1).toString().padStart(2, "0") + "-" + 
               d.getDate().toString().padStart(2, "0");
    },
    
    addMinutes(timeStr, minutes) {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return newH.toString().padStart(2, '0') + ':' + newM.toString().padStart(2, '0');
    },
    
    timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }
};

// 导出
window.AICopilot = AICopilot;
