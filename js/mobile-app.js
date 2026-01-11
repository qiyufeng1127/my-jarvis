// 移动端应用模块
const MobileApp = {
    currentView: 'smartInput',
    isMobile: false,
    
    // 默认底部导航配置
    defaultNavItems: [
        { id: 'smartInput', icon: '💬', label: '对话' },
        { id: 'timeline', icon: '📅', label: '任务' },
        { id: 'procrastinationPanel', icon: '⏰', label: '监控' },
        { id: 'gameSystem', icon: '🎮', label: '游戏' },
        { id: 'more', icon: '⋯', label: '更多' }
    ],
    
    // 可选的导航项
    availableNavItems: [
        { id: 'smartInput', icon: '💬', label: '对话' },
        { id: 'timeline', icon: '📅', label: '任务' },
        { id: 'procrastinationPanel', icon: '⏰', label: '拖延监控' },
        { id: 'inefficiencyPanel', icon: '📉', label: '低效监控' },
        { id: 'gameSystem', icon: '🎮', label: '游戏' },
        { id: 'memoryBank', icon: '🧠', label: '记忆库' },
        { id: 'valuePanel', icon: '💰', label: '价值显化' },
        { id: 'reviewPanel', icon: '📊', label: '复盘' },
        { id: 'aiInsights', icon: '🧠', label: 'AI洞察' },
        { id: 'aiMemory', icon: '💖', label: 'KiiKii记忆' },
        { id: 'promptPanel', icon: '📝', label: '提示词' },
        { id: 'more', icon: '⋯', label: '更多' }
    ],
    
    // 用户自定义的导航项
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
    
    // 获取当前使用的导航项
    getCurrentNavItems() {
        return this.customNavItems || this.defaultNavItems;
    },
    
    // 渲染移动端导航栏
    renderMobileNav() {
        const nav = document.getElementById('mobileNav');
        if (!nav) return;
        
        const items = this.getCurrentNavItems();
        nav.innerHTML = items.map(item => `
            <button class="mobile-nav-item ${this.currentView === item.id ? 'active' : ''}" 
                    data-view="${item.id}" 
                    onclick="MobileApp.${item.id === 'more' ? 'showMoreMenu()' : 'switchView(\'' + item.id + '\')'}">
                <span class="mobile-nav-icon">${item.icon}</span>
                <span class="mobile-nav-label">${item.label}</span>
            </button>
        `).join('');
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
                    <button class="more-menu-item" data-view="memoryBank" type="button">
                        <span class="more-menu-icon">🧠</span>
                        <span>记忆库</span>
                    </button>
                    <button class="more-menu-item" data-view="valuePanel" type="button">
                        <span class="more-menu-icon">💰</span>
                        <span>价值显化</span>
                    </button>
                    <button class="more-menu-item" data-view="reviewPanel" type="button">
                        <span class="more-menu-icon">📊</span>
                        <span>复盘</span>
                    </button>
                    <button class="more-menu-item" data-view="aiInsights" type="button">
                        <span class="more-menu-icon">🧠</span>
                        <span>AI洞察</span>
                    </button>
                    <button class="more-menu-item" data-view="aiMemory" type="button">
                        <span class="more-menu-icon">💖</span>
                        <span>KiiKii记忆</span>
                    </button>
                    <button class="more-menu-item" data-view="inefficiencyPanel" type="button">
                        <span class="more-menu-icon">📉</span>
                        <span>低效监控</span>
                    </button>
                    <button class="more-menu-item" data-view="promptPanel" type="button">
                        <span class="more-menu-icon">📝</span>
                        <span>提示词</span>
                    </button>
                    <button class="more-menu-item" data-action="customizeNav" type="button">
                        <span class="more-menu-icon">🎨</span>
                        <span>自定义布局</span>
                    </button>
                    <button class="more-menu-item ${isLoggedIn ? 'logged-in' : ''}" data-action="cloudSync" type="button">
                        <span class="more-menu-icon">${isLoggedIn ? '✅' : '☁️'}</span>
                        <span>${isLoggedIn ? '已同步' : '云同步'}</span>
                    </button>
                    <button class="more-menu-item" data-action="settings" type="button">
                        <span class="more-menu-icon">⚙️</span>
                        <span>设置</span>
                    </button>
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
    
    // 显示自定义导航栏模态框
    showCustomizeNavModal() {
        const modal = document.createElement('div');
        modal.id = 'customizeNavModal';
        modal.className = 'modal-overlay';
        
        const currentItems = this.getCurrentNavItems();
        const selectedIds = currentItems.map(item => item.id);
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <span class="modal-icon">🎨</span>
                    <h2>自定义底部导航</h2>
                </div>
                <div class="modal-body">
                    <p class="modal-desc">选择最多5个功能显示在底部导航栏（建议保留"更多"按钮）</p>
                    <div class="customize-nav-list" id="customizeNavList">
                        ${this.availableNavItems.map(item => `
                            <label class="customize-nav-item">
                                <input type="checkbox" 
                                       value="${item.id}" 
                                       ${selectedIds.includes(item.id) ? 'checked' : ''}
                                       ${item.id === 'more' ? 'disabled' : ''}>
                                <span class="customize-nav-icon">${item.icon}</span>
                                <span class="customize-nav-label">${item.label}</span>
                                ${item.id === 'more' ? '<span class="customize-nav-badge">推荐</span>' : ''}
                            </label>
                        `).join('')}
                    </div>
                    <div class="customize-nav-hint">
                        <span>💡 提示：</span>
                        <span>已选择 <strong id="selectedCount">${selectedIds.length}</strong> / 5 个功能</span>
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
        
        // 绑定复选框事件
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:not([disabled])');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checked = modal.querySelectorAll('input[type="checkbox"]:checked').length;
                document.getElementById('selectedCount').textContent = checked;
                
                // 限制最多5个
                if (checked >= 5) {
                    checkboxes.forEach(cb => {
                        if (!cb.checked) cb.disabled = true;
                    });
                } else {
                    checkboxes.forEach(cb => {
                        cb.disabled = false;
                    });
                }
            });
        });
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
        const modal = document.getElementById('customizeNavModal');
        if (!modal) return;
        
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0) {
            alert('请至少选择一个功能');
            return;
        }
        
        // 确保"更多"按钮在最后
        const moreIndex = selectedIds.indexOf('more');
        if (moreIndex !== -1 && moreIndex !== selectedIds.length - 1) {
            selectedIds.splice(moreIndex, 1);
            selectedIds.push('more');
        }
        
        // 构建新的导航项
        const newNavItems = selectedIds.map(id => {
            return this.availableNavItems.find(item => item.id === id);
        }).filter(item => item);
        
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
        // 切换到对话视图
        this.switchView('smartInput');
        
        // 聚焦输入框
        setTimeout(() => {
            const input = document.querySelector('.chat-input');
            if (input) {
                input.focus();
            }
        }, 300);
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

