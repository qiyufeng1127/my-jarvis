// ============================================================
// 主应用入口 v4.0
// 整合所有模块，统一初始化
// ============================================================

const AppMain = {
    version: '4.0.0',
    initialized: false,
    
    // 模块加载顺序
    modules: [
        { name: 'GlobalState', init: () => GlobalState?.init?.() },
        { name: 'UnifiedAPI', init: () => UnifiedAPI?.init?.() },
        { name: 'FinanceSystem', init: () => FinanceSystem?.init?.() },
        { name: 'MonitorSystem', init: () => MonitorSystem?.init?.() },
        { name: 'VoiceAssistant', init: () => VoiceAssistant?.init?.() },
        { name: 'UniversalInput', init: () => UniversalInput?.init?.() }
    ],
    
    // ==================== 初始化 ====================
    
    async init() {
        if (this.initialized) return;
        
        console.log('========================================');
        console.log(`ADHD Focus v${this.version} 启动中...`);
        console.log('========================================');
        
        try {
            // 1. 初始化核心模块
            for (const module of this.modules) {
                try {
                    if (typeof window[module.name] !== 'undefined') {
                        await module.init();
                        console.log(`✓ ${module.name} 已加载`);
                    } else {
                        console.warn(`○ ${module.name} 未找到`);
                    }
                } catch (e) {
                    console.error(`✗ ${module.name} 加载失败:`, e);
                }
            }
            
            // 2. 兼容旧版App对象
            this.setupCompatibility();
            
            // 3. 绑定全局事件
            this.bindGlobalEvents();
            
            // 4. 加载用户数据
            this.loadUserData();
            
            // 5. 更新UI
            this.updateAllUI();
            
            this.initialized = true;
            console.log('========================================');
            console.log('ADHD Focus 启动完成！');
            console.log('========================================');
            
            // 显示欢迎消息
            this.showWelcome();
            
        } catch (e) {
            console.error('应用初始化失败:', e);
        }
    },
    
    // ==================== 兼容性设置 ====================
    
    setupCompatibility() {
        // 确保App对象存在并扩展
        if (typeof window.App === 'undefined') {
            window.App = {};
        }
        
        // 扩展App方法
        Object.assign(window.App, {
            // 更新游戏状态显示
            updateGameStatus: () => {
                const coinsEl = document.getElementById('coinsDisplay');
                const energyEl = document.getElementById('energyDisplay');
                
                if (coinsEl && typeof GlobalState !== 'undefined') {
                    coinsEl.textContent = GlobalState.coins.balance;
                }
                if (energyEl && typeof GlobalState !== 'undefined') {
                    energyEl.textContent = GlobalState.game.energy;
                }
            },
            
            // 加载时间轴
            loadTimeline: () => {
                if (typeof Timeline !== 'undefined' && Timeline.render) {
                    Timeline.render();
                } else if (typeof loadTimeline === 'function') {
                    loadTimeline();
                }
            },
            
            // 加载价值面板
            loadValuePanel: () => {
                const panel = document.getElementById('valueBody');
                if (panel && typeof FinanceSystem !== 'undefined') {
                    panel.innerHTML = FinanceSystem.renderValuePanel();
                }
            },
            
            // 加载监控面板
            loadMonitorPanel: () => {
                // 由MonitorSystem处理
            },
            
            // 添加聊天消息
            addChatMessage: (role, content, avatar) => {
                const container = document.getElementById('chatMessages');
                if (!container) return;
                
                const msg = document.createElement('div');
                msg.className = `chat-message ${role}`;
                msg.innerHTML = `
                    <span class="message-avatar">${avatar || (role === 'user' ? '👤' : '🤖')}</span>
                    <div class="message-content">${content.replace(/\n/g, '<br>')}</div>
                `;
                container.appendChild(msg);
                container.scrollTop = container.scrollHeight;
            },
            
            // 发送消息
            sendMessage: async (text) => {
                if (!text?.trim()) return;
                
                App.addChatMessage('user', text, '👤');
                
                if (typeof UnifiedAPI !== 'undefined') {
                    try {
                        const response = await UnifiedAPI.chat(text);
                        App.addChatMessage('assistant', response, '🤖');
                    } catch (e) {
                        App.addChatMessage('system', '抱歉，处理消息时出错了', '❌');
                    }
                }
            },
            
            // 显示奖励面板
            showRewardsPanel: () => {
                if (typeof RewardsPanel !== 'undefined') {
                    RewardsPanel.show();
                }
            }
        });
        
        // 兼容Storage
        if (typeof window.Storage === 'undefined') {
            window.Storage = {
                getTasks: () => GlobalState?.tasks || [],
                saveTasks: (tasks) => { if (GlobalState) GlobalState.tasks = tasks; GlobalState?.saveToStorage(); },
                getCoins: () => GlobalState?.coins?.balance || 0
            };
        }
    },
    
    // ==================== 全局事件 ====================
    
    bindGlobalEvents() {
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onPageVisible();
            }
        });
        
        // 窗口大小变化
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });
        
        // 在线/离线状态
        window.addEventListener('online', () => {
            UIComponents?.toast?.success('网络已连接', '');
        });
        
        window.addEventListener('offline', () => {
            UIComponents?.toast?.warning('网络已断开', '部分功能可能不可用');
        });
    },
    
    onPageVisible() {
        // 刷新数据
        if (typeof GlobalState !== 'undefined') {
            GlobalState.loadFromStorage();
        }
        this.updateAllUI();
    },
    
    handleResize() {
        // 响应式处理
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile-view', isMobile);
    },
    
    handleGlobalKeydown(e) {
        // Ctrl/Cmd + K: 聚焦输入框
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('universalInputField')?.focus();
        }
        
        // Ctrl/Cmd + Enter: 快速完成当前任务
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (typeof MonitorSystem !== 'undefined' && MonitorSystem.currentTask) {
                MonitorSystem.completeStep();
            }
        }
    },
    
    // ==================== 数据加载 ====================
    
    loadUserData() {
        // 从GlobalState加载
        if (typeof GlobalState !== 'undefined') {
            GlobalState.loadFromStorage();
        }
    },
    
    // ==================== UI更新 ====================
    
    updateAllUI() {
        // 更新游戏状态
        App?.updateGameStatus?.();
        
        // 更新时间轴
        App?.loadTimeline?.();
        
        // 更新价值面板
        App?.loadValuePanel?.();
        
        // 响应式检查
        this.handleResize();
    },
    
    // ==================== 欢迎消息 ====================
    
    showWelcome() {
        const hour = new Date().getHours();
        let greeting = '你好';
        
        if (hour < 6) greeting = '夜深了';
        else if (hour < 9) greeting = '早上好';
        else if (hour < 12) greeting = '上午好';
        else if (hour < 14) greeting = '中午好';
        else if (hour < 18) greeting = '下午好';
        else if (hour < 22) greeting = '晚上好';
        else greeting = '夜深了';
        
        const userName = GlobalState?.user?.name || '朋友';
        const coins = GlobalState?.coins?.balance || 0;
        const todayTasks = GlobalState?.getTodayTasks?.() || [];
        const completedTasks = todayTasks.filter(t => t.completed).length;
        
        setTimeout(() => {
            App?.addChatMessage?.('assistant', 
                `${greeting}，${userName}！✨\n\n` +
                `💰 当前金币：${coins}\n` +
                `📋 今日任务：${completedTasks}/${todayTasks.length} 已完成\n\n` +
                `有什么我可以帮你的吗？`,
                '🤖'
            );
        }, 500);
    },
    
    // ==================== 工具方法 ====================
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保所有脚本加载完成
    setTimeout(() => AppMain.init(), 100);
});

// 导出
window.AppMain = AppMain;

