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
        userEmail: null,
        deviceId: null,  // 设备唯一标识
        dataVersion: 0   // 数据版本号
    },
    
    // Supabase客户端
    supabase: null,
    
    // 初始化
    async init() {
        this.loadConfig();
        this.setupOnlineListener();
        this.loadPendingChanges();
        this.initDeviceId();  // 初始化设备ID
        
        // 清理过大的待同步数据（防止 QuotaExceededError）
        this.cleanupStorage();
        
        // 更新云同步按钮状态（先显示UI）
        this.updateCloudButton();
        
        // 延迟初始化 Supabase，不阻塞页面加载
        if (this.config.configured) {
            // 使用 setTimeout 让页面先渲染完成
            setTimeout(async () => {
                await this.initSupabase();
            }, 100);
        }
        
        // 监听页面可见性变化，恢复时同步
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.state.userId && !this.state.syncInProgress) {
                // 页面恢复可见时立即同步
                console.log('📱 页面恢复可见，开始同步...');
                setTimeout(() => this.syncNow(), 500);
            }
        });
        
        // 监听页面关闭前保存
        window.addEventListener('beforeunload', () => {
            if (this.state.userId && this.state.pendingChanges.length > 0) {
                // 尝试同步（可能不会完成）
                this.uploadChanges().catch(() => {});
            }
        });
        
        // 监听 localStorage 变化（跨标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key && this.shouldSync(e.key) && !this._merging) {
                console.log('📦 检测到其他标签页数据变化:', e.key);
                // 其他标签页修改了数据，触发同步
                this.debouncedSync();
            }
        });
        
        console.log('云同步模块初始化完成, 设备ID:', this.state.deviceId);
    },
    
    // 初始化设备唯一标识
    initDeviceId() {
        let deviceId = localStorage.getItem('adhd_device_id');
        if (!deviceId) {
            // 生成唯一设备ID
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('adhd_device_id', deviceId);
        }
        this.state.deviceId = deviceId;
    },
    
    // 清理过大的存储数据
    cleanupStorage() {
        try {
            // 清理待同步队列
            const pendingSync = localStorage.getItem('adhd_pending_sync');
            if (pendingSync && pendingSync.length > 50000) { // 50KB
                console.warn('待同步数据过大，已清理');
                localStorage.removeItem('adhd_pending_sync');
                this.state.pendingChanges = [];
            }
        } catch (e) {
            console.error('清理存储失败:', e);
        }
    },
    
    // 更新云同步按钮状态
    updateCloudButton() {
        const btn = document.getElementById('cloudToggle');
        if (btn) {
            if (this.state.userId) {
                btn.classList.add('logged-in');
                btn.title = `已登录: ${this.state.userEmail || '云同步'}`;
                btn.innerHTML = '☁️';
                
                // 添加实时同步状态指示
                if (this._realtimeConnected) {
                    btn.innerHTML = '☁️';
                    btn.style.color = '#4CAF50';  // 绿色表示已连接
                } else {
                    btn.innerHTML = '☁️';
                    btn.style.color = '#FF9800';  // 橙色表示未连接实时
                }
            } else {
                btn.classList.remove('logged-in');
                btn.title = '点击登录云同步';
                btn.innerHTML = '☁️';
                btn.style.color = '';
            }
        }
        
        // 更新移动端更多菜单中的云同步状态
        const moreMenuCloud = document.querySelector('.more-menu-item[onclick*="CloudSync"]');
        if (moreMenuCloud) {
            const statusText = this.state.userId 
                ? (this._realtimeConnected ? '已同步 ✓' : '同步中...')
                : '云同步';
            moreMenuCloud.querySelector('span:last-child').textContent = statusText;
        }
        
        // 更新同步状态指示器
        this.updateSyncStatusIndicator();
    },
    
    // 更新同步状态指示器
    updateSyncStatusIndicator() {
        let indicator = document.getElementById('syncStatusIndicator');
        
        if (!this.state.userId) {
            if (indicator) indicator.remove();
            return;
        }
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'syncStatusIndicator';
            indicator.className = 'sync-status-indicator';
            document.body.appendChild(indicator);
        }
        
        if (this._realtimeConnected) {
            indicator.innerHTML = '<span class="sync-dot connected"></span>';
            indicator.title = '实时同步已连接';
        } else if (this.state.syncInProgress) {
            indicator.innerHTML = '<span class="sync-dot syncing"></span>';
            indicator.title = '正在同步...';
        } else {
            indicator.innerHTML = '<span class="sync-dot disconnected"></span>';
            indicator.title = '实时同步未连接';
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
            // 动态加载Supabase SDK（带超时）
            if (!window.supabase) {
                const loadPromise = this.loadSupabaseSDK();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('SDK加载超时')), 10000)
                );
                await Promise.race([loadPromise, timeoutPromise]);
            }
            
            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    },
                    // 添加超时设置
                    global: {
                        fetch: (url, options) => {
                            return fetch(url, {
                                ...options,
                                signal: AbortSignal.timeout(15000) // 15秒超时
                            });
                        }
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
            
            // 检查认证状态（带超时）
            try {
                const sessionPromise = this.supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('认证检查超时')), 8000)
                );
                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
                
                if (session) {
                    this.state.userId = session.user.id;
                    this.state.userEmail = session.user.email;
                    Storage.save('adhd_cloud_user_id', this.state.userId);
                    Storage.save('adhd_cloud_user_email', this.state.userEmail);
                    this.updateCloudButton();
                    this.startAutoSync();
                    // 登录后延迟同步，不阻塞页面
                    setTimeout(() => this.syncNow(), 3000);
                }
            } catch (authError) {
                console.warn('认证检查失败，使用本地缓存:', authError.message);
                // 使用本地缓存的用户信息
                if (this.state.userId) {
                    this.updateCloudButton();
                }
            }
            
            return true;
        } catch (error) {
            console.error('Supabase初始化失败:', error);
            // 初始化失败时使用本地缓存
            if (this.state.userId) {
                this.updateCloudButton();
            }
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
                            <button class="cloud-action-btn" onclick="CloudSync.manualSync(); document.getElementById('cloudConfigModal').remove();">
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
                if (typeof App.loadTimeline === 'function') {
                    App.loadTimeline();
                } else if (typeof App.renderTimeline === 'function') {
                    App.renderTimeline();
                }
                if (typeof App.updateGameStatus === 'function') {
                    App.updateGameStatus();
                }
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
        // 每30秒自动同步（提高频率以保持实时性）
        if (this._autoSyncInterval) {
            clearInterval(this._autoSyncInterval);
        }
        this._autoSyncInterval = setInterval(() => {
            if (this.state.isOnline && this.state.userId && !this.state.syncInProgress) {
                console.log('⏰ 定时同步触发');
                this.syncNow();
            }
        }, 30 * 1000);  // 30秒
        
        // 监听数据变化
        this.watchLocalChanges();
        
        // 启动实时同步监听
        this.startRealtimeSync();
        
        console.log('✅ 自动同步已启动');
    },
    
    // 启动 Supabase Realtime 实时同步
    startRealtimeSync() {
        if (!this.supabase || !this.state.userId) {
            console.log('无法启动实时同步: supabase或userId不存在');
            return;
        }
        
        // 取消之前的订阅
        this.stopRealtimeSync();
        
        console.log('正在启动实时同步订阅...');
        
        // 生成唯一的channel名称，避免冲突
        const channelName = `user_data_${this.state.userId}_${Date.now()}`;
        
        // 订阅用户数据变化
        this._realtimeChannel = this.supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_data',
                    filter: `user_id=eq.${this.state.userId}`
                },
                (payload) => {
                    console.log('📡 收到实时更新:', payload.eventType, new Date().toLocaleTimeString());
                    
                    // 忽略自己刚刚上传的更新（通过时间戳判断）
                    if (this._lastUploadTime && Date.now() - this._lastUploadTime < 3000) {
                        console.log('忽略自己的更新');
                        return;
                    }
                    
                    // 收到远程更新，下载最新数据
                    if (!this.state.syncInProgress && !this._merging) {
                        // 使用防抖，避免频繁刷新
                        clearTimeout(this._realtimeDownloadTimer);
                        this._realtimeDownloadTimer = setTimeout(() => {
                            this.downloadChanges().then(() => {
                                console.log('✅ 实时同步完成');
                                // 刷新界面
                                this.refreshUI();
                            }).catch(err => {
                                console.error('❌ 实时同步失败:', err);
                            });
                        }, 500);
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('Realtime 订阅状态:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ 实时同步已连接');
                    this._realtimeConnected = true;
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('❌ 实时同步连接失败:', err);
                    this._realtimeConnected = false;
                    // 5秒后重试
                    setTimeout(() => this.startRealtimeSync(), 5000);
                } else if (status === 'CLOSED') {
                    console.log('实时同步已断开');
                    this._realtimeConnected = false;
                }
            });
    },
    
    // 刷新UI
    refreshUI() {
        if (typeof App !== 'undefined') {
            // 刷新时间轴
            if (typeof App.loadTimeline === 'function') {
                App.loadTimeline();
            }
            // 刷新游戏状态
            if (typeof App.updateGameStatus === 'function') {
                App.updateGameStatus();
            }
            // 刷新游戏系统面板
            if (typeof App.loadGameSystem === 'function') {
                App.loadGameSystem();
            }
            // 刷新聊天记录
            if (typeof App.loadChatMessages === 'function') {
                App.loadChatMessages();
            }
            // 刷新智能输入（更新头部金币精力显示）
            if (typeof App.loadSmartInput === 'function') {
                App.loadSmartInput();
            }
        }
    },
    
    // 停止实时同步
    stopRealtimeSync() {
        if (this._realtimeChannel && this.supabase) {
            console.log('🔌 断开实时同步连接');
            this.supabase.removeChannel(this._realtimeChannel);
            this._realtimeChannel = null;
            this._realtimeConnected = false;
        }
    },
    
    // 监听本地数据变化
    watchLocalChanges() {
        // 重写Storage的save方法来追踪变化
        const originalSave = Storage.save.bind(Storage);
        Storage.save = (key, data) => {
            // 如果正在合并远程数据，直接保存不记录变化
            if (this._merging) {
                return originalSave(key, data);
            }
            
            const result = originalSave(key, data);
            
            // 记录需要同步的变化
            if (this.shouldSync(key)) {
                this.recordChange(key, data);
            }
            
            return result;
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
            'adhd_recurring_tasks',
            'adhd_chat_messages'  // 添加聊天记录同步
        ];
        return syncKeys.includes(key);
    },
    
    // 记录变化
    recordChange(key, data) {
        // 如果正在合并远程数据，不记录变化（避免循环）
        if (this._merging) return;
        
        // 限制待同步队列大小，防止 QuotaExceededError
        if (this.state.pendingChanges.length > 50) {
            this.state.pendingChanges = this.state.pendingChanges.slice(-20);
        }
        
        // 检查是否已有相同 key 的变化，如果有则更新而不是添加
        const existingIndex = this.state.pendingChanges.findIndex(c => c.key === key);
        if (existingIndex !== -1) {
            this.state.pendingChanges[existingIndex] = {
                key,
                data,
                timestamp: Date.now()
            };
        } else {
            this.state.pendingChanges.push({
                key,
                data,
                timestamp: Date.now()
            });
        }
        
        // 使用原始的 localStorage 保存，避免触发监听
        try {
            // 只保存 key 和 timestamp，不保存完整数据（减少存储空间）
            const minimalChanges = this.state.pendingChanges.map(c => ({
                key: c.key,
                timestamp: c.timestamp
            }));
            localStorage.setItem('adhd_pending_sync', JSON.stringify(minimalChanges));
        } catch (e) {
            console.error('保存待同步数据失败:', e);
            // 如果存储失败，清空待同步队列
            this.state.pendingChanges = [];
            try {
                localStorage.removeItem('adhd_pending_sync');
            } catch (e2) {}
        }
        
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
                if (this.state.isOnline && this.state.userId && !this.state.syncInProgress) {
                    console.log('📤 防抖同步触发');
                    this.syncNow();
                }
            }, 1500);  // 1.5秒防抖，更快响应
        };
    })(),
    
    // 立即同步
    async syncNow() {
        if (!this.supabase || !this.state.userId || this.state.syncInProgress) {
            return;
        }
        
        this.state.syncInProgress = true;
        this.updateSyncStatusIndicator();
        this.showSyncIndicator();
        
        try {
            // 设置同步超时
            const syncPromise = this._doSync();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('同步超时，请检查网络')), 20000)
            );
            
            await Promise.race([syncPromise, timeoutPromise]);
            
            // 更新同步时间
            this.state.lastSync = Date.now();
            Storage.save('adhd_last_sync', this.state.lastSync);
            
            // 清空待同步队列
            this.state.pendingChanges = [];
            Storage.save('adhd_pending_sync', []);
            
            this.hideSyncIndicator();
            this.updateSyncStatusIndicator();
            console.log('✅ 云同步完成:', new Date().toLocaleString());
            
        } catch (error) {
            console.error('❌ 同步失败:', error);
            this.hideSyncIndicator(true);
            this.updateSyncStatusIndicator();
            
            // 只在用户主动操作时显示错误提示
            if (this._manualSync) {
                Settings.showToast('error', '同步失败', error.message || '请检查网络连接');
            }
        } finally {
            this.state.syncInProgress = false;
            this._manualSync = false;
            this.updateSyncStatusIndicator();
        }
    },
    
    // 实际执行同步
    async _doSync() {
        // 1. 上传本地变化
        await this.uploadChanges();
        
        // 2. 下载远程变化
        await this.downloadChanges();
    },
    
    // 手动触发同步（显示错误提示）
    async manualSync() {
        this._manualSync = true;
        await this.syncNow();
    },
    
    // 上传变化
    async uploadChanges() {
        const syncData = this.getAllSyncData();
        
        // 增加版本号
        this.state.dataVersion = (this.state.dataVersion || 0) + 1;
        
        // 记录上传时间，用于忽略自己的实时更新
        this._lastUploadTime = Date.now();
        
        const uploadData = {
            data: syncData,
            data_type: 'full_sync',
            device_id: this.state.deviceId,
            version: this.state.dataVersion,
            updated_at: new Date().toISOString()
        };
        
        // 先检查是否已有数据
        const { data: existingData } = await this.supabase
            .from('user_data')
            .select('user_id, version')
            .eq('user_id', this.state.userId)
            .single();
        
        if (existingData) {
            // 更新现有数据
            const { error } = await this.supabase
                .from('user_data')
                .update(uploadData)
                .eq('user_id', this.state.userId);
            
            if (error) throw error;
        } else {
            // 插入新数据
            const { error } = await this.supabase
                .from('user_data')
                .insert({
                    user_id: this.state.userId,
                    ...uploadData
                });
            
            if (error) throw error;
        }
        
        console.log('📤 数据已上传, 版本:', this.state.dataVersion);
    },
    
    // 下载变化
    async downloadChanges() {
        const { data, error } = await this.supabase
            .from('user_data')
            .select('data, updated_at, device_id, version')
            .eq('user_id', this.state.userId)
            .maybeSingle();  // 使用 maybeSingle 避免没有数据时报错
        
        if (error) throw error;
        
        if (data && data.data) {
            // 检查是否是自己设备刚刚上传的数据
            if (data.device_id === this.state.deviceId && 
                this._lastUploadTime && 
                Date.now() - this._lastUploadTime < 5000) {
                console.log('📥 跳过自己设备的更新');
                return;
            }
            
            // 检查版本号，避免旧数据覆盖新数据
            const remoteVersion = data.version || 0;
            if (remoteVersion <= this.state.dataVersion && data.device_id === this.state.deviceId) {
                console.log('📥 本地数据已是最新版本');
                return;
            }
            
            console.log('📥 下载远程数据, 版本:', remoteVersion, '来自设备:', data.device_id);
            
            // 合并远程数据
            this.mergeRemoteData(data.data);
            
            // 更新本地版本号
            this.state.dataVersion = Math.max(this.state.dataVersion, remoteVersion);
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
            recurring: Storage.load('adhd_recurring_tasks', []),
            chatMessages: Storage.load('adhd_chat_messages', [])  // 添加聊天记录
        };
    },
    
    // 合并远程数据（智能合并策略）
    mergeRemoteData(remoteData) {
        // 暂时禁用同步监听，避免循环触发
        this._merging = true;
        
        console.log('🔄 开始合并远程数据...');
        
        try {
            // 使用原始 localStorage 直接保存，完全绕过 Storage.save 的监听
            const saveDirectly = (key, data) => {
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (e) {
                    console.error('直接保存失败:', key, e);
                }
            };
            
            let hasChanges = false;
            
            // 智能合并任务（按ID和时间戳合并）
            if (remoteData.tasks) {
                const localTasks = Storage.getTasks() || [];
                const mergedTasks = this.mergeByIdAndTimestamp(localTasks, remoteData.tasks, 'id');
                if (JSON.stringify(mergedTasks) !== JSON.stringify(localTasks)) {
                    saveDirectly('adhd_focus_tasks', mergedTasks);
                    hasChanges = true;
                    console.log('  ✓ 任务已合并:', mergedTasks.length, '条');
                }
            }
            
            // 智能合并记忆（按ID和时间戳合并）
            if (remoteData.memories) {
                const localMemories = Storage.getMemories() || [];
                const mergedMemories = this.mergeByIdAndTimestamp(localMemories, remoteData.memories, 'id');
                if (JSON.stringify(mergedMemories) !== JSON.stringify(localMemories)) {
                    saveDirectly('adhd_focus_memories', mergedMemories);
                    hasChanges = true;
                    console.log('  ✓ 记忆已合并:', mergedMemories.length, '条');
                }
            }
            
            // 智能合并聊天记录（按ID和时间戳合并）
            if (remoteData.chatMessages) {
                const localMessages = Storage.load('adhd_chat_messages', []);
                const mergedMessages = this.mergeByIdAndTimestamp(localMessages, remoteData.chatMessages, 'id');
                // 只保留最近200条
                const trimmedMessages = mergedMessages.slice(-200);
                if (JSON.stringify(trimmedMessages) !== JSON.stringify(localMessages)) {
                    saveDirectly('adhd_chat_messages', trimmedMessages);
                    hasChanges = true;
                    console.log('  ✓ 聊天记录已合并:', trimmedMessages.length, '条');
                }
            }
            
            // 游戏状态：智能合并（取较优值）
            if (remoteData.gameState) {
                const localState = Storage.getGameState() || {};
                const mergedState = this.mergeGameState(localState, remoteData.gameState);
                if (JSON.stringify(mergedState) !== JSON.stringify(localState)) {
                    saveDirectly('adhd_focus_game_state', mergedState);
                    hasChanges = true;
                    console.log('  ✓ 游戏状态已合并');
                }
            }
            
            // 其他数据：远程覆盖本地（简单策略）
            if (remoteData.valueFinance) {
                saveDirectly('adhd_value_finance', remoteData.valueFinance);
            }
            if (remoteData.aiMemory) {
                saveDirectly('adhd_ai_memory_data', remoteData.aiMemory);
            }
            if (remoteData.customTags) {
                saveDirectly('adhd_custom_tags', remoteData.customTags);
            }
            if (remoteData.templates) {
                saveDirectly('adhd_task_templates', remoteData.templates);
            }
            if (remoteData.recurring) {
                saveDirectly('adhd_recurring_tasks', remoteData.recurring);
            }
            
            // 只有有变化时才刷新界面
            if (hasChanges) {
                console.log('🔄 数据有变化，刷新界面...');
                this.refreshUI();
            } else {
                console.log('📥 数据无变化');
            }
        } finally {
            this._merging = false;
        }
    },
    
    // 按ID和时间戳智能合并数组
    mergeByIdAndTimestamp(localArray, remoteArray, idField = 'id') {
        const merged = new Map();
        
        // 先添加本地数据
        (localArray || []).forEach(item => {
            if (item && item[idField]) {
                merged.set(item[idField], item);
            }
        });
        
        // 合并远程数据（按时间戳判断）
        (remoteArray || []).forEach(item => {
            if (!item || !item[idField]) return;
            
            const existing = merged.get(item[idField]);
            if (!existing) {
                // 本地没有，直接添加
                merged.set(item[idField], item);
            } else {
                // 本地有，比较时间戳，取较新的
                const localTime = new Date(existing.updatedAt || existing.createdAt || existing.timestamp || 0).getTime();
                const remoteTime = new Date(item.updatedAt || item.createdAt || item.timestamp || 0).getTime();
                
                if (remoteTime > localTime) {
                    merged.set(item[idField], item);
                }
            }
        });
        
        // 转换回数组并按时间排序
        return Array.from(merged.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return timeA - timeB;
        });
    },
    
    // 合并游戏状态（取较优值）
    mergeGameState(localState, remoteState) {
        return {
            coins: Math.max(localState.coins || 0, remoteState.coins || 0),
            energy: Math.max(localState.energy || 0, remoteState.energy || 0),
            maxEnergy: Math.max(localState.maxEnergy || 10, remoteState.maxEnergy || 10),
            level: Math.max(localState.level || 1, remoteState.level || 1),
            exp: Math.max(localState.exp || 0, remoteState.exp || 0),
            completedTasks: Math.max(localState.completedTasks || 0, remoteState.completedTasks || 0),
            achievements: this.mergeArrayUnique(localState.achievements || [], remoteState.achievements || [])
        };
    },
    
    // 合并数组（去重）
    mergeArrayUnique(arr1, arr2) {
        const set = new Set([...(arr1 || []), ...(arr2 || [])]);
        return Array.from(set);
    },
    
    // ==================== UI ====================
    
    // 显示同步指示器（静默模式，不显示）
    showSyncIndicator() {
        // 静默同步，不显示指示器
        // 只在调试模式下显示
        if (this._debugMode) {
            let indicator = document.getElementById('syncIndicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'syncIndicator';
                indicator.className = 'sync-indicator';
                indicator.innerHTML = '<div class="sync-spinner"></div><span>同步中...</span>';
                document.body.appendChild(indicator);
            }
            indicator.classList.add('show');
        }
    },
    
    // 隐藏同步指示器
    hideSyncIndicator(isError = false) {
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
        try {
            const saved = localStorage.getItem('adhd_pending_sync');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 检查数据大小，如果太大则清空
                if (saved.length > 100000) { // 100KB 限制
                    console.warn('待同步数据过大，已清空');
                    localStorage.removeItem('adhd_pending_sync');
                    this.state.pendingChanges = [];
                } else {
                    this.state.pendingChanges = Array.isArray(parsed) ? parsed : [];
                }
            } else {
                this.state.pendingChanges = [];
            }
        } catch (e) {
            console.error('加载待同步数据失败:', e);
            this.state.pendingChanges = [];
            try {
                localStorage.removeItem('adhd_pending_sync');
            } catch (e2) {}
        }
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
    
    /* 同步状态指示器 */
    .sync-status-indicator {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 1000;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #666;
    }
    
    [data-theme="dark"] .sync-status-indicator {
        background: rgba(40, 40, 60, 0.95);
        color: #aaa;
    }
    
    .sync-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }
    
    .sync-dot.connected {
        background: #4CAF50;
        box-shadow: 0 0 6px #4CAF50;
    }
    
    .sync-dot.syncing {
        background: #2196F3;
        animation: pulse 1s ease-in-out infinite;
    }
    
    .sync-dot.disconnected {
        background: #FF9800;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
    }
    
    /* 移动端隐藏同步指示器 */
    @media (max-width: 768px) {
        .sync-status-indicator {
            bottom: 70px;
            right: 10px;
            padding: 4px 8px;
            font-size: 10px;
        }
    }
`;
document.head.appendChild(syncStyles);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    CloudSync.init();
});

// 导出
window.CloudSync = CloudSync;

