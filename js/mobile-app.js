// 移动端应用模块
const MobileApp = {
    currentView: 'smartInput',
    isMobile: false,
    
    // 初始化
    init() {
        this.checkMobile();
        this.bindEvents();
        
        if (this.isMobile) {
            this.setupMobileView();
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.checkMobile());
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
        const menu = document.getElementById('moreMenu');
        if (menu) {
            menu.classList.toggle('show');
            return;
        }
        
        // 获取云同步状态
        const isLoggedIn = window.CloudSync && CloudSync.state.userId;
        
        // 创建更多菜单
        const moreMenu = document.createElement('div');
        moreMenu.id = 'moreMenu';
        moreMenu.className = 'more-menu show';
        moreMenu.innerHTML = `
            <div class="more-menu-overlay" onclick="MobileApp.hideMoreMenu()"></div>
            <div class="more-menu-content">
                <div class="more-menu-header">
                    <span>更多功能</span>
                    <button onclick="MobileApp.hideMoreMenu()">×</button>
                </div>
                <div class="more-menu-grid">
                    <button class="more-menu-item" onclick="MobileApp.switchViewAndClose('memoryBank')">
                        <span class="more-menu-icon">🧠</span>
                        <span>记忆库</span>
                    </button>
                    <button class="more-menu-item" onclick="MobileApp.switchViewAndClose('valuePanel')">
                        <span class="more-menu-icon">💰</span>
                        <span>价值显化</span>
                    </button>
                    <button class="more-menu-item" onclick="MobileApp.switchViewAndClose('reviewPanel')">
                        <span class="more-menu-icon">📊</span>
                        <span>复盘</span>
                    </button>
                    <button class="more-menu-item" onclick="MobileApp.switchViewAndClose('aiInsights')">
                        <span class="more-menu-icon">🧠</span>
                        <span>AI洞察</span>
                    </button>
                    <button class="more-menu-item" onclick="MobileApp.switchViewAndClose('aiMemory')">
                        <span class="more-menu-icon">💖</span>
                        <span>KiiKii记忆</span>
                    </button>
                    <button class="more-menu-item" onclick="MobileApp.switchViewAndClose('inefficiencyPanel')">
                        <span class="more-menu-icon">📉</span>
                        <span>低效监控</span>
                    </button>
                    <button class="more-menu-item" onclick="MobileApp.switchViewAndClose('promptPanel')">
                        <span class="more-menu-icon">📝</span>
                        <span>提示词</span>
                    </button>
                    <button class="more-menu-item ${isLoggedIn ? 'logged-in' : ''}" onclick="MobileApp.hideMoreMenu(); CloudSync.showConfigModal();">
                        <span class="more-menu-icon">${isLoggedIn ? '✅' : '☁️'}</span>
                        <span>${isLoggedIn ? '已同步' : '云同步'}</span>
                    </button>
                    <button class="more-menu-item" onclick="toggleSettingsPanel(); MobileApp.hideMoreMenu();">
                        <span class="more-menu-icon">⚙️</span>
                        <span>设置</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(moreMenu);
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
                           target.closest('.value-setup-overlay');
            
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

