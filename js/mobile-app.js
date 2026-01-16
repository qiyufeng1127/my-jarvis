// 移动端应用模块
const MobileApp = {
    currentView: 'smartInput',
    isMobile: false,
    
    // 固定的"更多"按钮配置
    moreButton: { id: 'more', icon: '⋯', label: '更多' },
    
    // 默认底部导航配置（4个自定义 + 更多）
    defaultNavItems: [
        { id: 'smartInput', icon: '💬', label: '对话' },
        { id: 'timeline', icon: '📅', label: '任务' },
        { id: 'monitorPanel', icon: '📊', label: '监控' },
        { id: 'gameSystem', icon: '🎮', label: '游戏' }
    ],
    
    // 所有可选的导航项（不包含"更多"）
    availableNavItems: [
        { id: 'smartInput', icon: '💬', label: '对话' },
        { id: 'timeline', icon: '📅', label: '任务' },
        { id: 'monitorPanel', icon: '📊', label: '监控' },
        { id: 'gameSystem', icon: '🎮', label: '游戏' },
        { id: 'brainDump', icon: '🧹', label: '清空脑子' },
        { id: 'voiceSettings', icon: '🔊', label: '语音设置' },
        { id: 'memoryBank', icon: '🧠', label: '记忆库' },
        { id: 'valuePanel', icon: '💰', label: '价值显化' },
        { id: 'reviewPanel', icon: '📊', label: '复盘' },
        { id: 'aiInsights', icon: '💡', label: 'AI洞察' },
        { id: 'aiMemory', icon: '💖', label: 'KiiKii记忆' },
        { id: 'promptPanel', icon: '📝', label: '提示词' }
    ],
    
    // 用户自定义的导航项（最多4个，不包含"更多"）
    customNavItems: null,
    
    // 初始化
    init() {
        this.checkMobile();
        this.bindEvents();
        
        // 加载自定义导航配置
        this.loadCustomNavItems();
        
        if (this.isMobile) {
            this.setupMobileView();
            this.renderMobileNav();
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.checkMobile());
    },
    
    // 加载自定义导航配置
    loadCustomNavItems() {
        const saved = localStorage.getItem('adhd-mobile-nav-items');
        if (saved) {
            try {
                this.customNavItems = JSON.parse(saved);
            } catch (e) {
                console.error('加载自定义导航配置失败:', e);
                this.customNavItems = null;
            }
        }
    },
    
    // 保存自定义导航配置
    saveCustomNavItems(items) {
        this.customNavItems = items;
        localStorage.setItem('adhd-mobile-nav-items', JSON.stringify(items));
        this.renderMobileNav();
    },
    
    // 获取当前使用的导航项（4个自定义项）
    getCurrentNavItems() {
        return this.customNavItems || this.defaultNavItems;
    },
    
    // 获取未在底部导航显示的组件（用于"更多"菜单）
    getMoreMenuItems() {
        const currentNavIds = this.getCurrentNavItems().map(item => item.id);
        return this.availableNavItems.filter(item => !currentNavIds.includes(item.id));
    },
    
    // 渲染移动端导航栏（4个自定义 + 更多按钮）
    renderMobileNav() {
        const nav = document.getElementById('mobileNav');
        if (!nav) return;
        
        const items = this.getCurrentNavItems();
        
        // 渲染4个自定义导航项
        let html = items.slice(0, 4).map(item => `
            <button class="mobile-nav-item ${this.currentView === item.id ? 'active' : ''}" 
                    data-view="${item.id}" 
                    onclick="MobileApp.switchView('${item.id}')">
                <span class="mobile-nav-icon">${item.icon}</span>
                <span class="mobile-nav-label">${item.label}</span>
            </button>
        `).join('');
        
        // 添加固定的"更多"按钮
        html += `
            <button class="mobile-nav-item ${this.currentView === 'more' ? 'active' : ''}" 
                    data-view="more" 
                    onclick="MobileApp.showMoreMenu()">
                <span class="mobile-nav-icon">${this.moreButton.icon}</span>
                <span class="mobile-nav-label">${this.moreButton.label}</span>
            </button>
        `;
        
        nav.innerHTML = html;
    },
    
    // 检测是否为移动端
    checkMobile() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                this.setupMobileView();
            } else {
                this.setupDesktopView();
            }
        }
    },
    
    // 设置移动端视图
    setupMobileView() {
        document.body.classList.add('mobile-mode');
        
        // 默认显示智能对话
        this.switchView('smartInput');
    },
    
    // 设置桌面端视图
    setupDesktopView() {
        document.body.classList.remove('mobile-mode');
        
        // 显示所有组件
        document.querySelectorAll('.draggable-component').forEach(comp => {
            comp.classList.remove('mobile-active');
            comp.style.display = '';
        });
    },
    
    // 切换视图
    switchView(viewId) {
        if (!this.isMobile) return;
        
        this.currentView = viewId;
        
        // 更新导航状态
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewId);
        });
        
        // 切换组件显示
        document.querySelectorAll('.draggable-component').forEach(comp => {
            comp.classList.remove('mobile-active');
        });
        
        const targetComp = document.getElementById(viewId);
        if (targetComp) {
            targetComp.classList.add('mobile-active');
            // 滚动到顶部
            targetComp.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    // 显示更多菜单
    showMoreMenu() {
        const existingMenu = document.getElementById('moreMenu');
        if (existingMenu) {
            // 如果菜单已存在，切换显示状态
            if (existingMenu.classList.contains('show')) {
                this.hideMoreMenu();
            } else {
                existingMenu.classList.add('show');
            }
            return;
        }
        
        // 获取云同步状态
        const isLoggedIn = window.CloudSync && CloudSync.state.userId;
        
        // 获取未在底部导航显示的组件
        const moreItems = this.getMoreMenuItems();
        
        // 生成动态组件列表HTML
        const componentItemsHtml = moreItems.map(item => `
            <button class="more-menu-item" data-view="${item.id}" type="button">
                <span class="more-menu-icon">${item.icon}</span>
                <span>${item.label}</span>
            </button>
        `).join('');
        
        // 创建更多菜单
        const moreMenu = document.createElement('div');
        moreMenu.id = 'moreMenu';
        moreMenu.className = 'more-menu';
        moreMenu.innerHTML = `
            <div class="more-menu-overlay" id="moreMenuOverlay"></div>
            <div class="more-menu-content" id="moreMenuContent">
                <div class="more-menu-header">
                    <span>更多功能</span>
                    <button class="more-menu-close-btn" id="moreMenuCloseBtn" type="button">×</button>
                </div>
                <div class="more-menu-grid" id="moreMenuGrid">
                    ${moreItems.length > 0 ? `
                        <div class="more-menu-section">
                            <div class="more-menu-section-title">📱 其他组件</div>
                            <div class="more-menu-section-grid">
                                ${componentItemsHtml}
                            </div>
                        </div>
                    ` : ''}
                    <div class="more-menu-section">
                        <div class="more-menu-section-title">⚙️ 系统功能</div>
                        <div class="more-menu-section-grid">
                            <button class="more-menu-item" data-action="customizeNav" type="button">
                                <span class="more-menu-icon">🎨</span>
                                <span>自定义导航</span>
                            </button>
                            <button class="more-menu-item ${isLoggedIn ? 'logged-in' : ''}" data-action="cloudSync" type="button">
                                <span class="more-menu-icon">${isLoggedIn ? '✅' : '☁️'}</span>
                                <span>${isLoggedIn ? '已同步' : '云同步'}</span>
                            </button>
                            <button class="more-menu-item" data-action="apiKey" type="button">
                                <span class="more-menu-icon">🔑</span>
                                <span>API Key</span>
                            </button>
                            <button class="more-menu-item" data-action="settings" type="button">
                                <span class="more-menu-icon">⚙️</span>
                                <span>设置</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(moreMenu);
        
        // 强制重绘后再添加show类，确保动画生效
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                moreMenu.classList.add('show');
            });
        });
        
        // 为关闭按钮单独绑定事件（使用touchend和click双重绑定）
        const closeBtn = document.getElementById('moreMenuCloseBtn');
            if (closeBtn) {
            const handleClose = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideMoreMenu();
            };
            closeBtn.addEventListener('touchend', handleClose, { passive: false });
            closeBtn.addEventListener('click', handleClose);
            }
            
        // 为遮罩层绑定关闭事件
        const overlay = document.getElementById('moreMenuOverlay');
            if (overlay) {
            const handleOverlayClose = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideMoreMenu();
            };
            overlay.addEventListener('touchend', handleOverlayClose, { passive: false });
            overlay.addEventListener('click', handleOverlayClose);
            }
            
        // 为每个菜单项单独绑定事件
        const menuItems = moreMenu.querySelectorAll('.more-menu-item');
        menuItems.forEach(item => {
            const handleItemClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const viewId = item.dataset.view;
                const action = item.dataset.action;
                
                // 添加点击反馈
                item.style.transform = 'scale(0.95)';
                item.style.opacity = '0.7';
                
                setTimeout(() => {
                if (viewId) {
                    // 切换视图
                    this.switchViewAndClose(viewId);
                } else if (action === 'customizeNav') {
                    // 自定义布局
                    this.hideMoreMenu();
                    setTimeout(() => {
                        this.showCustomizeNavModal();
                    }, 100);
                } else if (action === 'cloudSync') {
                    // 云同步
                    this.hideMoreMenu();
                        setTimeout(() => {
                    if (window.CloudSync) {
                        CloudSync.showConfigModal();
                    }
                        }, 100);
                } else if (action === 'apiKey') {
                    // API Key 配置
                    this.hideMoreMenu();
                    setTimeout(() => {
                        if (typeof showApiKeyModal === 'function') {
                            showApiKeyModal();
                        }
                    }, 100);
                } else if (action === 'settings') {
                    // 设置
                    this.hideMoreMenu();
                        setTimeout(() => {
                    if (typeof toggleSettingsPanel === 'function') {
                        toggleSettingsPanel();
                    }
                        }, 100);
            }
                }, 50);
            };
            
            // 移动端优先使用touchend事件
            item.addEventListener('touchend', handleItemClick, { passive: false });
            // 同时保留click事件作为后备
            item.addEventListener('click', handleItemClick);
        });
    },
    
    // 隐藏更多菜单
    hideMoreMenu() {
        const menu = document.getElementById('moreMenu');
        if (menu) {
            menu.classList.remove('show');
            setTimeout(() => menu.remove(), 300);
        }
    },
    
    // 切换视图并关闭菜单
    switchViewAndClose(viewId) {
        this.hideMoreMenu();
        this.switchView(viewId);
    },
    
    // 显示自定义导航栏模态框（支持拖拽排序）
    showCustomizeNavModal() {
        const modal = document.createElement('div');
        modal.id = 'customizeNavModal';
        modal.className = 'modal-overlay';
        
        const currentItems = this.getCurrentNavItems();
        const selectedIds = currentItems.map(item => item.id);
        
        // 分离已选中和未选中的项目
        const selectedItems = currentItems.slice(0, 4);
        const unselectedItems = this.availableNavItems.filter(item => !selectedIds.includes(item.id));
        
        modal.innerHTML = `
            <div class="modal-content customize-nav-modal">
                <div class="modal-header">
                    <span class="modal-icon">🎨</span>
                    <h2>自定义底部导航</h2>
                </div>
                <div class="modal-body">
                    <p class="modal-desc">拖拽调整顺序，选择4个常用功能显示在底部导航栏</p>
                    
                    <div class="customize-nav-container">
                        <!-- 左侧：已选中的导航项（可拖拽排序） -->
                        <div class="customize-nav-selected">
                            <div class="customize-nav-section-header">
                                <span class="section-icon">📌</span>
                                <span class="section-title">底部导航栏</span>
                                <span class="section-count" id="selectedNavCount">${selectedItems.length}/4</span>
                            </div>
                            <div class="customize-nav-sortable" id="selectedNavList">
                                ${selectedItems.map((item, index) => `
                                    <div class="customize-nav-drag-item" data-id="${item.id}" draggable="true">
                                        <span class="drag-handle">⋮⋮</span>
                                        <span class="drag-order">${index + 1}</span>
                                        <span class="drag-icon">${item.icon}</span>
                                        <span class="drag-label">${item.label}</span>
                                        <button class="drag-remove" onclick="MobileApp.removeFromNav('${item.id}')" title="移除">×</button>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="customize-nav-hint-box">
                                <span>💡 拖拽调整顺序，点击 × 移除</span>
                            </div>
                        </div>
                        
                        <!-- 右侧：可添加的组件 -->
                        <div class="customize-nav-available">
                            <div class="customize-nav-section-header">
                                <span class="section-icon">📦</span>
                                <span class="section-title">可添加组件</span>
                            </div>
                            <div class="customize-nav-grid" id="availableNavList">
                                ${unselectedItems.map(item => `
                                    <button class="customize-nav-add-item" data-id="${item.id}" onclick="MobileApp.addToNav('${item.id}')">
                                        <span class="add-icon">${item.icon}</span>
                                        <span class="add-label">${item.label}</span>
                                        <span class="add-btn">+</span>
                                    </button>
                                `).join('')}
                                ${unselectedItems.length === 0 ? '<div class="customize-nav-empty">已添加所有组件</div>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="MobileApp.closeCustomizeNavModal()">取消</button>
                    <button class="modal-btn btn-secondary" onclick="MobileApp.resetNavToDefault()">恢复默认</button>
                    <button class="modal-btn btn-confirm" onclick="MobileApp.saveCustomNav()">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // 初始化拖拽排序
        this.initDragSort();
    },
    
    // 初始化拖拽排序
    initDragSort() {
        const sortableList = document.getElementById('selectedNavList');
        if (!sortableList) return;
        
        let draggedItem = null;
        
        sortableList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('customize-nav-drag-item')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        sortableList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('customize-nav-drag-item')) {
                e.target.classList.remove('dragging');
                draggedItem = null;
                this.updateDragOrderNumbers();
            }
        });
        
        sortableList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(sortableList, e.clientY);
            if (draggedItem) {
                if (afterElement == null) {
                    sortableList.appendChild(draggedItem);
                } else {
                    sortableList.insertBefore(draggedItem, afterElement);
                }
            }
        });
    },
    
    // 获取拖拽后的位置
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.customize-nav-drag-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },
    
    // 更新拖拽序号显示
    updateDragOrderNumbers() {
        const items = document.querySelectorAll('#selectedNavList .customize-nav-drag-item');
        items.forEach((item, index) => {
            const orderSpan = item.querySelector('.drag-order');
            if (orderSpan) {
                orderSpan.textContent = index + 1;
            }
        });
    },
    
    // 添加到导航栏
    addToNav(itemId) {
        const selectedList = document.getElementById('selectedNavList');
        const availableList = document.getElementById('availableNavList');
        const countSpan = document.getElementById('selectedNavCount');
        
        const currentCount = selectedList.querySelectorAll('.customize-nav-drag-item').length;
        
        if (currentCount >= 4) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '已达上限', '底部导航最多显示4个组件');
            }
            return;
        }
        
        const item = this.availableNavItems.find(i => i.id === itemId);
        if (!item) return;
        
        // 添加到已选列表
        const newItem = document.createElement('div');
        newItem.className = 'customize-nav-drag-item';
        newItem.dataset.id = item.id;
        newItem.draggable = true;
        newItem.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <span class="drag-order">${currentCount + 1}</span>
            <span class="drag-icon">${item.icon}</span>
            <span class="drag-label">${item.label}</span>
            <button class="drag-remove" onclick="MobileApp.removeFromNav('${item.id}')" title="移除">×</button>
        `;
        selectedList.appendChild(newItem);
        
        // 从可添加列表移除
        const availableItem = availableList.querySelector(`[data-id="${itemId}"]`);
        if (availableItem) {
            availableItem.remove();
        }
        
        // 更新计数
        countSpan.textContent = `${currentCount + 1}/4`;
        
        // 检查是否为空
        if (availableList.querySelectorAll('.customize-nav-add-item').length === 0) {
            availableList.innerHTML = '<div class="customize-nav-empty">已添加所有组件</div>';
        }
        
        // 重新初始化拖拽
        this.initDragSort();
    },
    
    // 从导航栏移除
    removeFromNav(itemId) {
        const selectedList = document.getElementById('selectedNavList');
        const availableList = document.getElementById('availableNavList');
        const countSpan = document.getElementById('selectedNavCount');
        
        const currentCount = selectedList.querySelectorAll('.customize-nav-drag-item').length;
        
        if (currentCount <= 1) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '至少保留一个', '底部导航至少需要1个组件');
            }
            return;
        }
        
        const item = this.availableNavItems.find(i => i.id === itemId);
        if (!item) return;
        
        // 从已选列表移除
        const selectedItem = selectedList.querySelector(`[data-id="${itemId}"]`);
        if (selectedItem) {
            selectedItem.remove();
        }
        
        // 添加到可添加列表
        const emptyMsg = availableList.querySelector('.customize-nav-empty');
        if (emptyMsg) {
            emptyMsg.remove();
        }
        
        const newAvailableItem = document.createElement('button');
        newAvailableItem.className = 'customize-nav-add-item';
        newAvailableItem.dataset.id = item.id;
        newAvailableItem.onclick = () => this.addToNav(item.id);
        newAvailableItem.innerHTML = `
            <span class="add-icon">${item.icon}</span>
            <span class="add-label">${item.label}</span>
            <span class="add-btn">+</span>
        `;
        availableList.appendChild(newAvailableItem);
        
        // 更新计数和序号
        countSpan.textContent = `${currentCount - 1}/4`;
        this.updateDragOrderNumbers();
    },
    
    // 关闭自定义导航模态框
    closeCustomizeNavModal() {
        const modal = document.getElementById('customizeNavModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 保存自定义导航
    saveCustomNav() {
        const selectedList = document.getElementById('selectedNavList');
        if (!selectedList) return;
        
        const items = selectedList.querySelectorAll('.customize-nav-drag-item');
        if (items.length === 0) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '请选择组件', '至少选择一个组件');
            }
            return;
        }
        
        // 按当前顺序构建新的导航项
        const newNavItems = [];
        items.forEach(item => {
            const id = item.dataset.id;
            const navItem = this.availableNavItems.find(i => i.id === id);
            if (navItem) {
                newNavItems.push(navItem);
            }
        });
        
        // 保存配置
        this.saveCustomNavItems(newNavItems);
        
        this.closeCustomizeNavModal();
        
        if (typeof Settings !== 'undefined') {
            Settings.showToast('success', '保存成功', '底部导航已更新');
        }
    },
    
    // 恢复默认导航
    resetNavToDefault() {
        if (confirm('确定要恢复默认导航配置吗？')) {
            this.customNavItems = null;
            localStorage.removeItem('adhd-mobile-nav-items');
            this.renderMobileNav();
            this.closeCustomizeNavModal();
            
            if (typeof Settings !== 'undefined') {
                Settings.showToast('success', '已恢复', '底部导航已恢复为默认配置');
            }
        }
    },
    
    // 快速添加任务
    quickAddTask() {
        // 直接显示快捷添加弹窗
        if (typeof QuickAddTask !== 'undefined') {
            QuickAddTask.openPopup();
        } else {
            // 备用方案：切换到对话视图并聚焦输入框
        this.switchView('smartInput');
        setTimeout(() => {
            const input = document.querySelector('.chat-input');
            if (input) {
                input.focus();
            }
        }, 300);
        }
    },
    
    // 绑定事件
    bindEvents() {
        // 下拉刷新（简化版）- 只在特定条件下触发
        let startY = 0;
        let pulling = false;
        
        document.addEventListener('touchstart', (e) => {
            // 只在页面顶部且不在输入框内时启用下拉刷新
            const target = e.target;
            const isInput = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'SELECT' ||
                           target.isContentEditable ||
                           target.closest('.modal-overlay') ||
                           target.closest('.onboarding-overlay') ||
                           target.closest('.value-setup-overlay') ||
                           // 在更多菜单内时，不触发下拉刷新逻辑，避免干扰菜单点击
                           target.closest('.more-menu') ||
                           target.closest('.more-menu-content');
            
            if (window.scrollY === 0 && !isInput) {
                startY = e.touches[0].pageY;
                pulling = true;
            } else {
                pulling = false;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            const currentY = e.touches[0].pageY;
            const diff = currentY - startY;
            
            if (diff > 80 && window.scrollY === 0) {
                this.showPullRefresh();
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (pulling) {
                this.hidePullRefresh();
                pulling = false;
            }
        }, { passive: true });
    },
    
    // 显示下拉刷新
    showPullRefresh() {
        let indicator = document.querySelector('.pull-to-refresh');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'pull-to-refresh';
            indicator.innerHTML = '<div class="spinner"></div><span>刷新中...</span>';
            document.body.appendChild(indicator);
        }
        indicator.classList.add('visible');
        
        // 模拟刷新
        setTimeout(() => {
            this.hidePullRefresh();
            // 刷新当前视图数据
            if (typeof App !== 'undefined') {
                App.refreshCurrentView();
            }
        }, 1000);
    },
    
    // 隐藏下拉刷新
    hidePullRefresh() {
        const indicator = document.querySelector('.pull-to-refresh');
        if (indicator) {
            indicator.classList.remove('visible');
        }
    },
    
    // 显示安装提示
    showInstallPrompt(deferredPrompt) {
        if (!this.isMobile) return;
        
        const banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.innerHTML = `
            <div class="install-banner-content">
                <span class="install-banner-icon">📱</span>
                <div class="install-banner-text">
                    <strong>安装 ADHD Focus</strong>
                    <span>添加到主屏幕，获得更好体验</span>
                </div>
                <button class="install-banner-btn" onclick="MobileApp.installApp()">安装</button>
                <button class="install-banner-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        this.deferredPrompt = deferredPrompt;
    },
    
    // 安装应用
    async installApp() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('用户接受安装');
        }
        
        this.deferredPrompt = null;
        document.querySelector('.install-banner')?.remove();
    }
};

// 监听安装提示
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    MobileApp.showInstallPrompt(e);
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    MobileApp.init();
});

// 导出
window.MobileApp = MobileApp;

// 全局函数：显示API Key设置模态框（移动端优化版）
function showApiKeyModal() {
    // 移除已存在的模态框
    const existingModal = document.getElementById('apiKeyModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const currentKey = typeof Storage !== 'undefined' ? Storage.getApiKey() : '';
    const maskedKey = currentKey ? currentKey.substring(0, 8) + '...' + currentKey.substring(currentKey.length - 4) : '';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'apiKeyModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <span class="modal-icon">🔑</span>
                <h2>API Key 设置</h2>
            </div>
            <div class="modal-body">
                <p style="margin-bottom:16px;color:#666;font-size:14px;">
                    配置 DeepSeek API Key 以启用 AI 功能
                </p>
                ${currentKey ? `
                    <div style="margin-bottom:16px;padding:12px;background:rgba(39,174,96,0.1);border-radius:8px;border-left:3px solid #27AE60;">
                        <div style="font-size:12px;color:#27AE60;margin-bottom:4px;">✅ 当前已配置</div>
                        <div style="font-size:13px;color:#666;font-family:monospace;">${maskedKey}</div>
                    </div>
                ` : `
                    <div style="margin-bottom:16px;padding:12px;background:rgba(231,76,60,0.1);border-radius:8px;border-left:3px solid #E74C3C;">
                        <div style="font-size:12px;color:#E74C3C;">⚠️ 尚未配置 API Key</div>
                    </div>
                `}
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;font-size:14px;">
                        ${currentKey ? '更新 API Key' : '输入 API Key'}
                    </label>
                    <input type="text" 
                           id="apiKeyInput" 
                           class="api-key-input" 
                           placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                           autocomplete="off"
                           autocorrect="off"
                           autocapitalize="off"
                           spellcheck="false"
                           style="width:100%;padding:14px 16px;font-size:16px;border:2px solid #E0E0E0;border-radius:10px;outline:none;transition:border-color 0.3s;-webkit-appearance:none;appearance:none;">
                </div>
                <div style="font-size:12px;color:#888;line-height:1.6;">
                    💡 获取方式：访问 <a href="https://platform.deepseek.com" target="_blank" style="color:#667eea;">platform.deepseek.com</a> 注册并创建 API Key
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn btn-cancel" id="apiKeyModalCancelBtn">取消</button>
                <button class="modal-btn btn-confirm" id="apiKeyModalSaveBtn">保存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示模态框
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // 获取输入框并设置焦点
    const input = document.getElementById('apiKeyInput');
    if (input) {
        // 延迟聚焦，确保模态框动画完成
        setTimeout(() => {
            input.focus();
            // 移动端需要触发点击才能弹出键盘
            if (MobileApp.isMobile) {
                input.click();
            }
        }, 300);
        
        // 输入框获得焦点时的样式
        input.addEventListener('focus', function() {
            this.style.borderColor = '#667eea';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '#E0E0E0';
        });
        
        // 回车键保存
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveApiKeyFromModal();
            }
        });
    }
    
    // 绑定按钮事件
    const cancelBtn = document.getElementById('apiKeyModalCancelBtn');
    const saveBtn = document.getElementById('apiKeyModalSaveBtn');
    
    if (cancelBtn) {
        const handleCancel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeApiKeyModalNew();
        };
        cancelBtn.addEventListener('click', handleCancel);
        cancelBtn.addEventListener('touchend', handleCancel, { passive: false });
    }
    
    if (saveBtn) {
        const handleSave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            saveApiKeyFromModal();
        };
        saveBtn.addEventListener('click', handleSave);
        saveBtn.addEventListener('touchend', handleSave, { passive: false });
    }
    
    // 点击遮罩关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeApiKeyModalNew();
        }
    });
}

// 关闭API Key模态框
function closeApiKeyModalNew() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// 保存API Key
function saveApiKeyFromModal() {
    const input = document.getElementById('apiKeyInput');
    if (!input) return;
    
    const key = input.value.trim();
    if (!key) {
        if (typeof Settings !== 'undefined') {
            Settings.showToast('warning', '请输入 API Key', '');
        }
        return;
    }
    
    // 验证格式
    if (!key.startsWith('sk-')) {
        if (typeof Settings !== 'undefined') {
            Settings.showToast('warning', '格式错误', 'API Key 应以 sk- 开头');
        }
        return;
    }
    
    // 保存
    if (typeof Storage !== 'undefined') {
        Storage.setApiKey(key);
    }
    
    closeApiKeyModalNew();
    
    if (typeof Settings !== 'undefined') {
        Settings.showToast('success', 'API Key 已保存', '');
    }
    
    // 检查连接
    if (typeof App !== 'undefined' && App.checkApiConnection) {
        App.checkApiConnection().then(function() {
            if (typeof App.loadSmartInput === 'function') {
                App.loadSmartInput();
            }
        });
    }
}

// 确保全局可用
window.showApiKeyModal = showApiKeyModal;


// Override switchView to set data-view attribute for CSS targeting
(function() {
    const originalSwitchView = MobileApp.switchView.bind(MobileApp);
    MobileApp.switchView = function(viewId) {
        originalSwitchView(viewId);
        // Set data-view attribute on body for CSS targeting
        document.body.setAttribute('data-view', viewId);
    };
})();

