// 后台运行与监控模块
const BackgroundMonitor = {
    // 状态
    isRunning: false,
    taskCheckInterval: null,
    reminderTimeouts: [],
    
    // 初始化
    init() {
        this.loadState();
        this.requestNotificationPermission();
        this.startBackgroundMonitor();
        this.scheduleReminders();
        console.log('后台监控模块初始化完成');
    },
    
    // 加载状态
    loadState() {
        this.isRunning = localStorage.getItem('backgroundMonitorEnabled') !== 'false';
    },
    
    // 请求通知权限
    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
    },
    
    // 发送系统通知
    sendNotification(title, body, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: 'icons/tomato.png',
                badge: 'icons/tomato.png',
                tag: options.tag || 'adhd-focus',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
                if (options.onClick) {
                    options.onClick();
                }
            };
            
            // 播放提示音
            if (!options.silent && typeof CelebrationEffects !== 'undefined') {
                CelebrationEffects.playAlertSound();
            }
            
            return notification;
        }
        return null;
    },
    
    // 启动后台监控
    startBackgroundMonitor() {
        if (this.taskCheckInterval) {
            clearInterval(this.taskCheckInterval);
        }
        
        // 每30秒检查一次任务状态
        this.taskCheckInterval = setInterval(() => {
            this.checkTaskStatus();
        }, 30000);
        
        // 立即检查一次
        this.checkTaskStatus();
        
        this.isRunning = true;
        console.log('后台监控已启动');
    },
    
    // 停止后台监控
    stopBackgroundMonitor() {
        if (this.taskCheckInterval) {
            clearInterval(this.taskCheckInterval);
            this.taskCheckInterval = null;
        }
        
        this.reminderTimeouts.forEach(timeout => clearTimeout(timeout));
        this.reminderTimeouts = [];
        
        this.isRunning = false;
        console.log('后台监控已停止');
    },
    
    // 检查任务状态
    checkTaskStatus() {
        const tasks = Storage.getTasks();
        const now = new Date();
        const today = this.formatDate(now);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // 检查即将开始的任务
        tasks.forEach(task => {
            if (task.date !== today || task.completed) return;
            
            const startParts = task.startTime.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            
            // 任务即将开始（提前5分钟提醒）
            const reminderMinutes = task.reminderMinutes || 5;
            if (startMinutes - currentMinutes === reminderMinutes && !task.reminderSent) {
                this.sendTaskReminder(task, reminderMinutes);
                Storage.updateTask(task.id, { reminderSent: true });
            }
            
            // 任务正在开始
            if (startMinutes === currentMinutes && !task.startNotified) {
                this.sendTaskStartNotification(task);
                Storage.updateTask(task.id, { startNotified: true });
                
                // 启动拖延监控
                this.startProcrastinationMonitor(task);
            }
            
            // 检查任务是否超时
            const duration = task.duration || 30;
            const endMinutes = startMinutes + duration;
            if (currentMinutes > endMinutes && !task.completed && !task.overtimeNotified) {
                this.sendOvertimeNotification(task);
                Storage.updateTask(task.id, { overtimeNotified: true });
            }
        });
    },
    
    // 发送任务提醒
    sendTaskReminder(task, minutes) {
        this.sendNotification(
            `⏰ 任务即将开始`,
            `「${task.title}」将在 ${minutes} 分钟后开始`,
            {
                tag: `reminder-${task.id}`,
                requireInteraction: true,
                onClick: () => {
                    if (typeof App !== 'undefined') {
                        App.loadTimeline();
                    }
                }
            }
        );
        
        // 语音播报
        if (typeof VoiceAssistant !== 'undefined' && VoiceAssistant.isEnabled) {
            VoiceAssistant.speak(`提醒：${task.title}将在${minutes}分钟后开始`);
        }
    },
    
    // 发送任务开始通知
    sendTaskStartNotification(task) {
        this.sendNotification(
            `🚀 任务开始`,
            `现在开始：「${task.title}」`,
            {
                tag: `start-${task.id}`,
                requireInteraction: true,
                onClick: () => {
                    if (typeof App !== 'undefined') {
                        App.loadTimeline();
                    }
                }
            }
        );
        
        // 语音播报
        if (typeof VoiceAssistant !== 'undefined' && VoiceAssistant.isEnabled) {
            VoiceAssistant.speak(`当前任务：${task.title}`);
            
            // 如果有子步骤，播报第一步
            if (task.substeps && task.substeps.length > 0) {
                setTimeout(() => {
                    VoiceAssistant.speak(`第一步：${task.substeps[0].title}`);
                }, 2000);
            }
        }
    },
    
    // 发送超时通知
    sendOvertimeNotification(task) {
        this.sendNotification(
            `⚠️ 任务超时`,
            `「${task.title}」已超过预定时间，请尽快完成`,
            {
                tag: `overtime-${task.id}`,
                requireInteraction: true
            }
        );
        
        // 播放警告音
        if (typeof CelebrationEffects !== 'undefined') {
            CelebrationEffects.playWarningSound();
        }
    },
    
    // 启动拖延监控
    startProcrastinationMonitor(task) {
        // 如果已有拖延监控模块，使用它
        if (typeof ProcrastinationMonitor !== 'undefined') {
            ProcrastinationMonitor.startMonitoring(task);
            return;
        }
        
        // 简单的拖延检测
        const checkInterval = setInterval(() => {
            // 检查任务是否已完成
            const tasks = Storage.getTasks();
            const currentTask = tasks.find(t => t.id === task.id);
            
            if (!currentTask || currentTask.completed) {
                clearInterval(checkInterval);
                return;
            }
            
            // 检查是否超过宽限期
            const now = new Date();
            const startParts = task.startTime.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const elapsedMinutes = currentMinutes - startMinutes;
            
            // 超过5分钟未开始，发送提醒
            if (elapsedMinutes >= 5 && !currentTask.procrastinationWarned) {
                this.sendNotification(
                    `🚨 拖延警告`,
                    `「${task.title}」已开始 ${elapsedMinutes} 分钟，请立即行动！`,
                    {
                        tag: `procrastination-${task.id}`,
                        requireInteraction: true
                    }
                );
                
                Storage.updateTask(task.id, { procrastinationWarned: true });
                
                if (typeof CelebrationEffects !== 'undefined') {
                    CelebrationEffects.playWarningSound();
                }
            }
        }, 60000); // 每分钟检查一次
    },
    
    // 安排所有提醒
    scheduleReminders() {
        // 清除现有提醒
        this.reminderTimeouts.forEach(timeout => clearTimeout(timeout));
        this.reminderTimeouts = [];
        
        const tasks = Storage.getTasks();
        const now = new Date();
        const today = this.formatDate(now);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        tasks.forEach(task => {
            if (task.date !== today || task.completed) return;
            
            const startParts = task.startTime.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const reminderMinutes = task.reminderMinutes || 5;
            
            // 计算提醒时间
            const reminderTime = startMinutes - reminderMinutes;
            const delayMs = (reminderTime - currentMinutes) * 60 * 1000;
            
            if (delayMs > 0) {
                const timeout = setTimeout(() => {
                    this.sendTaskReminder(task, reminderMinutes);
                }, delayMs);
                this.reminderTimeouts.push(timeout);
            }
            
            // 计算开始时间
            const startDelayMs = (startMinutes - currentMinutes) * 60 * 1000;
            if (startDelayMs > 0) {
                const timeout = setTimeout(() => {
                    this.sendTaskStartNotification(task);
                    this.startProcrastinationMonitor(task);
                }, startDelayMs);
                this.reminderTimeouts.push(timeout);
            }
        });
    },
    
    // 工具方法
    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// 快捷添加任务模块
