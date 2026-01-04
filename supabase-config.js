// Supabase配置文件
// 请在Supabase控制台获取这些值并替换

const SUPABASE_CONFIG = {
    // 从 https://app.supabase.com 项目设置中获取
    url: 'https://rkacmsgngdlolooodtjv.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYWNtc2duZ2Rsb2xvb29kdGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzE2NzcsImV4cCI6MjA1MTMwNzY3N30.sb_publishable_7dgzskR8jA_lFEsTSsQIrw_uoND9GHO'
    
    // 数据库表名配置
    tables: {
        users: 'users',
        tasks: 'tasks', 
        memories: 'memories',
        coins: 'coin_transactions',
        settings: 'user_settings',
        procrastination: 'procrastination_records',
        inefficiency: 'inefficiency_records',
        focus_sessions: 'focus_sessions'
    }
};

// 初始化Supabase客户端
let supabase;

// 当前用户状态
let currentUser = null;
let isOnline = navigator.onLine;

// 离线数据缓存
let offlineCache = {
    tasks: [],
    memories: [],
    coins: [],
    settings: {},
    pendingSync: []
};

// 初始化Supabase
async function initSupabase() {
    try {
        // 检查Supabase配置
        if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
            console.warn('请先配置Supabase URL和密钥');
            showNotification('请先配置Supabase连接信息', 'error');
            return false;
        }

        // 初始化Supabase客户端
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        // 检查用户登录状态
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUser = user;
            await loadUserData();
            showNotification('欢迎回来！数据已同步', 'success');
        }

        // 监听认证状态变化
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                currentUser = session.user;
                await loadUserData();
                showNotification('登录成功！', 'success');
                hideLoginModal();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                clearUserData();
                showNotification('已退出登录', 'info');
                showLoginModal();
            }
        });

        // 监听网络状态
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 设置实时订阅
        setupRealtimeSubscriptions();

        console.log('Supabase初始化成功');
        return true;
    } catch (error) {
        console.error('Supabase初始化失败:', error);
        showNotification('数据库连接失败，将使用离线模式', 'error');
        return false;
    }
}

// 用户认证函数
async function signUp(email, password, userData = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: userData
            }
        });

        if (error) throw error;

        showNotification('注册成功！请检查邮箱验证链接', 'success');
        return { success: true, data };
    } catch (error) {
        console.error('注册失败:', error);
        showNotification(`注册失败: ${error.message}`, 'error');
        return { success: false, error };
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('登录失败:', error);
        showNotification(`登录失败: ${error.message}`, 'error');
        return { success: false, error };
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('退出失败:', error);
        showNotification(`退出失败: ${error.message}`, 'error');
        return { success: false, error };
    }
}

// 数据同步函数
async function saveTask(task) {
    if (!currentUser) {
        // 离线模式：保存到本地缓存
        offlineCache.tasks.push(task);
        offlineCache.pendingSync.push({ type: 'task', action: 'create', data: task });
        localStorage.setItem('jarvis_offline_cache', JSON.stringify(offlineCache));
        return { success: true, offline: true };
    }

    try {
        const taskData = {
            ...task,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.tasks)
            .insert([taskData])
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('保存任务失败:', error);
        // 保存到离线缓存作为备份
        offlineCache.tasks.push(task);
        offlineCache.pendingSync.push({ type: 'task', action: 'create', data: task });
        localStorage.setItem('jarvis_offline_cache', JSON.stringify(offlineCache));
        return { success: false, error, offline: true };
    }
}

async function updateTask(taskId, updates) {
    if (!currentUser) {
        // 离线模式：更新本地缓存
        const taskIndex = offlineCache.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            offlineCache.tasks[taskIndex] = { ...offlineCache.tasks[taskIndex], ...updates };
        }
        offlineCache.pendingSync.push({ type: 'task', action: 'update', id: taskId, data: updates });
        localStorage.setItem('jarvis_offline_cache', JSON.stringify(offlineCache));
        return { success: true, offline: true };
    }

    try {
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.tasks)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', taskId)
            .eq('user_id', currentUser.id)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('更新任务失败:', error);
        return { success: false, error };
    }
}

async function deleteTask(taskId) {
    if (!currentUser) {
        // 离线模式：从本地缓存删除
        offlineCache.tasks = offlineCache.tasks.filter(t => t.id !== taskId);
        offlineCache.pendingSync.push({ type: 'task', action: 'delete', id: taskId });
        localStorage.setItem('jarvis_offline_cache', JSON.stringify(offlineCache));
        return { success: true, offline: true };
    }

    try {
        const { error } = await supabase
            .from(SUPABASE_CONFIG.tables.tasks)
            .delete()
            .eq('id', taskId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('删除任务失败:', error);
        return { success: false, error };
    }
}

async function loadTasks() {
    if (!currentUser) {
        // 离线模式：从本地缓存加载
        return { success: true, data: offlineCache.tasks, offline: true };
    }

    try {
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.tasks)
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('加载任务失败:', error);
        return { success: false, error };
    }
}

// 记忆数据同步
async function saveMemory(memory) {
    if (!currentUser) {
        offlineCache.memories.push(memory);
        offlineCache.pendingSync.push({ type: 'memory', action: 'create', data: memory });
        localStorage.setItem('jarvis_offline_cache', JSON.stringify(offlineCache));
        return { success: true, offline: true };
    }

    try {
        const memoryData = {
            ...memory,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.memories)
            .insert([memoryData])
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('保存记忆失败:', error);
        return { success: false, error };
    }
}

