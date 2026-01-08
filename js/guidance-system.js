// 新手引导与专注模式模块
const GuidanceSystem = {
    // 引导状态
    guidanceState: {
        completedGuides: [],       // 已完成的引导
        currentGuide: null,        // 当前引导
        focusMode: false,          // 专注模式
        currentLayout: 'default'   // 当前布局预设
    },
    
    // 功能引导配置
    featureGuides: {
        'smart-input': {
            id: 'smart-input',
            title: '💬 智能对话',
            steps: [
                { target: '.chat-input', text: '在这里输入你想做的事，比如"明天下午3点开会"', position: 'top' },
                { target: '.ai-parse-btn', text: '点击"AI拆解"可以把复杂任务分解成小步骤', position: 'top' },
                { target: '.quick-replies', text: '这些快捷按钮可以快速发送常用指令', position: 'top' }
            ],
            description: '用自然语言与KiiKii交流，添加任务、记录情绪、获取建议'
        },
        'timeline': {
            id: 'timeline',
            title: '📅 时间轴',
            steps: [
                { target: '.calendar-section', text: '点击日期可以切换查看不同日期的任务', position: 'bottom' },
                { target: '.timeline-section', text: '这里显示当天的所有任务，按时间排列', position: 'top' },
                { target: '.event-card', text: '点击任务卡片可以展开详情、编辑或完成', position: 'left' }
            ],
            description: '可视化日程管理，查看和管理你的所有任务'
        },
        'procrastination-panel': {
            id: 'procrastination-panel',
            title: '⏰ 拖延监控',
            steps: [
                { target: '.monitor-card', text: '当任务时间到达时，这里会显示倒计时', position: 'left' },
                { target: '.monitor-btn.primary', text: '完成启动步骤后点击这里确认', position: 'top' },
                { target: '.procrastination-history', text: '这里记录你的启动历史和金币变化', position: 'top' }
            ],
            description: '监控任务启动，用金币惩罚推动你立即行动'
        },
        'value-panel': {
            id: 'value-panel',
            title: '💰 价值显化器',
            steps: [
                { target: '.finance-dashboard', text: '这里显示你的财务目标和今日进度', position: 'bottom' },
                { target: '.today-earnings', text: '实时显示今天完成任务赚到的钱', position: 'top' },
                { target: '.earning-ranking', text: 'AI根据紧急度和时薪排序，告诉你应该先做什么', position: 'top' }
            ],
            description: '把工作价值变成具体数字，实时看到你赚了多少钱'
        },
        'game-system': {
            id: 'game-system',
            title: '🎮 游戏化系统',
            steps: [
                { target: '.coin-display', text: '完成任务获得金币，拖延会扣除金币', position: 'bottom' },
                { target: '.energy-display', text: '能量值代表今日精力，耗尽时提醒休息', position: 'bottom' },
                { target: '.achievements', text: '达成条件解锁成就徽章', position: 'top' }
            ],
            description: '游戏化激励系统，让工作像游戏一样有趣'
        },
        'ai-memory': {
            id: 'ai-memory',
            title: '💖 KiiKii记忆',
            steps: [
                { target: '.memory-progress', text: 'KiiKii对你的了解程度，使用越多越懂你', position: 'bottom' },
                { target: '.memory-categories', text: '点击分类查看KiiKii记住了什么', position: 'top' },
                { target: '.add-memory-btn', text: '也可以手动告诉KiiKii一些信息', position: 'top' }
            ],
            description: 'AI记忆库，KiiKii会学习你的习惯和偏好'
        }
    },
    
    // 组件简短说明
    componentHelp: {
        'smartInput': { icon: '💬', title: '智能对话', desc: '用自然语言添加任务、记录情绪、与KiiKii交流' },
        'timeline': { icon: '📅', title: '时间轴', desc: '查看和管理今天的所有任务，按时间排列' },
        'memoryBank': { icon: '🧠', title: '全景记忆库', desc: '记录你的情绪、灵感、反思，按情绪分类' },
        'promptPanel': { icon: '📝', title: 'AI提示词', desc: '自定义AI解析规则（高级用户）' },
        'gameSystem': { icon: '🎮', title: '游戏化系统', desc: '金币、能量、等级、成就，让工作更有趣' },
        'reviewPanel': { icon: '📊', title: '复盘面板', desc: '每日统计、情绪分布、效率分析' },
        'procrastinationPanel': { icon: '⏰', title: '拖延监控', desc: '监控任务启动，用金币惩罚推动行动' },
        'inefficiencyPanel': { icon: '📉', title: '低效率监控', desc: '监控任务执行，防止卡顿太久' },
        'valuePanel': { icon: '💰', title: '价值显化器', desc: '实时显示收入，让努力变成看得见的钱' },
        'aiInsights': { icon: '🧠', title: 'AI智能洞察', desc: 'AI学习进度、财务分析、任务预测' },
        'aiMemory': { icon: '💖', title: 'KiiKii记忆', desc: 'KiiKii对你的了解，越用越懂你' }
    },
    
    // 布局预设
    layoutPresets: {
        'default': {
            name: '默认布局',
            icon: '🏠',
            visible: ['smartInput', 'timeline', 'memoryBank', 'promptPanel', 'gameSystem', 'reviewPanel', 'procrastinationPanel', 'inefficiencyPanel', 'valuePanel', 'aiInsights', 'aiMemory'],
            description: '显示所有组件'
        },
        'focus': {
            name: '专注模式',
            icon: '🎯',
            visible: ['smartInput', 'timeline', 'procrastinationPanel'],
            description: '只保留核心组件，减少干扰'
        },
        'work': {
            name: '工作模式',
            icon: '💼',
            visible: ['smartInput', 'timeline', 'procrastinationPanel', 'inefficiencyPanel', 'valuePanel'],
            description: '专注于任务执行和价值追踪'
        },
        'plan': {
            name: '规划模式',
            icon: '📋',
            visible: ['smartInput', 'timeline', 'aiInsights', 'valuePanel'],
            description: '适合规划任务和查看建议'
        },
        'review': {
            name: '复盘模式',
            icon: '📊',
            visible: ['timeline', 'reviewPanel', 'aiInsights', 'aiMemory', 'gameSystem'],
            description: '回顾今日表现和AI洞察'
        }
    },
    
    // 初始化
    init() {
        this.loadState();
        this.addHelpButtons();
        this.addFocusModeButton();
        this.setupAutoCollapse();
        this.checkFirstTimeFeatures();
        console.log('引导系统初始化完成');
    },
    
    // 加载状态
    loadState() {
        const saved = Storage.load('adhd_guidance_state', null);
        if (saved) {
            Object.assign(this.guidanceState, saved);
        }
    },
    
    // 保存状态
    saveState() {
        Storage.save('adhd_guidance_state', this.guidanceState);
    },
    
    // 添加帮助按钮到所有组件
    addHelpButtons() {
        document.querySelectorAll('.draggable-component').forEach(comp => {
            const id = comp.id;
            const help = this.componentHelp[id];
            if (!help) return;
            
            const controls = comp.querySelector('.component-controls');
            if (!controls || controls.querySelector('.help-btn')) return;
            
            const helpBtn = document.createElement('button');
            helpBtn.className = 'help-btn';
            helpBtn.innerHTML = '?';
            helpBtn.title = '这是什么？';
            helpBtn.onclick = (e) => {
                e.stopPropagation();
                this.showComponentHelp(id);
            };
            
            controls.insertBefore(helpBtn, controls.firstChild);
        });
    },
    
    // 显示组件帮助
    showComponentHelp(componentId) {
        const help = this.componentHelp[componentId];
        if (!help) return;
        
        // 移除已有的帮助提示
        document.querySelectorAll('.component-help-tooltip').forEach(el => el.remove());
        
        const comp = document.getElementById(componentId);
        if (!comp) return;
        
        const rect = comp.getBoundingClientRect();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'component-help-tooltip';
        tooltip.innerHTML = `
            <div class="help-tooltip-header">
                <span class="help-tooltip-icon">${help.icon}</span>
                <span class="help-tooltip-title">${help.title}</span>
                <button class="help-tooltip-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="help-tooltip-desc">${help.desc}</div>
            <button class="help-tooltip-guide" onclick="GuidanceSystem.startFeatureGuide('${componentId}')">
                📖 查看详细教程
            </button>
        `;
        
        // 定位
        tooltip.style.position = 'fixed';
        tooltip.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
        tooltip.style.top = (rect.top + 50) + 'px';
        tooltip.style.zIndex = '10000';
        
        document.body.appendChild(tooltip);
        
        // 点击其他地方关闭
        setTimeout(() => {
            document.addEventListener('click', function closeTooltip(e) {
                if (!tooltip.contains(e.target)) {
                    tooltip.remove();
                    document.removeEventListener('click', closeTooltip);
                }
            });
        }, 100);
    },
    
    // 开始功能引导
    startFeatureGuide(componentId) {
        // 移除帮助提示
        document.querySelectorAll('.component-help-tooltip').forEach(el => el.remove());
        
        const guide = this.featureGuides[componentId] || this.featureGuides[this.getComponentDataId(componentId)];
        if (!guide || guide.steps.length === 0) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('info', '暂无详细教程', '该功能的教程正在制作中');
            }
            return;
        }
        
        this.currentGuide = {
            ...guide,
            currentStep: 0
        };
        
        this.showGuideStep();
    },
    
    // 获取组件data-component属性
    getComponentDataId(componentId) {
        const comp = document.getElementById(componentId);
        return comp?.dataset?.component || componentId;
    },
    
    // 显示引导步骤
    showGuideStep() {
        if (!this.currentGuide) return;
        
        const { steps, currentStep, title } = this.currentGuide;
        if (currentStep >= steps.length) {
            this.completeGuide();
            return;
        }
        
        const step = steps[currentStep];
        
        // 移除已有的引导
        document.querySelectorAll('.guide-overlay, .guide-spotlight, .guide-tooltip').forEach(el => el.remove());
        
        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.className = 'guide-overlay';
        document.body.appendChild(overlay);
        
        // 查找目标元素
        const target = document.querySelector(step.target);
        if (target) {
            const rect = target.getBoundingClientRect();
            
            // 创建聚光灯
            const spotlight = document.createElement('div');
            spotlight.className = 'guide-spotlight';
            spotlight.style.left = (rect.left - 5) + 'px';
            spotlight.style.top = (rect.top - 5) + 'px';
            spotlight.style.width = (rect.width + 10) + 'px';
            spotlight.style.height = (rect.height + 10) + 'px';
            document.body.appendChild(spotlight);
            
            // 创建提示框
            const tooltip = document.createElement('div');
            tooltip.className = 'guide-tooltip';
            tooltip.innerHTML = `
                <div class="guide-tooltip-header">
                    <span class="guide-tooltip-title">${title}</span>
                    <span class="guide-tooltip-progress">${currentStep + 1}/${steps.length}</span>
                </div>
                <div class="guide-tooltip-content">${step.text}</div>
                <div class="guide-tooltip-actions">
                    <button class="guide-btn skip" onclick="GuidanceSystem.skipGuide()">跳过</button>
                    <button class="guide-btn next" onclick="GuidanceSystem.nextGuideStep()">
                        ${currentStep === steps.length - 1 ? '完成' : '下一步 →'}
                    </button>
                </div>
            `;
            
            // 定位提示框
            const tooltipPos = this.calculateTooltipPosition(rect, step.position);
            tooltip.style.left = tooltipPos.left + 'px';
            tooltip.style.top = tooltipPos.top + 'px';
            
            document.body.appendChild(tooltip);
        }
    },
    
    // 计算提示框位置
    calculateTooltipPosition(targetRect, position) {
        const tooltipWidth = 300;
        const tooltipHeight = 150;
        const margin = 15;
        
        let left, top;
        
        switch (position) {
            case 'top':
                left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
                top = targetRect.top - tooltipHeight - margin;
                break;
            case 'bottom':
                left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
                top = targetRect.bottom + margin;
                break;
            case 'left':
                left = targetRect.left - tooltipWidth - margin;
                top = targetRect.top + (targetRect.height - tooltipHeight) / 2;
                break;
            case 'right':
                left = targetRect.right + margin;
                top = targetRect.top + (targetRect.height - tooltipHeight) / 2;
                break;
            default:
                left = targetRect.left;
                top = targetRect.bottom + margin;
        }
        
        // 边界检查
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
        
        return { left, top };
    },
    
    // 下一步
    nextGuideStep() {
        if (!this.currentGuide) return;
        this.currentGuide.currentStep++;
        this.showGuideStep();
    },
    
    // 跳过引导
    skipGuide() {
        this.completeGuide();
    },
    
    // 完成引导
    completeGuide() {
        if (this.currentGuide) {
            if (!this.guidanceState.completedGuides.includes(this.currentGuide.id)) {
                this.guidanceState.completedGuides.push(this.currentGuide.id);
                this.saveState();
            }
        }
        
        this.currentGuide = null;
        
        // 移除引导元素
        document.querySelectorAll('.guide-overlay, .guide-spotlight, .guide-tooltip').forEach(el => el.remove());
        
        if (typeof Settings !== 'undefined') {
            Settings.showToast('success', '教程完成！', '有问题随时点击 ? 按钮查看帮助');
        }
    },
    
    // 检查首次使用功能
    checkFirstTimeFeatures() {
        // 监听组件交互
        document.querySelectorAll('.draggable-component').forEach(comp => {
            const id = comp.id;
            const dataId = comp.dataset?.component;
            
            comp.addEventListener('click', () => {
                this.onComponentFirstUse(id, dataId);
            }, { once: true });
        });
    },
    
    // 首次使用组件
    onComponentFirstUse(componentId, dataId) {
        const guideId = dataId || componentId;
        
        // 如果已经完成过引导，不再提示
        if (this.guidanceState.completedGuides.includes(guideId)) return;
        
        const guide = this.featureGuides[guideId];
        if (!guide) return;
        
        // 显示首次使用提示
        this.showFirstUseHint(componentId, guide);
    },
    
    // 显示首次使用提示
    showFirstUseHint(componentId, guide) {
        const comp = document.getElementById(componentId);
        if (!comp) return;
        
        // 检查是否已显示过
        if (comp.dataset.hintShown) return;
        comp.dataset.hintShown = 'true';
        
        const hint = document.createElement('div');
        hint.className = 'first-use-hint';
        hint.innerHTML = `
            <div class="hint-content">
                <span class="hint-icon">💡</span>
                <span class="hint-text">首次使用${guide.title}？</span>
                <button class="hint-btn" onclick="GuidanceSystem.startFeatureGuide('${componentId}'); this.parentElement.parentElement.remove();">
                    查看教程
                </button>
                <button class="hint-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        comp.appendChild(hint);
        
        // 10秒后自动消失
        setTimeout(() => {
            if (hint.parentElement) {
                hint.style.animation = 'hintFadeOut 0.3s ease forwards';
                setTimeout(() => hint.remove(), 300);
            }
        }, 10000);
    },
    
    // ==================== 专注模式 ====================
    
    // 添加专注模式按钮
    addFocusModeButton() {
        // 检查是否已存在
        if (document.getElementById('focusModeBtn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'focusModeBtn';
        btn.className = 'focus-mode-btn';
        btn.innerHTML = '🎯';
        btn.title = '专注模式';
        btn.onclick = () => this.showLayoutSelector();
        
        document.body.appendChild(btn);
        
        // 如果之前是专注模式，恢复
        if (this.guidanceState.focusMode) {
            this.applyLayout(this.guidanceState.currentLayout);
        }
    },
    
    // 显示布局选择器
    showLayoutSelector() {
        // 移除已有的选择器
        document.querySelectorAll('.layout-selector').forEach(el => el.remove());
        
        const selector = document.createElement('div');
        selector.className = 'layout-selector';
        selector.innerHTML = `
            <div class="layout-selector-header">
                <span class="layout-selector-title">🎨 选择布局模式</span>
                <button class="layout-selector-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="layout-options">
                ${Object.entries(this.layoutPresets).map(([key, preset]) => `
                    <div class="layout-option ${this.guidanceState.currentLayout === key ? 'active' : ''}" 
                         onclick="GuidanceSystem.applyLayout('${key}')">
                        <span class="layout-option-icon">${preset.icon}</span>
                        <div class="layout-option-info">
                            <div class="layout-option-name">${preset.name}</div>
                            <div class="layout-option-desc">${preset.description}</div>
                        </div>
                        ${this.guidanceState.currentLayout === key ? '<span class="layout-option-check">✓</span>' : ''}
                    </div>
                `).join('')}
            </div>
            <div class="layout-selector-footer">
                <button class="layout-custom-btn" onclick="GuidanceSystem.showCustomLayoutEditor()">
                    ⚙️ 自定义布局
                </button>
            </div>
        `;
        
        document.body.appendChild(selector);
        
        // 点击外部关闭
        setTimeout(() => {
            document.addEventListener('click', function closeSelector(e) {
                if (!selector.contains(e.target) && e.target.id !== 'focusModeBtn') {
                    selector.remove();
                    document.removeEventListener('click', closeSelector);
                }
            });
        }, 100);
    },
    
    // 应用布局
    applyLayout(layoutKey) {
        const preset = this.layoutPresets[layoutKey];
        if (!preset) return;
        
        const allComponents = ['smartInput', 'timeline', 'memoryBank', 'promptPanel', 'gameSystem', 'reviewPanel', 'procrastinationPanel', 'inefficiencyPanel', 'valuePanel', 'aiInsights', 'aiMemory'];
        
        allComponents.forEach(id => {
            const comp = document.getElementById(id);
            if (!comp) return;
            
            if (preset.visible.includes(id)) {
                comp.style.display = '';
                comp.classList.remove('layout-hidden');
            } else {
                comp.style.display = 'none';
                comp.classList.add('layout-hidden');
            }
        });
        
        // 更新状态
        this.guidanceState.currentLayout = layoutKey;
        this.guidanceState.focusMode = layoutKey !== 'default';
        this.saveState();
        
        // 更新按钮样式
        const btn = document.getElementById('focusModeBtn');
        if (btn) {
            btn.classList.toggle('active', layoutKey !== 'default');
            btn.innerHTML = preset.icon;
            btn.title = preset.name;
        }
        
        // 关闭选择器
        document.querySelectorAll('.layout-selector').forEach(el => el.remove());
        
        // 显示提示
        if (typeof Settings !== 'undefined') {
            Settings.showToast('success', `${preset.icon} ${preset.name}`, preset.description);
        }
    },
    
    // 切换专注模式
    toggleFocusMode() {
        if (this.guidanceState.focusMode) {
            this.applyLayout('default');
        } else {
            this.applyLayout('focus');
        }
    },
    
    // 显示自定义布局编辑器
    showCustomLayoutEditor() {
        document.querySelectorAll('.layout-selector').forEach(el => el.remove());
        
        const allComponents = ['smartInput', 'timeline', 'memoryBank', 'promptPanel', 'gameSystem', 'reviewPanel', 'procrastinationPanel', 'inefficiencyPanel', 'valuePanel', 'aiInsights', 'aiMemory'];
        const currentVisible = this.layoutPresets[this.guidanceState.currentLayout]?.visible || allComponents;
        
        const editor = document.createElement('div');
        editor.className = 'modal-overlay show';
        editor.id = 'layoutEditorModal';
        editor.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <span class="modal-icon">⚙️</span>
                    <h2>自定义布局</h2>
                </div>
                <div class="modal-body">
                    <p style="color: #666; margin-bottom: 16px;">选择要显示的组件：</p>
                    <div class="layout-component-list">
                        ${allComponents.map(id => {
                            const help = this.componentHelp[id];
                            return `
                                <label class="layout-component-item">
                                    <input type="checkbox" value="${id}" ${currentVisible.includes(id) ? 'checked' : ''}>
                                    <span class="layout-component-icon">${help?.icon || '📦'}</span>
                                    <span class="layout-component-name">${help?.title || id}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-cancel" onclick="document.getElementById('layoutEditorModal').remove()">取消</button>
                    <button class="modal-btn btn-confirm" onclick="GuidanceSystem.saveCustomLayout()">应用</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(editor);
    },
    
    // 保存自定义布局
    saveCustomLayout() {
        const checkboxes = document.querySelectorAll('#layoutEditorModal input[type="checkbox"]:checked');
        const visible = Array.from(checkboxes).map(cb => cb.value);
        
        if (visible.length === 0) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '至少选择一个组件', '');
            }
            return;
        }
        
        // 保存为自定义布局
        this.layoutPresets['custom'] = {
            name: '自定义布局',
            icon: '⚙️',
            visible: visible,
            description: `显示 ${visible.length} 个组件`
        };
        
        document.getElementById('layoutEditorModal')?.remove();
        this.applyLayout('custom');
    },
    
    // ==================== 自动折叠 ====================
    
    // 设置自动折叠
    setupAutoCollapse() {
        // 监听组件活动状态
        document.querySelectorAll('.draggable-component').forEach(comp => {
            let inactiveTimer = null;
            
            const resetTimer = () => {
                clearTimeout(inactiveTimer);
                comp.classList.remove('auto-collapsed');
                
                // 3分钟无活动后折叠（可配置）
                inactiveTimer = setTimeout(() => {
                    if (!this.isComponentActive(comp.id)) {
                        // comp.classList.add('auto-collapsed');
                        // 暂时禁用自动折叠，因为可能影响用户体验
                    }
                }, 180000);
            };
            
            comp.addEventListener('click', resetTimer);
            comp.addEventListener('mouseover', resetTimer);
        });
    },
    
    // 检查组件是否活跃
    isComponentActive(componentId) {
        // 检查是否有正在进行的任务监控等
        if (componentId === 'procrastinationPanel') {
            return typeof ProcrastinationMonitor !== 'undefined' && ProcrastinationMonitor.currentTask;
        }
        if (componentId === 'inefficiencyPanel') {
            return typeof InefficiencyMonitor !== 'undefined' && InefficiencyMonitor.currentTask;
        }
        return false;
    },
    
    // 展开组件
    expandComponent(componentId) {
        const comp = document.getElementById(componentId);
        if (comp) {
            comp.classList.remove('auto-collapsed');
        }
    }
};

// 导出
window.GuidanceSystem = GuidanceSystem;

