// 设置与工具模块
const Settings = {
    // 初始化
    init() {
        this.loadTheme();
        this.loadNotificationSetting();
        this.initKeyboardShortcuts();
        this.checkFirstVisit();
        this.initThemeToggle();
    },

    // ==================== 主题切换 ====================
    
    loadTheme() {
        const savedTheme = localStorage.getItem('adhd-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
        this.updateDarkModeSwitch(savedTheme === 'dark');
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('adhd-theme', newTheme);
        this.updateThemeToggleIcon(newTheme);
        this.updateDarkModeSwitch(newTheme === 'dark');
        this.showToast('success', '主题已切换', newTheme === 'dark' ? '已切换到深色模式' : '已切换到浅色模式');
    },

    updateThemeToggleIcon(theme) {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    updateDarkModeSwitch(isDark) {
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.classList.toggle('active', isDark);
        }
    },

    initThemeToggle() {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggleTheme());
        }
    },

    // ==================== 通知设置 ====================

    loadNotificationSetting() {
        const enabled = localStorage.getItem('adhd-notifications') === 'true';
        this.updateNotificationSwitch(enabled);
    },

    async toggleNotifications() {
        const toggle = document.getElementById('notificationToggle');
        const isCurrentlyEnabled = toggle?.classList.contains('active');
        
        if (!isCurrentlyEnabled) {
            // 请求通知权限
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    localStorage.setItem('adhd-notifications', 'true');
                    this.updateNotificationSwitch(true);
                    this.showToast('success', '通知已开启', '你将收到任务提醒通知');
                } else {
                    this.showToast('warning', '权限被拒绝', '请在浏览器设置中允许通知');
                }
            } else {
                this.showToast('error', '不支持', '你的浏览器不支持通知功能');
            }
        } else {
            localStorage.setItem('adhd-notifications', 'false');
            this.updateNotificationSwitch(false);
            this.showToast('info', '通知已关闭', '你将不再收到提醒通知');
        }
    },

    updateNotificationSwitch(enabled) {
        const toggle = document.getElementById('notificationToggle');
        if (toggle) {
            toggle.classList.toggle('active', enabled);
        }
    },

    // 发送浏览器通知
    sendNotification(title, body, icon = '🔔') {
        const enabled = localStorage.getItem('adhd-notifications') === 'true';
        if (enabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
                badge: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>`
            });
        }
    },

    // ==================== 数据备份与恢复 ====================

    exportData() {
        const data = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            tasks: JSON.parse(localStorage.getItem('adhd-tasks') || '[]'),
            memories: JSON.parse(localStorage.getItem('adhd-memories') || '[]'),
            gameState: JSON.parse(localStorage.getItem('adhd-game-state') || '{}'),
            userProfile: JSON.parse(localStorage.getItem('adhd-user-profile') || '{}'),
            aiMemory: JSON.parse(localStorage.getItem('adhd-ai-memory') || '{}'),
            aiLearning: JSON.parse(localStorage.getItem('adhd-ai-learning') || '{}'),
            aiFinance: JSON.parse(localStorage.getItem('adhd-ai-finance') || '{}'),
            settings: {
                theme: localStorage.getItem('adhd-theme'),
                notifications: localStorage.getItem('adhd-notifications')
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adhd-focus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('success', '导出成功', '数据已保存到文件');
    },

    importData() {
        document.getElementById('importFileInput').click();
    },

    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.version) {
                    throw new Error('无效的备份文件');
                }

                // 恢复数据
                if (data.tasks) localStorage.setItem('adhd-tasks', JSON.stringify(data.tasks));
                if (data.memories) localStorage.setItem('adhd-memories', JSON.stringify(data.memories));
                if (data.gameState) localStorage.setItem('adhd-game-state', JSON.stringify(data.gameState));
                if (data.userProfile) localStorage.setItem('adhd-user-profile', JSON.stringify(data.userProfile));
                if (data.aiMemory) localStorage.setItem('adhd-ai-memory', JSON.stringify(data.aiMemory));
                if (data.aiLearning) localStorage.setItem('adhd-ai-learning', JSON.stringify(data.aiLearning));
                if (data.aiFinance) localStorage.setItem('adhd-ai-finance', JSON.stringify(data.aiFinance));
                
                if (data.settings) {
                    if (data.settings.theme) localStorage.setItem('adhd-theme', data.settings.theme);
                    if (data.settings.notifications) localStorage.setItem('adhd-notifications', data.settings.notifications);
                }

                this.showToast('success', '导入成功', '数据已恢复，页面将刷新');
                
                setTimeout(() => {
                    location.reload();
                }, 1500);

            } catch (err) {
                this.showToast('error', '导入失败', err.message || '文件格式错误');
            }
        };
        reader.readAsText(file);
        
        // 清空input以便再次选择同一文件
        event.target.value = '';
    },

    // ==================== 键盘快捷键 ====================

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + N: 新建任务（聚焦输入框）
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const input = document.getElementById('chatInput');
                if (input) {
                    input.focus();
                    input.placeholder = '输入新任务...';
                }
            }
            
            // Ctrl + D: 切换主题
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Ctrl + ,: 打开设置
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                this.toggleSettingsPanel();
            }
            
            // Ctrl + /: 显示快捷键
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.toggleShortcutsHint();
            }
            
            // Escape: 关闭弹窗
            if (e.key === 'Escape') {
                this.closeAllPanels();
            }
        });
    },

    toggleShortcutsHint() {
        const hint = document.getElementById('shortcutsHint');
        if (hint) {
            hint.classList.toggle('show');
            // 3秒后自动隐藏
            if (hint.classList.contains('show')) {
                setTimeout(() => {
                    hint.classList.remove('show');
                }, 5000);
            }
        }
    },

    // ==================== 设置面板 ====================

    toggleSettingsPanel() {
        const panel = document.getElementById('settingsPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    },

    closeAllPanels() {
        document.getElementById('settingsPanel')?.classList.remove('show');
        document.getElementById('shortcutsHint')?.classList.remove('show');
        document.getElementById('onboardingOverlay')?.classList.remove('show');
    },

    // ==================== 首次引导 ====================

    onboardingSteps: [
        {
            icon: '👋',
            title: '欢迎使用 ADHD Focus!',
            desc: '这是一个专为ADHD人群设计的智能任务管理系统，让我来带你快速了解~',
            features: [
                { icon: '💬', text: '用自然语言告诉 KiiKii 你想做什么' },
                { icon: '🎮', text: '完成任务获得金币，游戏化激励' },
                { icon: '🧠', text: 'AI学习你的习惯，越用越懂你' }
            ],
            btnText: '开始体验 →'
        },
        {
            icon: '💬',
            title: '智能对话',
            desc: '在左侧的对话框中，你可以用自然语言描述任务，比如"明天下午3点开会"，KiiKii会自动理解并添加到时间轴。',
            features: [
                { icon: '🗣️', text: '支持自然语言，像聊天一样添加任务' },
                { icon: '🎯', text: 'AI自动拆解复杂任务为小步骤' },
                { icon: '💭', text: '记录你的情绪和想法' }
            ],
            btnText: '继续 →'
        },
        {
            icon: '🚀',
            title: '准备好了！',
            desc: '现在你可以开始使用了！记住，KiiKii会随着你的使用越来越了解你，给你更个性化的建议。',
            features: [
                { icon: '⌨️', text: '按 Ctrl+/ 查看快捷键' },
                { icon: '🌙', text: '按 Ctrl+D 切换深色模式' },
                { icon: '💾', text: '在设置中可以备份你的数据' }
            ],
            btnText: '开始使用 🎉'
        }
    ],

    currentOnboardingStep: 0,

    checkFirstVisit() {
        const hasVisited = localStorage.getItem('adhd-onboarding-complete');
        if (!hasVisited) {
            setTimeout(() => {
                this.showOnboarding();
            }, 500);
        }
    },

    showOnboarding() {
        this.currentOnboardingStep = 0;
        this.renderOnboardingStep();
        document.getElementById('onboardingOverlay')?.classList.add('show');
    },

    renderOnboardingStep() {
        const step = this.onboardingSteps[this.currentOnboardingStep];
        if (!step) return;

        document.getElementById('onboardingIcon').textContent = step.icon;
        document.getElementById('onboardingTitle').textContent = step.title;
        document.getElementById('onboardingDesc').textContent = step.desc;
        document.getElementById('onboardingNextBtn').textContent = step.btnText;

        const featuresContainer = document.getElementById('onboardingFeatures');
        featuresContainer.innerHTML = step.features.map(f => `
            <div class="onboarding-feature">
                <span class="onboarding-feature-icon">${f.icon}</span>
                <span>${f.text}</span>
            </div>
        `).join('');

        // 更新进度点
        document.querySelectorAll('.onboarding-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentOnboardingStep);
        });
    },

    nextOnboardingStep() {
        this.currentOnboardingStep++;
        if (this.currentOnboardingStep >= this.onboardingSteps.length) {
            this.completeOnboarding();
        } else {
            this.renderOnboardingStep();
        }
    },

    skipOnboarding() {
        this.completeOnboarding();
    },

    completeOnboarding() {
        localStorage.setItem('adhd-onboarding-complete', 'true');
        document.getElementById('onboardingOverlay')?.classList.remove('show');
        this.showToast('success', '欢迎！', '开始你的高效之旅吧~');
    },

    resetOnboarding() {
        localStorage.removeItem('adhd-onboarding-complete');
        this.toggleSettingsPanel();
        this.showOnboarding();
    },

    // ==================== Toast通知 ====================

    showToast(type, title, message, duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// 全局函数（供HTML onclick调用）
function toggleDarkMode() {
    Settings.toggleTheme();
}

function toggleNotifications() {
    Settings.toggleNotifications();
}

function exportData() {
    Settings.exportData();
}

function importData() {
    Settings.importData();
}

function handleImportFile(event) {
    Settings.handleImportFile(event);
}

function toggleSettingsPanel() {
    Settings.toggleSettingsPanel();
}

function skipOnboarding() {
    Settings.skipOnboarding();
}

function nextOnboardingStep() {
    Settings.nextOnboardingStep();
}

function resetOnboarding() {
    Settings.resetOnboarding();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    Settings.init();
});

