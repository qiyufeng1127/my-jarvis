// 主应用模块
const App = {
    isConnected: false,
    currentDate: new Date(),
    chatMessages: [],
    lastActivityTime: Date.now(),
    userContext: {
        recentTasks: [],
        currentMood: 'calm',
        lastCommand: null
    },

    async init() {
        console.log("ADHD Focus 初始化中...");
        
        // 初始化画布
        Canvas.init();
        
        // 加载组件内容
        this.loadSmartInput();
        this.loadTimeline();
        this.loadMemoryBank();
        this.loadPromptPanel();
        this.loadGameSystem();
        this.loadReviewPanel();
        this.loadVerificationPanel();
        this.loadWarningPanel();
        this.loadVerificationPanel();
        this.loadWarningPanel();
        
        // 更新游戏状态显示
        this.updateGameStatus();
        
        // 检查API连接
        await this.checkApiConnection();
        
        // 如果没有API Key，显示设置弹窗
        if (!Storage.getApiKey()) {
            this.showApiKeyModal();
        }
        
        // 初始化验证系统
        if (typeof Verification !== 'undefined') {
            Verification.init();
        }
        
        // 初始化警告系统
        if (typeof Warning !== 'undefined') {
            Warning.init();
            Warning.detectBypass(); // 检测绕过行为
        }
        
        // 启动活动监控
        this.startActivityMonitor();
        
        // 每天重置拖延任务记录
        this.scheduleDailyReset();
        
        console.log("ADHD Focus 初始化完成！");
    },

    // 启动活动监控
    startActivityMonitor() {
        const self = this;
        // 记录用户活动
        document.addEventListener('click', function() {
            self.lastActivityTime = Date.now();
        });
        document.addEventListener('keypress', function() {
            self.lastActivityTime = Date.now();
        });
    },

    // 每天重置
    scheduleDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow - now;
        
        setTimeout(function() {
            if (typeof Warning !== 'undefined') {
                Warning.resetDelayedTasks();
            }
            App.scheduleDailyReset(); // 重新调度
        }, msUntilMidnight);
    },

    async checkApiConnection() {
        const statusDot = document.querySelector(".online-status");
        if (!statusDot) return;
        
        this.isConnected = await AIService.checkConnection();
        statusDot.className = "online-status " + (this.isConnected ? "connected" : "disconnected");
    },

    showApiKeyModal() {
        document.getElementById("apiKeyModal").classList.add("show");
    },

    // 智能输入框
    loadSmartInput() {
        const container = document.getElementById("smartInputBody");
        const profile = Storage.getUserProfile();
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
                        '<span>' + (this.isConnected ? '已连接AI' : '未连接AI') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="chat-messages" id="chatMessages">' +
                    '<div class="message system">' +
                        '<span class="message-emoji">👋</span>' +
                        '<div class="message-bubble">嗨！我是你的专属任务助手~随便告诉我你想做什么，我来帮你安排！</div>' +
                    '</div>' +
                '</div>' +
                '<div class="chat-input-area">' +
                    '<div class="input-wrapper">' +
                        '<input type="text" class="chat-input" id="chatInput" placeholder="随便写点啥..." onkeypress="if(event.key===\'Enter\')App.sendMessage()">' +
                        '<button class="input-btn" onclick="App.addAttachment()" title="添加附件">➕</button>' +
                        '<button class="ai-parse-btn" onclick="App.aiParseInput()">AI拆解</button>' +
                        '<button class="input-btn" onclick="App.sendMessage()" title="发送">➡️</button>' +
                    '</div>' +
                '</div>' +
                '<button class="api-key-btn" onclick="App.showApiKeyModal()" title="设置API Key">🔑</button>' +
            '</div>';
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('smartInput'); }, 10);
    },

    async sendMessage() {
        const input = document.getElementById("chatInput");
        const text = input.value.trim();
        if (!text) return;
        
        this.addChatMessage("user", text, this.getEmoji(text, "user"));
        input.value = "";
        
        // 更新用户上下文
        this.userContext.lastCommand = text;
        this.lastActivityTime = Date.now();
        
        // 检查是否是高级指令
        const commandResult = this.parseAdvancedCommand(text);
        if (commandResult.handled) {
            return;
        }
        
        try {
            const result = await AIService.parseUserInput(text);
            
            // 处理删除操作
            if (result.deleteActions && result.deleteActions.length > 0) {
                for (var k = 0; k < result.deleteActions.length; k++) {
                    var action = result.deleteActions[k];
                    if (action.deletedCount > 0) {
                        this.loadTimeline(); // 刷新时间轴
                    }
                }
            }
            
            // 处理多任务
            if (result.tasks && result.tasks.length > 0) {
                for (var i = 0; i < result.tasks.length; i++) {
                    this.addTaskToTimeline(result.tasks[i]);
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
                    // 更新用户情绪上下文
                    this.userContext.currentMood = memory.emotion;
            }
            }
            
            // 显示回复
            this.addChatMessage("system", result.reply || "好的，我记下了~", this.getEmoji(result.reply, "system"));
            
        } catch (e) {
            this.addChatMessage("system", "抱歉，我暂时无法处理，请检查API连接~", "😅");
        }
    },

    // 解析高级指令
    parseAdvancedCommand(text) {
        const result = { handled: false };
        
        // 验证指令：验证[任务名称]
        const verifyMatch = text.match(/^验证[：:\s]*(.+)$/);
        if (verifyMatch) {
            this.handleVerifyCommand(verifyMatch[1]);
            result.handled = true;
            return result;
        }
        
        // 跳过指令：跳过[任务名称]
        const skipMatch = text.match(/^跳过[：:\s]*(.+)$/);
        if (skipMatch) {
            this.handleSkipCommand(skipMatch[1]);
            result.handled = true;
            return result;
        }
        
        // 状态更新：我现在在[做什么]
        const statusMatch = text.match(/^我现在在[：:\s]*(.+)$/);
        if (statusMatch) {
            this.handleStatusUpdate(statusMatch[1]);
            result.handled = true;
            return result;
        }
        
        // 紧急任务：紧急！[任务]
        const urgentMatch = text.match(/^紧急[！!][：:\s]*(.+)$/);
        if (urgentMatch) {
            this.handleUrgentTask(urgentMatch[1]);
            result.handled = true;
            return result;
        }
        
        // 鼓励指令
        if (/^(给我打气|鼓励我|加油|我需要鼓励)/.test(text)) {
            this.handleEncouragement();
            result.handled = true;
            return result;
        }
        
        // 查看进度
        if (/^(今日进度|我的进度|完成情况|今天完成了什么)/.test(text)) {
            this.handleProgressQuery();
            result.handled = true;
            return result;
        }
        
        // 精力查询
        if (/^(精力|我累了|好累|疲劳)/.test(text)) {
            this.handleEnergyQuery();
            result.handled = true;
            return result;
        }
        
        // 金币查询
        if (/^(金币|我有多少金币|余额)/.test(text)) {
            this.handleCoinsQuery();
            result.handled = true;
            return result;
        }
        
        // AI重排任务
        if (/^(重排|重新安排|智能排序|优化任务|调整顺序)/.test(text)) {
            this.aiReorderTasks();
            result.handled = true;
            return result;
        }
        
        // 休息恢复
        if (/^(休息|恢复精力|我要休息)/.test(text)) {
            this.restWithCoins();
            result.handled = true;
            return result;
        }
        
        return result;
    },

    // 处理验证指令
    handleVerifyCommand(taskName) {
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) {
            return t.title.includes(taskName) && !t.completed && !t.verified;
        });
        
        if (task) {
            if (typeof Verification !== 'undefined') {
                Verification.triggerVerification(task);
                this.addChatMessage("system", "正在打开任务「" + task.title + "」的验证窗口...", "✅");
            } else {
                this.addChatMessage("system", "验证系统未加载，请刷新页面重试", "😅");
            }
        } else {
            this.addChatMessage("system", "找不到名为「" + taskName + "」的待验证任务", "🤔");
        }
    },

    // 处理跳过指令
    handleSkipCommand(taskName) {
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) {
            return t.title.includes(taskName) && !t.completed && !t.skipped;
        });
        
        if (task) {
            const reason = prompt("请说明跳过原因（可选）：");
            const penalty = Math.ceil((task.coins || 5) * 0.3);
            
            // 扣除金币
            const state = Storage.getGameState();
            state.coins = Math.max(0, state.coins - penalty);
            Storage.saveGameState(state);
            
            // 标记任务跳过
            Storage.updateTask(task.id, { 
                skipped: true, 
                skipReason: reason || '用户主动跳过',
                skippedAt: new Date().toISOString()
            });
            
            this.addChatMessage("system", "已跳过任务「" + task.title + "」，扣除 " + penalty + " 金币\n" + (reason ? "原因：" + reason : ""), "⏭️");
            this.updateGameStatus();
            this.loadTimeline();
        } else {
            this.addChatMessage("system", "找不到名为「" + taskName + "」的可跳过任务", "🤔");
        }
    },

    // 处理状态更新
    handleStatusUpdate(activity) {
        // 记录当前活动
        Storage.addMemory({
            type: 'activity',
            content: '正在：' + activity,
            tags: ['状态更新']
        });
        
        // 检查是否与当前任务相关
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const currentTasks = tasks.filter(function(t) {
            return t.date === today && !t.completed;
        });
        
        let relatedTask = null;
        const self = this;
        currentTasks.forEach(function(task) {
            if (activity.includes(task.title) || task.title.includes(activity)) {
                relatedTask = task;
            }
        });
        
        if (relatedTask) {
            this.addChatMessage("system", "好的，你正在进行「" + relatedTask.title + "」相关的活动，继续加油！💪", "📝");
        } else {
            this.addChatMessage("system", "已记录你的当前状态：" + activity + "\n有什么需要帮助的吗？", "📝");
        }
    },

    // 处理紧急任务
    handleUrgentTask(taskDesc) {
        const now = new Date();
        const startTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        const task = {
            title: '🚨 ' + taskDesc,
            date: this.formatDate(now),
            startTime: startTime,
            duration: 30,
            coins: 10, // 紧急任务奖励更高
            energyCost: 3,
            tags: ['紧急', '高优先级'],
            urgent: true
        };
        
        this.addTaskToTimeline(task);
        this.addChatMessage("system", "🚨 紧急任务已创建！\n「" + taskDesc + "」\n开始时间：" + startTime + "\n完成奖励：10金币\n\n立即开始吧！", "🔥");
    },

    // 处理鼓励请求
    async handleEncouragement() {
        this.addChatMessage("system", "正在为你准备鼓励...", "💭");
        
        try {
            const state = Storage.getGameState();
            const tasks = Storage.getTasks();
            const today = this.formatDate(new Date());
            const todayCompleted = tasks.filter(function(t) {
                return t.date === today && t.completed;
            }).length;
            
            const context = "用户今天已完成" + todayCompleted + "个任务，当前金币" + state.coins + "，精力值" + state.energy + "/" + state.maxEnergy;
            const encouragement = await AIService.generateEncouragement(context);
            
            // 移除加载消息
            const messages = document.getElementById("chatMessages");
            if (messages.lastChild) {
                messages.removeChild(messages.lastChild);
            }
            
            this.addChatMessage("system", encouragement, "💪");
        } catch (e) {
            const messages = document.getElementById("chatMessages");
            if (messages.lastChild) {
                messages.removeChild(messages.lastChild);
            }
            
            const defaultEncouragements = [
                "你做得很棒！每一小步都是进步！🌟",
                "相信自己，你可以的！✨",
                "休息一下也是为了走更远的路~🌈",
                "完成比完美更重要！🎯",
                "你已经在行动了，这就是胜利！🏆"
            ];
            const msg = defaultEncouragements[Math.floor(Math.random() * defaultEncouragements.length)];
            this.addChatMessage("system", msg, "💪");
        }
    },

    // 处理进度查询
    handleProgressQuery() {
        const state = Storage.getGameState();
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        
        const todayTasks = tasks.filter(function(t) { return t.date === today; });
        const completed = todayTasks.filter(function(t) { return t.completed; });
        const failed = todayTasks.filter(function(t) { return t.failed; });
        const pending = todayTasks.filter(function(t) { return !t.completed && !t.failed && !t.skipped; });
        
        let msg = "📊 今日进度报告\n\n";
        msg += "✅ 已完成：" + completed.length + " 个任务\n";
        msg += "⏳ 待完成：" + pending.length + " 个任务\n";
        msg += "❌ 未完成：" + failed.length + " 个任务\n\n";
        msg += "🪙 当前金币：" + state.coins + "\n";
        msg += "⚡ 当前精力：" + state.energy + "/" + state.maxEnergy + "\n";
        
        if (completed.length > 0) {
            msg += "\n已完成的任务：\n";
            completed.forEach(function(t) {
                msg += "  ✓ " + t.title + "\n";
            });
        }
        
        if (pending.length > 0) {
            msg += "\n待完成的任务：\n";
            pending.forEach(function(t) {
                msg += "  ○ " + t.title + " (" + t.startTime + ")\n";
            });
        }
        
        this.addChatMessage("system", msg, "📊");
    },

    // 处理精力查询
    handleEnergyQuery() {
        const state = Storage.getGameState();
        const energyPercent = Math.round((state.energy / state.maxEnergy) * 100);
        
        let msg = "⚡ 精力状态\n\n";
        msg += "当前精力：" + state.energy + "/" + state.maxEnergy + " (" + energyPercent + "%)\n\n";
        
        if (energyPercent <= 20) {
            msg += "😴 精力很低了！强烈建议休息一下。\n";
            msg += "💡 建议：安排一个15-30分钟的休息任务来恢复精力。";
        } else if (energyPercent <= 50) {
            msg += "😐 精力一般，可以继续工作但要注意休息。\n";
            msg += "💡 建议：完成当前任务后安排短暂休息。";
        } else {
            msg += "😊 精力充沛！现在是高效工作的好时机！\n";
            msg += "💡 建议：趁精力好处理重要或困难的任务。";
        }
        
        this.addChatMessage("system", msg, "⚡");
        
        // 如果精力很低，触发警告
        if (energyPercent <= 20 && typeof Warning !== 'undefined') {
            Warning.trigger('energy_low', { level: Warning.LEVELS.LOW });
        }
    },

    // 处理金币查询
    handleCoinsQuery() {
        const state = Storage.getGameState();
        
        let msg = "🪙 金币状态\n\n";
        msg += "当前金币：" + state.coins + "\n";
        msg += "等级：Lv." + state.level + "\n";
        msg += "累计完成任务：" + state.completedTasks + " 个\n\n";
        
        if (state.coins <= 0) {
            msg += "⚠️ 金币已耗尽！请尽快完成任务获取金币。";
        } else if (state.coins < 10) {
            msg += "💡 金币较少，建议多完成一些任务来积累金币。";
        } else {
            msg += "💰 金币充足，继续保持！";
        }
        
        this.addChatMessage("system", msg, "🪙");
    },

    addChatMessage(type, text, emoji) {
        const container = document.getElementById("chatMessages");
        const msgDiv = document.createElement("div");
        msgDiv.className = "message " + type;
        msgDiv.innerHTML = '<span class="message-emoji">' + emoji + '</span><div class="message-bubble">' + text + '</div>';
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
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
            
            // 处理删除操作
            if (result.deleteActions && result.deleteActions.length > 0) {
                replyText += "\n\n🗑️ 删除操作：";
                for (var k = 0; k < result.deleteActions.length; k++) {
                    var action = result.deleteActions[k];
                    if (action.deletedCount > 0) {
                        replyText += "\n  ✅ 已删除 " + action.deletedCount + " 个任务";
                        if (action.date) {
                            replyText += "（" + action.date + "）";
                        }
                        this.loadTimeline(); // 刷新时间轴
                    } else {
                        replyText += "\n  ℹ️ 没有找到需要删除的任务";
                    }
                }
            }
            
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
                    App.loadSmartInput();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    // 时间轴 - 新设计（带可拖拽分隔线）
    loadTimeline() {
    const container = document.getElementById("timelineBody");
    const tasks = Storage.getTasks();
    const today = this.formatDate(this.currentDate);
        const todayTasks = tasks.filter(function(t) { return t.date === today; });
        const self = this;
        
        // 生成日历HTML
        const calendarHtml = this.generateCalendarHtml();
        
        // 生成时间轴HTML（30分钟间隔）
        var timeSlots = "";
        for (var hour = 0; hour < 24; hour++) {
            for (var half = 0; half < 2; half++) {
                const minutes = half * 30;
                const timeStr = hour.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
                const h = hour;
                const m = minutes;
                
                // 查找这个时间段的任务
                const tasksInSlot = todayTasks.filter(function(t) {
            const taskHour = parseInt(t.startTime.split(":")[0]);
                    const taskMin = parseInt(t.startTime.split(":")[1]) || 0;
                    return taskHour === h && taskMin >= m && taskMin < m + 30;
        });
        
                var eventCards = "";
                for (var i = 0; i < tasksInSlot.length; i++) {
                    eventCards += this.renderEventCard(tasksInSlot[i], i);
                }
                
                // 只在整点显示时间标签
                var timeLabel = half === 0 ? '<span class="time-label">' + hour.toString().padStart(2, "0") + ':00</span>' : '';
                
                timeSlots += 
                    '<div class="time-slot" data-hour="' + hour + '" data-minutes="' + minutes + '">' +
                        timeLabel +
                        eventCards +
                        '<div class="gap-add-section">' +
                            '<button class="gap-add-link" onclick="App.showGapMenu(event, ' + hour + ', ' + minutes + ')">' +
                                '<span>+</span> 添加任务' +
                            '</button>' +
                        '</div>' +
                    '</div>';
    }
        }
        
        // 计算当前时间指示器位置
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const indicatorTop = (currentHour * 2 + Math.floor(currentMinute / 30)) * 42 + (currentMinute % 30) * (42/30);
        const currentTimeStr = currentHour.toString().padStart(2, "0") + ":" + currentMinute.toString().padStart(2, "0");
        
        // 获取保存的日历高度
        const savedCalendarHeight = localStorage.getItem('calendarHeight') || '120';
        
        container.innerHTML = 
            '<div class="timeline-container">' +
                // 顶部日历区（可调整高度）
                '<div class="calendar-section" id="calendarSection" style="height: ' + savedCalendarHeight + 'px;">' +
                    '<div class="calendar-header">' +
                        '<span class="calendar-month">' + this.getMonthYearStr(this.currentDate) + '</span>' +
                        '<div class="calendar-nav">' +
                            '<button class="calendar-nav-btn" onclick="App.prevMonth()">◀</button>' +
                            '<button class="calendar-nav-btn" onclick="App.nextMonth()">▶</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="calendar-weekdays">' +
                        '<span class="weekday-label">MO</span>' +
                        '<span class="weekday-label">TU</span>' +
                        '<span class="weekday-label">WE</span>' +
                        '<span class="weekday-label">TH</span>' +
                        '<span class="weekday-label">FR</span>' +
                        '<span class="weekday-label">SA</span>' +
                        '<span class="weekday-label">SU</span>' +
                    '</div>' +
                    '<div class="calendar-grid" id="calendarGrid">' +
                        calendarHtml +
                    '</div>' +
                    '<button class="add-event-btn" onclick="App.showAddEventForm()">+ Add event</button>' +
                '</div>' +
                // 可拖拽分隔线
                '<div class="calendar-resize-handle" id="calendarResizeHandle"></div>' +
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
        this.initCalendarResize();
    this.scrollToCurrentTime();
        this.startTimeIndicatorUpdate();
        
        // 应用卡片颜色（必须在DOM渲染后）
        this.applyCardColors();
        
        // 重新应用背景色 - 但不覆盖事件卡片的颜色
        var that = this;
        setTimeout(function() { 
            Canvas.reapplyBackgroundExceptCards('timeline');
            // 再次应用卡片颜色确保不被覆盖
            that.applyCardColors();
        }, 10);
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

    // 渲染事件卡片（支持自定义颜色、子任务和进度条）
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
                tagsHtml += '<span class="event-tag">' + task.tags[i] + '</span>';
            }
            tagsHtml += '</div>';
        }
        
        // 大金币图标显示（使用$符号代替emoji，避免乱码）
        var coinBadgeHtml = '';
        if (task.coins) {
            coinBadgeHtml = '<span class="event-coin-badge" style="color:' + cardText + ';">' +
                '<span class="coin-icon-large">$</span>' +
                '<span class="coin-value">' + task.coins + '</span>' +
            '</span>';
        }
        
        // 地点显示
        var locationHtml = task.location ? '<div class="event-location" style="color:' + cardText + ';">@ ' + task.location + '</div>' : '';
        
        // 完成状态
        var completedClass = task.completed ? ' completed' : '';
        
        // 子任务/步骤HTML和进度条
        var subtasksHtml = '';
        var progressHtml = '';
        if (task.subtasks && task.subtasks.length > 0) {
            var completedCount = 0;
            var subtaskItems = '';
            for (var j = 0; j < task.subtasks.length; j++) {
                var subtask = task.subtasks[j];
                if (subtask.completed) completedCount++;
                var checkedClass = subtask.completed ? ' checked' : '';
                var checkIcon = subtask.completed ? '✓' : '';
                subtaskItems += 
                    '<div class="subtask-item' + checkedClass + '" onclick="App.toggleSubtask(event, \'' + task.id + '\', ' + j + ')">' +
                        '<span class="subtask-checkbox">' + checkIcon + '</span>' +
                        '<span class="subtask-title">' + subtask.title + '</span>' +
                        '<span class="subtask-duration">' + (subtask.duration || 5) + '分钟</span>' +
                    '</div>';
            }
            
            var progressPercent = Math.round((completedCount / task.subtasks.length) * 100);
            progressHtml = 
                '<div class="task-progress-container">' +
                    '<div class="task-progress-bar">' +
                        '<div class="task-progress-fill" style="width: ' + progressPercent + '%;"></div>' +
                    '</div>' +
                    '<span class="task-progress-text">' + progressPercent + '%</span>' +
                '</div>';
            
            subtasksHtml = 
                '<div class="subtasks-section" id="subtasks_' + task.id + '">' +
                    '<div class="subtasks-header" onclick="App.toggleSubtasksExpand(event, \'' + task.id + '\')">' +
                        '<span class="subtasks-toggle">▶</span>' +
                        '<span class="subtasks-label">子步骤 (' + completedCount + '/' + task.subtasks.length + ')</span>' +
                    '</div>' +
                    '<div class="subtasks-list" id="subtasksList_' + task.id + '">' +
                        subtaskItems +
                    '</div>' +
                '</div>';
        }
        
        // 卡片样式 - 确保背景色和文字色都正确应用
        var cardStyle = 'background-color: ' + cardBg + ' !important; color: ' + cardText + ' !important;';
        
        return '<div class="event-card' + completedClass + '" data-task-id="' + task.id + '" style="' + cardStyle + '">' +
                   '<div class="event-icon">' + icon + '</div>' +
                   '<div class="event-content">' +
                       '<div class="event-title" style="color:' + cardText + ';">' + task.title + coinBadgeHtml + '</div>' +
                       '<div class="event-time" style="color:' + cardText + ';">' + task.startTime + ' - ' + endTime + ' (' + duration + ' min)</div>' +
                       progressHtml +
                       locationHtml +
                       tagsHtml +
                       subtasksHtml +
                       '<div class="event-details" id="eventDetails_' + task.id + '" style="color:' + cardText + ';">' +
                           '<div class="event-detail-row">' +
                               '<span class="event-detail-label">奖励</span>' +
                               '<span class="event-detail-value">$ ' + (task.coins || 5) + ' 金币</span>' +
                           '</div>' +
                           '<div class="event-detail-row">' +
                               '<span class="event-detail-label">精力消耗</span>' +
                               '<span class="event-detail-value">⚡ ' + (task.energyCost || 2) + '</span>' +
                           '</div>' +
                           (task.notes ? '<div class="event-detail-row"><span class="event-detail-label">备注</span><span class="event-detail-value">' + task.notes + '</span></div>' : '') +
                           '<div class="event-actions">' +
                               '<button class="event-action-btn edit" onclick="App.editTask(event, \'' + task.id + '\')">✏ 编辑</button>' +
                               '<button class="event-action-btn complete" onclick="App.completeTask(\'' + task.id + '\')">✓ 完成</button>' +
                               '<button class="event-action-btn delete" onclick="App.deleteTask(\'' + task.id + '\')">✕ 删除</button>' +
                           '</div>' +
                       '</div>' +
                   '</div>' +
                   '<div class="event-card-buttons">' +
                       '<button class="event-add-subtask-btn" style="color:' + cardText + ';" onclick="App.addSubTask(event, \'' + task.id + '\')" title="添加子任务">➕</button>' +
                       '<button class="event-ai-btn" style="color:' + cardText + ';" onclick="App.aiBreakdownTask(event, \'' + task.id + '\')" title="AI拆解">🤖</button>' +
                       '<button class="event-color-btn" style="color:' + cardText + ';" onclick="App.showCardColorPicker(event, \'' + task.id + '\')" title="换颜色">🎨</button>' +
                       '<button class="event-expand-btn" style="color:' + cardText + ';" onclick="App.toggleEventDetails(event, \'' + task.id + '\')">▼</button>' +
                   '</div>' +
               '</div>';
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
    
    // 添加子任务（保存在任务内部）
    addSubTask(event, parentTaskId) {
        event.stopPropagation();
        const tasks = Storage.getTasks();
        const parentTask = tasks.find(function(t) { return t.id === parentTaskId; });
        if (!parentTask) return;
        
        const title = prompt("请输入子步骤名称:", "");
        if (!title) return;
        
        const duration = prompt("请输入子步骤时长（分钟）:", "5");
        if (!duration || isNaN(parseInt(duration))) return;
        
        // 初始化subtasks数组
        if (!parentTask.subtasks) {
            parentTask.subtasks = [];
        }
        
        // 添加新子任务
        parentTask.subtasks.push({
            title: title,
            duration: parseInt(duration),
            completed: false
        });
        
        Storage.updateTask(parentTaskId, { subtasks: parentTask.subtasks });
        this.loadTimeline();
        
        this.addChatMessage("system", "已添加子步骤「" + title + "」到任务「" + parentTask.title + "」", "📝");
    },
    
    // 应用所有卡片颜色（在DOM渲染后调用）
    applyCardColors() {
        const self = this;
        const tasks = Storage.getTasks();
        
        document.querySelectorAll('.event-card[data-task-id]').forEach(function(card) {
            const taskId = card.getAttribute('data-task-id');
            const task = tasks.find(function(t) { return t.id === taskId; });
            
            if (task) {
                // 获取卡片颜色
                var cardBg;
                if (task.cardColor) {
                    cardBg = task.cardColor;
                } else {
                    const colorIndex = parseInt(task.id) % self.cardColors.length;
                    cardBg = self.cardColors[colorIndex].bg;
                }
                
                // 计算文字颜色
                var cardText = self.getContrastColor(cardBg);
                
                // 使用CSS变量和直接样式设置
                card.style.cssText = 'background-color: ' + cardBg + ' !important; color: ' + cardText + ' !important;';
                
                // 应用到所有子元素（包括子任务相关元素）
                var elements = card.querySelectorAll('.event-title, .event-time, .event-location, .event-tags, .event-tag, .event-details, .event-detail-row, .event-detail-label, .event-detail-value, .event-expand-btn, .event-color-btn, .event-ai-btn, .event-add-subtask-btn, .event-coin-badge, .coin-icon-large, .coin-value, .task-progress-text, .subtasks-header, .subtasks-toggle, .subtasks-label, .subtask-item, .subtask-title, .subtask-duration, .subtask-checkbox');
                for (var i = 0; i < elements.length; i++) {
                    elements[i].style.cssText = 'color: ' + cardText + ' !important;';
                }
                
                // 进度条特殊处理 - 边框和填充都使用对比色
                var progressBar = card.querySelector('.task-progress-bar');
                var progressFill = card.querySelector('.task-progress-fill');
                if (progressBar) {
                    progressBar.style.cssText = 'border-color: ' + cardText + ' !important;';
                }
                if (progressFill) {
                    progressFill.style.cssText = 'background-color: ' + cardText + ' !important; width: ' + progressFill.style.width + ';';
                }
                
                // 特殊处理复选框边框颜色
                var checkboxes = card.querySelectorAll('.subtask-checkbox');
                for (var j = 0; j < checkboxes.length; j++) {
                    checkboxes[j].style.borderColor = cardText;
                }
            }
        });
    },

    // 切换事件详情展开/收起（只通过展开按钮触发）
    toggleEventDetails(event, taskId) {
        event.stopPropagation();
        event.preventDefault();
        
        const details = document.getElementById("eventDetails_" + taskId);
        const card = document.querySelector('.event-card[data-task-id="' + taskId + '"]');
        const btn = card ? card.querySelector('.event-expand-btn') : null;
        
        if (details) {
            details.classList.toggle("show");
            if (btn) {
                btn.classList.toggle("expanded");
            }
        }
    },

    // 编辑任务
    editTask(event, taskId) {
        event.stopPropagation();
        event.preventDefault();
        
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        const newTitle = prompt("编辑任务名称:", task.title);
        if (newTitle && newTitle !== task.title) {
            Storage.updateTask(taskId, { title: newTitle });
            // 只更新当前卡片的标题，不刷新整个时间轴
            const card = document.querySelector('.event-card[data-task-id="' + taskId + '"]');
            if (card) {
                const titleEl = card.querySelector('.event-title');
                if (titleEl) {
                    // 保留金币徽章
                    const coinBadge = titleEl.querySelector('.event-coin-badge');
                    titleEl.textContent = newTitle;
                    if (coinBadge) titleEl.appendChild(coinBadge);
                }
            }
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
                        '<input type="time" class="event-form-input" id="eventEndInput">' +
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
        const endTime = document.getElementById("eventEndInput").value;
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
            endTime: endTime || this.addMinutes(startTime, 30),
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

    // 更新当前时间指示器
    startTimeIndicatorUpdate() {
        const self = this;
        // 每分钟更新一次
        if (this.timeIndicatorInterval) {
            clearInterval(this.timeIndicatorInterval);
        }
        this.timeIndicatorInterval = setInterval(function() {
            const indicator = document.getElementById("currentTimeIndicator");
            const label = indicator ? indicator.querySelector(".current-time-label") : null;
            if (indicator && label) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const indicatorTop = (currentHour * 2 + Math.floor(currentMinute / 30)) * 50 + (currentMinute % 30) * (50/30);
                const currentTimeStr = currentHour.toString().padStart(2, "0") + ":" + currentMinute.toString().padStart(2, "0");
                
                indicator.style.top = indicatorTop + "px";
                label.textContent = "Now " + currentTimeStr;
            }
        }, 60000);
    },

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
    
        // 检测时间冲突
        const conflict = this.detectTimeConflict(task);
        if (conflict) {
            // 自动调整时间
            const adjustedTime = this.findNextAvailableSlot(task);
            if (adjustedTime) {
                const oldTime = task.startTime;
                task.startTime = adjustedTime;
                task.endTime = this.addMinutes(adjustedTime, task.duration || 30);
                this.addChatMessage("system", "⚠️ 检测到时间冲突！\n「" + task.title + "」与「" + conflict.title + "」时间重叠\n已自动调整到 " + adjustedTime, "🔄");
            }
    }
    
    const savedTask = Storage.addTask(task);
    this.loadTimeline();
    this.showCoinAnimation(2);
    return savedTask;
    },

    // 检测时间冲突
    detectTimeConflict(newTask) {
        const tasks = Storage.getTasks();
        const sameDayTasks = tasks.filter(function(t) {
            return t.date === newTask.date && t.id !== newTask.id;
        });
        
        const newStart = this.timeToMinutes(newTask.startTime);
        const newEnd = this.timeToMinutes(newTask.endTime || this.addMinutes(newTask.startTime, newTask.duration || 30));
        
        for (var i = 0; i < sameDayTasks.length; i++) {
            var task = sameDayTasks[i];
            var taskStart = this.timeToMinutes(task.startTime);
            var taskEnd = this.timeToMinutes(task.endTime || this.addMinutes(task.startTime, task.duration || 30));
            
            // 检查是否重叠
            if (newStart < taskEnd && newEnd > taskStart) {
                return task;
            }
        }
        
        return null;
    },

    // 找到下一个可用时间槽
    findNextAvailableSlot(task) {
        const tasks = Storage.getTasks();
        const sameDayTasks = tasks.filter(function(t) {
            return t.date === task.date;
        }).sort(function(a, b) {
            return App.timeToMinutes(a.startTime) - App.timeToMinutes(b.startTime);
        });
        
        const duration = task.duration || 30;
        var searchStart = this.timeToMinutes(task.startTime);
        
        // 尝试找到空闲时间槽
        for (var i = 0; i < sameDayTasks.length; i++) {
            var existingTask = sameDayTasks[i];
            var existingStart = this.timeToMinutes(existingTask.startTime);
            var existingEnd = this.timeToMinutes(existingTask.endTime || this.addMinutes(existingTask.startTime, existingTask.duration || 30));
            
            // 如果当前搜索位置在现有任务之前，且有足够空间
            if (searchStart + duration <= existingStart) {
                return this.minutesToTime(searchStart);
            }
            
            // 移动搜索位置到现有任务结束后
            if (searchStart < existingEnd) {
                searchStart = existingEnd;
            }
        }
        
        // 检查是否超过24小时
        if (searchStart + duration <= 24 * 60) {
            return this.minutesToTime(searchStart);
        }
        
        return null;
    },

    // 时间转分钟
    timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
    },

    // 分钟转时间
    minutesToTime(minutes) {
        const h = Math.floor(minutes / 60) % 24;
        const m = minutes % 60;
        return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
    },

    // AI智能重排任务
    async aiReorderTasks() {
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const todayTasks = tasks.filter(function(t) { 
            return t.date === today && !t.completed; 
        });
        
        if (todayTasks.length < 2) {
            this.addChatMessage("system", "今天的任务太少了，不需要重排~", "😊");
            return;
        }
        
        const state = Storage.getGameState();
        this.addChatMessage("system", "正在分析任务并智能重排...", "🤖");
        
        try {
            const taskList = todayTasks.map(function(t) {
                return t.title + " (" + t.startTime + ", " + (t.duration || 30) + "分钟, 精力消耗:" + (t.energyCost || 2) + ")";
            }).join('\n');
            
            const response = await AIService.chat([
                { role: 'user', content: '请根据以下任务列表，考虑用户当前精力值(' + state.energy + '/' + state.maxEnergy + ')，重新安排任务顺序。\n\n任务列表：\n' + taskList + '\n\n请返回JSON格式：{"reorderedTasks": [{"title": "任务名", "suggestedTime": "HH:mm", "reason": "调整理由"}]}' }
            ], '你是一个ADHD任务规划专家。请根据精力值和任务难度，将高精力消耗的任务安排在精力充沛时，低精力消耗的任务安排在精力较低时。');
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                if (result.reorderedTasks && result.reorderedTasks.length > 0) {
                    // 应用新的时间安排
                    result.reorderedTasks.forEach(function(suggestion) {
                        const task = todayTasks.find(function(t) { 
                            return t.title.includes(suggestion.title) || suggestion.title.includes(t.title); 
                        });
                        if (task && suggestion.suggestedTime) {
                            Storage.updateTask(task.id, { 
                                startTime: suggestion.suggestedTime,
                                endTime: App.addMinutes(suggestion.suggestedTime, task.duration || 30)
                            });
                        }
                    });
                    
                    this.loadTimeline();
                    
                    var msg = "✅ 任务已智能重排！\n\n";
                    result.reorderedTasks.forEach(function(s) {
                        msg += "📌 " + s.title + " → " + s.suggestedTime + "\n";
                        if (s.reason) msg += "   💡 " + s.reason + "\n";
                    });
                    
                    // 移除加载消息
                    const messages = document.getElementById("chatMessages");
                    if (messages.lastChild) messages.removeChild(messages.lastChild);
                    
                    this.addChatMessage("system", msg, "🎯");
                }
            }
        } catch (e) {
            const messages = document.getElementById("chatMessages");
            if (messages.lastChild) messages.removeChild(messages.lastChild);
            this.addChatMessage("system", "智能重排失败，请稍后重试", "😅");
        }
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
        document.querySelectorAll(".gap-menu, .context-menu, .task-detail-popup, .color-picker-popup").forEach(function(el) {
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

    async aiBreakdownTask(event, taskId) {
        if (event) event.stopPropagation();
    this.closeAllMenus();
    const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;
        
        // 如果已经有子任务，提示用户
        if (task.subtasks && task.subtasks.length > 0) {
            if (!confirm("该任务已有子步骤，是否重新拆解？（将覆盖现有子步骤）")) {
                return;
            }
        }
        
        this.addChatMessage("system", "正在AI拆解任务「" + task.title + "」...", "🤖");
    
    try {
        const steps = await AIService.breakdownTask(task);
        if (steps.length > 0) {
                // 将步骤作为子任务保存到任务内部
                var subtasks = [];
                for (var i = 0; i < steps.length; i++) {
                    subtasks.push({
                        title: steps[i].title,
                        duration: steps[i].duration || 5,
                        difficulty: steps[i].difficulty || 1,
                        tip: steps[i].tip || '',
                        completed: false
                    });
            }
                
                // 更新任务，添加子任务
                Storage.updateTask(taskId, { subtasks: subtasks });
            this.loadTimeline();
                
                // 显示成功消息
                var msgText = "✅ 已将「" + task.title + "」拆解为 " + steps.length + " 个子步骤：\n";
                for (var j = 0; j < steps.length; j++) {
                    msgText += "\n" + (j + 1) + ". " + steps[j].title + " (" + (steps[j].duration || 5) + "分钟)";
                    if (steps[j].tip) {
                        msgText += "\n   💡 " + steps[j].tip;
                    }
                }
                this.addChatMessage("system", msgText, "🎯");
            } else {
                this.addChatMessage("system", "AI拆解未返回有效步骤，请重试", "😅");
        }
    } catch (e) {
            this.addChatMessage("system", "AI拆解失败，请检查API连接", "😅");
        }
    },
    
    // 切换子任务展开/收起
    toggleSubtasksExpand(event, taskId) {
        event.stopPropagation();
        event.preventDefault();
        
        const section = document.getElementById("subtasks_" + taskId);
        const list = document.getElementById("subtasksList_" + taskId);
        if (section && list) {
            section.classList.toggle("expanded");
            const toggle = section.querySelector(".subtasks-toggle");
            if (toggle) {
                toggle.textContent = section.classList.contains("expanded") ? "▼" : "▶";
            }
        }
    },
    
    // 切换子任务完成状态（不刷新整个时间轴）
    toggleSubtask(event, taskId, subtaskIndex) {
        event.stopPropagation();
        event.preventDefault();
        
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task || !task.subtasks || !task.subtasks[subtaskIndex]) return;
        
        // 切换完成状态
        task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
        Storage.updateTask(taskId, { subtasks: task.subtasks });
        
        // 只更新当前子任务的UI，不刷新整个时间轴
        const subtaskItem = event.currentTarget;
        const checkbox = subtaskItem.querySelector('.subtask-checkbox');
        
        if (task.subtasks[subtaskIndex].completed) {
            subtaskItem.classList.add('checked');
            if (checkbox) checkbox.textContent = '✓';
        } else {
            subtaskItem.classList.remove('checked');
            if (checkbox) checkbox.textContent = '';
        }
        
        // 更新进度条
        var completedCount = task.subtasks.filter(function(s) { return s.completed; }).length;
        var totalCount = task.subtasks.length;
        var percent = Math.round((completedCount / totalCount) * 100);
        
        const card = document.querySelector('.event-card[data-task-id="' + taskId + '"]');
        if (card) {
            const progressFill = card.querySelector('.task-progress-fill');
            const progressText = card.querySelector('.task-progress-text');
            const subtasksLabel = card.querySelector('.subtasks-label');
            
            if (progressFill) {
                // 保持原有的背景色，只更新宽度
                var currentBg = progressFill.style.backgroundColor || 'currentColor';
                progressFill.style.cssText = 'background-color: ' + currentBg + ' !important; width: ' + percent + '%;';
            }
            if (progressText) progressText.textContent = percent + '%';
            if (subtasksLabel) subtasksLabel.textContent = '子步骤 (' + completedCount + '/' + totalCount + ')';
        }
        
        // 检查是否所有子任务都完成了
        var allCompleted = task.subtasks.every(function(s) { return s.completed; });
        if (allCompleted && !task.completed) {
            // 提示用户是否完成整个任务
            setTimeout(function() {
                if (confirm("🎉 所有子步骤都完成了！是否标记整个任务为完成？")) {
                    App.completeTask(taskId);
                }
            }, 300);
            return;
        }
        
        // 显示鼓励消息
        if (task.subtasks[subtaskIndex].completed) {
            this.addChatMessage("system", "✓ 完成子步骤「" + task.subtasks[subtaskIndex].title + "」\n进度：" + percent + "% (" + completedCount + "/" + totalCount + ")", "👍");
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

    completeTask(taskId) {
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (!task) return;
        
        // 使用任务自带的金币和精力消耗，或默认值
        const coinsEarned = task.coins || 5;
        const energyCost = task.energyCost || 2;
        
    Storage.updateTask(taskId, { completed: true, completedAt: new Date().toISOString() });
    
    const state = Storage.getGameState();
        state.coins += coinsEarned;
        state.totalCoinsEarned = (state.totalCoinsEarned || 0) + coinsEarned;
        state.energy = Math.max(0, state.energy - energyCost);
    state.completedTasks += 1;
        state.streak = (state.streak || 0) + 1;
        
        // 连续完成奖励
        var bonusCoins = 0;
        if (state.streak === 3) {
            bonusCoins = 5;
            this.addChatMessage("system", "🔥 三连击！额外奖励 5 金币！", "⚡");
        } else if (state.streak === 5) {
            bonusCoins = 10;
            this.addChatMessage("system", "⚡ 五连杀！额外奖励 10 金币！", "🔥");
        } else if (state.streak === 10) {
            bonusCoins = 20;
            this.addChatMessage("system", "🌟 十连神！额外奖励 20 金币！", "👑");
        }
        state.coins += bonusCoins;
        state.totalCoinsEarned += bonusCoins;
        
        // 检查升级
        const tasksForLevel = state.level * 5;
        if (state.completedTasks >= tasksForLevel) {
            state.level += 1;
            state.maxEnergy = 10 + state.level;
            state.energy = state.maxEnergy; // 升级时恢复满精力
            this.showLevelUpAnimation(state.level);
        }
        
    Storage.saveGameState(state);
    
        // 检查成就
        const newAchievements = Storage.checkAchievements();
        if (newAchievements.length > 0) {
            const self = this;
            newAchievements.forEach(function(ach, index) {
                setTimeout(function() {
                    self.showAchievementToast(ach);
                }, index * 1500);
            });
        }
        
        // 检查完美日
        Storage.checkPerfectDay();
        
        this.showCoinAnimation(coinsEarned + bonusCoins);
    this.updateGameStatus();
    this.loadTimeline();
    this.loadGameSystem();
        this.loadReviewPanel();
    this.closeAllMenus();
    
        this.addChatMessage("system", "太棒了！「" + task.title + "」完成！获得 " + coinsEarned + " 金币 🎉\n精力 -" + energyCost + (bonusCoins > 0 ? "\n连击奖励 +" + bonusCoins : ""), "🏆");
        
        // 触发验证（如果任务需要验证）
        if (task.verification && typeof Verification !== 'undefined') {
            setTimeout(function() {
                Verification.triggerVerification(task);
            }, 500);
        }
    },

    // 显示升级动画
    showLevelUpAnimation(level) {
        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';
        overlay.innerHTML = 
            '<div class="level-up-content">' +
                '<div class="level-up-icon">🎉</div>' +
                '<div class="level-up-title">升级啦！</div>' +
                '<div class="level-up-subtitle">恭喜达到 Lv.' + level + '</div>' +
                '<div class="level-up-rewards">' +
                    '<div class="level-up-reward">⚡ 最大精力 +1</div>' +
                    '<div class="level-up-reward">💚 精力已恢复</div>' +
                '</div>' +
                '<button class="level-up-btn" onclick="this.parentElement.parentElement.remove()">太棒了！</button>' +
            '</div>';
        
        document.body.appendChild(overlay);
        
        // 5秒后自动关闭
        setTimeout(function() {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 5000);
    },

    // 显示成就解锁提示
    showAchievementToast(achievement) {
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = 
            '<div class="achievement-toast-icon">' + achievement.icon + '</div>' +
            '<div class="achievement-toast-content">' +
                '<div class="achievement-toast-title">🏆 成就解锁</div>' +
                '<div class="achievement-toast-name">' + achievement.name + '</div>' +
            '</div>';
        
        document.body.appendChild(toast);
        
        // 3秒后自动关闭
        setTimeout(function() {
            toast.style.animation = 'achievementSlide 0.3s ease reverse';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
        
        this.addChatMessage("system", "🏆 成就解锁：" + achievement.icon + " " + achievement.name + "\n" + achievement.desc, "🎊");
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
                    '<div class="emotion-tags">' +
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
        
        return '<div class="memory-card ' + memory.type + '" style="border-left-color: ' + borderColor + ';" data-emotion="' + (memory.emotionType || '') + '">' +
                   '<div class="memory-card-header">' +
                       '<span class="memory-type-icon">' + icon + '</span>' +
                       '<span class="memory-time">' + this.formatTime(memory.createdAt) + '</span>' +
                   '</div>' +
                   '<div class="memory-content">' + memory.content + '</div>' +
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
        
    Storage.addMemory({
        type: "emotion",
            emotionType: emotionType,
            content: emotion.content || ("记录了" + emotionType + "的情绪"),
            intensity: emotion.intensity || 0.5,
            tags: emotion.tags || ["情绪"]
    });
    this.loadMemoryBank();
        this.loadReviewPanel();
    },

    filterMemories(filter) {
    const grid = document.getElementById("memoryGrid");
    const cards = grid.querySelectorAll(".memory-card");
    const tags = document.querySelectorAll(".emotion-tag");
    
        tags.forEach(function(tag) { tag.classList.remove("active"); });
    event.target.classList.add("active");
    
        cards.forEach(function(card) {
        if (filter === "all" || card.dataset.emotion === filter) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
    },

    // 提示词面板
    loadPromptPanel() {
    const container = document.getElementById("promptPanelBody");
    const prompts = Storage.getPrompts();
    
        // 截取提示词的前100个字符用于显示
        var taskParseShort = prompts.taskParse.substring(0, 150) + '...';
        var taskBreakdownShort = prompts.taskBreakdown.substring(0, 150) + '...';
        var gapSuggestionShort = prompts.gapSuggestion.substring(0, 150) + '...';
        var emotionAnalysisShort = prompts.emotionAnalysis.substring(0, 150) + '...';
        var coinAllocationShort = (prompts.coinAllocation || '').substring(0, 150) + '...';
        
        container.innerHTML = 
            '<div class="prompt-container">' +
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
        const achievements = Storage.getAchievementsStatus();
        
        // 计算今日完成数
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        const todayTasks = tasks.filter(function(t) { return t.date === today; });
        const todayCompleted = todayTasks.filter(function(t) { return t.completed; }).length;
        const todayTotal = todayTasks.length || 5;
        const todayProgress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
        
        // 精力值状态样式
        const energyPercent = (state.energy / state.maxEnergy) * 100;
        const energyClass = energyPercent <= 20 ? ' energy-warning' : '';
        
        // 生成成就徽章HTML
        var achievementsHtml = '';
        for (var i = 0; i < Math.min(achievements.length, 8); i++) {
            var ach = achievements[i];
            achievementsHtml += '<div class="achievement-badge ' + (ach.unlocked ? '' : 'locked') + '" title="' + ach.name + ': ' + ach.desc + '">' + ach.icon + '</div>';
        }
        
        // 连续完成奖励显示
        var streakHtml = '';
        if (state.streak >= 3) {
            streakHtml = '<div class="streak-badge">🔥 ' + state.streak + '连击</div>';
        }
        
        container.innerHTML = 
            '<div class="game-container">' +
                '<div class="game-stats">' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon">🪙</div>' +
                        '<div class="stat-value">' + state.coins + '</div>' +
                        '<div class="stat-label">金币</div>' +
                    '</div>' +
                    '<div class="stat-card' + energyClass + '">' +
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
                        '<div class="stat-icon">📅</div>' +
                        '<div class="stat-value">' + (state.dailyStreak || 0) + '天</div>' +
                        '<div class="stat-label">连续打卡</div>' +
                    '</div>' +
                '</div>' +
                '<div class="game-progress">' +
                    '<div class="progress-title">今日进度 ' + streakHtml + '</div>' +
                    '<div class="progress-bar-container">' +
                        '<div class="progress-bar-fill" style="width: ' + todayProgress + '%"></div>' +
                        '<span class="progress-text">' + todayCompleted + '/' + todayTotal + ' 任务</span>' +
                    '</div>' +
                '</div>' +
                '<div class="game-actions">' +
                    '<button class="game-action-btn" onclick="App.restWithCoins()" title="花费5金币恢复3点精力">☕ 休息恢复</button>' +
                    '<button class="game-action-btn" onclick="App.showAchievements()" title="查看所有成就">🏆 成就</button>' +
                '</div>' +
                '<div class="achievements">' +
                    achievementsHtml +
                '</div>' +
            '</div>';
        
        // 更新每日打卡
        Storage.updateDailyStreak();
        
        // 重新应用背景色
        setTimeout(function() { Canvas.reapplyBackground('gameSystem'); }, 10);
    },

    // 花费金币恢复精力
    restWithCoins() {
    const state = Storage.getGameState();
        if (state.coins < 5) {
            this.addChatMessage("system", "金币不足！需要5金币才能恢复精力", "😅");
            return;
        }
        if (state.energy >= state.maxEnergy) {
            this.addChatMessage("system", "精力已满，不需要恢复~", "😊");
            return;
        }
        
        state.coins -= 5;
        state.energy = Math.min(state.maxEnergy, state.energy + 3);
        Storage.saveGameState(state);
        
        this.addChatMessage("system", "☕ 休息一下！花费5金币，恢复3点精力\n当前精力：" + state.energy + "/" + state.maxEnergy, "✨");
        this.updateGameStatus();
        this.loadGameSystem();
    },

    // 显示成就面板
    showAchievements() {
        const achievements = Storage.getAchievementsStatus();
        const state = Storage.getGameState();
        
        var unlockedCount = achievements.filter(function(a) { return a.unlocked; }).length;
        var msg = "🏆 成就系统\n\n";
        msg += "已解锁：" + unlockedCount + "/" + achievements.length + "\n\n";
        
        achievements.forEach(function(ach) {
            if (ach.unlocked) {
                msg += ach.icon + " " + ach.name + " ✓\n";
                msg += "   " + ach.desc + "\n\n";
            } else {
                msg += "🔒 " + ach.name + "\n";
                msg += "   " + ach.desc + "\n\n";
            }
        });
        
        this.addChatMessage("system", msg, "🏆");
    },

    updateGameStatus() {
    const state = Storage.getGameState();
    document.getElementById("coinAmount").textContent = state.coins;
    document.getElementById("energyFill").style.width = (state.energy / state.maxEnergy * 100) + "%";
    document.getElementById("energyText").textContent = state.energy + "/" + state.maxEnergy;
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
    }
};

// API Key 相关全局函数
function closeApiKeyModal() {
    document.getElementById("apiKeyModal").classList.remove("show");
}

function saveApiKey() {
    const key = document.getElementById("apiKeyInput").value.trim();
    if (key) {
        Storage.setApiKey(key);
        closeApiKeyModal();
        App.checkApiConnection().then(function() {
            App.loadSmartInput();
            if (App.isConnected) {
                App.addChatMessage("system", "API连接成功！现在可以开始使用AI功能了~", "🎉");
            } else {
                App.addChatMessage("system", "API Key已保存，但连接似乎有问题，请检查Key是否正确", "⚠️");
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", function() {
    App.init();
    
    // 初始化拖延面板
    if (window.ProcrastinationPanel) {
        ProcrastinationPanel.init();
    }
    
    // 初始化低效率面板
    if (window.InefficiencyPanel) {
        InefficiencyPanel.init();
    }
});
