// ============================================================
// 双账本系统 v4.0
// 金币（💰虚拟激励）+ 人民币（💴真实财务）完全分离
// ============================================================

const FinanceSystem = {
    // ==================== 金币系统（虚拟激励）====================
    
    coins: {
        // 获取余额
        getBalance() {
            return GlobalState?.coins?.balance || 0;
        },
        
        // 添加金币（统一入口）
        add(amount, reason, source) {
            if (typeof GlobalState !== 'undefined') {
                return GlobalState.addCoins(amount, reason, source);
            }
            return false;
        },
        
        // 扣除金币
        deduct(amount, reason, source) {
            if (typeof GlobalState !== 'undefined') {
                return GlobalState.deductCoins(amount, reason, source);
            }
            return 0;
        },
        
        // 检查是否足够
        hasEnough(amount) {
            return this.getBalance() >= amount;
        },
        
        // 获取历史记录
        getHistory(limit = 50) {
            const history = GlobalState?.coins?.history || [];
            return history.slice(-limit).reverse();
        },
        
        // 获取统计
        getStats() {
            const state = GlobalState?.coins || {};
            return {
                balance: state.balance || 0,
                totalEarned: state.totalEarned || 0,
                totalSpent: state.totalSpent || 0
            };
        }
    },
    
    // ==================== 人民币系统（真实财务）====================
    
    money: {
        // 获取余额
        getBalance() {
            return GlobalState?.finance?.balance || 0;
        },
        
        // 记录收入
        addIncome(amount, description, category = '其他') {
            if (typeof GlobalState !== 'undefined') {
                GlobalState.addIncome(amount, description, category);
                this.showIncomeAnimation(amount, description);
                return true;
            }
            return false;
        },
        
        // 记录支出
        addExpense(amount, description, category = '其他') {
            if (typeof GlobalState !== 'undefined') {
                GlobalState.addExpense(amount, description, category);
                return true;
            }
            return false;
        },
        
        // 获取今日收入
        getTodayIncome() {
            return GlobalState?.finance?.todayEarned || 0;
        },
        
        // 获取财务目标
        getTargets() {
            const finance = GlobalState?.finance || {};
            const now = new Date();
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const currentDay = now.getDate();
            const daysRemaining = lastDay - currentDay + 1;
            
            const totalRequired = Math.max(0, 
                (finance.debt || 0) + (finance.monthlyExpense || 0) - this.getMonthIncome()
            );
            const dailyTarget = daysRemaining > 0 ? Math.ceil(totalRequired / daysRemaining) : 0;
            
            return {
                debt: finance.debt || 0,
                monthlyExpense: finance.monthlyExpense || 0,
                monthlyTarget: finance.monthlyTarget || 0,
                daysRemaining,
                totalRequired,
                dailyTarget,
                todayProgress: this.getTodayIncome() / (dailyTarget || 1) * 100
            };
        },
        
        // 获取本月收入
        getMonthIncome() {
            const now = new Date();
            const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);
            const monthData = localStorage.getItem('adhd_value_month_' + monthKey);
            if (monthData) {
                return JSON.parse(monthData).earned || 0;
            }
            return 0;
        },
        
        // 设置财务目标
        setTargets(debt, monthlyExpense, monthlyTarget) {
            if (typeof GlobalState !== 'undefined') {
                GlobalState.finance.debt = debt || 0;
                GlobalState.finance.monthlyExpense = monthlyExpense || 0;
                GlobalState.finance.monthlyTarget = monthlyTarget || 0;
                GlobalState.saveToStorage();
            }
        },
        
        // 获取历史记录
        getHistory(limit = 50) {
            const history = GlobalState?.finance?.history || [];
            return history.slice(-limit).reverse();
        },
        
        // 获取收入流分类统计
        getIncomeByCategory() {
            const history = GlobalState?.finance?.history || [];
            const categories = {};
            
            history.filter(h => h.type === 'income').forEach(h => {
                const cat = h.category || '其他';
                if (!categories[cat]) {
                    categories[cat] = { total: 0, count: 0 };
                }
                categories[cat].total += h.amount;
                categories[cat].count++;
            });
            
            return Object.entries(categories)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.total - a.total);
        },
        
        // 显示收入动画
        showIncomeAnimation(amount, description) {
            const container = document.getElementById('coinAnimationContainer');
            if (!container) return;
            
            const anim = document.createElement('div');
            anim.className = 'income-animation';
            anim.innerHTML = `
                <div class="income-popup">
                    <div class="income-icon">💴</div>
                    <div class="income-amount">+¥${amount}</div>
                    <div class="income-desc">${description || ''}</div>
                </div>
            `;
            container.appendChild(anim);
            
            // 播放音效
            this.playIncomeSound();
            
            setTimeout(() => anim.remove(), 2500);
        },
        
        // 播放收入音效
        playIncomeSound() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const notes = [523.25, 659.25, 783.99, 1046.5];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.1);
                    osc.stop(ctx.currentTime + i * 0.1 + 0.2);
                });
            } catch (e) {}
        }
    },
    
    // ==================== 货币兑换所 ====================
    
    exchange: {
        // 兑换比率配置
        config: {
            rate: 1,              // 1元 = 1金币
            minAmount: 1,         // 最小兑换金额
            maxAmount: 10000,     // 最大兑换金额
            enabled: true         // 是否启用兑换
        },
        
        // 加载配置
        loadConfig() {
            const saved = localStorage.getItem('adhd_exchange_config');
            if (saved) {
                Object.assign(this.config, JSON.parse(saved));
            }
        },
        
        // 保存配置
        saveConfig() {
            localStorage.setItem('adhd_exchange_config', JSON.stringify(this.config));
        },
        
        // 设置兑换比率
        setRate(rate) {
            this.config.rate = Math.max(0.1, Math.min(100, rate));
            this.saveConfig();
        },
        
        // 计算可兑换金币数
        calculateCoins(yuanAmount) {
            return Math.floor(yuanAmount * this.config.rate);
        },
        
        // 执行兑换（人民币 → 金币）
        exchangeToCoins(yuanAmount) {
            if (!this.config.enabled) {
                return { success: false, message: '兑换功能未启用' };
            }
            
            if (yuanAmount < this.config.minAmount) {
                return { success: false, message: `最小兑换金额为¥${this.config.minAmount}` };
            }
            
            if (yuanAmount > this.config.maxAmount) {
                return { success: false, message: `最大兑换金额为¥${this.config.maxAmount}` };
            }
            
            const moneyBalance = FinanceSystem.money.getBalance();
            if (moneyBalance < yuanAmount) {
                return { success: false, message: '人民币余额不足' };
            }
            
            if (typeof GlobalState !== 'undefined') {
                const result = GlobalState.exchangeToCoins(yuanAmount, this.config.rate);
                if (result.success) {
                    this.showExchangeAnimation(yuanAmount, result.coins);
                }
                return result;
            }
            
            return { success: false, message: '系统错误' };
        },
        
        // 显示兑换动画
        showExchangeAnimation(yuan, coins) {
            const container = document.getElementById('coinAnimationContainer');
            if (!container) return;
            
            const anim = document.createElement('div');
            anim.className = 'exchange-animation';
            anim.innerHTML = `
                <div class="exchange-popup">
                    <div class="exchange-from">💴 ¥${yuan}</div>
                    <div class="exchange-arrow">→</div>
                    <div class="exchange-to">💰 ${coins}</div>
                    <div class="exchange-text">兑换成功！</div>
                </div>
            `;
            container.appendChild(anim);
            
            setTimeout(() => anim.remove(), 3000);
        },
        
        // 显示兑换弹窗
        showExchangeModal() {
            const existingModal = document.getElementById('exchangeModal');
            if (existingModal) existingModal.remove();
            
            const moneyBalance = FinanceSystem.money.getBalance();
            const coinsBalance = FinanceSystem.coins.getBalance();
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay show';
            modal.id = 'exchangeModal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <span class="modal-icon">🏦</span>
                        <h2>货币兑换所</h2>
                    </div>
                    <div class="modal-body">
                        <div class="exchange-balances">
                            <div class="balance-item">
                                <span class="balance-icon">💴</span>
                                <span class="balance-label">人民币余额</span>
                                <span class="balance-value">¥${moneyBalance.toFixed(2)}</span>
                            </div>
                            <div class="balance-item">
                                <span class="balance-icon">💰</span>
                                <span class="balance-label">金币余额</span>
                                <span class="balance-value">${coinsBalance}</span>
                            </div>
                        </div>
                        
                        <div class="exchange-rate-info">
                            <span>当前汇率：1元 = ${this.config.rate}金币</span>
                        </div>
                        
                        <div class="exchange-input-group">
                            <label>兑换金额（元）</label>
                            <input type="number" id="exchangeAmount" 
                                   min="${this.config.minAmount}" 
                                   max="${Math.min(this.config.maxAmount, moneyBalance)}"
                                   value="100"
                                   oninput="FinanceSystem.exchange.updatePreview()">
                            <div class="exchange-preview" id="exchangePreview">
                                将获得 <strong>${this.calculateCoins(100)}</strong> 金币
                            </div>
                        </div>
                        
                        <div class="exchange-quick-amounts">
                            <button onclick="FinanceSystem.exchange.setAmount(10)">¥10</button>
                            <button onclick="FinanceSystem.exchange.setAmount(50)">¥50</button>
                            <button onclick="FinanceSystem.exchange.setAmount(100)">¥100</button>
                            <button onclick="FinanceSystem.exchange.setAmount(500)">¥500</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn btn-cancel" onclick="document.getElementById('exchangeModal').remove()">取消</button>
                        <button class="modal-btn btn-confirm" onclick="FinanceSystem.exchange.confirmExchange()">确认兑换</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        },
        
        // 设置金额
        setAmount(amount) {
            const input = document.getElementById('exchangeAmount');
            if (input) {
                input.value = amount;
                this.updatePreview();
            }
        },
        
        // 更新预览
        updatePreview() {
            const input = document.getElementById('exchangeAmount');
            const preview = document.getElementById('exchangePreview');
            if (input && preview) {
                const amount = parseFloat(input.value) || 0;
                const coins = this.calculateCoins(amount);
                preview.innerHTML = `将获得 <strong>${coins}</strong> 金币`;
            }
        },
        
        // 确认兑换
        confirmExchange() {
            const input = document.getElementById('exchangeAmount');
            const amount = parseFloat(input?.value) || 0;
            
            const result = this.exchangeToCoins(amount);
            
            if (result.success) {
                document.getElementById('exchangeModal')?.remove();
                
                if (typeof App !== 'undefined') {
                    App.updateGameStatus();
                    App.addChatMessage('system', 
                        `🏦 兑换成功！\n¥${amount} → 💰${result.coins}金币`, 
                        '🏦'
                    );
                }
            } else {
                alert(result.message);
            }
        }
    },
    
    // ==================== 初始化 ====================
    
    init() {
        this.exchange.loadConfig();
        console.log('FinanceSystem 初始化完成');
    },
    
    // ==================== UI渲染 ====================
    
    // 渲染价值显化器面板
    renderValuePanel() {
        const targets = this.money.getTargets();
        const todayIncome = this.money.getTodayIncome();
        const coinsBalance = this.coins.getBalance();
        const incomeCategories = this.money.getIncomeByCategory().slice(0, 5);
        
        return `
            <div class="value-panel-container">
                <!-- 双账本概览 -->
                <div class="dual-balance-section">
                    <div class="balance-card coins-card" onclick="App.showRewardsPanel()">
                        <div class="balance-icon">💰</div>
                        <div class="balance-info">
                            <div class="balance-label">金币（激励积分）</div>
                            <div class="balance-value">${coinsBalance}</div>
                        </div>
                        <div class="balance-action">兑换奖励 →</div>
                    </div>
                    <div class="balance-card money-card" onclick="FinanceSystem.money.showIncomeModal && FinanceSystem.money.showIncomeModal()">
                        <div class="balance-icon">💴</div>
                        <div class="balance-info">
                            <div class="balance-label">今日收入（人民币）</div>
                            <div class="balance-value">¥${todayIncome}</div>
                        </div>
                        <div class="balance-action">记录收入 →</div>
                    </div>
                </div>
                
                <!-- 今日目标进度 -->
                <div class="daily-target-section">
                    <div class="section-header">
                        <span class="section-title">📊 今日目标</span>
                        <span class="target-value">¥${targets.dailyTarget}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill ${targets.todayProgress >= 100 ? 'completed' : ''}" 
                                 style="width: ${Math.min(100, targets.todayProgress)}%"></div>
                        </div>
                        <div class="progress-text">
                            ${targets.todayProgress >= 100 ? '🎉 目标达成！' : `还差 ¥${targets.dailyTarget - todayIncome}`}
                        </div>
                    </div>
                </div>
                
                <!-- 财务概览 -->
                <div class="finance-overview-section">
                    <div class="overview-item">
                        <span class="overview-label">本月还需</span>
                        <span class="overview-value warning">¥${targets.totalRequired}</span>
                    </div>
                    <div class="overview-item">
                        <span class="overview-label">剩余天数</span>
                        <span class="overview-value">${targets.daysRemaining}天</span>
                    </div>
                    <div class="overview-item">
                        <span class="overview-label">欠款</span>
                        <span class="overview-value ${targets.debt > 0 ? 'danger' : ''}">¥${targets.debt}</span>
                    </div>
                </div>
                
                <!-- 收入来源分布 -->
                ${incomeCategories.length > 0 ? `
                <div class="income-sources-section">
                    <div class="section-header">
                        <span class="section-title">💼 收入来源</span>
                    </div>
                    <div class="income-sources-list">
                        ${incomeCategories.map(cat => `
                            <div class="income-source-item">
                                <span class="source-name">${cat.name}</span>
                                <span class="source-value">¥${cat.total} (${cat.count}笔)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- 操作按钮 -->
                <div class="value-actions">
                    <button class="value-action-btn primary" onclick="FinanceSystem.showAddIncomeModal()">
                        💵 记录收入
                    </button>
                    <button class="value-action-btn" onclick="FinanceSystem.exchange.showExchangeModal()">
                        🏦 货币兑换
                    </button>
                    <button class="value-action-btn" onclick="FinanceSystem.showSettingsModal()">
                        ⚙️ 财务设置
                    </button>
                </div>
            </div>
        `;
    },
    
    // 显示添加收入弹窗
    showAddIncomeModal() {
        const existingModal = document.getElementById('addIncomeModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'addIncomeModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 380px;">
                <div class="modal-header">
                    <span class="modal-icon">💵</span>
                    <h2>记录收入</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>💰 收入金额</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">¥</span>
                            <input type="number" id="incomeAmount" placeholder="500" inputmode="decimal">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>📝 收入来源</label>
                        <input type="text" id="incomeDescription" placeholder="例：插画项目、照相馆客人">
                    </div>
                    <div class="form-group">
                        <label>📂 分类</label>
                        <select id="incomeCategory">
                            <option value="照相馆">📷 照相馆</option>
                            <option value="插画">🎨 插画</option>
                            <option value="设计">✏️ 设计</option>
                            <option value="视频">🎬 视频</option>
                            <option value="小红书">📱 小红书</option>
                            <option value="写作">✍️ 写作</option>
                            <option value="咨询">💬 咨询</option>
                            <option value="其他">📦 其他</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('addIncomeModal').remove()">取消</button>
                    <button class="modal-btn btn-confirm" onclick="FinanceSystem.confirmAddIncome()">💵 记录</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('incomeAmount')?.focus(), 100);
    },
    
    // 确认添加收入
    confirmAddIncome() {
        const amount = parseFloat(document.getElementById('incomeAmount')?.value) || 0;
        const description = document.getElementById('incomeDescription')?.value || '';
        const category = document.getElementById('incomeCategory')?.value || '其他';
        
        if (amount <= 0) {
            alert('请输入有效金额');
            return;
        }
        
        this.money.addIncome(amount, description, category);
        document.getElementById('addIncomeModal')?.remove();
        
        if (typeof App !== 'undefined') {
            App.loadValuePanel();
            App.addChatMessage('system', 
                `💵 收入已记录！+¥${amount}\n📝 来源：${description || category}`, 
                '💵'
            );
        }
    },
    
    // 显示财务设置弹窗
    showSettingsModal() {
        const targets = this.money.getTargets();
        
        const existingModal = document.getElementById('financeSettingsModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'financeSettingsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <span class="modal-icon">⚙️</span>
                    <h2>财务目标设置</h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>💳 当前欠款</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">¥</span>
                            <input type="number" id="settingDebt" value="${targets.debt}" placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>🏠 月固定支出</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">¥</span>
                            <input type="number" id="settingExpense" value="${targets.monthlyExpense}" placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>🎯 月收入目标（可选）</label>
                        <div class="input-with-prefix">
                            <span class="input-prefix">¥</span>
                            <input type="number" id="settingTarget" value="${targets.monthlyTarget}" placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>💱 兑换比率（1元=?金币）</label>
                        <input type="number" id="settingExchangeRate" value="${this.exchange.config.rate}" min="0.1" max="100" step="0.1">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('financeSettingsModal').remove()">取消</button>
                    <button class="modal-btn btn-confirm" onclick="FinanceSystem.saveSettings()">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // 保存设置
    saveSettings() {
        const debt = parseFloat(document.getElementById('settingDebt')?.value) || 0;
        const expense = parseFloat(document.getElementById('settingExpense')?.value) || 0;
        const target = parseFloat(document.getElementById('settingTarget')?.value) || 0;
        const rate = parseFloat(document.getElementById('settingExchangeRate')?.value) || 1;
        
        this.money.setTargets(debt, expense, target);
        this.exchange.setRate(rate);
        
        document.getElementById('financeSettingsModal')?.remove();
        
        if (typeof App !== 'undefined') {
            App.loadValuePanel();
        }
        
        if (typeof Settings !== 'undefined') {
            Settings.showToast('success', '设置已保存', '');
        }
    }
};

// 导出
window.FinanceSystem = FinanceSystem;

// 兼容旧版 ValueVisualizer
window.ValueVisualizer = {
    init: () => FinanceSystem.init(),
    recordIncome: (task, stepIndex, value, desc) => FinanceSystem.money.addIncome(value, desc),
    addManualIncome: (amount, desc, cat) => FinanceSystem.money.addIncome(amount, desc, cat),
    showAddIncomeModal: () => FinanceSystem.showAddIncomeModal(),
    showSetupModal: () => FinanceSystem.showSettingsModal(),
    formatMoney: (amount) => '¥' + amount,
    getTodayProgress: () => FinanceSystem.money.getTargets().todayProgress,
    finance: GlobalState?.finance || {},
    settings: { currency: '¥' }
};

