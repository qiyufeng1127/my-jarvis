// Supabase 云同步模块
const CloudSync = {
    // Supabase 配置 - 预配置
    config: {
        url: 'https://nucvylmszllecoupjfbh.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o',
        configured: true
    },
    
    // 同步状态
    state: {
        isOnline: navigator.onLine,
        lastSync: null,
        syncInProgress: false,
        pendingChanges: [],
        userId: null,
        userEmail: null
    },
    
    // Supabase客户端
    supabase: null,
    
    // 初始化
    async init() {
        this.loadConfig();
        this.setupOnlineListener();
        this.loadPendingChanges();
        
        if (this.config.configured) {
            await this.initSupabase();
        }
        
        // 更新云同步按钮状态
        this.updateCloudButton();
        
        // 监听页面可见性变化，恢复时同步
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.state.userId) {
                this.syncNow();
            }
        });
        
        console.log('云同步模块初始化完成');
    },
    
    // 更新云同步按钮状态
    updateCloudButton() {
        const btn = document.getElementById('cloudToggle');
        if (btn) {
            if (this.state.userId) {
                btn.classList.add('logged-in');
                btn.title = `已登录: ${this.state.userEmail || '云同步'}`;
                btn.innerHTML = '☁️';
            } else {
                btn.classList.remove('logged-in');
                btn.title = '点击登录云同步';
                btn.innerHTML = '☁️';
            }
        }
        
        // 更新移动端更多菜单中的云同步状态
        const moreMenuCloud = document.querySelector('.more-menu-item[onclick*="CloudSync"]');
        if (moreMenuCloud) {
            moreMenuCloud.querySelector('span:last-child').textContent = 
                this.state.userId ? '已同步' : '云同步';
        }
    },
    
    // 加载配置
    loadConfig() {
        const saved = Storage.load('adhd_cloud_config', null);
        if (saved) {
            Object.assign(this.config, saved);
        }
        this.state.lastSync = Storage.load('adhd_last_sync', null);
        this.state.userId = Storage.load('adhd_cloud_user_id', null);
        this.state.userEmail = Storage.load('adhd_cloud_user_email', null);
    },
    
    // 保存配置
    saveConfig() {
        Storage.save('adhd_cloud_config', {
            url: this.config.url,
            anonKey: this.config.anonKey,
            configured: this.config.configured
        });
    },
    
    // 初始化Supabase客户端
    async initSupabase() {
        if (!this.config.url || !this.config.anonKey) {
            console.log('Supabase未配置');
            return false;
        }
        
        try {
            // 动态加载Supabase SDK
            if (!window.supabase) {
                await this.loadSupabaseSDK();
            }
            
            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );
            
            // 监听认证状态变化
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                if (event === 'SIGNED_IN' && session) {
                    this.state.userId = session.user.id;
                    this.state.userEmail = session.user.email;
                    Storage.save('adhd_cloud_user_id', this.state.userId);
                    Storage.save('adhd_cloud_user_email', this.state.userEmail);
                    this.updateCloudButton();
                    this.startAutoSync();
                } else if (event === 'SIGNED_OUT') {
                    this.state.userId = null;
                    this.state.userEmail = null;
                    Storage.remove('adhd_cloud_user_id');
                    Storage.remove('adhd_cloud_user_email');
                    this.updateCloudButton();
                }
            });
            
            // 检查认证状态
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.state.userId = session.user.id;
                this.state.userEmail = session.user.email;
                Storage.save('adhd_cloud_user_id', this.state.userId);
                Storage.save('adhd_cloud_user_email', this.state.userEmail);
                this.updateCloudButton();
                this.startAutoSync();
                // 登录后立即同步
                setTimeout(() => this.syncNow(), 1000);
            }
            
            return true;
        } catch (error) {
            console.error('Supabase初始化失败:', error);
            return false;
        }
    },
    
    // 加载Supabase SDK
    loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // 显示配置弹窗
    showConfigModal() {
        // 如果已配置但未登录，直接显示登录弹窗
        if (this.config.configured && !this.state.userId) {
            this.showLoginModal();
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'cloudConfigModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <span class="modal-icon">☁️</span>
                    <h2>云同步设置</h2>
                </div>
                <div class="modal-body">
                    ${this.state.userId ? `
                        <div class="cloud-user-info">
                            <span class="cloud-user-icon">👤</span>
                            <div class="cloud-user-details">
                                <span class="cloud-user-text">已登录</span>
                                <span class="cloud-user-email">${this.state.userEmail || ''}</span>
                            </div>
                        </div>
                        <div class="sync-status">
                            <span class="sync-status-icon">${this.state.isOnline ? '🟢' : '🔴'}</span>
                            <span class="sync-status-text">
                                ${this.state.isOnline ? '已连接' : '离线'}
                                ${this.state.lastSync ? ` · 上次同步: ${this.formatTime(this.state.lastSync)}` : ''}
                            </span>
                        </div>
                        <div class="sync-info" style="margin-top: 12px; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; font-size: 13px; color: #666;">
                            <p style="margin: 0;">💡 数据会自动同步到云端，您可以在其他设备登录同一账号访问数据。</p>
                        </div>
                        <div class="cloud-actions" style="margin-top: 16px;">
                            <button class="cloud-action-btn" onclick="CloudSync.syncNow(); document.getElementById('cloudConfigModal').remove();">
                                🔄 立即同步
                            </button>
                            <button class="cloud-action-btn danger" onclick="CloudSync.logout(); document.getElementById('cloudConfigModal').remove();">
                                🚪 退出登录
                            </button>
                        </div>
                    ` : `
                        <p style="color: #666; margin-bottom: 16px; font-size: 13px;">
                            登录后可实现数据云端同步，多设备共享数据。
                        </p>
                        <div class="cloud-actions" style="flex-direction: column;">
                            <button class="modal-btn btn-confirm" style="width: 100%; margin-bottom: 10px;" onclick="document.getElementById('cloudConfigModal').remove(); CloudSync.showLoginModal();">
                                🔐 登录 / 注册
                            </button>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('cloudConfigModal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // 从弹窗保存配置
    async saveConfigFromModal() {
        const url = document.getElementById('supabaseUrl').value.trim();
        const key = document.getElementById('supabaseKey').value.trim();
        
        if (!url || !key) {
            Settings.showToast('warning', '请填写完整配置', '');
            return;
        }
        
        this.config.url = url;
        this.config.anonKey = key;
        this.config.configured = true;
        this.saveConfig();
        
        const success = await this.initSupabase();
        
        if (success) {
            document.getElementById('cloudConfigModal')?.remove();
            this.showLoginModal();
        } else {
            Settings.showToast('error', '连接失败', '请检查配置是否正确');
        }
    },
    
    // 显示登录弹窗
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'cloudLoginModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 380px;">
                <div class="modal-header">
                    <span class="modal-icon">🔐</span>
                    <h2>登录云账号</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" id="cloudEmail" placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" id="cloudPassword" placeholder="••••••••">
                    </div>
                </div>
                <div class="modal-footer" style="flex-direction: column; gap: 10px;">
                    <button class="modal-btn btn-confirm" style="width: 100%;" onclick="CloudSync.login()">
                        登录
                    </button>
                    <button class="modal-btn btn-cancel" style="width: 100%;" onclick="CloudSync.register()">
                        注册新账号
                    </button>
                    <button class="modal-btn" style="width: 100%; background: none; color: #888;" 
                            onclick="document.getElementById('cloudLoginModal').remove()">
                        稍后再说
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // 登录
    async login() {
        const email = document.getElementById('cloudEmail').value.trim();
        const password = document.getElementById('cloudPassword').value;
        
        if (!email || !password) {
            Settings.showToast('warning', '请填写邮箱和密码', '');
            return;
        }
        
        // 显示加载状态
        const loginBtn = document.querySelector('#cloudLoginModal .btn-confirm');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';
        }
        
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.state.userId = data.user.id;
            this.state.userEmail = data.user.email;
            Storage.save('adhd_cloud_user_id', this.state.userId);
            Storage.save('adhd_cloud_user_email', this.state.userEmail);
            
            document.getElementById('cloudLoginModal')?.remove();
            Settings.showToast('success', '登录成功', '正在同步数据...');
            
            // 更新按钮状态
            this.updateCloudButton();
            
            this.startAutoSync();
            
            // 登录后立即从云端拉取数据
            await this.syncNow();
            
            // 刷新界面
            if (typeof App !== 'undefined') {
                App.renderTimeline();
                App.updateGameStatus();
            }
            
        } catch (error) {
            Settings.showToast('error', '登录失败', error.message);
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = '登录';
            }
        }
    },
    
    // 注册
    async register() {
        const email = document.getElementById('cloudEmail').value.trim();
        const password = document.getElementById('cloudPassword').value;
        
        if (!email || !password) {
            Settings.showToast('warning', '请填写邮箱和密码', '');
            return;
        }
        
        if (password.length < 6) {
            Settings.showToast('warning', '密码至少6位', '');
            return;
        }
        
        // 显示加载状态
        const registerBtn = document.querySelector('#cloudLoginModal .btn-cancel');
        if (registerBtn) {
            registerBtn.disabled = true;
            registerBtn.textContent = '注册中...';
        }
        
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    // 禁用邮箱验证，直接登录
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) throw error;
            
            // 如果用户已确认（无需邮箱验证）
            if (data.user && data.session) {
                this.state.userId = data.user.id;
                this.state.userEmail = data.user.email;
                Storage.save('adhd_cloud_user_id', this.state.userId);
                Storage.save('adhd_cloud_user_email', this.state.userEmail);
                
                document.getElementById('cloudLoginModal')?.remove();
                Settings.showToast('success', '注册成功', '正在同步数据...');
                
                this.updateCloudButton();
                this.startAutoSync();
                
                // 注册后上传本地数据到云端
                await this.syncNow();
            } else {
                Settings.showToast('success', '注册成功', '请查收验证邮件后登录');
            }
            
        } catch (error) {
            Settings.showToast('error', '注册失败', error.message);
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.textContent = '注册新账号';
            }
        }
    },
    
    // 退出登录
    async logout() {
        if (!this.supabase) return;
        
        try {
            await this.supabase.auth.signOut();
        } catch (e) {
            console.error('退出登录错误:', e);
        }
        
        this.state.userId = null;
        this.state.userEmail = null;
        Storage.remove('adhd_cloud_user_id');
        Storage.remove('adhd_cloud_user_email');
        
        // 更新按钮状态
        this.updateCloudButton();
        
        document.getElementById('cloudConfigModal')?.remove();
        Settings.showToast('info', '已退出登录', '本地数据保留');
    },
    
    // ==================== 同步功能 ====================
    
    // 开始自动同步
    startAutoSync() {
        // 每5分钟自动同步
        setInterval(() => {
            if (this.state.isOnline && this.state.userId) {
                this.syncNow();
            }
        }, 5 * 60 * 1000);
        
        // 监听数据变化
        this.watchLocalChanges();
    },
    
    // 监听本地数据变化
    watchLocalChanges() {
        // 重写Storage的save方法来追踪变化
        const originalSave = Storage.save.bind(Storage);
        Storage.save = (key, data) => {
            originalSave(key, data);
            
            // 记录需要同步的变化
            if (this.shouldSync(key)) {
                this.recordChange(key, data);
            }
        };
    },
    
    // 判断是否需要同步
    shouldSync(key) {
        const syncKeys = [
            'adhd_focus_tasks',
            'adhd_focus_memories',
            'adhd_focus_game_state',
            'adhd_value_finance',
            'adhd_ai_memory_data',
            'adhd_custom_tags',
            'adhd_task_templates',
            'adhd_recurring_tasks'
        ];
        return syncKeys.includes(key);
    },
    
    // 记录变化
    recordChange(key, data) {
        this.state.pendingChanges.push({
            key,
            data,
            timestamp: Date.now()
        });
        
        Storage.save('adhd_pending_sync', this.state.pendingChanges);
        
        // 如果在线，延迟同步
        if (this.state.isOnline && this.state.userId) {
            this.debouncedSync();
        }
    },
    
    // 防抖同步
    debouncedSync: (function() {
        let timer = null;
        return function() {
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.syncNow();
            }, 3000);
        };
    })(),
    
    // 立即同步
    async syncNow() {
        if (!this.supabase || !this.state.userId || this.state.syncInProgress) {
            return;
        }
        
        this.state.syncInProgress = true;
        this.showSyncIndicator();
        
        try {
            // 1. 上传本地变化
            await this.uploadChanges();
            
            // 2. 下载远程变化
            await this.downloadChanges();
            
            // 3. 更新同步时间
            this.state.lastSync = Date.now();
            Storage.save('adhd_last_sync', this.state.lastSync);
            
            // 4. 清空待同步队列
            this.state.pendingChanges = [];
            Storage.save('adhd_pending_sync', []);
            
            this.hideSyncIndicator();
            
        } catch (error) {
            console.error('同步失败:', error);
            Settings.showToast('error', '同步失败', error.message);
        } finally {
            this.state.syncInProgress = false;
        }
    },
    
    // 上传变化
    async uploadChanges() {
        if (this.state.pendingChanges.length === 0) return;
        
        const { error } = await this.supabase
            .from('user_data')
            .upsert({
                user_id: this.state.userId,
                data: this.getAllSyncData(),
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
    },
    
    // 下载变化
    async downloadChanges() {
        const { data, error } = await this.supabase
            .from('user_data')
            .select('data, updated_at')
            .eq('user_id', this.state.userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data && data.data) {
            // 合并远程数据
            this.mergeRemoteData(data.data);
        }
    },
    
    // 获取所有需要同步的数据
    getAllSyncData() {
        return {
            tasks: Storage.getTasks(),
            memories: Storage.getMemories(),
            gameState: Storage.load('adhd_focus_game_state', {}),
            valueFinance: Storage.load('adhd_value_finance', {}),
            aiMemory: Storage.load('adhd_ai_memory_data', {}),
            customTags: Storage.load('adhd_custom_tags', []),
            templates: Storage.load('adhd_task_templates', []),
            recurring: Storage.load('adhd_recurring_tasks', [])
        };
    },
    
    // 合并远程数据
    mergeRemoteData(remoteData) {
        // 简单策略：远程数据覆盖本地（可以改进为更智能的合并）
        if (remoteData.tasks) Storage.saveTasks(remoteData.tasks);
        if (remoteData.memories) Storage.saveMemories(remoteData.memories);
        if (remoteData.gameState) Storage.save('adhd_focus_game_state', remoteData.gameState);
        if (remoteData.valueFinance) Storage.save('adhd_value_finance', remoteData.valueFinance);
        if (remoteData.aiMemory) Storage.save('adhd_ai_memory_data', remoteData.aiMemory);
        if (remoteData.customTags) Storage.save('adhd_custom_tags', remoteData.customTags);
        if (remoteData.templates) Storage.save('adhd_task_templates', remoteData.templates);
        if (remoteData.recurring) Storage.save('adhd_recurring_tasks', remoteData.recurring);
        
        // 刷新界面
        if (typeof App !== 'undefined') {
            App.renderTimeline();
            App.updateGameStatus();
        }
    },
    
    // ==================== UI ====================
    
    // 显示同步指示器
    showSyncIndicator() {
        let indicator = document.getElementById('syncIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'syncIndicator';
            indicator.className = 'sync-indicator';
            indicator.innerHTML = '<div class="sync-spinner"></div><span>同步中...</span>';
            document.body.appendChild(indicator);
        }
        indicator.classList.add('show');
    },
    
    // 隐藏同步指示器
    hideSyncIndicator() {
        const indicator = document.getElementById('syncIndicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    },
    
    // 设置在线监听
    setupOnlineListener() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            Settings.showToast('success', '网络已连接', '');
            
            // 上线后同步待处理的变化
            if (this.state.userId && this.state.pendingChanges.length > 0) {
                this.syncNow();
            }
        });
        
        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            Settings.showToast('warning', '网络已断开', '数据将在恢复连接后同步');
        });
    },
    
    // 加载待同步变化
    loadPendingChanges() {
        this.state.pendingChanges = Storage.load('adhd_pending_sync', []);
    },
    
    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return `${Math.floor(diff / 86400000)}天前`;
    }
};

// 添加同步指示器样式
const syncStyles = document.createElement('style');
syncStyles.textContent = `
    .sync-indicator {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        z-index: 10000;
        transition: transform 0.3s ease;
    }
    
    .sync-indicator.show {
        transform: translateX(-50%) translateY(0);
    }
    
    .sync-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    
    .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: #F8F9FA;
        border-radius: 8px;
        margin-top: 12px;
    }
    
    [data-theme="dark"] .sync-status {
        background: rgba(60, 60, 100, 0.4);
    }
    
    .sync-status-icon {
        font-size: 12px;
    }
    
    .sync-status-text {
        font-size: 13px;
        color: #666;
    }
    
    .cloud-actions {
        display: flex;
        gap: 10px;
    }
    
    .cloud-action-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 8px;
        background: #F0F0F0;
        color: #333;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    [data-theme="dark"] .cloud-action-btn {
        background: rgba(60, 60, 100, 0.4);
        color: #E8E8E8;
    }
    
    .cloud-action-btn:hover {
        background: #E0E0E0;
    }
    
    .cloud-action-btn.danger {
        background: rgba(231, 76, 60, 0.1);
        color: #E74C3C;
    }
    
    .cloud-action-btn.danger:hover {
        background: rgba(231, 76, 60, 0.2);
    }
    
    .cloud-user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        border-radius: 12px;
        margin-bottom: 12px;
    }
    
    .cloud-user-icon {
        font-size: 24px;
    }
    
    .cloud-user-text {
        font-size: 15px;
        font-weight: 600;
        color: #667eea;
    }
`;
document.head.appendChild(syncStyles);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    CloudSync.init();
});

// 导出
window.CloudSync = CloudSync;