const QuickAddTask = {
    isPopupOpen: false,
    
    // 初始化
    init() {
        this.renderQuickAddButton();
        console.log('快捷添加模块初始化完成');
    },
    
    // 渲染快捷添加按钮
    renderQuickAddButton() {
        // 检查是否已存在
        const existing = document.getElementById('quickAddFab');
        if (existing) existing.remove();
        
        const btn = document.createElement('button');
        btn.id = 'quickAddFab';
        btn.className = 'quick-add-fab';
        btn.innerHTML = '+';
        btn.onclick = () => this.togglePopup();
        btn.title = '快捷添加任务';
        
        document.body.appendChild(btn);
    },
    
    // 切换弹窗
    togglePopup() {
        if (this.isPopupOpen) {
            this.closePopup();
        } else {
            this.openPopup();
        }
    },
    
    // 打开弹窗
    openPopup() {
        const existing = document.getElementById('quickAddPopup');
        if (existing) existing.remove();
        
        const now = new Date();
        const defaultTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          (Math.ceil(now.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0');
        
        const popup = document.createElement('div');
        popup.id = 'quickAddPopup';
        popup.className = 'quick-add-popup';
        popup.innerHTML = `
            <div class="quick-add-popup-header">
                <span>✨ 快捷添加任务</span>
                <button class="quick-add-popup-close" onclick="QuickAddTask.closePopup()">×</button>
            </div>
            <div class="quick-add-popup-body">
                <input type="text" 
                       class="quick-add-input" 
                       id="quickAddInput" 
                       placeholder="输入任务名称，如：下午3点开会"
                       onkeypress="if(event.key==='Enter')QuickAddTask.submit()">
                <div class="quick-add-time-row">
                    <input type="time" class="quick-add-time-input" id="quickAddTime" value="${defaultTime}">
                    <input type="number" class="quick-add-time-input" id="quickAddDuration" value="30" min="5" step="5" placeholder="时长(分钟)">
                </div>
                <button class="quick-add-submit" onclick="QuickAddTask.submit()">
                    添加任务
                </button>
                <div class="quick-add-hints">
                    <div class="quick-add-hint-title">💡 试试自然语言：</div>
                    <span class="quick-add-hint-item" onclick="QuickAddTask.useHint('下午3点开会')">下午3点开会</span>
                    <span class="quick-add-hint-item" onclick="QuickAddTask.useHint('明天上午10点健身')">明天上午10点健身</span>
                    <span class="quick-add-hint-item" onclick="QuickAddTask.useHint('把后面的任务都往后顺延30分钟')">顺延30分钟</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        this.isPopupOpen = true;
        
        // 聚焦输入框
        setTimeout(() => {
            document.getElementById('quickAddInput').focus();
        }, 100);
        
        // 点击外部关闭
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick);
        }, 100);
    },
    
    // 关闭弹窗
    closePopup() {
        const popup = document.getElementById('quickAddPopup');
        if (popup) {
            popup.remove();
        }
        this.isPopupOpen = false;
        document.removeEventListener('click', this.handleOutsideClick);
    },
    
    // 处理外部点击
    handleOutsideClick(e) {
        const popup = document.getElementById('quickAddPopup');
        const fab = document.getElementById('quickAddFab');
        if (popup && !popup.contains(e.target) && !fab.contains(e.target)) {
            QuickAddTask.closePopup();
        }
    },
    
    // 使用提示
    useHint(text) {
        const input = document.getElementById('quickAddInput');
        if (input) {
            input.value = text;
            input.focus();
        }
    },
    
    // 提交任务
    async submit() {
        const input = document.getElementById('quickAddInput');
        const timeInput = document.getElementById('quickAddTime');
        const durationInput = document.getElementById('quickAddDuration');
        
        const text = input.value.trim();
        if (!text) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '请输入任务内容', '');
            }
            return;
        }
        
        // 先尝试自然语言解析
        if (typeof NaturalLanguageTimeline !== 'undefined') {
            const result = await NaturalLanguageTimeline.parseAndExecute(text);
            if (result) {
                if (typeof App !== 'undefined') {
                    App.addChatMessage('system', result.message, result.success ? '✅' : '❌');
                }
                if (result.success) {
                    this.closePopup();
                }
                return;
            }
        }
        
        // 解析时间
        let startTime = timeInput.value;
        let taskTitle = text;
        
        // 尝试从文本中提取时间
        const timeMatch = text.match(/(上午|下午)?(\d{1,2})[:：点](\d{0,2})?/);
        if (timeMatch) {
            let hour = parseInt(timeMatch[2]);
            const minute = parseInt(timeMatch[3]) || 0;
            const period = timeMatch[1];
            
            if (period === '下午' && hour < 12) {
                hour += 12;
            } else if (period === '上午' && hour === 12) {
                hour = 0;
            }
            
            startTime = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
            taskTitle = text.replace(timeMatch[0], '').trim();
        }
        
        const duration = parseInt(durationInput.value) || 30;
        const today = this.formatDate(new Date());
        
        // 创建任务
        const task = {
            title: taskTitle || text,
            date: today,
            startTime: startTime,
            duration: duration,
            coins: 5,
            energyCost: 2,
            tags: []
        };
        
        if (typeof App !== 'undefined') {
            App.addTaskToTimeline(task);
            App.addChatMessage('system', `✅ 已添加任务「${task.title}」到 ${startTime}`, '📅');
        } else {
            Storage.addTask(task);
        }
        
        this.closePopup();
        
        if (typeof Settings !== 'undefined') {
            Settings.showToast('success', '任务已添加', task.title);
        }
    },
    
    // 工具方法
    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    BackgroundMonitor.init();
    QuickAddTask.init();
});

// 导出
window.BackgroundMonitor = BackgroundMonitor;
window.QuickAddTask = QuickAddTask;