// 金币交易记录
async function saveCoinTransaction(transaction) {
    if (!currentUser) {
        offlineCache.coins.push(transaction);
        offlineCache.pendingSync.push({ type: 'coin', action: 'create', data: transaction });
        localStorage.setItem('jarvis_offline_cache', JSON.stringify(offlineCache));
        return { success: true, offline: true };
    }

    try {
        const coinData = {
            ...transaction,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.coins)
            .insert([coinData])
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('保存金币交易失败:', error);
        return { success: false, error };
    }
}

// 用户设置同步
async function saveUserSettings(settings) {
    if (!currentUser) {
        offlineCache.settings = { ...offlineCache.settings, ...settings };
        offlineCache.pendingSync.push({ type: 'settings', action: 'update', data: settings });
        localStorage.setItem('jarvis_offline_cache', JSON.stringify(offlineCache));
        return { success: true, offline: true };
    }

    try {
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.settings)
            .upsert({
                user_id: currentUser.id,
                settings: settings,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('保存设置失败:', error);
        return { success: false, error };
    }
}

// 实时订阅设置
function setupRealtimeSubscriptions() {
    if (!currentUser || !supabase) return;

    // 订阅任务变化
    supabase
        .channel('tasks')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: SUPABASE_CONFIG.tables.tasks,
                filter: `user_id=eq.${currentUser.id}`
            }, 
            (payload) => {
                handleRealtimeUpdate('task', payload);
            }
        )
        .subscribe();

    // 订阅记忆变化
    supabase
        .channel('memories')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: SUPABASE_CONFIG.tables.memories,
                filter: `user_id=eq.${currentUser.id}`
            }, 
            (payload) => {
                handleRealtimeUpdate('memory', payload);
            }
        )
        .subscribe();

    console.log('实时订阅已设置');
}

// 处理实时更新
function handleRealtimeUpdate(type, payload) {
    console.log(`实时更新 ${type}:`, payload);
    
    switch (payload.eventType) {
        case 'INSERT':
            handleRealtimeInsert(type, payload.new);
            break;
        case 'UPDATE':
            handleRealtimeUpdate(type, payload.new);
            break;
        case 'DELETE':
            handleRealtimeDelete(type, payload.old);
            break;
    }
}

function handleRealtimeInsert(type, data) {
    if (type === 'task') {
        // 更新任务列表UI
        addTaskToTimeline(data.title, data);
        showNotification('新任务已同步', 'info');
    } else if (type === 'memory') {
        // 更新记忆列表UI
        addNewMemoryToUI(data);
        showNotification('新记忆已同步', 'info');
    }
}

// 网络状态处理
function handleOnline() {
    isOnline = true;
    showNotification('网络已连接，正在同步数据...', 'info');
    syncOfflineData();
}

function handleOffline() {
    isOnline = false;
    showNotification('网络已断开，将使用离线模式', 'info');
}

// 同步离线数据
async function syncOfflineData() {
    if (!currentUser || !isOnline) return;

    const cache = JSON.parse(localStorage.getItem('jarvis_offline_cache') || '{"pendingSync": []}');
    
    for (const item of cache.pendingSync) {
        try {
            switch (item.type) {
                case 'task':
                    if (item.action === 'create') {
                        await saveTask(item.data);
                    } else if (item.action === 'update') {
                        await updateTask(item.id, item.data);
                    } else if (item.action === 'delete') {
                        await deleteTask(item.id);
                    }
                    break;
                case 'memory':
                    if (item.action === 'create') {
                        await saveMemory(item.data);
                    }
                    break;
                case 'coin':
                    if (item.action === 'create') {
                        await saveCoinTransaction(item.data);
                    }
                    break;
                case 'settings':
                    if (item.action === 'update') {
                        await saveUserSettings(item.data);
                    }
                    break;
            }
        } catch (error) {
            console.error('同步失败:', error);
        }
    }

    // 清空待同步数据
    cache.pendingSync = [];
    localStorage.setItem('jarvis_offline_cache', JSON.stringify(cache));
    
    showNotification('离线数据同步完成', 'success');
}

// 加载用户数据
async function loadUserData() {
    if (!currentUser) return;

    try {
        // 加载任务
        const tasksResult = await loadTasks();
        if (tasksResult.success) {
            // 更新UI显示任务
            updateTasksUI(tasksResult.data);
        }

        // 加载用户设置
        const { data: settings } = await supabase
            .from(SUPABASE_CONFIG.tables.settings)
            .select('settings')
            .eq('user_id', currentUser.id)
            .single();

        if (settings) {
            applyUserSettings(settings.settings);
        }

        // 加载金币余额
        const { data: coinData } = await supabase
            .from(SUPABASE_CONFIG.tables.coins)
            .select('amount')
            .eq('user_id', currentUser.id);

        if (coinData) {
            const totalCoins = coinData.reduce((sum, transaction) => sum + transaction.amount, 0);
            updateCoinDisplay(totalCoins);
        }

    } catch (error) {
        console.error('加载用户数据失败:', error);
    }
}

// 清空用户数据
function clearUserData() {
    // 清空UI显示
    document.getElementById('timelineContainer').innerHTML = '';
    document.getElementById('memoryList').innerHTML = '';
    document.getElementById('coinCount').textContent = '0';
    
    // 重置缓存
    offlineCache = {
        tasks: [],
        memories: [],
        coins: [],
        settings: {},
        pendingSync: []
    };
}

// 导出函数供全局使用
window.SupabaseManager = {
    init: initSupabase,
    signUp,
    signIn,
    signOut,
    saveTask,
    updateTask,
    deleteTask,
    loadTasks,
    saveMemory,
    saveCoinTransaction,
    saveUserSettings,
    getCurrentUser: () => currentUser,
    isOnline: () => isOnline
};