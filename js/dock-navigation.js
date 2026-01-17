// macOS 风格 Dock 导航栏
// iOS 风格设计，支持展开/收起组件

const DockNavigation = {
    // 组件配置（emoji 不重复）
    components: [
        { id: 'brainDump', emoji: '💬', name: '智能对话', color: '#FF6B9D' },
        { id: 'timeline', emoji: '📅', name: '时间轴', color: '#4A90E2' },
        { id: 'memoryBank', emoji: '🗂️', name: '记忆库', color: '#9B59B6' },
        { id: 'promptPanel', emoji: '📝', name: '提示词', color: '#F39C12' },
        { id: 'gameSystem', emoji: '🎮', name: '游戏化', color: '#E74C3C' },
        { id: 'monitorPanel', emoji: '📊', name: '监控', color: '#3498DB' },
        { id: 'valuePanel', emoji: '💰', name: '价值显化', color: '#27AE60' },
        { id: 'aiInsights', emoji: '🔮', name: 'AI洞察', color: '#8E44AD' },
        { id: 'aiMemory', emoji: '💖', name: 'KiiKii', color: '#E91E63' },
        { id: 'voiceSettings', emoji: '🔊', name: '语音', color: '#FF9800' }
    ],
    
    // 当前展开的组件
    expandedComponents: new Set(),
    
    // Dock 位置
    position: 'top',
    
    // 拖拽状态
    dragState: {
        dragging: false,
        draggedIndex: null,
        draggedElement: null,
        startX: 0,
        startY: 0,
        longPressTimer: null
    },
    
    // 判断是否为移动端
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    // 初始化
    init() {
        console.log('🚀 Dock Navigation 初始化...');
        console.log('是否移动端:', this.isMobile());
        console.log('窗口宽度:', window.innerWidth);
        
        // 加载保存的状态
        this.loadState();
        
        console.log('加载的位置:', this.position);
        console.log('展开的组件:', Array.from(this.expandedComponents));
        
        // 创建 Dock
        this.createDock();
        
        // 隐藏所有组件
        this.hideAllComponents();
        
        // 移动端默认不展开任何组件
        if (this.isMobile()) {
            this.expandedComponents.clear();
            console.log('移动端：清空展开组件列表');
        } else {
            // 桌面端恢复上次展开的组件
            this.restoreExpandedComponents();
        }
        
        // 绑定事件
        this.bindEvents();
        
        // 隐藏旧的UI元素
        this.hideOldUIElements();
        
        console.log('✅ Dock Navigation 初始化完成');
    },
    
    // 隐藏旧的UI元素
    hideOldUIElements() {
        // 隐藏右下角的加号按钮
        const fab = document.getElementById('mobileFab');
        if (fab) fab.style.display = 'none';
        
        // 隐藏右上角的帮助按钮
        const helpBtn = document.getElementById('helpToggle');
        if (helpBtn) helpBtn.style.display = 'none';
        
        // 隐藏旧的设置按钮
        const settingsBtn = document.getElementById('settingsToggle');
        if (settingsBtn) settingsBtn.style.display = 'none';
        
        // 隐藏移动端底部导航
        const mobileNav = document.getElementById('mobileNav');
        if (mobileNav) mobileNav.style.display = 'none';
    },
    
    // 加载保存的状态
    loadState() {
        const saved = localStorage.getItem('dock_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // 移动端默认底部，桌面端默认顶部
                this.position = state.position || (this.isMobile() ? 'bottom' : 'top');
                this.expandedComponents = new Set(state.expanded || []);
                // 加载组件顺序
                if (state.componentOrder && state.componentOrder.length > 0) {
                    const orderedComponents = [];
                    state.componentOrder.forEach(id => {
                        const comp = this.components.find(c => c.id === id);
                        if (comp) orderedComponents.push(comp);
                    });
                    // 添加新组件（如果有）
                    this.components.forEach(comp => {
                        if (!orderedComponents.find(c => c.id === comp.id)) {
                            orderedComponents.push(comp);
                        }
                    });
                    this.components = orderedComponents;
                }
            } catch (e) {
                console.error('加载 Dock 状态失败:', e);
                this.position = this.isMobile() ? 'bottom' : 'top';
            }
        } else {
            // 首次加载，移动端默认底部
            this.position = this.isMobile() ? 'bottom' : 'top';
        }
    },
    
    // 保存状态
    saveState() {
        const state = {
            position: this.position,
            expanded: Array.from(this.expandedComponents),
            componentOrder: this.components.map(c => c.id)
        };
        localStorage.setItem('dock_state', JSON.stringify(state));
    },
    
    // 创建 Dock
    createDock() {
        // 移除旧的 Dock
        const oldDock = document.getElementById('dockNavigation');
        if (oldDock) oldDock.remove();
        
        // 移动端强制底部
        if (this.isMobile()) {
            this.position = 'bottom';
        }
        
        // 创建新的 Dock
        const dock = document.createElement('div');
        dock.id = 'dockNavigation';
        dock.className = `dock-navigation dock-${this.position}`;
        
        // Dock 容器
        const dockContainer = document.createElement('div');
        dockContainer.className = 'dock-container';
        
        // 添加组件图标
        this.components.forEach((comp, index) => {
            const item = this.createDockItem(comp, index);
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
        
        console.log('Dock 创建完成，位置:', this.position, '移动端:', this.isMobile());
    },
    
    // 创建 Dock 项目
    createDockItem(comp, index) {
        const item = document.createElement('div');
        item.className = 'dock-item';
        item.dataset.componentId = comp.id;
        item.dataset.index = index;
        item.style.setProperty('--item-color', comp.color);
        
        item.innerHTML = `
            <div class="dock-item-icon">
                <span class="dock-emoji">${comp.emoji}</span>
                <div class="dock-indicator ${this.expandedComponents.has(comp.id) ? 'active' : ''}"></div>
            </div>
            <div class="dock-item-label">${comp.name}</div>
        `;
        
        // 点击切换展开/收起
        item.addEventListener('click', (e) => {
            if (!this.dragState.dragging) {
                this.toggleComponent(comp.id);
            }
        });
        
        // 桌面端悬停效果
        if (!this.isMobile()) {
            item.addEventListener('mouseenter', (e) => this.onItemHover(e, item));
            item.addEventListener('mouseleave', (e) => this.onItemLeave(e, item));
        }
        
        // 长按拖拽（移动端和桌面端都支持）
        this.addDragListeners(item, index);
        
        return item;
    },
    
    // 添加拖拽监听器
    addDragListeners(item, index) {
        let longPressTimer = null;
        let startX = 0;
        let startY = 0;
        
        // 触摸开始 / 鼠标按下
        const startDrag = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            
            // 长按500ms开始拖拽
            longPressTimer = setTimeout(() => {
                this.startDragging(item, index);
                // 震动反馈（移动端）
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 500);
        };
        
        // 移动
        const moveDrag = (e) => {
            if (longPressTimer) {
                const touch = e.touches ? e.touches[0] : e;
                const moveX = Math.abs(touch.clientX - startX);
                const moveY = Math.abs(touch.clientY - startY);
                
                // 如果移动超过10px，取消长按
                if (moveX > 10 || moveY > 10) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }
            
            if (this.dragState.dragging && this.dragState.draggedIndex === index) {
                this.onDragMove(e);
            }
        };
        
        // 结束
        const endDrag = (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            if (this.dragState.dragging && this.dragState.draggedIndex === index) {
                this.endDragging();
            }
        };
        
        // 绑定事件
        item.addEventListener('touchstart', startDrag, { passive: true });
        item.addEventListener('touchmove', moveDrag, { passive: false });
        item.addEventListener('touchend', endDrag);
        item.addEventListener('touchcancel', endDrag);
        
        item.addEventListener('mousedown', startDrag);
        item.addEventListener('mousemove', moveDrag);
        item.addEventListener('mouseup', endDrag);
    },
    
    // 开始拖拽
    startDragging(item, index) {
        this.dragState.dragging = true;
        this.dragState.draggedIndex = index;
        this.dragState.draggedElement = item;
        
        item.classList.add('dock-item-dragging');
        
        // 添加拖拽提示
        const container = document.querySelector('.dock-container');
        if (container) {
            container.classList.add('dock-dragging-active');
        }
    },
    
    // 拖拽移动
    onDragMove(e) {
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        const container = document.querySelector('.dock-container');
        if (!container) return;
        
        // 获取所有 dock-item（不包括设置按钮）
        const items = Array.from(container.querySelectorAll('.dock-item:not(.dock-settings)'));
        
        // 找到鼠标/触摸位置下的项目
        let targetIndex = -1;
        items.forEach((item, idx) => {
            const rect = item.getBoundingClientRect();
            const isHorizontal = this.position === 'top' || this.position === 'bottom';
            
            if (isHorizontal) {
                if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
                    targetIndex = idx;
                }
            } else {
                if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    targetIndex = idx;
                }
            }
        });
        
        // 如果找到目标位置且不是当前位置
        if (targetIndex !== -1 && targetIndex !== this.dragState.draggedIndex) {
            // 交换组件顺序
            const temp = this.components[this.dragState.draggedIndex];
            this.components[this.dragState.draggedIndex] = this.components[targetIndex];
            this.components[targetIndex] = temp;
            
            // 更新拖拽索引
            this.dragState.draggedIndex = targetIndex;
            
            // 重新渲染 Dock
            this.createDock();
        }
    },
    
    // 结束拖拽
    endDragging() {
        this.dragState.dragging = false;
        this.dragState.draggedIndex = null;
        this.dragState.draggedElement = null;
        
        // 移除拖拽样式
        const container = document.querySelector('.dock-container');
        if (container) {
            container.classList.remove('dock-dragging-active');
        }
        
        // 保存新顺序
        this.saveState();
        
        // 播放音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('success');
        }
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
        console.log('切换组件:', componentId);
        
        const element = document.getElementById(componentId);
        if (!element) {
            console.error('组件元素未找到:', componentId);
            alert('组件未找到: ' + componentId);
            return;
        }
        
        console.log('组件元素:', element);
        
        const isExpanded = this.expandedComponents.has(componentId);
        console.log('当前状态:', isExpanded ? '已展开' : '已收起');
        
        if (isExpanded) {
            this.collapseComponent(componentId);
        } else {
            this.expandComponent(componentId);
        }
        
        this.updateIndicator(componentId);
        this.saveState();
        
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('click');
        }
    },
    
    // 展开组件
    expandComponent(componentId) {
        const element = document.getElementById(componentId);
        if (!element) {
            console.warn('组件未找到:', componentId);
            return;
        }
        
        // 移动端全屏显示
        if (this.isMobile()) {
            element.style.position = 'fixed';
            element.style.top = '10px';
            element.style.left = '10px';
            element.style.right = '10px';
            element.style.bottom = '80px';
            element.style.width = 'calc(100% - 20px)';
            element.style.height = 'calc(100% - 90px)';
            element.style.zIndex = '1000';
        }
        
        element.classList.remove('dock-hidden');
        element.classList.add('dock-expanding');
        
        setTimeout(() => {
            element.classList.remove('dock-expanding');
            element.classList.add('dock-expanded');
        }, 300);
        
        this.expandedComponents.add(componentId);
        
        // 移动端只允许展开一个组件
        if (this.isMobile()) {
            // 关闭其他组件
            this.expandedComponents.forEach(id => {
                if (id !== componentId) {
                    this.collapseComponent(id);
                }
            });
        }
    },
    
    // 收起组件
    collapseComponent(componentId) {
        const element = document.getElementById(componentId);
        if (!element) return;
        
        // 清除移动端样式
        if (this.isMobile()) {
            element.style.position = '';
            element.style.top = '';
            element.style.left = '';
            element.style.right = '';
            element.style.bottom = '';
            element.style.width = '';
            element.style.height = '';
            element.style.zIndex = '';
        }
        
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
    
    // 鼠标悬停效果
    onItemHover(e, item) {
        item.classList.add('dock-item-hover');
        
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
        
        const prev = item.previousElementSibling;
        const next = item.nextElementSibling;
        
        if (prev) prev.classList.remove('dock-item-neighbor');
        if (next) next.classList.remove('dock-item-neighbor');
    },
    
    // 显示 Dock 设置
    showDockSettings() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const apiKey = typeof Storage !== 'undefined' ? Storage.getApiKey() : '';
        
        const modal = document.createElement('div');
        modal.className = 'dock-settings-modal';
        modal.innerHTML = `
            <div class="dock-settings-content">
                <div class="dock-settings-header">
                    <span class="dock-settings-title">⚙️ 设置</span>
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
                        <span class="dock-setting-label">🌓 主题模式</span>
                        <div class="dock-theme-options">
                            <button class="dock-theme-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                                <span>☀️</span>
                                <span>浅色</span>
                            </button>
                            <button class="dock-theme-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                                <span>🌙</span>
                                <span>深色</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="dock-setting-item">
                        <span class="dock-setting-label">🔑 API Key</span>
                        <div class="dock-api-input-wrapper">
                            <input type="password" class="dock-api-input" id="dockApiKeyInput" 
                                   placeholder="输入 DeepSeek API Key" value="${apiKey || ''}">
                            <button class="dock-api-save-btn" onclick="DockNavigation.saveApiKey()">保存</button>
                        </div>
                    </div>
                    
                    <div class="dock-setting-item">
                        <span class="dock-setting-label">☁️ 云同步</span>
                        <button class="dock-full-btn" onclick="DockNavigation.openCloudSync()">
                            <span>☁️</span>
                            <span>配置云同步</span>
                        </button>
                    </div>
                    
                    <div class="dock-setting-item">
                        <span class="dock-setting-label">📚 数据管理</span>
                        <div class="dock-data-actions">
                            <button class="dock-data-btn" onclick="DockNavigation.exportData()">
                                <span>📤</span>
                                <span>导出数据</span>
                            </button>
                            <button class="dock-data-btn" onclick="DockNavigation.importData()">
                                <span>📥</span>
                                <span>导入数据</span>
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
        
        // 绑定主题切换事件
        modal.querySelectorAll('.dock-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.changeTheme(theme);
                // 更新按钮状态
                modal.querySelectorAll('.dock-theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDockSettings();
            }
        });
        
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 关闭设置
    closeDockSettings() {
        const modal = document.querySelector('.dock-settings-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 改变位置
    changePosition(newPosition) {
        this.position = newPosition;
        this.saveState();
        this.createDock();
        this.restoreExpandedComponents();
        
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('success');
        }
    },
    
    // 切换主题
    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('click');
        }
    },
    
    // 保存 API Key
    saveApiKey() {
        const input = document.getElementById('dockApiKeyInput');
        if (!input) return;
        
        const key = input.value.trim();
        if (key) {
            if (typeof Storage !== 'undefined') {
                Storage.setApiKey(key);
            } else {
                localStorage.setItem('deepseek_api_key', key);
            }
            
            alert('✅ API Key 已保存');
            
            if (typeof UnifiedAudioSystem !== 'undefined') {
                UnifiedAudioSystem.playSound('success');
            }
        }
    },
    
    // 打开云同步
    openCloudSync() {
        this.closeDockSettings();
        if (typeof CloudSync !== 'undefined' && CloudSync.showConfigModal) {
            CloudSync.showConfigModal();
        } else {
            alert('云同步功能暂未加载');
        }
    },
    
    // 导出数据
    exportData() {
        this.closeDockSettings();
        if (typeof window.exportData === 'function') {
            window.exportData();
        } else {
            alert('导出功能暂未加载');
        }
    },
    
    // 导入数据
    importData() {
        this.closeDockSettings();
        if (typeof window.importData === 'function') {
            window.importData();
        } else {
            alert('导入功能暂未加载');
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
    setTimeout(() => DockNavigation.init(), 500);
});
