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
        
        // Current Status Card - 更醒目的监控状态显示
        if (procrastinationActive || inefficiencyActive) {
            html += '<div class="overview-card status-card active" style="border: 2px solid #E74C3C; background: linear-gradient(135deg, rgba(231,76,60,0.1), rgba(241,196,15,0.1));">' +
                '<div class="card-header" style="background: rgba(231,76,60,0.15);">' +
                    '<span class="card-icon" style="animation: pulse 1s infinite;">🔴</span>' +
                    '<div class="card-title" style="color: #E74C3C; font-weight: 700;">⚡ 正在监控中 ⚡</div>' +
                '</div>' +
                '<div class="status-info" style="padding: 12px;">';
            
            if (procrastinationActive && PM.currentTask) {
                var remaining = PM.settings.gracePeriod - PM.elapsedSeconds;
                var urgentClass = remaining < 30 ? 'color: #E74C3C; font-weight: bold;' : '';
                html += '<div class="status-item" style="background: rgba(255,255,255,0.8); padding: 10px; border-radius: 8px; margin-bottom: 8px;">' +
                    '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">' +
                        '<span style="font-size: 18px;">⏰</span>' +
                        '<span style="font-weight: 600; color: #333;">启动监控</span>' +
                    '</div>' +
                    '<div style="font-size: 16px; font-weight: 600; color: #2C3E50; margin-bottom: 4px;">📌 ' + PM.currentTask.title + '</div>' +
                    '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                        '<span style="color: #666;">剩余时间</span>' +
                        '<span style="font-size: 20px; font-weight: bold; ' + urgentClass + '">' + 
                            Math.floor(remaining/60) + ':' + (remaining%60).toString().padStart(2,'0') + 
                        '</span>' +
                    '</div>' +
                    '<div style="margin-top: 8px;">' +
                        '<button class="action-btn success" style="width: 100%; padding: 8px;" onclick="ProcrastinationMonitor.completeStep()">✅ 已完成启动</button>' +
                    '</div>' +
                '</div>';
            }
            
            if (inefficiencyActive && IM.currentTask) {
                var elapsed = Math.floor(IM.elapsedSeconds / 60);
                html += '<div class="status-item" style="background: rgba(255,255,255,0.8); padding: 10px; border-radius: 8px;">' +
                    '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">' +
                        '<span style="font-size: 18px;">📊</span>' +
                        '<span style="font-weight: 600; color: #333;">效率监控</span>' +
                    '</div>' +
                    '<div style="font-size: 16px; font-weight: 600; color: #2C3E50; margin-bottom: 4px;">📌 ' + IM.currentTask.title + '</div>' +
                    '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                        '<span style="color: #666;">已进行</span>' +
                        '<span style="font-size: 18px; font-weight: bold; color: #3498DB;">' + elapsed + ' 分钟</span>' +
                    '</div>' +
                '</div>';
            }
            
            html += '</div></div>';
        } else {
            // 显示下一个即将开始的任务
            var nextTask = this.getNextUpcomingTask();
            var nextTaskHtml = '';
            if (nextTask) {
                var now = new Date();
                var currentMinutes = now.getHours() * 60 + now.getMinutes();
                var taskParts = nextTask.startTime.split(':');
                var taskMinutes = parseInt(taskParts[0]) * 60 + parseInt(taskParts[1]);
                var minutesUntil = taskMinutes - currentMinutes;
                
                nextTaskHtml = '<div style="margin-top: 10px; padding: 10px; background: rgba(52,152,219,0.1); border-radius: 8px; border-left: 3px solid #3498DB;">' +
                    '<div style="font-size: 12px; color: #666; margin-bottom: 4px;">⏳ 下一个任务</div>' +
                    '<div style="font-weight: 600; color: #2C3E50;">' + nextTask.title + '</div>' +
                    '<div style="font-size: 13px; color: #3498DB; margin-top: 4px;">' + 
                        nextTask.startTime + ' 开始 (还有 ' + minutesUntil + ' 分钟)' +
                    '</div>' +
                '</div>';
            }
            
            html += '<div class="overview-card status-card idle">' +
                '<div class="card-header">' +
                    '<span class="card-icon">💤</span>' +
                    '<div class="card-title">暂无活跃监控</div>' +
                '</div>' +
                '<div class="status-hint">当任务到达开始时间时，监控将自动启动</div>' +
                nextTaskHtml +
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
            var parts = t.startTime.split(':');
            var taskMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            var minutesUntil = taskMinutes - currentMinutes;
            var urgentStyle = minutesUntil <= 10 ? 'background: rgba(231,76,60,0.1); border-left: 3px solid #E74C3C;' : '';
            
            tasksHtml += '<div class="upcoming-task" style="padding: 8px; margin-bottom: 6px; border-radius: 6px; ' + urgentStyle + '">' +
                '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                    '<span class="task-time" style="font-weight: 600; color: #3498DB;">' + t.startTime + '</span>' +
                    '<span style="font-size: 12px; color: #999;">' + (minutesUntil <= 0 ? '即将开始' : minutesUntil + '分钟后') + '</span>' +
                '</div>' +
                '<span class="task-title" style="display: block; margin-top: 4px;">' + t.title + '</span>' +
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
    
    // 获取下一个即将开始的任务
    getNextUpcomingTask: function() {
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
        });
        
        return upcoming.length > 0 ? upcoming[0] : null;
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
        
        // 启动监控设置
        if (PM) {
            html += '<div class="settings-section">' +
                '<div class="section-title">⏰ 启动监控</div>' +
                '<div class="settings-list">' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">自动监控</span>' +
                        '<button class="toggle-btn small ' + (PM.settings.enabled ? 'active' : '') + '" onclick="ProcrastinationMonitor.toggleEnabled(); UnifiedMonitor.refresh();">' + (PM.settings.enabled ? '开' : '关') + '</button>' +
                    '</div>' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">宽限期</span>' +
                        '<span class="setting-value">' + PM.settings.gracePeriod + '秒</span>' +
                    '</div>' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">基础扣币 / 成功奖励</span>' +
                        '<span class="setting-value">' + PM.settings.baseCost + ' / ' + PM.settings.successReward + ' 金币</span>' +
                    '</div>' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">声音提醒</span>' +
                        '<button class="toggle-btn small ' + (PM.settings.soundEnabled ? 'active' : '') + '" onclick="ProcrastinationMonitor.toggleSound(); UnifiedMonitor.refresh();">' + (PM.settings.soundEnabled ? '开' : '关') + '</button>' +
                    '</div>' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">语音播报</span>' +
                        '<button class="toggle-btn small ' + (PM.settings.useVoiceAlert ? 'active' : '') + '" onclick="ProcrastinationMonitor.updateSetting(\'useVoiceAlert\', ' + !PM.settings.useVoiceAlert + '); UnifiedMonitor.refresh();">' + (PM.settings.useVoiceAlert ? '开' : '关') + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }
        
        // 效率监控设置
        if (IM) {
            html += '<div class="settings-section">' +
                '<div class="section-title">📊 效率监控</div>' +
                '<div class="settings-list">' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">效率监控</span>' +
                        '<button class="toggle-btn small ' + (IM.settings.enabled ? 'active' : '') + '" onclick="InefficiencyMonitor.settings.enabled = !InefficiencyMonitor.settings.enabled; UnifiedMonitor.refresh();">' + (IM.settings.enabled ? '开' : '关') + '</button>' +
                    '</div>' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">判定时长</span>' +
                        '<span class="setting-value">' + IM.settings.thresholdMinutes + '分钟</span>' +
                    '</div>' +
                    '<div class="setting-item">' +
                        '<span class="setting-label">半程提醒</span>' +
                        '<button class="toggle-btn small ' + (IM.settings.halfwayAlert ? 'active' : '') + '" onclick="InefficiencyMonitor.updateSetting(\'halfwayAlert\', ' + !IM.settings.halfwayAlert + '); UnifiedMonitor.refresh();">' + (IM.settings.halfwayAlert ? '开' : '关') + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }
        
        // AI提示词设置（整合入口）
        html += '<div class="settings-section">' +
            '<div class="section-title">🤖 AI提示词</div>' +
            '<div class="settings-list">' +
                '<div class="setting-item clickable" onclick="ProcrastinationEnhanced.showSettingsPanel()">' +
                    '<span class="setting-label">配置API Key和自定义提示词</span>' +
                    '<span class="setting-arrow">→</span>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        // 测试功能
        html += '<div class="settings-section">' +
            '<div class="section-title">🧪 测试</div>' +
            '<div class="test-buttons-grid">' +
                '<button class="test-btn" onclick="ProcrastinationEnhanced.testCountdown(10)">倒计时</button>' +
                '<button class="test-btn" onclick="ProcrastinationEnhanced.testAlert()">全屏警报</button>' +
                '<button class="test-btn" onclick="ProcrastinationEnhanced.testVoice()">语音播报</button>' +
                '<button class="test-btn" onclick="ProcrastinationMonitor.testSound(\'chime\')">提示音</button>' +
            '</div>' +
        '</div>';
        
        // 调试工具 - 查看今日任务时间
        html += '<div class="settings-section">' +
            '<div class="section-title">🔍 调试工具</div>' +
            '<div class="settings-list">' +
                '<div class="setting-item clickable" onclick="UnifiedMonitor.showTaskDebugInfo()">' +
                    '<span class="setting-label">查看今日任务时间设置</span>' +
                    '<span class="setting-arrow">→</span>' +
                '</div>' +
                '<div class="setting-item clickable" onclick="UnifiedMonitor.clearTriggeredTasks()">' +
                    '<span class="setting-label">清除已触发任务记录</span>' +
                    '<span class="setting-arrow">🗑️</span>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        return html;
    },
    
    // 显示任务调试信息
    showTaskDebugInfo: function() {
        var tasks = typeof Storage !== 'undefined' ? Storage.getTasks() : [];
        var today = new Date();
        var todayStr = today.getFullYear() + '-' + 
            (today.getMonth()+1).toString().padStart(2,'0') + '-' + 
            today.getDate().toString().padStart(2,'0');
        
        var todayTasks = tasks.filter(function(t) { return t.date === todayStr; });
        
        // 获取已触发任务列表
        var triggeredTasks = [];
        if (typeof ProcrastinationMonitor !== 'undefined') {
            triggeredTasks = ProcrastinationMonitor.triggeredTasks || [];
        }
        
        var debugHtml = '<div style="max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 12px;">';
        debugHtml += '<div style="margin-bottom: 10px; padding: 8px; background: #f0f0f0; border-radius: 4px;">';
        debugHtml += '<strong>今日日期:</strong> ' + todayStr + '<br>';
        debugHtml += '<strong>当前时间:</strong> ' + today.getHours().toString().padStart(2,'0') + ':' + today.getMinutes().toString().padStart(2,'0') + '<br>';
        debugHtml += '<strong>任务总数:</strong> ' + todayTasks.length + '<br>';
        debugHtml += '<strong>已触发任务ID:</strong> ' + (triggeredTasks.length > 0 ? triggeredTasks.join(', ') : '无');
        debugHtml += '</div>';
        
        if (todayTasks.length === 0) {
            debugHtml += '<div style="color: #999; text-align: center; padding: 20px;">今天没有任务</div>';
        } else {
            todayTasks.sort(function(a, b) { return a.startTime.localeCompare(b.startTime); });
            
            for (var i = 0; i < todayTasks.length; i++) {
                var t = todayTasks[i];
                var isTriggered = triggeredTasks.indexOf(t.id) !== -1;
                var bgColor = t.completed ? '#d4edda' : (isTriggered ? '#fff3cd' : '#ffffff');
                var borderColor = t.completed ? '#28a745' : (isTriggered ? '#ffc107' : '#ddd');
                
                debugHtml += '<div style="margin-bottom: 8px; padding: 10px; background: ' + bgColor + '; border: 1px solid ' + borderColor + '; border-radius: 6px;">';
                debugHtml += '<div style="font-weight: bold; margin-bottom: 4px;">' + (i+1) + '. ' + t.title + '</div>';
                debugHtml += '<div style="color: #666;">';
                debugHtml += '📅 日期: ' + t.date + '<br>';
                debugHtml += '⏰ 开始: <strong style="color: #E74C3C;">' + t.startTime + '</strong><br>';
                debugHtml += '⏱️ 时长: ' + (t.duration || 30) + ' 分钟<br>';
                if (t.endTime) {
                    debugHtml += '🏁 结束: ' + t.endTime + '<br>';
                }
                debugHtml += '🆔 ID: ' + t.id + '<br>';
                debugHtml += '✅ 完成: ' + (t.completed ? '是' : '否') + '<br>';
                debugHtml += '🔔 已触发: ' + (isTriggered ? '是' : '否');
                debugHtml += '</div></div>';
            }
        }
        
        debugHtml += '</div>';
        
        // 创建弹窗
        var modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'taskDebugModal';
        modal.innerHTML = '<div class="modal-content" style="max-width: 500px;">' +
            '<div class="modal-header">' +
                '<span class="modal-icon">🔍</span>' +
                '<h2>今日任务调试信息</h2>' +
            '</div>' +
            '<div class="modal-body">' + debugHtml + '</div>' +
            '<div class="modal-footer">' +
                '<button class="modal-btn btn-confirm" onclick="document.getElementById(\'taskDebugModal\').remove()">关闭</button>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
    },
    
    // 清除已触发任务记录
    clearTriggeredTasks: function() {
        if (typeof ProcrastinationMonitor !== 'undefined') {
            ProcrastinationMonitor.triggeredTasks = [];
            var today = new Date();
            var todayStr = today.getFullYear() + '-' + 
                (today.getMonth()+1).toString().padStart(2,'0') + '-' + 
                today.getDate().toString().padStart(2,'0');
            var savedTriggered = Storage.load('adhd_triggered_tasks', {});
            savedTriggered[todayStr] = [];
            Storage.save('adhd_triggered_tasks', savedTriggered);
            
            if (typeof Settings !== 'undefined' && Settings.showToast) {
                Settings.showToast('success', '已清除', '已触发任务记录已清空');
            } else {
                alert('已清除已触发任务记录');
            }
        }
    },
    
    refresh: function() {
        if (typeof App !== 'undefined' && App.loadMonitorPanel) {
            App.loadMonitorPanel();
        }
    },
    
    // 初始化：覆盖App.loadMonitorPanel
    init: function() {
        var self = this;
        var checkApp = setInterval(function() {
            if (typeof App !== 'undefined') {
                clearInterval(checkApp);
                
                // 覆盖 loadMonitorPanel
                App.loadMonitorPanel = function() {
                    var container = document.getElementById("monitorBody");
                    if (!container) return;
                    
                    // 使用 UnifiedMonitor 渲染
                    container.innerHTML = self.render();
                    
                    // 重新应用背景
                    setTimeout(function() { 
                        if (typeof Canvas !== 'undefined' && Canvas.reapplyBackground) {
                            Canvas.reapplyBackground('monitorPanel'); 
                        }
                    }, 10);
                };
                
                // 刷新面板
                App.loadMonitorPanel();
                
                console.log('UnifiedMonitor 初始化完成');
            }
        }, 500);
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    UnifiedMonitor.init();
});

window.UnifiedMonitor = UnifiedMonitor;

