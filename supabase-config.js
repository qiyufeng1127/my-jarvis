// Supabase配置文件
// 请将此文件与你的HTML文件放在同一目录下

// Supabase配置
const SUPABASE_CONFIG = {
    url: 'https://rkacmsgngdlolooodtjv.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYWNtc2duZ2Rsb2xvb29kdGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDM2OTcsImV4cCI6MjA4MzA3OTY5N30.VEXSLhYntkIKkQyFsCQOY71SV2SkLFr6n4YlVQKJtf0'
};

// 初始化Supabase客户端
const supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// 用户认证管理类
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    async init() {
        // 检查当前用户状态
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.currentUser = user;
            this.isLoggedIn = true;
            this.showMainInterface();
        } else {
            this.showLoginInterface();
        }

        // 监听认证状态变化
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.isLoggedIn = true;
                this.showMainInterface();
                showNotification('登录成功！', 'success');
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.isLoggedIn = false;
                this.showLoginInterface();
                showNotification('已退出登录', 'info');
            }
        });
    }

    // 显示登录界面
    showLoginInterface() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'flex';
        }
        
        // 隐藏主界面
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.display = 'none';
        }
    }

    // 显示主界面
    showMainInterface() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        
        // 显示主界面
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
        }

        // 更新用户信息显示
        this.updateUserDisplay();
    }

    // 更新用户信息显示
    updateUserDisplay() {
        if (this.currentUser) {
            const userEmail = document.getElementById('userEmail');
            if (userEmail) {
                userEmail.textContent = this.currentUser.email;
            }
        }
    }

    // 邮箱登录
    async signInWithEmail(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('登录错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 邮箱注册
    async signUpWithEmail(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('注册错误:', error);
            return { success: false, error: error.message };
        }
    }

    // Google登录
    async signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Google登录错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 退出登录
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('退出登录错误:', error);
            return { success: false, error: error.message };
        }
    }
}

// 数据同步管理类
class DataManager {
    constructor() {
        this.userId = null;
        this.realtimeSubscription = null;
    }

    // 设置用户ID
    setUserId(userId) {
        this.userId = userId;
        this.setupRealtimeSubscription();
    }

    // 设置实时订阅
    setupRealtimeSubscription() {
        if (!this.userId) return;

        // 订阅用户数据变化
        this.realtimeSubscription = supabase
            .channel('user_data_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'user_data',
                    filter: `user_id=eq.${this.userId}`
                }, 
                (payload) => {
                    console.log('数据变化:', payload);
                    this.handleDataChange(payload);
                }
            )
            .subscribe();
    }

    // 处理数据变化
    handleDataChange(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
            case 'INSERT':
                this.handleDataInsert(newRecord);
                break;
            case 'UPDATE':
                this.handleDataUpdate(newRecord, oldRecord);
                break;
            case 'DELETE':
                this.handleDataDelete(oldRecord);
                break;
        }
    }

    // 处理数据插入
    handleDataInsert(record) {
        showNotification('数据已同步', 'success');
        this.updateLocalData(record);
    }

    // 处理数据更新
    handleDataUpdate(newRecord, oldRecord) {
        showNotification('数据已更新', 'info');
        this.updateLocalData(newRecord);
    }

    // 处理数据删除
    handleDataDelete(record) {
        showNotification('数据已删除', 'info');
        this.removeLocalData(record);
    }

    // 更新本地数据
    updateLocalData(record) {
        const { data_type, data_content } = record;
        
        switch (data_type) {
            case 'tasks':
                this.updateTasks(JSON.parse(data_content));
                break;
            case 'coins':
                this.updateCoins(JSON.parse(data_content));
                break;
            case 'memories':
                this.updateMemories(JSON.parse(data_content));
                break;
            case 'settings':
                this.updateSettings(JSON.parse(data_content));
                break;
        }
    }

    // 保存用户数据到Supabase
    async saveUserData(dataType, dataContent) {
        if (!this.userId) return;

        try {
            const { data, error } = await supabase
                .from('user_data')
                .upsert({
                    user_id: this.userId,
                    data_type: dataType,
                    data_content: JSON.stringify(dataContent),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('保存数据错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取用户数据
    async getUserData(dataType = null) {
        if (!this.userId) return;

        try {
            let query = supabase
                .from('user_data')
                .select('*')
                .eq('user_id', this.userId);

            if (dataType) {
                query = query.eq('data_type', dataType);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('获取数据错误:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新任务数据
    updateTasks(tasks) {
        // 更新时间轴显示
        const timelineContainer = document.getElementById('timelineContainer');
        if (timelineContainer && tasks) {
            // 这里可以根据需要更新任务显示
            console.log('任务数据已更新:', tasks);
        }
    }

    // 更新金币数据
    updateCoins(coinData) {
        if (coinData && coinData.amount !== undefined) {
            const coinElement = document.getElementById('coinCount');
            if (coinElement) {
                coinElement.textContent = coinData.amount;
            }
        }
    }

    // 更新记忆数据
    updateMemories(memories) {
        // 更新记忆库显示
        console.log('记忆数据已更新:', memories);
    }

    // 更新设置数据
    updateSettings(settings) {
        // 更新系统设置
        console.log('设置数据已更新:', settings);
    }

    // 移除本地数据
    removeLocalData(record) {
        // 根据需要移除本地数据
        console.log('数据已删除:', record);
    }

    // 清理订阅
    cleanup() {
        if (this.realtimeSubscription) {
            supabase.removeChannel(this.realtimeSubscription);
        }
    }
}

// 全局实例
let authManager;
let dataManager;

// 初始化系统
function initSupabaseSystem() {
    authManager = new AuthManager();
    dataManager = new DataManager();
    
    // 当用户登录后设置数据管理器
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            dataManager.setUserId(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            dataManager.cleanup();
        }
    });
}

// 导出供HTML使用的函数
window.supabaseAuth = {
    signIn: (email, password) => authManager.signInWithEmail(email, password),
    signUp: (email, password) => authManager.signUpWithEmail(email, password),
    signInWithGoogle: () => authManager.signInWithGoogle(),
    signOut: () => authManager.signOut(),
    saveData: (type, content) => dataManager.saveUserData(type, content),
    getData: (type) => dataManager.getUserData(type)
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initSupabaseSystem);