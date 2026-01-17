// macOS 风格 Dock 导航栏
// iOS 风格设计，支持展开/收起组件

const DockNavigation = {
    // 组件配置
    components: [
        { id: 'brainDump', emoji: '💬', name: '智能对话', color: '#FF6B9D' },
        { id: 'timeline', emoji: '📅', name: '时间轴', color: '#4A90E2' },
        { id: 'memoryBank', emoji: '🧠', name: '记忆库', color: '#9B59B6' },
        { id: 'promptPanel', emoji: '📝', name: '提示词', color: '#F39C12' },
        { id: 'gameSystem', emoji: '🎮', name: '游戏化', color: '#E74C3C' },
        { id: 'monitorPanel', emoji: '📊', name: '监控', color: '#3498DB' },
        { id: 'valuePanel', emoji: '💰', name: '价值显化', color: '#27AE60' },
        { id: 'aiInsights', emoji: '🧠', name: 'AI洞察', color: '#8E44AD' },
        { id: 'aiMemory', emoji: '💖', name: 'KiiKii', color: '#E91E63' },
        { id: 'voiceSettings', emoji: '🔊', name: '语音', color: '#FF9800' }
    ],
    
    // 当前展开的组件
    expandedComponents: new Set(),
    
    // Dock 位置 ('top', 'left', 'bottom', 'right')
    position: 'top',
    
    // 初始化
    init() {
        console.log('🚀 Dock Navigation 初始化...');
        
        // 加载保存的状态
        this.loadState();
        
        // 创建 Dock
        this.createDock();
        
        // 隐藏所有组件
        this.hideAllComponents();
        
        // 恢复上次展开的组件
        this.restoreExpandedComponents();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('✅ Dock Navigation 初始化完成');
    },
    
    // 加载保存的状态
    loadState() {
        const saved = localStorage.getItem('dock_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.position = state.position || 'top';
                this.expandedComponents = new Set(state.expanded || []);
            } catch (e) {
                console.error('加载 Dock 状态失败:', e);
            }
        }
    },
    
    // 保存状态
    saveState() {
        const state = {
            position: this.position,
            expanded: Array.from(this.expandedComponents)
        };
        localStorage.setItem('dock_state', JSON.stringify(state));
    },
    
    // 创建 Dock
    createDock() {
        // 移除旧的 Dock
        const oldDock = document.getElementById('dockNavigation');
        if (oldDock) oldDock.remove();
        
        // 创建新的 Dock
        const dock = document.createElement('div');
        dock.id = 'dockNavigation';
        dock.className = `dock-navigation dock-${this.position}`;
        
        // Dock 容器
        const dockContainer = document.createElement('div');
        dockContainer.className = 'dock-container';
        
        // 添加组件图标
        this.components.forEach(comp => {
            const item = document.createElement('div');
            item.className = 'dock-item';
            item.dataset.componentId = comp.id;
            item.style.setProperty('--item-color', comp.color);
            
            item.innerHTML = `
                <div class="dock-item-icon">
                    <span class="dock-emoji">${comp.emoji}</span>
                    <div class="dock-indicator ${this.expandedComponents.has(comp.id) ? 'active' : ''}"></div>
                </div>
                <div class="dock-item-label">${comp.name}</div>
            `;
            
            // 点击切换展开/收起
            item.addEventListener('click', () => this.toggleComponent(comp.id));
            
            // 悬停效果
            item.addEventListener('mouseenter', (e) => this.onItemHover(e, item));
            item.addEventListener('mouseleave', (e) => this.onItemLeave(e, item));
            
            dockContainer.appendChild(item);
        });
        
        // 添加设置按钮
        const settingsItem = document.createElement('div');
        settingsItem.className = 'dock-item dock-settings';
        settingsItem.innerHTML = `
            <div class="dock-item-icon">
                <span class="dock-emoji">⚙️</span>
            </div>
            <div class="dock-item-label">设置</div>
        `;
        settingsItem.addEventListener('click', () => this.showDockSettings());
        dockContainer.appendChild(settingsItem);
        
        dock.appendChild(dockContainer);
        document.body.appendChild(dock);
    },
    
    // 隐藏所有组件
    hideAllComponents() {
        this.components.forEach(comp => {
            const element = document.getElementById(comp.id);
            if (element) {
                element.classList.add('dock-hidden');
            }
        });
    },
    
    // 恢复展开的组件
    restoreExpandedComponents() {
        this.expandedComponents.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('dock-hidden');
                element.classList.add('dock-expanded');
            }
        });
    },
    
    // 切换组件展开/收起
    toggleComponent(componentId) {
        const element = document.getElementById(componentId);
        if (!element) return;
        
        const isExpanded = this.expandedComponents.has(componentId);
        
        if (isExpanded) {
            // 收起
            this.collapseComponent(componentId);
        } else {
            // 展开
            this.expandComponent(componentId);
        }
        
        // 更新指示器
        this.updateIndicator(componentId);
        
        // 保存状态
        this.saveState();
        
        // 播放音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('click');
        }
    },
    
    // 展开组件
    expandComponent(componentId) {
        const element = document.getElementById(componentId);
        if (!element) return;
        
        // 添加展开动画
        element.classList.remove('dock-hidden');
        element.classList.add('dock-expanding');
        
        setTimeout(() => {
            element.classList.remove('dock-expanding');
            element.classList.add('dock-expanded');
        }, 300);
        
        this.expandedComponents.add(componentId);
        
        // 调整组件位置（避免重叠）
        this.adjustComponentPosition(componentId);
    },
    
    // 收起组件
    collapseComponent(componentId) {
        const element = document.getElementById(componentId);
        if (!element) return;
        
        // 添加收起动画
        element.classList.add('dock-collapsing');
        element.classList.remove('dock-expanded');
        
        setTimeout(() => {
            element.classList.remove('dock-collapsing');
            element.classList.add('dock-hidden');
        }, 300);
        
        this.expandedComponents.delete(componentId);
    },
    
    // 更新指示器
    updateIndicator(componentId) {
        const item = document.querySelector(`.dock-item[data-component-id="${componentId}"]`);
        if (!item) return;
        
        const indicator = item.querySelector('.dock-indicator');
        if (!indicator) return;
        
        if (this.expandedComponents.has(componentId)) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    },
    
    // 调整组件位置（智能布局）
    adjustComponentPosition(componentId) {
        const element = document.getElementById(componentId);
        if (!element) return;
        
        // 获取所有已展开的组件
        const expanded = Array.from(this.expandedComponents);
        const index = expanded.indexOf(componentId);
        
        // 根据 Dock 位置调整组件布局
        if (this.position === 'top') {
            // 顶部 Dock：组件从上往下排列
            const topOffset = 80 + (index * 20); // 80px 是 Dock 高度
            element.style.top = topOffset + 'px';
        } else if (this.position === 'left') {
            // 左侧 Dock：组件从左往右排列
            const leftOffset = 80 + (index * 20);
            element.style.left = leftOffset + 'px';
        }
    },
    
    // 鼠标悬停效果
    onItemHover(e, item) {
        // macOS Dock 放大效果
        item.classList.add('dock-item-hover');
        
        // 相邻项目也有轻微放大
        const prev = item.previousElementSibling;
        const next = item.nextElementSibling;
        
        if (prev && prev.classList.contains('dock-item')) {
            prev.classList.add('dock-item-neighbor');
        }
        if (next && next.classList.contains('dock-item')) {
            next.classList.add('dock-item-neighbor');
        }
    },
    
    // 鼠标离开效果
    onItemLeave(e, item) {
        item.classList.remove('dock-item-hover');
        
        // 移除相邻项目的效果
        const prev = item.previousElementSibling;
        const next = item.nextElementSibling;
        
        if (prev) prev.classList.remove('dock-item-neighbor');
        if (next) next.classList.remove('dock-item-neighbor');
    },
    
    // 显示 Dock 设置
    showDockSettings() {
        const modal = document.createElement('div');
        modal.className = 'dock-settings-modal';
        modal.innerHTML = `
            <div class="dock-settings-content">
                <div class="dock-settings-header">
                    <span class="dock-settings-title">⚙️ Dock 设置</span>
                    <button class="dock-settings-close" onclick="DockNavigation.closeDockSettings()">×</button>
                </div>
                <div class="dock-settings-body">
                    <div class="dock-setting-item">
                        <span class="dock-setting-label">📍 Dock 位置</span>
                        <div class="dock-position-options">
                            <button class="dock-position-btn ${this.position === 'top' ? 'active' : ''}" data-position="top">
                                <span>⬆️</span>
                                <span>顶部</span>
                            </button>
                            <button class="dock-position-btn ${this.position === 'left' ? 'active' : ''}" data-position="left">
                                <span>⬅️</span>
                                <span>左侧</span>
                            </button>
                            <button class="dock-position-btn ${this.position === 'bottom' ? 'active' : ''}" data-position="bottom">
                                <span>⬇️</span>
                                <span>底部</span>
                            </button>
                            <button class="dock-position-btn ${this.position === 'right' ? 'active' : ''}" data-position="right">
                                <span>➡️</span>
                                <span>右侧</span>
                            </button>
                        </div>
                    </div>
                    <div class="dock-setting-item">
                        <span class="dock-setting-label">🎨 快捷操作</span>
                        <div class="dock-quick-actions">
                            <button class="dock-action-btn" onclick="DockNavigation.expandAll()">
                                <span>📂</span>
                                <span>展开全部</span>
                            </button>
                            <button class="dock-action-btn" onclick="DockNavigation.collapseAll()">
                                <span>📁</span>
                                <span>收起全部</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定位置切换事件
        modal.querySelectorAll('.dock-position-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const position = btn.dataset.position;
                this.changePosition(position);
                this.closeDockSettings();
            });
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDockSettings();
            }
        });
        
        // 添加显示动画
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 关闭 Dock 设置
    closeDockSettings() {
        const modal = document.querySelector('.dock-settings-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 改变 Dock 位置
    changePosition(newPosition) {
        this.position = newPosition;
        this.saveState();
        this.createDock();
        this.restoreExpandedComponents();
        
        // 播放音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('success');
        }
    },
    
    // 展开全部
    expandAll() {
        this.components.forEach(comp => {
            if (!this.expandedComponents.has(comp.id)) {
                this.expandComponent(comp.id);
                this.updateIndicator(comp.id);
            }
        });
        this.saveState();
        this.closeDockSettings();
    },
    
    // 收起全部
    collapseAll() {
        Array.from(this.expandedComponents).forEach(id => {
            this.collapseComponent(id);
            this.updateIndicator(id);
        });
        this.saveState();
        this.closeDockSettings();
    },
    
    // 绑定事件
    bindEvents() {
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + D: 切换 Dock
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleDock();
            }
            
            // Cmd/Ctrl + 数字: 快速切换组件
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (index < this.components.length) {
                    this.toggleComponent(this.components[index].id);
                }
            }
        });
    },
    
    // 切换 Dock 显示/隐藏
    toggleDock() {
        const dock = document.getElementById('dockNavigation');
        if (dock) {
            dock.classList.toggle('dock-hidden-temp');
        }
    }
};

// 导出
window.DockNavigation = DockNavigation;

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他组件已加载
    setTimeout(() => DockNavigation.init(), 500);
});

