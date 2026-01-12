// KiiKii了解的我 - 面板渲染模块
const AIMemoryPanel = {
    // 当前展开的分类
    expandedCategory: null,
    
    // 渲染面板
    render() {
        const container = document.getElementById("aiMemoryBody");
        if (!container) return;
        
        const memories = typeof AIMemory !== 'undefined' ? AIMemory.getAllMemories() : null;
        const summary = typeof AIMemory !== 'undefined' ? AIMemory.getMemorySummary() : null;
        const secretaryName = typeof AIMemory !== 'undefined' ? AIMemory.getSecretaryName() : 'KiiKii';
        
        if (!memories || !summary) {
            container.innerHTML = '<div class="memory-empty">记忆模块加载中...</div>';
            return;
        }
        
        let html = '<div class="ai-memory-container">';
        
        // 头部 - 了解程度
        html += this.renderHeader(summary, secretaryName);
        
        // 快速概览
        html += this.renderQuickOverview(summary);
        
        // 分类记忆列表
        html += this.renderMemoryCategories(memories);
        
        // 底部操作
        html += this.renderFooter(secretaryName);
        
        html += '</div>';
        container.innerHTML = html;
        
        // 绑定事件
        this.bindEvents();
    },
    
    // 渲染头部
    renderHeader(summary, secretaryName) {
        const confidence = summary.progress.confidenceLevel;
        const interactions = summary.progress.totalInteractions;
        const memoriesCount = summary.progress.memoriesCount;
        
        let levelText = '初识';
        let levelEmoji = '🌱';
        if (confidence >= 80) { levelText = '知己'; levelEmoji = '💖'; }
        else if (confidence >= 60) { levelText = '熟悉'; levelEmoji = '🌟'; }
        else if (confidence >= 40) { levelText = '了解'; levelEmoji = '🌸'; }
        else if (confidence >= 20) { levelText = '认识'; levelEmoji = '🌿'; }
        
        return '<div class="memory-header">' +
            '<div class="memory-avatar">' +
                '<div class="avatar-circle">' + levelEmoji + '</div>' +
                '<div class="avatar-name">' + secretaryName + '</div>' +
            '</div>' +
            '<div class="memory-progress">' +
                '<div class="progress-title">对你的了解程度</div>' +
                '<div class="progress-bar-container">' +
                    '<div class="progress-bar-fill" style="width: ' + confidence + '%"></div>' +
                    '<span class="progress-text">' + confidence + '%</span>' +
                '</div>' +
                '<div class="progress-level">' + levelText + '</div>' +
            '</div>' +
            '<div class="memory-stats">' +
                '<div class="stat-item"><span class="stat-num">' + interactions + '</span><span class="stat-label">次对话</span></div>' +
                '<div class="stat-item"><span class="stat-num">' + memoriesCount + '</span><span class="stat-label">条记忆</span></div>' +
            '</div>' +
        '</div>';
    },
    
    // 渲染快速概览
    renderQuickOverview(summary) {
        const nickname = summary.profile.nickname;
        const occupation = summary.profile.occupation;
        const mainJobs = summary.workSummary.mainJobs;
        const moodTrend = summary.emotionsSummary.recentMood;
        
        const moodLabels = {
            very_positive: '😄 心情很好',
            positive: '🙂 心情不错',
            neutral: '😐 心情平稳',
            negative: '😔 有些低落',
            very_negative: '😢 压力较大',
            unknown: '🤔 还在了解中'
        };
        
        let html = '<div class="memory-overview">' +
            '<div class="overview-title">💭 我对你的印象</div>' +
            '<div class="overview-content">';
        
        if (nickname || occupation || mainJobs.length > 0) {
            html += '<p class="overview-text">';
            if (nickname) html += '你是<b>' + nickname + '</b>，';
            if (occupation) html += '是一位<b>' + occupation + '</b>，';
            if (mainJobs.length > 0) html += '主要做<b>' + mainJobs.join('、') + '</b>相关的工作。';
            html += '</p>';
        } else {
            html += '<p class="overview-text">我们才刚认识，让我慢慢了解你吧~</p>';
        }
        
        html += '<div class="mood-indicator">' +
            '<span class="mood-label">最近状态：</span>' +
            '<span class="mood-value">' + moodLabels[moodTrend] + '</span>' +
        '</div>';
        
        html += '</div></div>';
        return html;
    },
    
    // 渲染记忆分类
    renderMemoryCategories(memories) {
        const categories = [
            { key: 'work', icon: '💼', title: '工作相关', color: '#667eea' },
            { key: 'habits', icon: '🎯', title: '习惯特点', color: '#27AE60' },
            { key: 'personality', icon: '✨', title: '性格特质', color: '#E74C3C' },
            { key: 'emotions', icon: '💖', title: '情绪记录', color: '#F39C12' },
            { key: 'life', icon: '🏠', title: '生活点滴', color: '#9B59B6' },
            { key: 'finance', icon: '💰', title: '财务相关', color: '#1ABC9C' },
            { key: 'health', icon: '🏃', title: '健康状况', color: '#3498DB' }
        ];
        
        let html = '<div class="memory-categories">';
        
        categories.forEach(cat => {
            const data = memories[cat.key];
            const items = this.extractCategoryItems(cat.key, data);
            const itemCount = items.length;
            const isExpanded = this.expandedCategory === cat.key;
            
            html += '<div class="memory-category' + (isExpanded ? ' expanded' : '') + '" data-category="' + cat.key + '">' +
                '<div class="category-header" onclick="AIMemoryPanel.toggleCategory(\'' + cat.key + '\')">' +
                    '<span class="category-icon" style="background: ' + cat.color + '">' + cat.icon + '</span>' +
                    '<span class="category-title">' + cat.title + '</span>' +
                    '<span class="category-count">' + itemCount + '</span>' +
                    '<span class="category-arrow">' + (isExpanded ? '▼' : '▶') + '</span>' +
                '</div>' +
                '<div class="category-content" style="display: ' + (isExpanded ? 'block' : 'none') + '">';
            
            if (items.length > 0) {
                items.forEach(item => {
                    html += '<div class="memory-item">' +
                        '<span class="item-label">' + item.label + '</span>' +
                        '<span class="item-value">' + item.value + '</span>' +
                    '</div>';
                });
            } else {
                html += '<div class="category-empty">还没有相关记忆~</div>';
            }
            
            // 添加记忆按钮
            html += '<button class="add-memory-btn" onclick="AIMemoryPanel.showAddMemoryDialog(\'' + cat.key + '\')">+ 手动添加</button>';
            
            html += '</div></div>';
        });
        
        html += '</div>';
        return html;
    },
    
    // 提取分类项目
    extractCategoryItems(category, data) {
        const items = [];
        
        switch (category) {
            case 'work':
                if (data.mainJobs && data.mainJobs.length > 0) {
                    items.push({ label: '主要工作', value: data.mainJobs.join('、') });
                }
                if (data.clients && data.clients.length > 0) {
                    items.push({ label: '客户', value: data.clients.map(c => c.name).join('、') });
                }
                if (data.pricing && Object.keys(data.pricing).length > 0) {
                    for (const type in data.pricing) {
                        items.push({ label: type + '均价', value: '¥' + data.pricing[type].avg });
                    }
                }
                if (data.workPatterns && data.workPatterns.length > 0) {
                    const patterns = data.workPatterns.slice(0, 3).map(p => {
                        const timeLabels = { morning: '上午', afternoon: '下午', evening: '晚上' };
                        return timeLabels[p.time] + '做' + p.type;
                    });
                    items.push({ label: '工作模式', value: patterns.join('、') });
                }
                break;
                
            case 'habits':
                if (data.good && data.good.length > 0) {
                    data.good.forEach(h => items.push({ label: '好习惯', value: h }));
                }
                if (data.bad && data.bad.length > 0) {
                    data.bad.forEach(h => items.push({ label: '待改进', value: h }));
                }
                if (data.procrastination && data.procrastination.triggers.length > 0) {
                    items.push({ label: '拖延触发', value: data.procrastination.triggers.slice(0, 2).join('、') });
                }
                if (data.productivity && data.productivity.distractions.length > 0) {
                    items.push({ label: '分心因素', value: data.productivity.distractions.join('、') });
                }
                break;
                
            case 'personality':
                if (data.strengths && data.strengths.length > 0) {
                    data.strengths.forEach(s => items.push({ label: '优点', value: s }));
                }
                if (data.weaknesses && data.weaknesses.length > 0) {
                    data.weaknesses.forEach(w => items.push({ label: '待提升', value: w }));
                }
                if (data.motivations && data.motivations.length > 0) {
                    data.motivations.forEach(m => items.push({ label: '动力来源', value: m }));
                }
                if (data.dreams && data.dreams.length > 0) {
                    data.dreams.forEach(d => items.push({ label: '梦想', value: d }));
                }
                break;
                
            case 'emotions':
                if (data.moodHistory && data.moodHistory.length > 0) {
                    const recent = data.moodHistory.slice(-5);
                    recent.forEach(m => {
                        const date = new Date(m.date).toLocaleDateString('zh-CN');
                        items.push({ label: date, value: m.emotion + (m.context ? ' - ' + m.context.substring(0, 15) : '') });
                    });
                }
                if (data.copingStrategies && data.copingStrategies.length > 0) {
                    items.push({ label: '应对方式', value: data.copingStrategies.join('、') });
                }
                break;
                
            case 'life':
                if (data.hobbies && data.hobbies.length > 0) {
                    items.push({ label: '爱好', value: data.hobbies.join('、') });
                }
                if (data.routines && data.routines.length > 0) {
                    data.routines.forEach(r => items.push({ label: '日常', value: r }));
                }
                if (data.pets && data.pets.length > 0) {
                    items.push({ label: '宠物', value: data.pets.join('、') });
                }
                break;
                
            case 'finance':
                if (data.incomeStreams && data.incomeStreams.length > 0) {
                    items.push({ label: '收入来源', value: data.incomeStreams.join('、') });
                }
                if (data.financialGoals && data.financialGoals.length > 0) {
                    data.financialGoals.forEach(g => items.push({ label: '财务目标', value: g }));
                }
                if (data.spendingHabits && data.spendingHabits.length > 0) {
                    items.push({ label: '消费习惯', value: data.spendingHabits.join('、') });
                }
                break;
                
            case 'health':
                if (data.sleepPattern) {
                    items.push({ label: '睡眠模式', value: data.sleepPattern });
                }
                if (data.exerciseHabits && data.exerciseHabits.length > 0) {
                    items.push({ label: '运动习惯', value: data.exerciseHabits.join('、') });
                }
                if (data.healthGoals && data.healthGoals.length > 0) {
                    data.healthGoals.forEach(g => items.push({ label: '健康目标', value: g }));
                }
                break;
        }
        
        return items;
    },
    
    // 渲染底部
    renderFooter(secretaryName) {
        return '<div class="memory-footer">' +
            '<div class="footer-tip">💡 和我多聊聊，我会慢慢了解你更多~</div>' +
            '<div class="footer-actions">' +
                '<button class="footer-btn" onclick="AIMemoryPanel.showNameDialog()">✏️ 改名字</button>' +
                '<button class="footer-btn danger" onclick="AIMemoryPanel.confirmClearMemories()">🗑️ 清除记忆</button>' +
            '</div>' +
        '</div>';
    },
    
    // 切换分类展开
    toggleCategory(category) {
        if (this.expandedCategory === category) {
            this.expandedCategory = null;
        } else {
            this.expandedCategory = category;
        }
        this.render();
    },
    
    // 显示添加记忆对话框
    showAddMemoryDialog(category) {
        const categoryLabels = {
            work: '工作相关',
            habits: '习惯特点',
            personality: '性格特质',
            emotions: '情绪记录',
            life: '生活点滴',
            finance: '财务相关',
            health: '健康状况'
        };
        
        const subcategories = this.getSubcategories(category);
        
        let optionsHtml = '';
        subcategories.forEach(sub => {
            optionsHtml += '<option value="' + sub.key + '">' + sub.label + '</option>';
        });
        
        const modal = document.createElement('div');
        modal.className = 'memory-modal';
        modal.id = 'addMemoryModal';
        modal.innerHTML = 
            '<div class="memory-modal-content">' +
                '<div class="modal-header">' +
                    '<h3>添加' + categoryLabels[category] + '记忆</h3>' +
                    '<button class="modal-close" onclick="AIMemoryPanel.closeModal()">×</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-group">' +
                        '<label>类型</label>' +
                        '<select id="memorySubcategory">' + optionsHtml + '</select>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>内容</label>' +
                        '<input type="text" id="memoryContent" placeholder="输入要记住的内容...">' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="modal-btn cancel" onclick="AIMemoryPanel.closeModal()">取消</button>' +
                    '<button class="modal-btn confirm" onclick="AIMemoryPanel.saveMemory(\'' + category + '\')">保存</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 获取子分类
    getSubcategories(category) {
        const subcategories = {
            work: [
                { key: 'mainJobs', label: '主要工作' },
                { key: 'skills', label: '技能' },
                { key: 'clients', label: '客户' }
            ],
            habits: [
                { key: 'good', label: '好习惯' },
                { key: 'bad', label: '待改进的习惯' }
            ],
            personality: [
                { key: 'strengths', label: '优点' },
                { key: 'weaknesses', label: '待提升' },
                { key: 'motivations', label: '动力来源' },
                { key: 'dreams', label: '梦想' }
            ],
            emotions: [
                { key: 'copingStrategies', label: '应对策略' }
            ],
            life: [
                { key: 'hobbies', label: '爱好' },
                { key: 'routines', label: '日常习惯' },
                { key: 'pets', label: '宠物' }
            ],
            finance: [
                { key: 'incomeStreams', label: '收入来源' },
                { key: 'financialGoals', label: '财务目标' },
                { key: 'spendingHabits', label: '消费习惯' }
            ],
            health: [
                { key: 'exerciseHabits', label: '运动习惯' },
                { key: 'healthGoals', label: '健康目标' }
            ]
        };
        return subcategories[category] || [];
    },
    
    // 保存记忆
    saveMemory(category) {
        const subcategory = document.getElementById('memorySubcategory').value;
        const content = document.getElementById('memoryContent').value.trim();
        
        if (!content) {
            alert('请输入内容');
            return;
        }
        
        if (typeof AIMemory !== 'undefined') {
            const success = AIMemory.addManualMemory(category, subcategory, content);
            if (success) {
                this.closeModal();
                this.expandedCategory = category;
                this.render();
                
                if (typeof App !== 'undefined') {
                    App.addChatMessage('system', '✅ 好的，我记住了：' + content, '📝');
                }
            }
        }
    },
    
    // 显示改名对话框
    showNameDialog() {
        const currentName = typeof AIMemory !== 'undefined' ? AIMemory.getSecretaryName() : 'KiiKii';
        
        const modal = document.createElement('div');
        modal.className = 'memory-modal';
        modal.id = 'nameModal';
        modal.innerHTML = 
            '<div class="memory-modal-content small">' +
                '<div class="modal-header">' +
                    '<h3>给我起个名字</h3>' +
                    '<button class="modal-close" onclick="AIMemoryPanel.closeModal()">×</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-group">' +
                        '<label>我的新名字</label>' +
                        '<input type="text" id="secretaryName" value="' + currentName + '" placeholder="给我起个名字吧~">' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="modal-btn cancel" onclick="AIMemoryPanel.closeModal()">取消</button>' +
                    '<button class="modal-btn confirm" onclick="AIMemoryPanel.saveName()">确定</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 保存名字
    saveName() {
        const name = document.getElementById('secretaryName').value.trim();
        if (name && typeof AIMemory !== 'undefined') {
            AIMemory.setSecretaryName(name);
            this.closeModal();
            this.render();
            
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', '好的！以后叫我 ' + name + ' 吧~ 💕', '🎀');
            }
        }
    },
    
    // 确认清除记忆
    confirmClearMemories() {
        if (confirm('确定要清除所有记忆吗？这个操作不可恢复！')) {
            if (typeof AIMemory !== 'undefined') {
                AIMemory.clearAllMemories();
                this.render();
                
                if (typeof App !== 'undefined') {
                    App.addChatMessage('system', '记忆已清除，让我们重新认识吧~ 👋', '🔄');
                }
            }
        }
    },
    
    // 关闭弹窗
    closeModal() {
        const modals = document.querySelectorAll('.memory-modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    },
    
    // 绑定事件
    bindEvents() {
        // 监听记忆学习事件
        document.addEventListener('memoryLearned', (e) => {
            // 可以添加动画效果
            this.render();
        });
    }
};

// 导出
window.AIMemoryPanel = AIMemoryPanel;

