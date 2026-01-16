// 教程链接处理模块
// 处理从教程页面跳转过来的高亮请求

const TutorialLink = {
    // 组件ID映射
    componentMap: {
        'smart-input': 'smartInput',
        'timeline': 'timeline',
        'memory-bank': 'memoryBank',
        'prompt-panel': 'promptPanel',
        'game-system': 'gameSystem',
        'monitor': 'monitorPanel',
        'value-panel': 'valuePanel',
        'ai-insights': 'aiInsights',
        'ai-memory': 'aiMemory',
        'voice-settings': 'voiceSettings',
        'brain-dump': 'brainDump',
        'settings': 'settingsPanel'
    },
    
    // 功能操作映射
    actionMap: {
        'open-settings': () => {
            const panel = document.getElementById('settingsPanel');
            if (panel && !panel.classList.contains('active')) {
                toggleSettingsPanel();
            }
        },
        'open-api-key': () => {
            showApiKeyModal();
        },
        'open-rewards': () => {
            if (typeof App !== 'undefined' && App.showRewardShop) {
                App.showRewardShop();
            }
        },
        'open-voice': () => {
            TutorialLink.highlightComponent('voiceSettings');
        },
        'start-timer': () => {
            // 聚焦到输入框并提示
            const input = document.querySelector('.smart-input-field');
            if (input) {
                input.focus();
                input.placeholder = '试试输入: 开始25分钟专注';
            }
        },
        'add-task': () => {
            const input = document.querySelector('.smart-input-field');
            if (input) {
                input.focus();
                input.placeholder = '试试输入: 3点开会';
            }
        },
        'add-income': () => {
            const input = document.querySelector('.smart-input-field');
            if (input) {
                input.focus();
                input.placeholder = '试试输入: 收入1500元';
            }
        },
        'export-data': () => {
            TutorialLink.actionMap['open-settings']();
            setTimeout(() => {
                const exportBtn = document.querySelector('.backup-btn');
                if (exportBtn) {
                    TutorialLink.pulseElement(exportBtn);
                }
            }, 300);
        },
        'import-data': () => {
            TutorialLink.actionMap['open-settings']();
            setTimeout(() => {
                const importBtn = document.querySelector('.backup-btn.restore');
                if (importBtn) {
                    TutorialLink.pulseElement(importBtn);
                }
            }, 300);
        }
    },
    
    // 初始化 - 检查URL参数
    init() {
        const params = new URLSearchParams(window.location.search);
        const highlight = params.get('highlight');
        const action = params.get('action');
        
        if (highlight) {
            // 延迟执行，等待页面加载完成
            setTimeout(() => {
                this.highlightComponent(highlight);
            }, 500);
        }
        
        if (action && this.actionMap[action]) {
            setTimeout(() => {
                this.actionMap[action]();
            }, 600);
        }
        
        // 清除URL参数，避免刷新时重复触发
        if (highlight || action) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    },
    
    // 高亮组件
    highlightComponent(componentKey) {
        const componentId = this.componentMap[componentKey] || componentKey;
        const element = document.getElementById(componentId);
        
        if (!element) {
            console.warn('Component not found:', componentKey);
            return;
        }
        
        // 如果是移动端，先切换到对应视图
        if (window.innerWidth <= 768 && typeof MobileApp !== 'undefined') {
            MobileApp.switchView(componentId);
        }
        
        // 滚动到元素位置
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 添加高亮动画
        this.pulseElement(element);
        
        // 如果组件是最小化状态，展开它
        if (element.classList.contains('minimized')) {
            const minimizeBtn = element.querySelector('.btn-minimize');
            if (minimizeBtn) minimizeBtn.click();
        }
    },
    
    // 脉冲高亮效果
    pulseElement(element) {
        // 移除之前的高亮
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // 添加高亮类
        element.classList.add('tutorial-highlight');
        
        // 3秒后移除高亮
        setTimeout(() => {
            element.classList.remove('tutorial-highlight');
        }, 3000);
    },
    
    // 显示提示气泡
    showTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tutorial-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <span class="tooltip-icon">👆</span>
                <span class="tooltip-text">${message}</span>
            </div>
            <div class="tooltip-arrow"></div>
        `;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.top = (rect.top - 60) + 'px';
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.zIndex = '10000';
        
        document.body.appendChild(tooltip);
        
        // 3秒后移除
        setTimeout(() => {
            tooltip.remove();
        }, 3000);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    TutorialLink.init();
});

