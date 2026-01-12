// 任务增强模块 - 提醒、模板、重复、标签、撤销
const TaskEnhance = {
    // 标签系统
    tags: {
        system: [
            { id: 'work', name: '工作', icon: '💼', color: '#4A90E2' },
            { id: 'life', name: '生活', icon: '🏠', color: '#27AE60' },
            { id: 'health', name: '健康', icon: '💪', color: '#E74C3C' },
            { id: 'study', name: '学习', icon: '📚', color: '#9B59B6' },
            { id: 'social', name: '社交', icon: '👥', color: '#F39C12' },
            { id: 'finance', name: '财务', icon: '💰', color: '#1ABC9C' },
            { id: 'creative', name: '创作', icon: '🎨', color: '#E91E63' },
            { id: 'urgent', name: '紧急', icon: '🔥', color: '#FF5722' }
        ],
        custom: []
    },
    
    // 任务模板
    templates: [],
    
    // 回收站
    trash: [],
    
    // 操作历史（用于撤销）
    history: [],
    maxHistory: 50,
    
    // 提醒设置
    reminders: {
        defaultBefore: [5, 15, 30], // 默认提前提醒时间（分钟）
        scheduled: [] // 已安排的提醒
    },
    
    // 重复任务
    recurring: [],
    
    // 初始化
    init() {
        this.loadData();
        this.setupReminders();
        this.checkRecurringTasks();
        this.setupAutoBackupReminder();
        console.log('任务增强模块初始化完成');
    },
    
    // 加载数据
    loadData() {
        this.tags.custom = Storage.load('adhd_custom_tags', []);
        this.templates = Storage.load('adhd_task_templates', this.getDefaultTemplates());
        this.trash = Storage.load('adhd_task_trash', []);
        this.recurring = Storage.load('adhd_recurring_tasks', []);
        this.reminders.scheduled = Storage.load('adhd_scheduled_reminders', []);
    },
    
    // 获取默认模板
    getDefaultTemplates() {
        return [
            {
                id: 'morning_routine',
                name: '晨间例行',
                icon: '🌅',
                tasks: [
                    { title: '起床洗漱', duration: 15, tags: ['life'] },
                    { title: '吃早餐', duration: 20, tags: ['health'] },
                    { title: '查看今日任务', duration: 5, tags: ['work'] }
                ]
            },
            {
                id: 'work_session',
                name: '工作时段',
                icon: '💼',
                tasks: [
                    { title: '专注工作', duration: 45, tags: ['work'] },
                    { title: '短暂休息', duration: 10, tags: ['health'] }
                ]
            },
            {
                id: 'evening_review',
                name: '晚间复盘',
                icon: '🌙',
                tasks: [
                    { title: '回顾今日完成', duration: 10, tags: ['work'] },
                    { title: '规划明日任务', duration: 10, tags: ['work'] },
                    { title: '记录心情感想', duration: 5, tags: ['life'] }
                ]
            }
        ];
    },
    
    // ==================== 标签系统 ====================
    
    // 获取所有标签
    getAllTags() {
        return [...this.tags.system, ...this.tags.custom];
    },
    
    // 添加自定义标签
    addCustomTag(name, icon, color) {
        const tag = {
            id: 'custom_' + Date.now(),
            name,
            icon: icon || '🏷️',
            color: color || '#667eea',
            custom: true
        };
        this.tags.custom.push(tag);
        Storage.save('adhd_custom_tags', this.tags.custom);
        return tag;
    },
    
    // 删除自定义标签
    removeCustomTag(tagId) {
        this.tags.custom = this.tags.custom.filter(t => t.id !== tagId);
        Storage.save('adhd_custom_tags', this.tags.custom);
    },
    
    // 获取标签信息
    getTag(tagId) {
        return this.getAllTags().find(t => t.id === tagId);
    },
    
    // 渲染标签选择器
    renderTagSelector(selectedTags = [], onSelect) {
        const allTags = this.getAllTags();
        const html = `
            <div class="tag-selector">
                <div class="tag-selector-title">选择标签</div>
                <div class="tag-selector-list">
                    ${allTags.map(tag => `
                        <button class="tag-selector-item ${selectedTags.includes(tag.id) ? 'selected' : ''}"
                                data-tag-id="${tag.id}"
                                style="--tag-color: ${tag.color}">
                            <span class="tag-icon">${tag.icon}</span>
                            <span class="tag-name">${tag.name}</span>
                        </button>
                    `).join('')}
                    <button class="tag-selector-add" onclick="TaskEnhance.showAddTagModal()">
                        + 新标签
                    </button>
                </div>
            </div>
        `;
        return html;
    },
    
    // 显示添加标签弹窗
    showAddTagModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'addTagModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 350px;">
                <div class="modal-header">
                    <span class="modal-icon">🏷️</span>
                    <h2>添加标签</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>标签名称</label>
                        <input type="text" id="newTagName" placeholder="如：运动" maxlength="10">
                    </div>
                    <div class="form-group">
                        <label>图标</label>
                        <div class="emoji-picker-mini">
                            ${['🏷️', '⭐', '❤️', '🎯', '📌', '🔖', '💡', '🎪'].map(e => 
                                `<button class="emoji-btn" onclick="document.getElementById('newTagIcon').value='${e}'">${e}</button>`
                            ).join('')}
                        </div>
                        <input type="text" id="newTagIcon" value="🏷️" style="width: 60px; text-align: center;">
                    </div>
                    <div class="form-group">
                        <label>颜色</label>
                        <input type="color" id="newTagColor" value="#667eea">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('addTagModal').remove()">取消</button>
                    <button class="modal-btn btn-confirm" onclick="TaskEnhance.saveNewTag()">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // 保存新标签
    saveNewTag() {
        const name = document.getElementById('newTagName').value.trim();
        const icon = document.getElementById('newTagIcon').value;
        const color = document.getElementById('newTagColor').value;
        
        if (!name) {
            Settings.showToast('warning', '请输入标签名称', '');
            return;
        }
        
        this.addCustomTag(name, icon, color);
        document.getElementById('addTagModal').remove();
        Settings.showToast('success', '标签已添加', name);
    },
    
    // ==================== 任务模板 ====================
    
    // 获取所有模板
    getAllTemplates() {
        return this.templates;
    },
    
    // 添加模板
    addTemplate(template) {
        template.id = 'template_' + Date.now();
        this.templates.push(template);
        Storage.save('adhd_task_templates', this.templates);
        return template;
    },
    
    // 从当前任务创建模板
    createTemplateFromTask(task) {
        const template = {
            id: 'template_' + Date.now(),
            name: task.title + ' 模板',
            icon: '📋',
            tasks: [{
                title: task.title,
                duration: task.duration || 30,
                tags: task.tags || [],
                steps: task.steps || []
            }]
        };
        this.templates.push(template);
        Storage.save('adhd_task_templates', this.templates);
        return template;
    },
    
    // 应用模板创建任务
    applyTemplate(templateId, date, startTime) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return [];
        
        const tasks = [];
        let currentTime = startTime || '09:00';
        
        template.tasks.forEach(taskDef => {
            const task = {
                title: taskDef.title,
                date: date || this.formatDate(new Date()),
                startTime: currentTime,
                duration: taskDef.duration,
                tags: taskDef.tags || [],
                steps: taskDef.steps || [],
                fromTemplate: templateId
            };
            
            // 计算下一个任务的开始时间
            const [hours, mins] = currentTime.split(':').map(Number);
            const totalMins = hours * 60 + mins + taskDef.duration;
            currentTime = `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`;
            
            tasks.push(Storage.addTask(task));
        });
        
        return tasks;
    },
    
    // 显示模板选择器
    showTemplateSelector() {
        const templates = this.getAllTemplates();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'templateModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <span class="modal-icon">📋</span>
                    <h2>选择模板</h2>
                </div>
                <div class="modal-body">
                    <div class="template-list">
                        ${templates.map(t => `
                            <div class="template-item" onclick="TaskEnhance.selectTemplate('${t.id}')">
                                <span class="template-icon">${t.icon}</span>
                                <div class="template-info">
                                    <div class="template-name">${t.name}</div>
                                    <div class="template-tasks">${t.tasks.length} 个任务</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-template-btn" onclick="TaskEnhance.showCreateTemplateModal()">
                        + 创建新模板
                    </button>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('templateModal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // 选择模板
    selectTemplate(templateId) {
        const today = this.formatDate(new Date());
        const tasks = this.applyTemplate(templateId, today);
        
        document.getElementById('templateModal')?.remove();
        
        if (tasks.length > 0) {
            Settings.showToast('success', '模板已应用', `创建了 ${tasks.length} 个任务`);
            // 刷新时间轴
            if (typeof App !== 'undefined') {
                App.renderTimeline();
            }
        }
    },
    
    // ==================== 重复任务 ====================
    
    // 添加重复任务
    addRecurringTask(task, pattern) {
        const recurring = {
            id: 'recurring_' + Date.now(),
            task: { ...task },
            pattern: pattern, // daily, weekly, monthly, custom
            customDays: pattern.customDays || [], // 0-6 表示周日到周六
            lastGenerated: null,
            enabled: true
        };
        
        this.recurring.push(recurring);
        Storage.save('adhd_recurring_tasks', this.recurring);
        return recurring;
    },
    
    // 检查并生成重复任务
    checkRecurringTasks() {
        const today = new Date();
        const todayStr = this.formatDate(today);
        const dayOfWeek = today.getDay();
        
        this.recurring.forEach(rec => {
            if (!rec.enabled) return;
            if (rec.lastGenerated === todayStr) return;
            
            let shouldGenerate = false;
            
            switch (rec.pattern.type) {
                case 'daily':
                    shouldGenerate = true;
                    break;
                case 'weekly':
                    shouldGenerate = rec.pattern.customDays.includes(dayOfWeek);
                    break;
                case 'monthly':
                    shouldGenerate = today.getDate() === rec.pattern.dayOfMonth;
                    break;
            }
            
            if (shouldGenerate) {
                const newTask = {
                    ...rec.task,
                    date: todayStr,
                    recurring: rec.id
                };
                Storage.addTask(newTask);
                rec.lastGenerated = todayStr;
            }
        });
        
        Storage.save('adhd_recurring_tasks', this.recurring);
    },
    
    // 显示重复设置
    showRecurringModal(task) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'recurringModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <span class="modal-icon">🔄</span>
                    <h2>设置重复</h2>
                </div>
                <div class="modal-body">
                    <div class="recurring-options">
                        <label class="recurring-option">
                            <input type="radio" name="recurring" value="daily">
                            <span>每天</span>
                        </label>
                        <label class="recurring-option">
                            <input type="radio" name="recurring" value="weekly">
                            <span>每周</span>
                        </label>
                        <label class="recurring-option">
                            <input type="radio" name="recurring" value="weekdays">
                            <span>工作日</span>
                        </label>
                        <label class="recurring-option">
                            <input type="radio" name="recurring" value="custom">
                            <span>自定义</span>
                        </label>
                    </div>
                    <div class="recurring-days" id="recurringDays" style="display: none;">
                        <label><input type="checkbox" value="0"> 周日</label>
                        <label><input type="checkbox" value="1"> 周一</label>
                        <label><input type="checkbox" value="2"> 周二</label>
                        <label><input type="checkbox" value="3"> 周三</label>
                        <label><input type="checkbox" value="4"> 周四</label>
                        <label><input type="checkbox" value="5"> 周五</label>
                        <label><input type="checkbox" value="6"> 周六</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('recurringModal').remove()">取消</button>
                    <button class="modal-btn btn-confirm" onclick="TaskEnhance.saveRecurring('${task.id}')">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelectorAll('input[name="recurring"]').forEach(input => {
            input.addEventListener('change', () => {
                document.getElementById('recurringDays').style.display = 
                    input.value === 'custom' ? 'flex' : 'none';
            });
        });
    },
    
    // 保存重复设置
    saveRecurring(taskId) {
        const task = Storage.getTasks().find(t => t.id === taskId);
        if (!task) return;
        
        const selected = document.querySelector('input[name="recurring"]:checked');
        if (!selected) {
            Settings.showToast('warning', '请选择重复频率', '');
            return;
        }
        
        let pattern = { type: selected.value, customDays: [] };
        
        if (selected.value === 'daily') {
            pattern.customDays = [0, 1, 2, 3, 4, 5, 6];
        } else if (selected.value === 'weekdays') {
            pattern.customDays = [1, 2, 3, 4, 5];
        } else if (selected.value === 'weekly') {
            const today = new Date().getDay();
            pattern.customDays = [today];
        } else if (selected.value === 'custom') {
            document.querySelectorAll('#recurringDays input:checked').forEach(cb => {
                pattern.customDays.push(parseInt(cb.value));
            });
        }
        
        this.addRecurringTask(task, pattern);
        document.getElementById('recurringModal').remove();
        Settings.showToast('success', '重复任务已设置', '');
    },
    
    // ==================== 任务提醒 ====================
    
    // 设置任务提醒
    setupReminders() {
        // 每分钟检查一次提醒
        setInterval(() => this.checkReminders(), 60000);
        this.checkReminders();
    },
    
    // 为任务添加提醒
    addReminder(taskId, minutesBefore) {
        const task = Storage.getTasks().find(t => t.id === taskId);
        if (!task || !task.startTime) return;
        
        const [hours, mins] = task.startTime.split(':').map(Number);
        const taskDate = new Date(task.date);
        taskDate.setHours(hours, mins, 0, 0);
        
        const reminderTime = new Date(taskDate.getTime() - minutesBefore * 60000);
        
        const reminder = {
            id: 'reminder_' + Date.now(),
            taskId,
            taskTitle: task.title,
            reminderTime: reminderTime.toISOString(),
            minutesBefore,
            notified: false
        };
        
        this.reminders.scheduled.push(reminder);
        Storage.save('adhd_scheduled_reminders', this.reminders.scheduled);
        
        return reminder;
    },
    
    // 检查提醒
    checkReminders() {
        const now = new Date();
        
        this.reminders.scheduled.forEach(reminder => {
            if (reminder.notified) return;
            
            const reminderTime = new Date(reminder.reminderTime);
            if (now >= reminderTime) {
                this.triggerReminder(reminder);
                reminder.notified = true;
            }
        });
        
        // 清理已过期的提醒
        this.reminders.scheduled = this.reminders.scheduled.filter(r => {
            const reminderTime = new Date(r.reminderTime);
            return !r.notified || (now - reminderTime) < 3600000; // 保留1小时内的
        });
        
        Storage.save('adhd_scheduled_reminders', this.reminders.scheduled);
    },
    
    // 触发提醒
    triggerReminder(reminder) {
        const message = `${reminder.minutesBefore}分钟后: ${reminder.taskTitle}`;
        
        // 显示Toast
        if (typeof Settings !== 'undefined') {
            Settings.showToast('info', '⏰ 任务提醒', message, 10000);
        }
        
        // 发送浏览器通知
        if (Notification.permission === 'granted') {
            new Notification('ADHD Focus - 任务提醒', {
                body: message,
                icon: '/icons/icon-192.png',
                tag: reminder.id,
                requireInteraction: true
            });
        }
        
        // 发送给Service Worker
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                payload: {
                    title: '⏰ 任务提醒',
                    body: message,
                    delay: 0,
                    tag: reminder.id
                }
            });
        }
    },
    
    // ==================== 撤销/回收站 ====================
    
    // 记录操作历史
    recordHistory(action, data) {
        this.history.unshift({
            action,
            data,
            timestamp: Date.now()
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    },
    
    // 撤销上一步
    undo() {
        if (this.history.length === 0) {
            Settings.showToast('info', '没有可撤销的操作', '');
            return;
        }
        
        const lastAction = this.history.shift();
        
        switch (lastAction.action) {
            case 'delete_task':
                // 恢复删除的任务
                const tasks = Storage.getTasks();
                tasks.push(lastAction.data);
                Storage.saveTasks(tasks);
                Settings.showToast('success', '已撤销删除', lastAction.data.title);
                break;
                
            case 'complete_task':
                // 取消完成
                Storage.updateTask(lastAction.data.id, { completed: false });
                Settings.showToast('success', '已撤销完成', lastAction.data.title);
                break;
                
            case 'update_task':
                // 恢复原始数据
                Storage.updateTask(lastAction.data.id, lastAction.data.original);
                Settings.showToast('success', '已撤销修改', '');
                break;
        }
        
        // 刷新界面
        if (typeof App !== 'undefined') {
            App.renderTimeline();
        }
    },
    
    // 删除任务（移到回收站）
    deleteTask(taskId) {
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        // 记录历史
        this.recordHistory('delete_task', task);
        
        // 移到回收站
        task.deletedAt = Date.now();
        this.trash.push(task);
        Storage.save('adhd_task_trash', this.trash);
        
        // 从任务列表删除
        Storage.deleteTask(taskId);
        
        // 显示撤销提示
        this.showUndoToast('任务已删除', task.title);
    },
    
    // 显示撤销Toast
    showUndoToast(title, message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-undo show';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">🗑️</span>
                <div class="toast-text">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-undo-btn" onclick="TaskEnhance.undo(); this.parentElement.parentElement.remove();">
                    撤销
                </button>
            </div>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },
    
    // 清空回收站
    emptyTrash() {
        this.trash = [];
        Storage.save('adhd_task_trash', this.trash);
        Settings.showToast('success', '回收站已清空', '');
    },
    
    // 从回收站恢复
    restoreFromTrash(taskId) {
        const index = this.trash.findIndex(t => t.id === taskId);
        if (index === -1) return;
        
        const task = this.trash.splice(index, 1)[0];
        delete task.deletedAt;
        
        const tasks = Storage.getTasks();
        tasks.push(task);
        Storage.saveTasks(tasks);
        Storage.save('adhd_task_trash', this.trash);
        
        Settings.showToast('success', '任务已恢复', task.title);
        
        if (typeof App !== 'undefined') {
            App.renderTimeline();
        }
    },
    
    // ==================== 自动备份提醒 ====================
    
    setupAutoBackupReminder() {
        const lastBackup = Storage.load('adhd_last_backup', null);
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (!lastBackup || (now - lastBackup) > sevenDays) {
            setTimeout(() => {
                this.showBackupReminder();
            }, 10000);
        }
    },
    
    showBackupReminder() {
        if (typeof Settings !== 'undefined') {
            Settings.showToast('warning', '💾 数据备份提醒', '建议定期备份数据，防止丢失', 10000);
        }
    },
    
    // ==================== 工具方法 ====================
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
    TaskEnhance.init();
});

// 导出
window.TaskEnhance = TaskEnhance;
