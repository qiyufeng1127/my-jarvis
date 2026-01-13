// Unified Monitor Component v1.0
// Integrates procrastination, inefficiency, and enhanced ADHD monitoring

const UnifiedMonitor = {
    activeTab: 'overview',
    
    render: function() {
        var PM = typeof ProcrastinationMonitor !== 'undefined' ? ProcrastinationMonitor : null;
        var IM = typeof InefficiencyMonitor !== 'undefined' ? InefficiencyMonitor : null;
        var PE = typeof ProcrastinationEnhanced !== 'undefined' ? ProcrastinationEnhanced : null;
        
        var procrastinationActive = PM && PM.currentTask;
        var inefficiencyActive = IM && IM.currentTask;
        
        if (procrastinationActive) this.activeTab = 'procrastination';
        else if (inefficiencyActive) this.activeTab = 'inefficiency';
        
        return this.renderContainer(PM, IM, PE, procrastinationActive, inefficiencyActive);
    },
    
    renderContainer: function(PM, IM, PE, procrastinationActive, inefficiencyActive) {
        var tabsHtml = '<div class="unified-tabs">' +
            '<button class="unified-tab ' + (this.activeTab === 'overview' ? 'active' : '') + '" onclick="UnifiedMonitor.switchTab(\'overview\')">' +
                '<span class="tab-icon">🧠</span><span class="tab-label">总览</span>' +
            '</button>' +
            '<button class="unified-tab ' + (this.activeTab === 'procrastination' ? 'active' : '') + 
                (procrastinationActive ? ' has-activity' : '') + '" onclick="UnifiedMonitor.switchTab(\'procrastination\')">' +
                '<span class="tab-icon">⏰</span><span class="tab-label">启动监控</span>' +
                (procrastinationActive ? '<span class="tab-badge">●</span>' : '') +
            '</button>' +
            '<button class="unified-tab ' + (this.activeTab === 'inefficiency' ? 'active' : '') + 
                (inefficiencyActive ? ' has-activity' : '') + '" onclick="UnifiedMonitor.switchTab(\'inefficiency\')">' +
                '<span class="tab-icon">📊</span><span class="tab-label">效率监控</span>' +
                (inefficiencyActive ? '<span class="tab-badge">●</span>' : '') +
            '</button>' +
            '<button class="unified-tab ' + (this.activeTab === 'settings' ? 'active' : '') + '" onclick="UnifiedMonitor.switchTab(\'settings\')">' +
                '<span class="tab-icon">⚙️</span><span class="tab-label">设置</span>' +
            '</button>' +
        '</div>';
        
        var contentHtml = '';
        if (this.activeTab === 'overview') {
            contentHtml = this.renderOverview(PM, IM, PE, procrastinationActive, inefficiencyActive);
        } else if (this.activeTab === 'procrastination') {
            contentHtml = this.renderProcrastination(PM, PE);
        } else if (this.activeTab === 'inefficiency') {
            contentHtml = this.renderInefficiency(IM, PE);
        } else if (this.activeTab === 'settings') {
            contentHtml = this.renderSettings(PM, IM, PE);
        }
        
        return '<div class="unified-monitor-container">' + tabsHtml + 
            '<div class="unified-content">' + contentHtml + '</div></div>';
    },
    
    switchTab: function(tab) {
        this.activeTab = tab;
        if (typeof App !== 'undefined' && App.loadMonitorPanel) {
            App.loadMonitorPanel();
        }
    },
    
    renderOverview: function(PM, IM, PE, procrastinationActive, inefficiencyActive) {
        var html = '';
        
        // ADHD Enhanced Entry Card
        html += '<div class="overview-card enhanced-card">' +
            '<div class="card-header">' +
                '<span class="card-icon">🧠</span>' +
                '<div class="card-title-group">' +
                    '<div class="card-title">ADHD智能监控</div>' +
                    '<div class="card-subtitle">专业提示词 · AI启动步骤 · 梯度问责</div>' +
                '</div>' +
            '</div>' +
            '<div class="card-actions">' +
                '<button class="action-btn primary" onclick="ProcrastinationEnhanced.testCountdown(10)">🧪 测试倒计时</button>' +
                '<button class="action-btn" onclick="ProcrastinationEnhanced.testAlert()">🚨 测试警报</button>' +
                '<button class="action-btn" onclick="ProcrastinationEnhanced.showSettingsPanel()">⚙️ 提示词设置</button>' +
            '</div>' +
            '<div class="card-features">' +
                '<span class="feature-tag">🔊 语音播报</span>' +
                '<span class="feature-tag">🚨 全屏警报</span>' +
                '<span class="feature-tag">🤖 AI步骤</span>' +
                '<span class="feature-tag">📈 梯度问责</span>' +
            '</div>' +
        '</div>';
        
        // Current Status Card
        if (procrastinationActive || inefficiencyActive) {
            html += '<div class="overview-card status-card active">' +
                '<div class="card-header">' +
                    '<span class="card-icon">🔴</span>' +
                    '<div class="card-title">监控进行中</div>' +
                '</div>' +
                '<div class="status-info">';
            
            if (procrastinationActive && PM.currentTask) {
                var remaining = PM.settings.gracePeriod - PM.elapsedSeconds;
                html += '<div class="status-item">' +
                    '<span class="status-label">启动监控</span>' +
                    '<span class="status-task">' + PM.currentTask.title + '</span>' +
                    '<span class="status-time ' + (remaining < 30 ? 'urgent' : '') + '">' + 
                        Math.floor(remaining/60) + ':' + (remaining%60).toString().padStart(2,'0') + 
                    '</span>' +
                '</div>';
            }
            
            if (inefficiencyActive && IM.currentTask) {
                var elapsed = Math.floor(IM.elapsedSeconds / 60);
                html += '<div class="status-item">' +
                    '<span class="status-label">效率监控</span>' +
                    '<span class="status-task">' + IM.currentTask.title + '</span>' +
                    '<span class="status-time">' + elapsed + '分钟</span>' +
                '</div>';
            }
            
            html += '</div></div>';
        } else {
            html += '<div class="overview-card status-card idle">' +
                '<div class="card-header">' +
                    '<span class="card-icon">💤</span>' +
                    '<div class="card-title">暂无活跃监控</div>' +
                '</div>' +
                '<div class="status-hint">当任务到达开始时间时，监控将自动启动</div>' +
            '</div>';
        }
        
        // Stats Card
        html += this.renderStatsCard(PM, IM);
        
        // Upcoming Tasks
        html += this.renderUpcomingTasks();
        
        return html;
    },
    
    renderStatsCard: function(PM, IM) {
        var pmStats = PM && PM.getStats ? PM.getStats() : {weeklyDelays: 0, weeklySuccess: 0, totalSpent: 0};
        
        return '<div class="overview-card stats-card">' +
            '<div class="card-header">' +
                '<span class="card-icon">📊</span>' +
                '<div class="card-title">本周统计</div>' +
            '</div>' +
            '<div class="stats-grid">' +
                '<div class="stat-item success">' +
                    '<div class="stat-value">' + pmStats.weeklySuccess + '</div>' +
                    '<div class="stat-label">成功启动</div>' +
                '</div>' +
                '<div class="stat-item warning">' +
                    '<div class="stat-value">' + pmStats.weeklyDelays + '</div>' +
                    '<div class="stat-label">拖延次数</div>' +
                '</div>' +
                '<div class="stat-item">' +
                    '<div class="stat-value">' + pmStats.totalSpent + '</div>' +
                    '<div class="stat-label">消耗金币</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    },
    
    renderUpcomingTasks: function() {
        var tasks = typeof Storage !== 'undefined' ? Storage.getTasks() : [];
        var today = new Date();
        var todayStr = today.getFullYear() + '-' + 
            (today.getMonth()+1).toString().padStart(2,'0') + '-' + 
            today.getDate().toString().padStart(2,'0');
        var currentMinutes = today.getHours() * 60 + today.getMinutes();
        
        var upcoming = tasks.filter(function(t) {
            if (t.date !== todayStr || t.completed) return false;
            var parts = t.startTime.split(':');
            var taskMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            return taskMinutes > currentMinutes;
        }).sort(function(a,b) {
            return a.startTime.localeCompare(b.startTime);
        }).slice(0, 3);
        
        if (upcoming.length === 0) {
            return '<div class="overview-card upcoming-card">' +
                '<div class="card-header">' +
                    '<span class="card-icon">📋</span>' +
                    '<div class="card-title">今日待监控</div>' +
                '</div>' +
                '<div class="empty-hint">今天没有更多待开始的任务</div>' +
            '</div>';
        }
        
        var tasksHtml = '';
        for (var i = 0; i < upcoming.length; i++) {
            var t = upcoming[i];
            tasksHtml += '<div class="upcoming-task">' +
                '<span class="task-time">' + t.startTime + '</span>' +
                '<span class="task-title">' + t.title + '</span>' +
            '</div>';
        }
        
        return '<div class="overview-card upcoming-card">' +
            '<div class="card-header">' +
                '<span class="card-icon">📋</span>' +
                '<div class="card-title">今日待监控</div>' +
            '</div>' +
            '<div class="upcoming-list">' + tasksHtml + '</div>' +
        '</div>';
    },
    
    renderProcrastination: function(PM, PE) {
        if (!PM) return '<div class="empty-state">拖延监控模块未加载</div>';
        
        var html = '';
        
        // Control Bar
        html += '<div class="control-bar">' +
            '<span class="control-label">自动监控</span>' +
            '<button class="toggle-btn ' + (PM.settings.enabled ? 'active' : '') + '" onclick="ProcrastinationMonitor.toggleEnabled()">' +
                (PM.settings.enabled ? '✅ 已启用' : '⏸️ 已暂停') +
            '</button>' +
            '<button class="toggle-btn ' + (PM.settings.soundEnabled ? 'active' : '') + '" onclick="ProcrastinationMonitor.toggleSound(); UnifiedMonitor.refresh();">' +
                (PM.settings.soundEnabled ? '🔊 声音开' : '🔇 声音关') +
            '</button>' +
        '</div>';
        
        // Active Monitor
        if (PM.currentTask) {
            var remaining = PM.settings.gracePeriod - PM.elapsedSeconds;
            var step = PM.currentTask.substeps && PM.currentTask.substeps.length > 0 ? 
                PM.currentTask.substeps[0].title : '开始执行';
            
            html += '<div class="monitor-active-card ' + (PM.isAlertActive ? 'alert' : '') + '">' +
                '<div class="monitor-task-name">' + PM.currentTask.title + '</div>' +
                '<div class="monitor-step">启动步骤：' + step + '</div>' +
                '<div class="monitor-countdown ' + (remaining < 30 ? 'urgent' : '') + '">' +
                    '<span class="countdown-value">' + Math.floor(remaining/60) + ':' + (remaining%60).toString().padStart(2,'0') + '</span>' +
                    '<span class="countdown-label">剩余时间</span>' +
                '</div>' +
                '<div class="monitor-cycle">第 ' + PM.currentCycle + ' 轮 | 已扣 ' + PM.totalPaidCoins + ' 金币</div>' +
                '<div class="monitor-actions">' +
                    '<button class="action-btn success" onclick="ProcrastinationMonitor.completeStep()">✅ 已完成启动</button>' +
                    '<button class="action-btn warning" onclick="ProcrastinationEnhanced.triggerFullscreenAlert()">😰 我卡住了</button>' +
                    '<button class="action-btn ghost" onclick="ProcrastinationMonitor.skipCurrentTask()">⏭️ 跳过</button>' +
                '</div>' +
            '</div>';
        } else {
            html += '<div class="monitor-idle-card">' +
                '<div class="idle-icon">💤</div>' +
                '<div class="idle-text">等待任务开始时间...</div>' +
                '<div class="idle-hint">当时间轴上的任务到达开始时间时，监控将自动启动</div>' +
            '</div>';
        }
        
        // History
        html += this.renderHistory(PM.history, 'procrastination');
        
        return html;
    },
    
    renderInefficiency: function(IM, PE) {
        if (!IM) return '<div class="empty-state">低效率监控模块未加载</div>';
        
        var html = '';
        
        // Control Bar
        html += '<div class="control-bar">' +
            '<span class="control-label">效率监控</span>' +
            '<button class="toggle-btn ' + (IM.settings.enabled ? 'active' : '') + '" onclick="InefficiencyMonitor.settings.enabled = !InefficiencyMonitor.settings.enabled; UnifiedMonitor.refresh();">' +
                (IM.settings.enabled ? '✅ 已启用' : '⏸️ 已暂停') +
            '</button>' +
        '</div>';
        
        // Active Monitor
        if (IM.currentTask) {
            var elapsed = Math.floor(IM.elapsedSeconds / 60);
            var threshold = IM.settings.thresholdMinutes;
            var progress = Math.min(100, (elapsed / threshold) * 100);
            
            html += '<div class="monitor-active-card ' + (IM.isAlertActive ? 'alert' : '') + '">' +
                '<div class="monitor-task-name">' + IM.currentTask.title + '</div>' +
                '<div class="monitor-progress">' +
                    '<div class="progress-bar">' +
                        '<div class="progress-fill ' + (progress > 80 ? 'warning' : '') + '" style="width:' + progress + '%"></div>' +
                    '</div>' +
                    '<div class="progress-text">' + elapsed + ' / ' + threshold + ' 分钟</div>' +
                '</div>' +
                '<div class="efficiency-score">效率评分：' + IM.efficiencyScore + '</div>' +
                '<div class="monitor-actions">' +
                    '<button class="action-btn success" onclick="InefficiencyMonitor.completeCurrentStep()">✅ 完成当前步骤</button>' +
                    '<button class="action-btn" onclick="ProcrastinationEnhanced.takeBreak()">☕ 休息一下</button>' +
                '</div>' +
            '</div>';
        } else {
            html += '<div class="monitor-idle-card">' +
                '<div class="idle-icon">📊</div>' +
                '<div class="idle-text">未在监控任务</div>' +
                '<div class="idle-hint">开始执行任务后，效率监控将自动启动</div>' +
            '</div>';
        }
        
        // History
        html += this.renderHistory(IM.history, 'inefficiency');
        
        return html;
    },
    
    renderHistory: function(history, type) {
        if (!history || history.length === 0) {
            return '<div class="history-section">' +
                '<div class="section-title">📜 历史记录</div>' +
                '<div class="empty-hint">暂无记录</div>' +
            '</div>';
        }
        
        var items = history.slice(0, 5);
        var itemsHtml = '';
        
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var statusClass = item.status === 'success' ? 'success' : (item.status === 'paid' ? 'warning' : 'error');
            var statusIcon = item.status === 'success' ? '✅' : (item.status === 'paid' ? '💰' : '⚠️');
            
            itemsHtml += '<div class="history-item ' + statusClass + '">' +
                '<span class="history-icon">' + statusIcon + '</span>' +
                '<span class="history-task">' + (item.taskTitle || '未知任务') + '</span>' +
                '<span class="history-detail">' + (item.duration || '') + '</span>' +
                '<span class="history-coins">' + (item.coins > 0 ? '+' : '') + item.coins + '💰</span>' +
            '</div>';
        }
        
        return '<div class="history-section">' +
            '<div class="section-title">📜 历史记录</div>' +
            '<div class="history-list">' + itemsHtml + '</div>' +
        '</div>';
    },
    
    renderSettings: function(PM, IM, PE) {
        var html = '';
        
        // ADHD Enhanced Settings Entry
        html += '<div class="settings-section">' +
            '<div class="section-title">🧠 ADHD增强版设置</div>' +
            '<div class="settings-card">' +
                '<p>配置AI提示词、API Key和高级功能</p>' +
                '<button class="action-btn primary full-width" onclick="ProcrastinationEnhanced.showSettingsPanel()">' +
                    '⚙️ 打开提示词设置面板' +
                '</button>' +
            '</div>' +
        '</div>';
        
        // Procrastination Settings
        if (PM) {
            html += '<div class="settings-section">' +
                '<div class="section-title">⏰ 启动监控设置</div>' +
                '<div class="settings-list">' +
                    '<div class="setting-item"><span class="setting-label">宽限期</span><span class="setting-value">' + PM.settings.gracePeriod + '秒</span></div>' +
                    '<div class="setting-item"><span class="setting-label">预警时间</span><span class="setting-value">' + PM.settings.preAlertTime + '秒</span></div>' +
                    '<div class="setting-item"><span class="setting-label">基础扣币</span><span class="setting-value">' + PM.settings.baseCost + '金币</span></div>' +
                    '<div class="setting-item"><span class="setting-label">成功奖励</span><span class="setting-value">' + PM.settings.successReward + '金币</span></div>' +
                    '<div class="setting-item"><span class="setting-label">语音播报</span><button class="toggle-btn small ' + (PM.settings.useVoiceAlert ? 'active' : '') + '" onclick="ProcrastinationMonitor.updateSetting(\'useVoiceAlert\', ' + !PM.settings.useVoiceAlert + '); UnifiedMonitor.refresh();">' + (PM.settings.useVoiceAlert ? '开' : '关') + '</button></div>' +
                '</div>' +
            '</div>';
        }
        
        // Inefficiency Settings
        if (IM) {
            html += '<div class="settings-section">' +
                '<div class="section-title">📊 效率监控设置</div>' +
                '<div class="settings-list">' +
                    '<div class="setting-item"><span class="setting-label">判定时长</span><span class="setting-value">' + IM.settings.thresholdMinutes + '分钟</span></div>' +
                    '<div class="setting-item"><span class="setting-label">基础扣币</span><span class="setting-value">' + IM.settings.baseCost + '金币</span></div>' +
                    '<div class="setting-item"><span class="setting-label">半程提醒</span><button class="toggle-btn small ' + (IM.settings.halfwayAlert ? 'active' : '') + '" onclick="InefficiencyMonitor.updateSetting(\'halfwayAlert\', ' + !IM.settings.halfwayAlert + '); UnifiedMonitor.refresh();">' + (IM.settings.halfwayAlert ? '开' : '关') + '</button></div>' +
                '</div>' +
            '</div>';
        }
        
        // Test Functions
        html += '<div class="settings-section">' +
            '<div class="section-title">🧪 测试功能</div>' +
            '<div class="test-buttons-grid">' +
                '<button class="test-btn" onclick="ProcrastinationEnhanced.testCountdown(10)">测试10秒倒计时</button>' +
                '<button class="test-btn" onclick="ProcrastinationEnhanced.testAlert()">测试全屏警报</button>' +
                '<button class="test-btn" onclick="ProcrastinationEnhanced.testVoice()">测试语音播报</button>' +
                '<button class="test-btn" onclick="ProcrastinationMonitor.testSound(\'chime\')">测试提示音</button>' +
            '</div>' +
        '</div>';
        
        return html;
    },
    
    refresh: function() {
        if (typeof App !== 'undefined' && App.loadMonitorPanel) {
            App.loadMonitorPanel();
        }
    }
};

window.UnifiedMonitor = UnifiedMonitor;

