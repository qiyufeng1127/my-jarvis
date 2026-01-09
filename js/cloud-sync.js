// 简单同步码云同步模块
// 不需要账号密码，只需要一个同步码即可在多设备间同步数据

const CloudSync = {
    // Supabase 配置
    config: {
        url: 'https://nucvylmszllecoupjfbh.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o'
    },
    
    // 同步状态
    state: {
        syncCode: null,      // 同步码（6位数字）
        deviceId: null,      // 设备ID
        lastSync: null,      // 上次同步时间
        isOnline: navigator.onLine,
        syncInProgress: false
    },
    
    // Supabase 客户端
    supabase: null,
    
    // 初始化
    async init() {
        this.loadState();
        this.initDeviceId();
        this.setupOnlineListener();
        this.updateCloudButton();
        
        // 延迟加载 Supabase
        setTimeout(async () => {
            await this.initSupabase();
            
            // 如果已有同步码，自动开始同步
            if (this.state.syncCode) {
                this.startAutoSync();
            }
        }, 500);
        
        // 页面可见时同步
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.state.syncCode) {
                console.log('📱 页面恢复，开始同步...');
                this.syncNow();
            }
        });
        
        console.log('☁️ 云同步模块已初始化');
    },
    
    // 初始化设备ID
    initDeviceId() {
        let deviceId = localStorage.getItem('adhd_device_id');
        if (!deviceId) {
            deviceId = 'D' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
            localStorage.setItem('adhd_device_id', deviceId);
        }
        this.state.deviceId = deviceId;
    },
    
    // 加载状态
    loadState() {
        this.state.syncCode = localStorage.getItem('adhd_sync_code');
        this.state.lastSync = localStorage.getItem('adhd_last_sync');
    },
    
    // 保存状态
    saveState() {
        if (this.state.syncCode) {
            localStorage.setItem('adhd_sync_code', this.state.syncCode);
        } else {
            localStorage.removeItem('adhd_sync_code');
        }
        if (this.state.lastSync) {
            localStorage.setItem('adhd_last_sync', this.state.lastSync);
        }
    },
    
    // 初始化 Supabase
    async initSupabase() {
        try {
            if (!window.supabase) {
                await this.loadSupabaseSDK();
            }
            
            this.supabase = window.supabase.createClient(
                this.config.url,
                this.config.anonKey
            );
            
            console.log('✅ Supabase 已连接');
            return true;
        } catch (e) {
            console.error('❌ Supabase 连接失败:', e);
            return false;
        }
    },
    
    // 加载 Supabase SDK
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
    
    // 生成6位同步码
    generateSyncCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
    
    // ==================== 主要功能 ====================
    
    // 显示同步弹窗
    showConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'syncModal';
        
        if (this.state.syncCode) {
            // 已有同步码，显示状态
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <span class="modal-icon">☁️</span>
                        <h2>云同步</h2>
                    </div>
                    <div class="modal-body">
                        <div class="sync-code-display">
                            <div class="sync-code-label">你的同步码</div>
                            <div class="sync-code-value">${this.state.syncCode}</div>
                            <div class="sync-code-hint">在其他设备输入此码即可同步数据</div>
                        </div>
                        
                        <div class="sync-status-box">
                            <div class="sync-status-row">
                                <span>设备ID</span>
                                <span>${this.state.deviceId}</span>
                            </div>
                            <div class="sync-status-row">
                                <span>上次同步</span>
                                <span>${this.state.lastSync ? this.formatTime(this.state.lastSync) : '从未'}</span>
                            </div>
                            <div class="sync-status-row">
                                <span>网络状态</span>
                                <span>${this.state.isOnline ? '🟢 在线' : '🔴 离线'}</span>
                            </div>
                        </div>
                        
                        <div class="sync-actions">
                            <button class="sync-btn primary" onclick="CloudSync.syncNow(); document.getElementById('syncModal').remove();">
                                🔄 立即同步
                            </button>
                            <button class="sync-btn danger" onclick="CloudSync.disconnect();">
                                🔌 断开同步
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn btn-cancel" onclick="document.getElementById('syncModal').remove()">关闭</button>
                    </div>
                </div>
            `;
        } else {
            // 没有同步码，显示设置界面
            const newCode = this.generateSyncCode();
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <span class="modal-icon">☁️</span>
                        <h2>云同步设置</h2>
                    </div>
                    <div class="modal-body">
                        <div class="sync-tabs">
                            <button class="sync-tab active" onclick="CloudSync.switchTab('new')">创建新同步</button>
                            <button class="sync-tab" onclick="CloudSync.switchTab('join')">加入已有同步</button>
                        </div>
                        
                        <div id="syncTabNew" class="sync-tab-content active">
                            <p class="sync-desc">创建一个新的同步码，然后在其他设备输入此码</p>
                            <div class="sync-code-display">
                                <div class="sync-code-label">你的新同步码</div>
                                <div class="sync-code-value" id="newSyncCode">${newCode}</div>
                                <button class="sync-code-refresh" onclick="CloudSync.refreshCode()">🔄 换一个</button>
                            </div>
                            <button class="sync-btn primary full" onclick="CloudSync.createSync('${newCode}')">
                                ✨ 使用此同步码
                            </button>
                        </div>
                        
                        <div id="syncTabJoin" class="sync-tab-content">
                            <p class="sync-desc">输入其他设备上显示的6位同步码</p>
                            <div class="sync-input-group">
                                <input type="text" id="joinSyncCode" class="sync-code-input" 
                                       placeholder="输入6位同步码" maxlength="6" 
                                       oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                            </div>
                            <button class="sync-btn primary full" onclick="CloudSync.joinSync()">
                                🔗 加入同步
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn btn-cancel" onclick="document.getElementById('syncModal').remove()">取消</button>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
    },
    
    // 切换标签页
    switchTab(tab) {
        document.querySelectorAll('.sync-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sync-tab-content').forEach(c => c.classList.remove('active'));
        
        if (tab === 'new') {
            document.querySelector('.sync-tab:first-child').classList.add('active');
            document.getElementById('syncTabNew').classList.add('active');
        } else {
            document.querySelector('.sync-tab:last-child').classList.add('active');
            document.getElementById('syncTabJoin').classList.add('active');
        }
    },
    
    // 刷新同步码
    refreshCode() {
        const newCode = this.generateSyncCode();
        document.getElementById('newSyncCode').textContent = newCode;
        // 更新按钮的onclick
        document.querySelector('#syncTabNew .sync-btn.primary').onclick = () => this.createSync(newCode);
    },
    
    // 创建新同步
    async createSync(code) {
        if (!this.supabase) {
            Settings.showToast('error', '连接失败', '请检查网络');
            return;
        }
        
        try {
            // 检查同步码是否已存在
            const { data: existing } = await this.supabase
                .from('sync_data')
                .select('sync_code')
                .eq('sync_code', code)
                .maybeSingle();
            
            if (existing) {
                // 同步码已存在，换一个
                Settings.showToast('warning', '同步码已被使用', '请换一个');
                this.refreshCode();
                return;
            }
            
            // 创建新的同步数据
            const syncData = this.getAllSyncData();
            const { error } = await this.supabase
                .from('sync_data')
                .insert({
                    sync_code: code,
                    data: syncData,
                    device_id: this.state.deviceId,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            // 保存同步码
            this.state.syncCode = code;
            this.state.lastSync = Date.now();
            this.saveState();
            this.updateCloudButton();
            this.startAutoSync();
            
            document.getElementById('syncModal')?.remove();
            Settings.showToast('success', '同步已创建', '同步码: ' + code);
            
        } catch (e) {
            console.error('创建同步失败:', e);
            Settings.showToast('error', '创建失败', e.message);
        }
    },
    
    // 加入已有同步
    async joinSync() {
        const code = document.getElementById('joinSyncCode')?.value?.trim();
        
        if (!code || code.length !== 6) {
            Settings.showToast('warning', '请输入6位同步码', '');
            return;
        }
        
        if (!this.supabase) {
            Settings.showToast('error', '连接失败', '请检查网络');
            return;
        }
        
        try {
            // 查找同步数据
            const { data, error } = await this.supabase
                .from('sync_data')
                .select('*')
                .eq('sync_code', code)
                .maybeSingle();
            
            if (error) throw error;
            
            if (!data) {
                Settings.showToast('error', '同步码不存在', '请检查是否输入正确');
                return;
            }
            
            // 保存同步码
            this.state.syncCode = code;
            this.saveState();
            
            // 下载远程数据
            if (data.data) {
                this.mergeRemoteData(data.data);
            }
            
            this.state.lastSync = Date.now();
            this.saveState();
            this.updateCloudButton();
            this.startAutoSync();
            
            document.getElementById('syncModal')?.remove();
            Settings.showToast('success', '已加入同步', '数据已同步');
            
            // 刷新界面
            this.refreshUI();
            
        } catch (e) {
            console.error('加入同步失败:', e);
            Settings.showToast('error', '加入失败', e.message);
        }
    },
    
    // 断开同步
    disconnect() {
        this.state.syncCode = null;
        this.state.lastSync = null;
        localStorage.removeItem('adhd_sync_code');
        localStorage.removeItem('adhd_last_sync');
        
        if (this._syncInterval) {
            clearInterval(this._syncInterval);
        }
        
        this.updateCloudButton();
        document.getElementById('syncModal')?.remove();
        Settings.showToast('info', '已断开同步', '本地数据保留');
    },
    
    // ==================== 同步逻辑 ====================
    
    // 开始自动同步
    startAutoSync() {
        if (this._syncInterval) {
            clearInterval(this._syncInterval);
        }
        
        // 每10秒同步一次
        this._syncInterval = setInterval(() => {
            if (this.state.isOnline && this.state.syncCode && !this.state.syncInProgress) {
                this.syncNow();
            }
        }, 10000);
        
        // 监听数据变化
        this.watchLocalChanges();
        
        console.log('✅ 自动同步已启动，每10秒同步一次');
    },
    
    // 监听本地数据变化
    watchLocalChanges() {
        if (this._watchingChanges) return;
        this._watchingChanges = true;
        
        const originalSave = Storage.save.bind(Storage);
        Storage.save = (key, data) => {
            const result = originalSave(key, data);
            
            // 如果是需要同步的数据，触发同步
            if (this.shouldSync(key) && !this._merging && this.state.syncCode) {
                clearTimeout(this._syncTimer);
                this._syncTimer = setTimeout(() => this.syncNow(), 2000);
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
            'adhd_chat_messages'
        ];
        return syncKeys.includes(key);
    },
    
    // 立即同步
    async syncNow() {
        if (!this.supabase || !this.state.syncCode || this.state.syncInProgress) {
            return;
        }
        
        this.state.syncInProgress = true;
        console.log('🔄 开始同步...');
        
        try {
            // 1. 下载远程数据
            const { data: remoteData, error: fetchError } = await this.supabase
                .from('sync_data')
                .select('*')
                .eq('sync_code', this.state.syncCode)
                .maybeSingle();
            
            if (fetchError) throw fetchError;
            
            // 2. 合并数据
            let localData = this.getAllSyncData();
            let mergedData = localData;
            
            if (remoteData && remoteData.data) {
                // 如果远程数据来自其他设备，合并它
                if (remoteData.device_id !== this.state.deviceId) {
                    this._merging = true;
                    mergedData = this.mergeData(localData, remoteData.data);
                    this.saveLocalData(mergedData);
                    this._merging = false;
                    console.log('📥 已合并远程数据');
                }
            }
            
            // 3. 上传合并后的数据
            const { error: updateError } = await this.supabase
                .from('sync_data')
                .upsert({
                    sync_code: this.state.syncCode,
                    data: mergedData,
                    device_id: this.state.deviceId,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'sync_code'
                });
            
            if (updateError) throw updateError;
            
            this.state.lastSync = Date.now();
            this.saveState();
            console.log('✅ 同步完成:', new Date().toLocaleTimeString());
            
        } catch (e) {
            console.error('❌ 同步失败:', e);
        } finally {
            this.state.syncInProgress = false;
        }
    },
    
    // 获取所有需要同步的数据
    getAllSyncData() {
        return {
            tasks: Storage.getTasks() || [],
            memories: Storage.getMemories() || [],
            gameState: Storage.getGameState() || {},
            chatMessages: Storage.load('adhd_chat_messages', []),
            timestamp: Date.now()
        };
    },
    
    // 合并数据
    mergeData(local, remote) {
        return {
            tasks: this.mergeArrayById(local.tasks || [], remote.tasks || []),
            memories: this.mergeArrayById(local.memories || [], remote.memories || []),
            gameState: this.mergeGameState(local.gameState || {}, remote.gameState || {}),
            chatMessages: this.mergeArrayById(local.chatMessages || [], remote.chatMessages || []).slice(-100),
            timestamp: Date.now()
        };
    },
    
    // 按ID合并数组
    mergeArrayById(arr1, arr2) {
        const map = new Map();
        
        // 添加第一个数组
        arr1.forEach(item => {
            if (item && item.id) {
                map.set(item.id, item);
            }
        });
        
        // 合并第二个数组（按时间戳取较新的）
        arr2.forEach(item => {
            if (!item || !item.id) return;
            
            const existing = map.get(item.id);
            if (!existing) {
                map.set(item.id, item);
            } else {
                // 比较时间戳
                const t1 = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
                const t2 = new Date(item.updatedAt || item.createdAt || 0).getTime();
                if (t2 > t1) {
                    map.set(item.id, item);
                }
            }
        });
        
        // 按创建时间排序
        return Array.from(map.values()).sort((a, b) => {
            const t1 = new Date(a.createdAt || 0).getTime();
            const t2 = new Date(b.createdAt || 0).getTime();
            return t1 - t2;
        });
    },
    
    // 合并游戏状态
    mergeGameState(s1, s2) {
        return {
            coins: Math.max(s1.coins || 0, s2.coins || 0),
            energy: Math.max(s1.energy || 0, s2.energy || 0),
            maxEnergy: Math.max(s1.maxEnergy || 25, s2.maxEnergy || 25),
            level: Math.max(s1.level || 1, s2.level || 1),
            exp: Math.max(s1.exp || 0, s2.exp || 0),
            completedTasks: Math.max(s1.completedTasks || 0, s2.completedTasks || 0)
        };
    },
    
    // 保存本地数据
    saveLocalData(data) {
        if (data.tasks) {
            localStorage.setItem('adhd_focus_tasks', JSON.stringify(data.tasks));
        }
        if (data.memories) {
            localStorage.setItem('adhd_focus_memories', JSON.stringify(data.memories));
        }
        if (data.gameState) {
            localStorage.setItem('adhd_focus_game_state', JSON.stringify(data.gameState));
        }
        if (data.chatMessages) {
            localStorage.setItem('adhd_chat_messages', JSON.stringify(data.chatMessages));
        }
        
        // 刷新界面
        this.refreshUI();
    },
    
    // 合并远程数据到本地
    mergeRemoteData(remoteData) {
        const localData = this.getAllSyncData();
        const merged = this.mergeData(localData, remoteData);
        this._merging = true;
        this.saveLocalData(merged);
        this._merging = false;
    },
    
    // 刷新UI
    refreshUI() {
        if (typeof App !== 'undefined') {
            if (typeof App.loadTimeline === 'function') App.loadTimeline();
            if (typeof App.updateGameStatus === 'function') App.updateGameStatus();
            if (typeof App.loadSmartInput === 'function') App.loadSmartInput();
        }
    },
    
    // ==================== UI ====================
    
    // 更新云同步按钮
    updateCloudButton() {
        const btn = document.getElementById('cloudToggle');
        if (btn) {
            if (this.state.syncCode) {
                btn.classList.add('logged-in');
                btn.title = '同步码: ' + this.state.syncCode;
                btn.style.color = '#4CAF50';
            } else {
                btn.classList.remove('logged-in');
                btn.title = '点击设置云同步';
                btn.style.color = '';
            }
        }
    },
    
    // 设置在线监听
    setupOnlineListener() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            if (this.state.syncCode) {
                this.syncNow();
            }
        });
        
        window.addEventListener('offline', () => {
            this.state.isOnline = false;
        });
    },
    
    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(parseInt(timestamp));
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        return Math.floor(diff / 86400000) + '天前';
    }
};

// 添加样式
const syncStyles = document.createElement('style');
syncStyles.textContent = `
    .sync-code-display {
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        margin-bottom: 16px;
    }
    
    .sync-code-label {
        color: rgba(255,255,255,0.8);
        font-size: 13px;
        margin-bottom: 8px;
    }
    
    .sync-code-value {
        color: white;
        font-size: 36px;
        font-weight: bold;
        letter-spacing: 8px;
        font-family: 'Courier New', monospace;
    }
    
    .sync-code-hint {
        color: rgba(255,255,255,0.7);
        font-size: 12px;
        margin-top: 8px;
    }
    
    .sync-code-refresh {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        margin-top: 12px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .sync-code-refresh:hover {
        background: rgba(255,255,255,0.3);
    }
    
    .sync-status-box {
        background: #f5f5f5;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 16px;
    }
    
    [data-theme="dark"] .sync-status-box {
        background: rgba(255,255,255,0.1);
    }
    
    .sync-status-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 13px;
        border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    
    .sync-status-row:last-child {
        border-bottom: none;
    }
    
    .sync-actions {
        display: flex;
        gap: 10px;
    }
    
    .sync-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .sync-btn.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .sync-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .sync-btn.danger {
        background: #f5f5f5;
        color: #e74c3c;
    }
    
    .sync-btn.danger:hover {
        background: #fee;
    }
    
    .sync-btn.full {
        width: 100%;
    }
    
    .sync-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }
    
    .sync-tab {
        flex: 1;
        padding: 10px;
        border: none;
        background: #f0f0f0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
    }
    
    [data-theme="dark"] .sync-tab {
        background: rgba(255,255,255,0.1);
        color: #ccc;
    }
    
    .sync-tab.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .sync-tab-content {
        display: none;
    }
    
    .sync-tab-content.active {
        display: block;
    }
    
    .sync-desc {
        color: #666;
        font-size: 13px;
        margin-bottom: 16px;
        text-align: center;
    }
    
    .sync-input-group {
        margin-bottom: 16px;
    }
    
    .sync-code-input {
        width: 100%;
        padding: 16px;
        font-size: 24px;
        text-align: center;
        letter-spacing: 8px;
        border: 2px solid #ddd;
        border-radius: 12px;
        font-family: 'Courier New', monospace;
        box-sizing: border-box;
    }
    
    .sync-code-input:focus {
        outline: none;
        border-color: #667eea;
    }
    
    [data-theme="dark"] .sync-code-input {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.2);
        color: white;
    }
`;
document.head.appendChild(syncStyles);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    CloudSync.init();
});

window.CloudSync = CloudSync;
