// 清空你的脑子 - 头脑风暴中转站 v1.0
// 收集未分类、未排序的零散想法和待办事项，经AI智能整理后推送到时间轴

const BrainDump = {
    // 暂存的想法列表
    items: [],
    
    // AI安排后的任务列表
    arrangedTasks: [],
    
    // 是否显示AI安排结果
    showArrangedView: false,
    
    // 聊天消息列表
    chatMessages: [],
    
    // 拖拽状态
    dragState: {
        dragging: false,
        dragIndex: null,
        dropIndex: null
    },
    
    // Loft布局配置（可在设置中自定义）
    layoutConfig: {
        floors: {
            '一楼': ['进门', '客厅', '厕所', '厨房', '楼梯', '洗衣区'],
            '二楼': ['楼梯', '卧室', '拍摄间', '工作区']
        },
        // 动线顺序（数字越小越靠前）
        locationOrder: {
            '厕所': 1, '客厅': 2, '楼下': 3, '厨房': 4, '洗衣区': 5,
            '卧室': 10, '拍摄间': 11, '工作区': 12
        },
        // 固定时间任务
        fixedTimeTasks: {
            '吃午饭': { start: '12:00', end: '13:00' },
            '午饭': { start: '12:00', end: '13:00' },
            '吃晚饭': { start: '18:00', end: '19:00' },
            '晚饭': { start: '18:00', end: '19:00' },
            '吃早饭': { start: '08:00', end: '08:30' },
            '早饭': { start: '08:00', end: '08:30' }
        },
        // 猫咪相关 - 猫砂盆和猫碗都在厨房
        petInfo: {
            cat: {
                location: '厨房',
                items: ['猫砂盆', '猫碗', '猫粮', '猫水']
            }
        }
    },
    
    // 任务关键词库 - 用于智能拆分
    taskKeywords: [
        // 个人卫生
        '刷牙', '洗脸', '洗头', '洗澡', '上厕所', '护肤', '敷面膜', '化妆', '卸妆',
        // 家务清洁
        '打扫', '拖地', '扫地', '擦桌子', '擦地', '收拾', '整理', '清洁', '打扫卫生',
        '洗衣服', '晾衣服', '叠衣服', '收衣服', '洗碗', '刷锅',
        // 厨房相关
        '做饭', '炒菜', '煮饭', '烧水', '泡茶', '冲咖啡',
        '吃早饭', '吃午饭', '吃晚饭', '吃饭', '早饭', '午饭', '晚饭',
        // 猫咪相关
        '喂猫', '倒猫粮', '换猫粮', '加猫粮', '铲猫砂', '换猫砂', '清理猫砂', 
        '换猫水', '加水', '洗猫碗', '清洗猫碗',
        // 工作学习
        '工作', '开会', '写代码', '修图', '剪辑', '拍摄', '学习', '看书', '写作',
        // 外出
        '拿快递', '取快递', '寄快递', '出门', '买东西', '购物', '逛街',
        // 休息娱乐
        '休息', '午睡', '睡觉', '看电视', '玩游戏', '刷手机',
        // 其他
        '换床单', '铺床', '浇花', '倒垃圾'
    ],
    
    // AI安排提示词
    arrangePrompt: `请作为任务安排专家，分析我提供的任务列表，按照以下规则智能安排：

【时间规则】
1. 默认安排今天的时间（从当前时间开始往后安排）
2. 用餐时间固定：早饭08:00-08:30，午饭12:00-13:00，晚饭18:00-19:00
3. 每项任务间留5-10分钟缓冲
4. 避免任务过度密集，合理分配精力
5. 高体力任务安排在上午或下午精力充沛时

【动线规则】根据loft布局优化动线：
一楼动线：进门客厅→左手厕所→直行厨房（猫砂盆和猫碗在这里）→洗衣区→楼梯
二楼动线：楼梯→左卧室→右拍摄间/工作区

【特殊说明】
- 我有一只猫咪，猫砂盆和猫碗都放在厨房
- 喂猫、倒猫粮、铲猫砂、换猫水等任务都在厨房完成
- 可以把猫咪相关任务和厨房任务（如洗碗、做饭）安排在一起

【优化原则】
1. 同一楼层任务集中安排
2. 上下楼次数最少化
3. 相关任务串联：如"收拾卧室"后接"换床单"，再下楼"洗衣服"
4. 物品流转顺路：楼上脏衣服→楼下洗衣区
5. 功能相似合并：清洁类任务集中处理
6. 站立任务和坐姿任务交替，避免疲劳
7. 猫咪任务可以和厨房任务顺便一起做

【任务分析】
请分析每个任务的：
- 任务类型（standing站立/sitting坐着）
- 预计时长（分钟）
- 体力消耗（1-5级，5为最高）
- 位置（厕所/客厅/厨房/卧室/拍摄间/工作区/外出等）
- 验证方式（photo拍照/check勾选/duration时长验证）

【输出格式】
请严格按照以下JSON格式输出，不要有其他文字：
{
  "tasks": [
    {
      "title": "任务名称",
      "startTime": "HH:MM",
      "duration": 30,
      "type": "standing",
      "energyCost": 3,
      "location": "客厅",
      "floor": "一楼",
      "verification": "photo",
      "coins": 50,
      "reason": "安排理由简述"
    }
  ],
  "summary": {
    "totalTasks": 10,
    "totalDuration": 300,
    "floorChanges": 2,
    "explanation": "动线优化说明"
  }
}

【金币计算规则】
- 站立任务：基础20金币 + 每分钟1金币
- 坐姿任务：基础10金币 + 每分钟0.5金币
- 高体力任务(4-5级)：额外+20%金币

当前时间：{currentTime}
今天日期：{today}

请安排以下任务：
{taskList}`,

    // 初始化
    init() {
        this.loadItems();
        this.refresh();
        console.log('🧠 清空你的脑子组件初始化完成');
    },
    
    // 加载暂存项目
    loadItems() {
        const saved = localStorage.getItem('brain_dump_items');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (e) {
                this.items = [];
            }
        }
    },
    
    // 保存暂存项目
    saveItems() {
        localStorage.setItem('brain_dump_items', JSON.stringify(this.items));
    },
    
    // 添加想法（支持智能拆分）
    addItem(text) {
        if (!text || !text.trim()) return;
        
        const trimmedText = text.trim();
        
        // 记录添加任务的习惯
        this.recordTaskHabit(trimmedText);
        
        // 尝试智能拆分
        const splitTasks = this.smartSplitText(trimmedText);
        
        if (splitTasks.length > 1) {
            // 拆分成功，添加多个任务
            splitTasks.forEach(taskText => {
                if (taskText.trim()) {
                    const item = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        text: taskText.trim(),
                        createdAt: new Date().toISOString(),
                        arranged: false
                    };
                    this.items.push(item);
                    
                    // 为每个拆分的任务也记录习惯
                    this.recordTaskHabit(taskText.trim());
                }
            });
            
            this.saveItems();
            this.refresh();
            
            // 播放添加音效
            if (typeof UnifiedAudioSystem !== 'undefined') {
                UnifiedAudioSystem.playSound('success');
            }
            
            // 提示用户
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', 
                    `✨ 已智能拆分为 ${splitTasks.length} 个任务：\n${splitTasks.map((t, i) => `${i+1}. ${t}`).join('\n')}`, 
                    '✨'
                );
            }
        } else {
            // 单个任务，直接添加
            const item = {
                id: Date.now().toString(),
                text: trimmedText,
                createdAt: new Date().toISOString(),
                arranged: false
            };
            
            this.items.push(item);
            this.saveItems();
            this.refresh();
            
            // 播放添加音效
            if (typeof UnifiedAudioSystem !== 'undefined') {
                UnifiedAudioSystem.playSound('click');
            }
        }
    },
    
    // 智能拆分文本为多个任务
    smartSplitText(text) {
        // 如果文本很短（少于4个字符），不拆分
        if (text.length < 4) {
            return [text];
        }
        
        // 方法1：先尝试用明显的分隔符拆分
        const explicitSeparators = /[,，、;；\n\r]+/;
        if (explicitSeparators.test(text)) {
            const parts = text.split(explicitSeparators).map(s => s.trim()).filter(s => s.length > 0);
            if (parts.length > 1) {
                // 对每个部分递归拆分
                const allTasks = [];
                parts.forEach(part => {
                    const subTasks = this.smartSplitText(part);
                    allTasks.push(...subTasks);
                });
                return allTasks;
            }
        }
        
        // 方法2：基于完整任务关键词列表进行贪婪匹配
        // 按长度降序排列，优先匹配更长的任务短语
        const allTaskPhrases = [
            // 收拾整理类（带位置）- 长的放前面
            '收拾整理工作区', '收拾整理客厅', '收拾整理厨房', '收拾整理卧室', '收拾整理厕所', '收拾整理房间',
            '整理收拾工作区', '整理收拾客厅', '整理收拾厨房', '整理收拾卧室', '整理收拾厕所', '整理收拾房间',
            '收拾工作区', '收拾客厅', '收拾厨房', '收拾卧室', '收拾厕所', '收拾房间', '收拾书桌', '收拾衣柜',
            '整理工作区', '整理客厅', '整理厨房', '整理卧室', '整理厕所', '整理房间', '整理书桌', '整理衣柜',
            '打扫工作区', '打扫客厅', '打扫厨房', '打扫卧室', '打扫厕所', '打扫房间', '打扫卫生',
            '清洁工作区', '清洁客厅', '清洁厨房', '清洁卧室', '清洁厕所', '清洁房间',
            // 收拾衣服类
            '收拾衣服', '整理衣服', '叠衣服', '晾衣服', '收衣服', '换衣服',
            // 洗涤类
            '洗衣服', '洗碗', '洗澡', '洗头', '洗脸', '洗手', '刷锅',
            // 个人卫生
            '刷牙', '上厕所', '护肤', '敷面膜', '化妆', '卸妆',
            // 地面清洁
            '拖地', '扫地', '擦地', '擦桌子', '擦窗户', '擦玻璃',
            // 厨房类
            '做饭', '炒菜', '煮饭', '烧水', '泡茶', '冲咖啡',
            '吃早饭', '吃午饭', '吃晚饭', '吃饭', '早饭', '午饭', '晚饭', '早餐', '午餐', '晚餐',
            '决定晚上的菜单', '决定菜单', '想菜单',
            // 猫咪类
            '喂猫', '倒猫粮', '换猫粮', '加猫粮', '铲猫砂', '换猫砂', '清理猫砂', '换猫水', '洗猫碗', '加水',
            // 工作学习
            '训练lora', '训练模型', '写代码', '修图', '剪辑', '拍摄', '学习', '看书', '写作', '开会', '工作',
            // 外出类
            '拿快递', '取快递', '寄快递', '出门', '买东西', '购物', '逛街',
            // 休息娱乐
            '休息', '午睡', '睡觉', '看电视', '玩游戏', '刷手机',
            // 其他
            '换床单', '铺床', '浇花', '倒垃圾'
        ];
        
        // 贪婪匹配：从文本中依次找出所有任务
        const foundTasks = [];
        let remaining = text;
        let lastLength = -1;
        
        // 循环直到没有新的匹配
        while (remaining.length > 0 && remaining.length !== lastLength) {
            lastLength = remaining.length;
            let matched = false;
            
            // 按长度降序尝试匹配
            for (const phrase of allTaskPhrases) {
                const index = remaining.indexOf(phrase);
                if (index !== -1) {
                    foundTasks.push({
                        text: phrase,
                        index: text.indexOf(phrase)
                    });
                    // 用占位符替换已匹配的部分
                    remaining = remaining.replace(phrase, '§');
                    matched = true;
                    break; // 找到一个就重新开始，确保贪婪匹配
                }
            }
            
            // 如果没有匹配到预定义短语，尝试匹配动态组合
            if (!matched) {
                // 尝试匹配 "收拾/整理 + 任意位置词"
                const dynamicPatterns = [
                    /(?:收拾整理|整理收拾|收拾|整理|打扫|清洁)([^\s§]{1,4})/,
                ];
                
                for (const pattern of dynamicPatterns) {
                    const match = remaining.match(pattern);
                    if (match && match[0].length >= 2) {
                        foundTasks.push({
                            text: match[0],
                            index: text.indexOf(match[0])
                        });
                        remaining = remaining.replace(match[0], '§');
                        matched = true;
                        break;
                    }
                }
            }
        }
        
        // 处理剩余未匹配的文本（可能是自定义任务）
        const leftover = remaining.split('§').map(s => s.trim()).filter(s => s.length >= 2);
        leftover.forEach(item => {
            // 检查是否包含有意义的内容
            if (!/^[的一下了着]$/.test(item)) {
                foundTasks.push({
                    text: item,
                    index: text.indexOf(item)
                });
            }
        });
        
        // 如果找到多个任务，按原文位置排序返回
        if (foundTasks.length > 1) {
            // 去重
            const uniqueTasks = [];
            const seen = new Set();
            foundTasks.forEach(t => {
                if (!seen.has(t.text)) {
                    seen.add(t.text);
                    uniqueTasks.push(t);
                }
            });
            
            uniqueTasks.sort((a, b) => a.index - b.index);
            return uniqueTasks.map(t => t.text);
        }
        
        // 方法3：尝试用常见的口语连接词拆分
        const oralSeparators = /(?:然后|接着|再去|再|还要|还得|还有|以及|同时|之后|完了|完再)/g;
        const oralParts = text.split(oralSeparators).map(s => s.trim()).filter(s => s.length > 1);
        if (oralParts.length > 1) {
            // 对每个部分递归拆分
            const allTasks = [];
            oralParts.forEach(part => {
                const subTasks = this.smartSplitText(part);
                allTasks.push(...subTasks);
            });
            return allTasks;
        }
        
        // 无法拆分，返回原文
        return [text];
    },
    
    // 删除想法
    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveItems();
        this.refresh();
    },
    
    // 清空所有
    clearAll() {
        if (this.items.length === 0) return;
        
        if (confirm('确定要清空所有暂存的想法吗？')) {
            this.items = [];
            this.arrangedTasks = [];
            this.showArrangedView = false;
            this.saveItems();
            this.refresh();
            
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', '已清空所有暂存想法', '🗑️');
            }
        }
    },
    
    // 刷新显示
    refresh() {
        const container = document.getElementById('brainDumpBody');
        if (container) {
            container.innerHTML = this.render();
            this.initDragAndDrop();
        }
    },
    
    // 渲染组件
    render() {
        const inputSection = this.renderInputSection();
        const itemsSection = this.showArrangedView ? 
            this.renderArrangedView() : this.renderItemsList();
        const actionsSection = this.renderActions();
        
        return `
            <div class="brain-dump-container">
                ${inputSection}
                ${itemsSection}
                ${actionsSection}
            </div>
        `;
    },
    
    // 渲染输入区（合并智能对话功能）
    renderInputSection() {
        // 获取当前时间段的智能推荐任务
        const smartSuggestions = this.getSmartSuggestions();
        
        // 获取 AI 模式状态
        const isAIMode = localStorage.getItem('brain_dump_ai_mode') === 'true';
        
        // 渲染聊天消息
        const chatMessages = this.renderChatMessages();
        
        return `
            <div class="brain-dump-input-section">
                ${chatMessages}
                <div class="brain-dump-input-wrapper">
                    <textarea id="brainDumpInput" 
                           class="brain-dump-input" 
                           placeholder="${isAIMode ? '🤖 AI模式：问我任何问题，我会智能回答...' : '💬 跟我说点什么...可以聊天、添加任务、问问题'}"
                           rows="1"
                           oninput="BrainDump.autoResizeInput(this)"
                           onkeydown="BrainDump.handleInputKeydown(event)"></textarea>
                    <button class="brain-dump-send-btn" onclick="BrainDump.handleInputSubmit()" title="发送 (Enter)">
                        <span>📤</span>
                    </button>
                    <button class="brain-dump-ai-btn ${isAIMode ? 'active' : ''}" onclick="BrainDump.toggleAIMode(this)" title="AI智能模式 (点击切换)">
                        <span>🤖</span>
                    </button>
                </div>
                <div class="brain-dump-smart-suggestions">
                    <div class="suggestions-header">
                        <span class="suggestions-title">⚡ 智能推荐 (${this.getCurrentTimeLabel()})</span>
                        <button class="refresh-suggestions-btn" onclick="BrainDump.refreshSuggestions()" title="刷新推荐">🔄</button>
                    </div>
                    <div class="suggestions-grid">
                        ${smartSuggestions.map(s => `
                            <button class="suggestion-btn" onclick="BrainDump.fillInput('${this.escapeHtml(s.text)}')" title="${s.reason}">
                                <span class="suggestion-icon">${s.icon}</span>
                                <span class="suggestion-text">${s.text}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    // 渲染聊天消息
    renderChatMessages() {
        if (!this.chatMessages || this.chatMessages.length === 0) {
            return '';
        }
        
        const messagesHtml = this.chatMessages.map(msg => `
            <div class="chat-message ${msg.type}">
                <span class="chat-message-icon">${msg.icon}</span>
                <span>${this.escapeHtml(msg.text).replace(/\n/g, '<br>')}</span>
            </div>
        `).join('');
        
        return `
            <div class="brain-dump-chat-messages show" id="brainDumpChatMessages">
                ${messagesHtml}
            </div>
        `;
    },
    
    // 添加聊天消息
    addChatMessage(type, text, icon) {
        if (!this.chatMessages) {
            this.chatMessages = [];
        }
        
        this.chatMessages.push({
            type: type, // 'user', 'assistant', 'system'
            text: text,
            icon: icon || '💬',
            timestamp: new Date().toISOString()
        });
        
        // 只保留最近10条消息
        if (this.chatMessages.length > 10) {
            this.chatMessages = this.chatMessages.slice(-10);
        }
        
        // 刷新显示
        this.refresh();
        
        // 滚动到最新消息
        setTimeout(() => {
            const chatContainer = document.getElementById('brainDumpChatMessages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    },
    
    // 清空聊天消息
    clearChatMessages() {
        this.chatMessages = [];
        this.refresh();
    },
    
    // 获取当前时间标签
    getCurrentTimeLabel() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 9) return '早晨 6:00-9:00';
        if (hour >= 9 && hour < 12) return '上午 9:00-12:00';
        if (hour >= 12 && hour < 14) return '午间 12:00-14:00';
        if (hour >= 14 && hour < 18) return '下午 14:00-18:00';
        if (hour >= 18 && hour < 22) return '晚上 18:00-22:00';
        return '深夜 22:00-6:00';
    },
    
    // 获取智能推荐任务（基于习惯学习）
    getSmartSuggestions() {
        const hour = new Date().getHours();
        
        // 1. 先尝试从习惯数据中获取推荐
        const habitSuggestions = this.getHabitBasedSuggestions(hour);
        
        // 2. 如果习惯数据不足，使用默认推荐
        if (habitSuggestions.length >= 6) {
            return habitSuggestions.slice(0, 8);
        }
        
        // 3. 混合习惯推荐和默认推荐
        const defaultSuggestions = this.getDefaultSuggestions(hour);
        const combined = [...habitSuggestions, ...defaultSuggestions];
        
        // 去重
        const unique = [];
        const seen = new Set();
        for (const item of combined) {
            if (!seen.has(item.text)) {
                seen.add(item.text);
                unique.push(item);
            }
        }
        
        return unique.slice(0, 8);
    },
    
    // 基于习惯学习的推荐
    getHabitBasedSuggestions(currentHour) {
        const habits = this.loadHabits();
        const suggestions = [];
        
        // 获取当前时间段（2小时为一个时间段）
        const timeSlot = Math.floor(currentHour / 2);
        
        // 分析该时间段的常见任务
        const timeSlotHabits = habits.filter(h => {
            const habitSlot = Math.floor(h.hour / 2);
            return habitSlot === timeSlot;
        });
        
        // 按频率排序
        const taskFrequency = {};
        timeSlotHabits.forEach(h => {
            const key = h.task.toLowerCase();
            taskFrequency[key] = (taskFrequency[key] || 0) + 1;
        });
        
        // 转换为数组并排序
        const sortedTasks = Object.entries(taskFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        // 生成推荐
        sortedTasks.forEach(([task, frequency]) => {
            const icon = this.getTaskIcon(task);
            const reason = `你在这个时间段完成过 ${frequency} 次`;
            suggestions.push({ icon, text: task, reason });
        });
        
        // 如果习惯数据不足，添加相邻时间段的推荐
        if (suggestions.length < 6) {
            const adjacentHabits = habits.filter(h => {
                const habitSlot = Math.floor(h.hour / 2);
                return Math.abs(habitSlot - timeSlot) === 1;
            });
            
            const adjacentFrequency = {};
            adjacentHabits.forEach(h => {
                const key = h.task.toLowerCase();
                adjacentFrequency[key] = (adjacentFrequency[key] || 0) + 1;
            });
            
            const adjacentSorted = Object.entries(adjacentFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4);
            
            adjacentSorted.forEach(([task, frequency]) => {
                if (!suggestions.find(s => s.text === task)) {
                    const icon = this.getTaskIcon(task);
                    const reason = `你经常在相近时间完成`;
                    suggestions.push({ icon, text: task, reason });
                }
            });
        }
        
        return suggestions;
    },
    
    // 获取任务对应的图标
    getTaskIcon(task) {
        const taskLower = task.toLowerCase();
        
        // 个人卫生
        if (/刷牙|洗脸/.test(taskLower)) return '🪥';
        if (/洗澡|洗头/.test(taskLower)) return '🚿';
        if (/上厕所/.test(taskLower)) return '🚽';
        
        // 清洁打扫
        if (/打扫|清洁|拖地|扫地/.test(taskLower)) return '🧹';
        if (/收拾|整理/.test(taskLower)) return '📦';
        
        // 洗涤
        if (/洗衣|晾衣|叠衣/.test(taskLower)) return '🧺';
        if (/洗碗|刷锅/.test(taskLower)) return '🧼';
        
        // 厨房
        if (/做饭|炒菜|煮/.test(taskLower)) return '🍳';
        if (/吃饭|早饭|午饭|晚饭/.test(taskLower)) return '🍽️';
        if (/烧水|泡茶|咖啡/.test(taskLower)) return '☕';
        
        // 猫咪
        if (/喂猫|猫粮/.test(taskLower)) return '🐱';
        if (/猫砂|铲/.test(taskLower)) return '🐾';
        if (/猫水|猫碗/.test(taskLower)) return '💧';
        
        // 工作学习
        if (/工作|训练|lora|模型/.test(taskLower)) return '💻';
        if (/修图|剪辑/.test(taskLower)) return '🎬';
        if (/拍摄/.test(taskLower)) return '📷';
        if (/学习|看书/.test(taskLower)) return '📚';
        
        // 外出
        if (/快递/.test(taskLower)) return '📦';
        if (/买|购物/.test(taskLower)) return '🛒';
        if (/出门/.test(taskLower)) return '🚶';
        
        // 休息
        if (/休息|午睡|睡觉/.test(taskLower)) return '😴';
        
        // 其他
        if (/垃圾/.test(taskLower)) return '🗑️';
        if (/床单|铺床/.test(taskLower)) return '🛏️';
        
        // 默认
        return '✨';
    },
    
    // 默认推荐（作为补充）
    getDefaultSuggestions(hour) {
        const suggestions = [];
        
        // 早晨 (6:00-9:00)
        if (hour >= 6 && hour < 9) {
            suggestions.push(
                { icon: '🪥', text: '刷牙洗脸', reason: '早晨个人卫生' },
                { icon: '🍳', text: '准备早餐', reason: '早餐时间' },
                { icon: '🐱', text: '喂猫倒猫粮', reason: '猫咪早餐时间' },
                { icon: '🧹', text: '快速整理卧室', reason: '起床后整理' },
                { icon: '☕', text: '冲咖啡', reason: '提神醒脑' },
                { icon: '📱', text: '查看今日日程', reason: '规划一天' }
            );
        }
        // 上午 (9:00-12:00)
        else if (hour >= 9 && hour < 12) {
            suggestions.push(
                { icon: '💻', text: '开始工作训练lora', reason: '上午精力充沛' },
                { icon: '📦', text: '下楼拿快递', reason: '快递通常上午到' },
                { icon: '🧺', text: '洗衣服晾衣服', reason: '上午洗衣服下午能干' },
                { icon: '🧹', text: '打扫客厅和厨房', reason: '上午做家务效率高' },
                { icon: '🐾', text: '铲猫砂清理猫砂盆', reason: '保持环境清洁' },
                { icon: '💧', text: '换猫水洗猫碗', reason: '保持猫咪饮水卫生' }
            );
        }
        // 午间 (12:00-14:00)
        else if (hour >= 12 && hour < 14) {
            suggestions.push(
                { icon: '🍳', text: '准备午饭', reason: '午餐时间' },
                { icon: '🍽️', text: '吃午饭', reason: '午餐时间' },
                { icon: '🐱', text: '喂猫加猫粮', reason: '猫咪午餐时间' },
                { icon: '🧼', text: '洗碗刷锅', reason: '饭后清洁' },
                { icon: '😴', text: '午休20分钟', reason: '午后小憩恢复精力' }
            );
        }
        // 下午 (14:00-18:00)
        else if (hour >= 14 && hour < 18) {
            suggestions.push(
                { icon: '💻', text: '继续工作修图剪辑', reason: '下午工作时段' },
                { icon: '📷', text: '拍摄新内容', reason: '下午光线好' },
                { icon: '🧹', text: '整理工作区', reason: '保持工作环境整洁' },
                { icon: '🧺', text: '收衣服叠衣服', reason: '衣服应该干了' },
                { icon: '🛒', text: '出门买东西', reason: '下午出门不晒' },
                { icon: '☕', text: '下午茶休息', reason: '补充能量' }
            );
        }
        // 晚上 (18:00-22:00)
        else if (hour >= 18 && hour < 22) {
            suggestions.push(
                { icon: '🍳', text: '准备晚饭', reason: '晚餐时间' },
                { icon: '🍽️', text: '吃晚饭', reason: '晚餐时间' },
                { icon: '🐱', text: '喂猫倒猫粮', reason: '猫咪晚餐时间' },
                { icon: '🧼', text: '洗碗刷锅', reason: '饭后清洁' },
                { icon: '🧹', text: '打扫厨房', reason: '晚饭后清洁' },
                { icon: '🚿', text: '洗澡洗头', reason: '晚上洗澡放松' },
                { icon: '🗑️', text: '倒垃圾', reason: '晚上倒垃圾' },
                { icon: '📱', text: '总结今日完成情况', reason: '回顾一天' }
            );
        }
        // 深夜 (22:00-6:00)
        else {
            suggestions.push(
                { icon: '🪥', text: '刷牙洗脸', reason: '睡前个人卫生' },
                { icon: '🐱', text: '检查猫粮猫水', reason: '确保猫咪夜间有食物' },
                { icon: '🛏️', text: '铺床换床单', reason: '保持床铺整洁' },
                { icon: '😴', text: '准备睡觉', reason: '该休息了' },
                { icon: '📱', text: '设置明日闹钟', reason: '准备明天' },
                { icon: '💡', text: '关灯检查门窗', reason: '睡前安全检查' }
            );
        }
        
        return suggestions;
    },
    
    // 加载习惯数据
    loadHabits() {
        const saved = localStorage.getItem('task_habits');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    },
    
    // 保存习惯数据
    saveHabit(task, hour) {
        const habits = this.loadHabits();
        
        // 添加新的习惯记录
        habits.push({
            task: task,
            hour: hour,
            timestamp: new Date().toISOString(),
            date: new Date().toDateString()
        });
        
        // 只保留最近90天的数据
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const recentHabits = habits.filter(h => {
            const habitDate = new Date(h.timestamp);
            return habitDate >= ninetyDaysAgo;
        });
        
        localStorage.setItem('task_habits', JSON.stringify(recentHabits));
    },
    
    // 记录任务完成习惯（在任务完成时调用）
    recordTaskHabit(taskTitle) {
        const hour = new Date().getHours();
        this.saveHabit(taskTitle, hour);
        console.log('📊 记录习惯:', taskTitle, '时间:', hour + ':00');
    },
    
    // 填充输入框
    fillInput(text) {
        const input = document.getElementById('brainDumpInput');
        if (input) {
            input.value = text;
            input.focus();
            this.autoResizeInput(input);
        }
    },
    
    // 刷新推荐
    refreshSuggestions() {
        this.refresh();
        
        // 播放音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('click');
        }
    },
    
    // 切换AI模式
    toggleAIMode(btn) {
        btn.classList.toggle('active');
        const isAIMode = btn.classList.contains('active');
        
        const input = document.getElementById('brainDumpInput');
        if (input) {
            if (isAIMode) {
                input.placeholder = '🤖 AI模式：问我任何问题，我会智能回答...';
            } else {
                input.placeholder = '💬 跟我说点什么...可以聊天、添加任务、问问题';
            }
        }
        
        // 保存AI模式状态
        localStorage.setItem('brain_dump_ai_mode', isAIMode);
        
        // 播放音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('click');
        }
    },
    
    // 自动调整输入框高度
    autoResizeInput(textarea) {
        // 重置高度以获取正确的scrollHeight
        textarea.style.height = 'auto';
        // 设置新高度，最小44px，最大200px
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 200);
        textarea.style.height = newHeight + 'px';
    },
    
    // 处理输入框键盘事件
    handleInputKeydown(event) {
        // Ctrl+Enter 或 Cmd+Enter 提交
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.handleInputSubmit();
        }
        // 单独按Enter不换行时也提交（如果没有Shift）
        else if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleInputSubmit();
        }
    },
    
    // 处理输入提交（支持AI对话模式）
    async handleInputSubmit() {
        const input = document.getElementById('brainDumpInput');
        const aiBtn = document.querySelector('.brain-dump-ai-btn');
        const isAIMode = aiBtn && aiBtn.classList.contains('active');
        
        if (!input || !input.value.trim()) return;
        
        const text = input.value.trim();
        input.value = '';
        input.focus();
        
        // AI对话模式
        if (isAIMode) {
            await this.handleAIChat(text);
        } 
        // 普通任务添加模式
        else {
            this.addItem(text);
        }
    },
    
    // 处理AI对话（支持指令、对话、任务分解）
    async handleAIChat(userMessage) {
        // 添加用户消息到聊天记录
        this.addChatMessage('user', userMessage, '👤');
        
        try {
            // 1. 先检查是否是系统指令
            const commandResult = await this.handleCommand(userMessage);
            if (commandResult.handled) {
                // 指令已处理，显示结果
                if (commandResult.message) {
                    this.addChatMessage('assistant', commandResult.message, '🤖');
                }
                
                // 播放音效
                if (typeof UnifiedAudioSystem !== 'undefined') {
                    UnifiedAudioSystem.playSound('success');
                }
                return;
            }
            
            // 2. 判断是否是任务相关的请求
            const isTaskRequest = /添加|安排|帮我|任务|待办|要做|计划|提醒|记得/.test(userMessage);
            
            if (isTaskRequest) {
                // 任务相关请求，使用任务安排AI
                const prompt = `用户说：${userMessage}\n\n请分析用户的需求，提取出具体的任务，并以友好的语气回复。如果是要添加任务，请列出具体的任务项。`;
                
                const response = await this.callAI(prompt);
                
                // 显示AI回复
                this.addChatMessage('assistant', response, '🤖');
                
                // 尝试从回复中提取任务
                const tasks = this.extractTasksFromAIResponse(response);
                if (tasks.length > 0) {
                    tasks.forEach(task => this.addItem(task));
                }
            } else {
                // 3. 普通对话，调用AI聊天
                if (typeof AIService !== 'undefined' && AIService.chat) {
                    const response = await AIService.chat([
                        { role: 'system', content: '你是KiiKii，一个温暖、有趣、善解人意的AI助手。你可以帮助用户管理任务、查看日程、回答问题。用简短、亲切的语气回复用户。' },
                        { role: 'user', content: userMessage }
                    ]);
                    
                    this.addChatMessage('assistant', response, '🤖');
                } else {
                    throw new Error('AI服务不可用');
                }
            }
            
            // 播放音效
            if (typeof UnifiedAudioSystem !== 'undefined') {
                UnifiedAudioSystem.playSound('success');
            }
            
        } catch (error) {
            console.error('AI对话失败:', error);
            
            this.addChatMessage('system', '抱歉，AI暂时无法回复。你可以关闭AI模式直接添加任务哦~', '⚠️');
        }
    },
    
    // 处理系统指令
    async handleCommand(message) {
        const msg = message.toLowerCase().trim();
        
        // ==================== 时间轴操作指令 ====================
        
        // 删除特定日期的任务（如：删除14号的任务、删除1月15日的任务）
        if (/删除|清空|移除/.test(msg) && /任务/.test(msg)) {
            // 尝试提取日期
            const dateMatch = msg.match(/(\d{1,2})号|(\d{1,2})日|(\d{1,2})月(\d{1,2})[号日]/);
            if (dateMatch) {
                const now = new Date();
                let targetDate;
                
                if (dateMatch[3] && dateMatch[4]) {
                    // 匹配到 "X月X号" 格式
                    const month = parseInt(dateMatch[3]);
                    const day = parseInt(dateMatch[4]);
                    targetDate = new Date(now.getFullYear(), month - 1, day);
                } else {
                    // 匹配到 "X号" 或 "X日" 格式
                    const day = parseInt(dateMatch[1] || dateMatch[2]);
                    targetDate = new Date(now.getFullYear(), now.getMonth(), day);
                }
                
                const dateStr = this.formatDate(targetDate);
                
                if (typeof App !== 'undefined' && App.deleteTasksByDate) {
                    const count = App.deleteTasksByDate(dateStr);
                    const displayDate = `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
                    return {
                        handled: true,
                        message: `🗑️ 已删除 ${displayDate} 的 ${count} 个任务`
                    };
                }
            }
        }
        
        // 删除今天的任务
        if (/删除|清空|移除/.test(msg) && /今天|今日/.test(msg) && /任务/.test(msg)) {
            if (typeof App !== 'undefined' && App.deleteTodayTasks) {
                const count = App.deleteTodayTasks();
                return {
                    handled: true,
                    message: `🗑️ 已删除今天的 ${count} 个任务`
                };
            }
        }
        
        // 删除明天的任务
        if (/删除|清空|移除/.test(msg) && /明天|明日/.test(msg) && /任务/.test(msg)) {
            if (typeof App !== 'undefined' && App.deleteTomorrowTasks) {
                const count = App.deleteTomorrowTasks();
                return {
                    handled: true,
                    message: `🗑️ 已删除明天的 ${count} 个任务`
                };
            }
        }
        
        // 删除今天和明天的任务
        if (/删除|清空|移除/.test(msg) && /今天.*明天|明天.*今天|今明两天/.test(msg)) {
            if (typeof App !== 'undefined' && App.deleteTodayAndTomorrowTasks) {
                const result = App.deleteTodayAndTomorrowTasks();
                return {
                    handled: true,
                    message: `🗑️ 已删除任务：\n今天：${result.today} 个\n明天：${result.tomorrow} 个\n总计：${result.total} 个`
                };
            }
        }
        
        // 删除本周的任务
        if (/删除|清空|移除/.test(msg) && /本周|这周|这一周/.test(msg) && /任务/.test(msg)) {
            if (typeof App !== 'undefined' && App.deleteThisWeekTasks) {
                const count = App.deleteThisWeekTasks();
                return {
                    handled: true,
                    message: `🗑️ 已删除本周的 ${count} 个任务`
                };
            }
        }
        
        // 删除所有未完成的任务
        if (/删除|清空|移除/.test(msg) && /未完成|没完成|未做/.test(msg) && /任务/.test(msg)) {
            if (typeof App !== 'undefined' && App.deleteIncompleteTasks) {
                const count = App.deleteIncompleteTasks();
                return {
                    handled: true,
                    message: `🗑️ 已删除 ${count} 个未完成的任务`
                };
            }
        }
        
        // 删除所有已完成的任务
        if (/删除|清空|移除/.test(msg) && /已完成|完成了|做完/.test(msg) && /任务/.test(msg)) {
            if (typeof App !== 'undefined' && App.deleteCompletedTasks) {
                const count = App.deleteCompletedTasks();
                return {
                    handled: true,
                    message: `🗑️ 已删除 ${count} 个已完成的任务`
                };
            }
        }
        
        // 删除特定任务（通过关键词）
        if (/删除|移除/.test(msg) && /任务/.test(msg) && !/今天|明天|本周|所有|全部/.test(msg)) {
            // 提取关键词
            const keyword = msg.replace(/删除|移除|任务|的|把|帮我|请/g, '').trim();
            if (keyword && typeof App !== 'undefined' && App.deleteTasksByKeyword) {
                const count = App.deleteTasksByKeyword(keyword);
                if (count > 0) {
                    return {
                        handled: true,
                        message: `🗑️ 已删除包含"${keyword}"的 ${count} 个任务`
                    };
                } else {
                    return {
                        handled: true,
                        message: `❌ 没有找到包含"${keyword}"的任务`
                    };
                }
            }
        }
        
        // 添加任务到特定日期（如：明天添加任务洗衣服、14号添加任务打扫卫生）
        if (/添加|加上|新增/.test(msg) && /任务/.test(msg)) {
            // 提取日期和任务内容
            let targetDate = new Date();
            let taskTitle = '';
            
            // 匹配 "明天添加任务XXX" 或 "添加任务XXX到明天"
            if (/明天|明日/.test(msg)) {
                targetDate.setDate(targetDate.getDate() + 1);
                taskTitle = msg.replace(/添加|加上|新增|任务|明天|明日|到|给|帮我|请/g, '').trim();
            }
            // 匹配 "后天添加任务XXX"
            else if (/后天/.test(msg)) {
                targetDate.setDate(targetDate.getDate() + 2);
                taskTitle = msg.replace(/添加|加上|新增|任务|后天|到|给|帮我|请/g, '').trim();
            }
            // 匹配 "14号添加任务XXX" 或 "1月15日添加任务XXX"
            else {
                const dateMatch = msg.match(/(\d{1,2})号|(\d{1,2})日|(\d{1,2})月(\d{1,2})[号日]/);
                if (dateMatch) {
                    if (dateMatch[3] && dateMatch[4]) {
                        // X月X号格式
                        const month = parseInt(dateMatch[3]);
                        const day = parseInt(dateMatch[4]);
                        targetDate = new Date(targetDate.getFullYear(), month - 1, day);
                    } else {
                        // X号格式
                        const day = parseInt(dateMatch[1] || dateMatch[2]);
                        targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
                    }
                    taskTitle = msg.replace(/添加|加上|新增|任务|\d{1,2}[号日月]|到|给|帮我|请/g, '').trim();
                } else {
                    // 今天
                    taskTitle = msg.replace(/添加|加上|新增|任务|今天|今日|到|给|帮我|请/g, '').trim();
                }
            }
            
            if (taskTitle && typeof App !== 'undefined' && App.addTaskToTimeline) {
                const dateStr = this.formatDate(targetDate);
                const displayDate = `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
                
                const task = {
                    title: taskTitle,
                    date: dateStr,
                    startTime: '09:00',
                    duration: 30,
                    coins: 50,
                    type: 'standing',
                    verification: 'check'
                };
                
                App.addTaskToTimeline(task);
                
                return {
                    handled: true,
                    message: `✅ 已添加任务"${taskTitle}"到 ${displayDate}`
                };
            }
        }
        
        // 查看明天的任务
        if (/明天|明日/.test(msg) && /任务|有什么|要做/.test(msg)) {
            if (typeof App !== 'undefined' && App.getTomorrowTasks) {
                const tasks = App.getTomorrowTasks();
                if (tasks && tasks.length > 0) {
                    const taskList = tasks.map((t, i) => 
                        `${i + 1}. ${t.startTime || ''} ${t.title} ${t.completed ? '✅' : '⏳'}`
                    ).join('\n');
                    return {
                        handled: true,
                        message: `📅 明天你有 ${tasks.length} 个任务：\n\n${taskList}`
                    };
                } else {
                    return {
                        handled: true,
                        message: '📅 明天还没有安排任务哦~'
                    };
                }
            }
        }
        
        // 查看本周任务
        if (/本周|这周|这一周/.test(msg) && /任务|有什么/.test(msg)) {
            if (typeof App !== 'undefined' && App.getThisWeekTasks) {
                const tasks = App.getThisWeekTasks();
                if (tasks && tasks.length > 0) {
                    return {
                        handled: true,
                        message: `📅 本周你有 ${tasks.length} 个任务\n已完成：${tasks.filter(t => t.completed).length} 个\n未完成：${tasks.filter(t => !t.completed).length} 个`
                    };
                } else {
                    return {
                        handled: true,
                        message: '📅 本周还没有安排任务哦~'
                    };
                }
            }
        }
        
        // 完成所有今天的任务
        if (/完成|标记完成/.test(msg) && /今天|今日|所有/.test(msg) && /任务/.test(msg)) {
            if (typeof App !== 'undefined' && App.completeAllTodayTasks) {
                const count = App.completeAllTodayTasks();
                return {
                    handled: true,
                    message: `✅ 已标记今天的 ${count} 个任务为完成！\n太棒了，继续保持！🎉`
                };
            }
        }
        
        // 取消完成所有今天的任务
        if (/取消完成|标记未完成|重置/.test(msg) && /今天|今日/.test(msg) && /任务/.test(msg)) {
            if (typeof App !== 'undefined' && App.uncompleteAllTodayTasks) {
                const count = App.uncompleteAllTodayTasks();
                return {
                    handled: true,
                    message: `⏳ 已将今天的 ${count} 个任务标记为未完成`
                };
            }
        }
        
        // 搜索任务
        if (/搜索|查找|找/.test(msg) && /任务/.test(msg)) {
            const keyword = msg.replace(/搜索|查找|找|任务|的|把|帮我|请/g, '').trim();
            if (keyword && typeof App !== 'undefined' && App.searchTasks) {
                const results = App.searchTasks(keyword);
                if (results.length > 0) {
                    const taskList = results.slice(0, 10).map((t, i) => 
                        `${i + 1}. ${t.date} ${t.startTime || ''} ${t.title} ${t.completed ? '✅' : '⏳'}`
                    ).join('\n');
                    return {
                        handled: true,
                        message: `🔍 找到 ${results.length} 个包含"${keyword}"的任务：\n\n${taskList}${results.length > 10 ? '\n\n（仅显示前10个）' : ''}`
                    };
                } else {
                    return {
                        handled: true,
                        message: `❌ 没有找到包含"${keyword}"的任务`
                    };
                }
            }
        }
        
        // ==================== 基础查询指令 ====================
        
        // 查看今日任务
        if (/今天|今日|今天的任务|今日任务|今天有什么/.test(msg)) {
            if (typeof App !== 'undefined' && App.getTodayTasks) {
                const tasks = App.getTodayTasks();
                if (tasks && tasks.length > 0) {
                    const taskList = tasks.map((t, i) => 
                        `${i + 1}. ${t.startTime || ''} ${t.title} ${t.completed ? '✅' : '⏳'}`
                    ).join('\n');
                    return {
                        handled: true,
                        message: `📅 今天你有 ${tasks.length} 个任务：\n\n${taskList}`
                    };
                } else {
                    return {
                        handled: true,
                        message: '📅 今天还没有安排任务哦~'
                    };
                }
            }
        }
        
        // 查看进度/完成情况
        if (/进度|完成|完成了多少|做了多少/.test(msg)) {
            if (typeof App !== 'undefined' && App.getTodayProgress) {
                const progress = App.getTodayProgress();
                return {
                    handled: true,
                    message: `📊 今日进度：\n已完成 ${progress.completed} / ${progress.total} 个任务\n完成率：${progress.percentage}%\n获得金币：🪙 ${progress.coins}`
                };
            }
        }
        
        // 查看金币
        if (/金币|余额|有多少金币/.test(msg)) {
            if (typeof GameSystem !== 'undefined' && GameSystem.getCoins) {
                const coins = GameSystem.getCoins();
                return {
                    handled: true,
                    message: `🪙 你当前有 ${coins} 金币！\n继续加油完成任务赚取更多金币吧~`
                };
            }
        }
        
        // 查看等级
        if (/等级|级别|多少级|level/.test(msg)) {
            if (typeof GameSystem !== 'undefined' && GameSystem.getLevel) {
                const level = GameSystem.getLevel();
                return {
                    handled: true,
                    message: `⭐ 你当前是 ${level.level} 级！\n经验值：${level.exp} / ${level.nextLevelExp}\n距离下一级还需要 ${level.nextLevelExp - level.exp} 经验~`
                };
            }
        }
        
        // 清空任务列表
        if (/清空|删除所有|全部删除/.test(msg) && /任务|想法|脑子/.test(msg)) {
            this.clearAll();
            return {
                handled: true,
                message: '🗑️ 已清空所有暂存的想法'
            };
        }
        
        // AI安排任务
        if (/安排|规划|帮我安排/.test(msg) && this.items.length > 0) {
            await this.aiArrange();
            return {
                handled: true,
                message: null // aiArrange 会自己显示消息
            };
        }
        
        // 查看记忆库
        if (/记忆|回忆|之前|以前/.test(msg)) {
            if (typeof MemoryBank !== 'undefined' && MemoryBank.search) {
                const keyword = msg.replace(/记忆|回忆|之前|以前|查看|搜索/g, '').trim();
                if (keyword) {
                    const results = MemoryBank.search(keyword);
                    if (results.length > 0) {
                        const list = results.slice(0, 5).map((r, i) => 
                            `${i + 1}. ${r.title} (${r.date})`
                        ).join('\n');
                        return {
                            handled: true,
                            message: `🗂️ 找到 ${results.length} 条相关记忆：\n\n${list}`
                        };
                    }
                }
            }
        }
        
        // 查看习惯统计
        if (/习惯|统计|分析|我的习惯/.test(msg)) {
            if (typeof App !== 'undefined' && App.getHabitStats) {
                const stats = App.getHabitStats();
                if (stats && stats.totalRecords > 0) {
                    const topTasksList = stats.topTasks.slice(0, 5).map((t, i) => 
                        `${i + 1}. ${t[0]} (${t[1]}次)`
                    ).join('\n');
                    
                    const mostActiveTime = stats.mostActiveHour;
                    const timeLabel = mostActiveTime + ':00-' + (mostActiveTime + 1) + ':00';
                    
                    return {
                        handled: true,
                        message: `📊 你的任务习惯分析：\n\n` +
                                `📝 总记录数：${stats.totalRecords} 条\n` +
                                `⏰ 最活跃时段：${timeLabel}\n\n` +
                                `🔥 最常做的任务：\n${topTasksList}\n\n` +
                                `💡 系统会根据这些习惯为你智能推荐任务哦~`
                    };
                } else {
                    return {
                        handled: true,
                        message: `📊 还没有足够的习惯数据\n\n继续使用系统，我会学习你的习惯并提供更智能的推荐！`
                    };
                }
            }
        }
        
        // 清除习惯数据
        if (/清除|删除|重置/.test(msg) && /习惯|数据/.test(msg)) {
            localStorage.removeItem('task_habits');
            return {
                handled: true,
                message: `🗑️ 已清除所有习惯数据\n\n系统将重新学习你的习惯`
            };
        }
        
        // 设置提醒
        if (/提醒|闹钟|定时/.test(msg)) {
            return {
                handled: true,
                message: '⏰ 提醒功能正在开发中，敬请期待！\n你可以先在时间轴中添加任务，到时间会自动提醒哦~'
            };
        }
        
        // 帮助信息
        if (/帮助|help|怎么用|功能/.test(msg)) {
            return {
                handled: true,
                message: `🤖 我可以帮你：

📝 任务管理
• "添加任务：洗衣服"
• "今天有什么任务"
• "明天有什么任务"
• "帮我安排任务"

🗑️ 删除任务
• "删除今天的任务"
• "删除明天的任务"
• "删除今天和明天的任务"
• "删除包含洗衣服的任务"
• "删除所有未完成的任务"

✅ 完成任务
• "完成所有今天的任务"
• "标记今天的任务为完成"

🔍 搜索任务
• "搜索洗衣服任务"
• "查找打扫的任务"

📊 进度查询
• "今天完成了多少"
• "我的金币"
• "我的等级"

🧠 习惯学习
• "我的习惯" - 查看习惯统计
• "清除习惯数据" - 重置学习
• 系统会自动学习你的任务习惯
• 智能推荐会根据你的习惯调整

💬 智能对话
• 问我任何问题
• 闲聊、建议、提醒

直接说出你的需求，我会智能理解并帮助你！`
            };
        }
        
        // 未匹配到指令
        return { handled: false };
    },
    
    // 从AI回复中提取任务
    extractTasksFromAIResponse(response) {
        const tasks = [];
        
        // 匹配列表格式的任务 (1. xxx, - xxx, • xxx)
        const listPattern = /(?:^|\n)(?:\d+\.|[-•])\s*(.+?)(?=\n|$)/g;
        let match;
        
        while ((match = listPattern.exec(response)) !== null) {
            const task = match[1].trim();
            if (task.length > 2 && task.length < 50) {
                tasks.push(task);
            }
        }
        
        return tasks;
    },
    
    // 渲染项目列表
    renderItemsList() {
        if (this.items.length === 0) {
            return `
                <div class="brain-dump-empty">
                    <div class="empty-icon">🧠</div>
                    <div class="empty-text">脑子空空的~</div>
                    <div class="empty-hint">把你的想法、待办都倒进来吧</div>
                </div>
            `;
        }
        
        let itemsHtml = '';
        this.items.forEach((item, index) => {
            itemsHtml += `
                <div class="brain-dump-item" 
                     data-id="${item.id}" 
                     data-index="${index}"
                     draggable="true">
                    <div class="item-drag-handle">⋮⋮</div>
                    <div class="item-content">${this.escapeHtml(item.text)}</div>
                    <button class="item-remove-btn" onclick="BrainDump.removeItem('${item.id}')">×</button>
                </div>
            `;
        });
        
        return `
            <div class="brain-dump-list" id="brainDumpList">
                <div class="list-header">
                    <span class="list-count">📝 ${this.items.length} 个想法待整理</span>
                    <span class="list-hint">拖拽可调整顺序</span>
                </div>
                <div class="items-container" id="itemsContainer">
                    ${itemsHtml}
                </div>
            </div>
        `;
    },
    
    // 渲染AI安排后的视图
    renderArrangedView() {
        if (this.arrangedTasks.length === 0) {
            return this.renderItemsList();
        }
        
        let tasksHtml = '';
        this.arrangedTasks.forEach((task, index) => {
            const typeIcon = task.type === 'standing' ? '🧍' : '🪑';
            const energyDots = '💪'.repeat(Math.min(task.energyCost || 1, 5));
            const endTime = this.addMinutesToTime(task.startTime, task.duration);
            
            tasksHtml += `
                <div class="arranged-task-card" 
                     data-index="${index}"
                     draggable="true">
                    <div class="task-drag-handle">⋮⋮</div>
                    <div class="task-time-badge">${task.startTime}-${endTime}</div>
                    <div class="task-main">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            <span class="meta-item" title="任务类型">${typeIcon}</span>
                            <span class="meta-item" title="位置">📍${task.location || '未知'}</span>
                            <span class="meta-item" title="体力消耗">${energyDots}</span>
                            <span class="meta-item coins" title="金币收益">🪙+${task.coins || 0}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-edit-btn" onclick="BrainDump.editArrangedTask(${index})" title="编辑">✏️</button>
                        <button class="task-remove-btn" onclick="BrainDump.removeArrangedTask(${index})" title="移除">×</button>
                    </div>
                </div>
            `;
        });
        
        // 动线说明
        const summaryHtml = this.arrangeSummary ? `
            <div class="arrange-summary">
                <div class="summary-title">📊 安排说明</div>
                <div class="summary-content">${this.arrangeSummary.explanation || ''}</div>
                <div class="summary-stats">
                    <span>共 ${this.arrangeSummary.totalTasks || 0} 个任务</span>
                    <span>约 ${Math.round((this.arrangeSummary.totalDuration || 0) / 60)} 小时</span>
                    <span>上下楼 ${this.arrangeSummary.floorChanges || 0} 次</span>
                </div>
            </div>
        ` : '';
        
        return `
            <div class="brain-dump-arranged">
                <div class="arranged-header">
                    <span class="arranged-title">✨ AI智能安排结果</span>
                    <button class="back-to-list-btn" onclick="BrainDump.backToList()">← 返回编辑</button>
                </div>
                ${summaryHtml}
                <div class="arranged-tasks-container" id="arrangedTasksContainer">
                    ${tasksHtml}
                </div>
                <div class="add-task-row">
                    <button class="add-arranged-task-btn" onclick="BrainDump.showAddTaskModal()">
                        <span class="add-icon">+</span>
                        <span>添加任务</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // 渲染操作按钮
    renderActions() {
        if (this.items.length === 0 && !this.showArrangedView) {
            return '';
        }
        
        if (this.showArrangedView && this.arrangedTasks.length > 0) {
            return `
                <div class="brain-dump-actions arranged-actions">
                    <button class="action-btn secondary" onclick="BrainDump.reArrange()">
                        🔄 重新安排
                    </button>
                    <button class="action-btn primary" onclick="BrainDump.pushToTimeline()">
                        📅 推送到时间轴
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="brain-dump-actions">
                <button class="action-btn danger" onclick="BrainDump.clearAll()">
                    🗑️ 一键清空
                </button>
                <button class="action-btn primary" onclick="BrainDump.aiArrange()">
                    🤖 AI智能安排
                </button>
            </div>
        `;
    },
    
    // ==================== AI智能安排 ====================
    
    // AI智能安排任务
    async aiArrange() {
        if (this.items.length === 0) {
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', '没有待安排的任务哦，先添加一些想法吧~', '💭');
            }
            return;
        }
        
        // 显示加载状态
        this.showLoading('🤖 AI正在智能安排任务...');
        
        try {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                               now.getMinutes().toString().padStart(2, '0');
            const today = now.getFullYear() + '-' + 
                         (now.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                         now.getDate().toString().padStart(2, '0');
            
            // 构建任务列表
            const taskList = this.items.map((item, i) => `${i + 1}. ${item.text}`).join('\n');
            
            // 替换提示词中的变量
            const prompt = this.arrangePrompt
                .replace('{currentTime}', currentTime)
                .replace('{today}', today)
                .replace('{taskList}', taskList);
            
            // 调用AI服务
            const response = await this.callAI(prompt);
            
            // 解析AI响应
            const result = this.parseAIResponse(response);
            
            if (result && result.tasks && result.tasks.length > 0) {
                this.arrangedTasks = result.tasks;
                this.arrangeSummary = result.summary;
                this.showArrangedView = true;
                this.hideLoading();
                this.refresh();
                
                // 播放成功音效
                if (typeof UnifiedAudioSystem !== 'undefined') {
                    UnifiedAudioSystem.playSound('success');
                }
                
                if (typeof App !== 'undefined') {
                    App.addChatMessage('system', 
                        `✨ AI已为你安排好 ${result.tasks.length} 个任务！\n` +
                        `预计总时长：${Math.round((result.summary?.totalDuration || 0) / 60)} 小时\n` +
                        `上下楼次数：${result.summary?.floorChanges || 0} 次\n` +
                        `你可以拖拽调整顺序，确认后推送到时间轴~`, 
                        '✨'
                    );
                }
            } else {
                throw new Error('AI返回的数据格式不正确');
            }
            
        } catch (error) {
            console.error('AI安排失败:', error);
            this.hideLoading();
            
            // 使用本地智能安排作为降级方案
            this.localSmartArrange();
        }
    },
    
    // 调用AI服务
    async callAI(prompt) {
        // 优先使用AIService
        if (typeof AIService !== 'undefined' && AIService.chat) {
            const response = await AIService.chat([
                { role: 'system', content: '你是一个专业的任务安排助手，擅长优化日程和动线规划。请严格按照JSON格式输出。' },
                { role: 'user', content: prompt }
            ]);
            return response;
        }
        
        // 降级：直接调用API
        const apiKey = typeof Storage !== 'undefined' ? Storage.getApiKey() : null;
        if (!apiKey) {
            throw new Error('未配置API Key');
        }
        
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一个专业的任务安排助手，擅长优化日程和动线规划。请严格按照JSON格式输出，不要有其他文字。' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    },
    
    // 解析AI响应
    parseAIResponse(response) {
        try {
            // 尝试直接解析JSON
            let jsonStr = response.trim();
            
            // 如果响应包含markdown代码块，提取JSON
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }
            
            // 尝试找到JSON对象
            const startIndex = jsonStr.indexOf('{');
            const endIndex = jsonStr.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
                jsonStr = jsonStr.substring(startIndex, endIndex + 1);
            }
            
            const result = JSON.parse(jsonStr);
            
            // 验证并补充数据
            if (result.tasks && Array.isArray(result.tasks)) {
                result.tasks = result.tasks.map(task => ({
                    title: task.title || '未命名任务',
                    startTime: task.startTime || '09:00',
                    duration: task.duration || 30,
                    type: task.type || 'standing',
                    energyCost: Math.min(5, Math.max(1, task.energyCost || 2)),
                    location: task.location || '未知',
                    floor: task.floor || '一楼',
                    verification: task.verification || 'check',
                    coins: task.coins || this.calculateCoins(task),
                    reason: task.reason || ''
                }));
            }
            
            return result;
        } catch (e) {
            console.error('解析AI响应失败:', e);
            return null;
        }
    },
    
    // 本地智能安排（降级方案）
    localSmartArrange() {
        const now = new Date();
        let currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // 如果当前时间太晚，从明天早上开始
        if (currentMinutes > 22 * 60) {
            currentMinutes = 9 * 60; // 从9点开始
        }
        
        // 向上取整到下一个5分钟
        currentMinutes = Math.ceil(currentMinutes / 5) * 5;
        
        const arrangedTasks = [];
        
        this.items.forEach((item, index) => {
            const text = item.text.toLowerCase();
            
            // 检查是否是固定时间任务
            let fixedTime = null;
            for (const [keyword, time] of Object.entries(this.layoutConfig.fixedTimeTasks)) {
                if (text.includes(keyword)) {
                    fixedTime = time;
                    break;
                }
            }
            
            // 智能判断任务属性
            const taskInfo = this.analyzeTask(item.text);
            
            if (fixedTime) {
                const [h, m] = fixedTime.start.split(':').map(Number);
                taskInfo.startTime = fixedTime.start;
                taskInfo.duration = this.getMinutesDiff(fixedTime.start, fixedTime.end);
            } else {
                const hours = Math.floor(currentMinutes / 60);
                const mins = currentMinutes % 60;
                taskInfo.startTime = hours.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0');
                currentMinutes += taskInfo.duration + 10; // 加10分钟缓冲
            }
            
            taskInfo.coins = this.calculateCoins(taskInfo);
            arrangedTasks.push(taskInfo);
        });
        
        // 按时间排序
        arrangedTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        this.arrangedTasks = arrangedTasks;
        this.arrangeSummary = {
            totalTasks: arrangedTasks.length,
            totalDuration: arrangedTasks.reduce((sum, t) => sum + t.duration, 0),
            floorChanges: this.calculateFloorChanges(arrangedTasks),
            explanation: '本地智能安排（AI暂时不可用）'
        };
        this.showArrangedView = true;
        this.refresh();
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `📋 已使用本地智能安排 ${arrangedTasks.length} 个任务\n` +
                `（AI暂时不可用，使用了简化的安排逻辑）`, 
                '📋'
            );
        }
    },
    
    // 分析任务属性
    analyzeTask(text) {
        const textLower = text.toLowerCase();
        
        // 默认值
        let type = 'standing';
        let duration = 30;
        let energyCost = 2;
        let location = '客厅';
        let floor = '一楼';
        let verification = 'check';
        
        // 位置判断
        if (/厕所|洗澡|洗头|刷牙|上厕所/.test(text)) {
            location = '厕所'; floor = '一楼';
        } else if (/厨房|做饭|炒菜|煮|烧水|洗碗/.test(text)) {
            location = '厨房'; floor = '一楼';
        } else if (/猫粮|猫砂|猫碗|喂猫|铲屎/.test(text)) {
            // 猫咪相关任务在厨房
            location = '厨房'; floor = '一楼';
        } else if (/卧室|床|睡|换床单|收拾卧室/.test(text)) {
            location = '卧室'; floor = '二楼';
        } else if (/拍摄|工作区|电脑|修图|剪辑/.test(text)) {
            location = '工作区'; floor = '二楼'; type = 'sitting';
        } else if (/客厅|沙发|看电视/.test(text)) {
            location = '客厅'; floor = '一楼';
        } else if (/洗衣|晾衣/.test(text)) {
            location = '洗衣区'; floor = '一楼';
        } else if (/快递|出门|外出|买/.test(text)) {
            location = '外出'; floor = '一楼';
        }
        
        // 任务类型和时长判断
        if (/打扫|拖地|擦|清洁|收拾/.test(text)) {
            type = 'standing'; duration = 40; energyCost = 4;
        } else if (/洗衣|洗碗/.test(text)) {
            type = 'standing'; duration = 20; energyCost = 2;
        } else if (/做饭|炒菜/.test(text)) {
            type = 'standing'; duration = 45; energyCost = 3;
        } else if (/吃饭|午饭|晚饭|早饭/.test(text)) {
            type = 'sitting'; duration = 30; energyCost = 1;
        } else if (/洗澡/.test(text)) {
            type = 'standing'; duration = 30; energyCost = 2;
        } else if (/洗头/.test(text)) {
            type = 'standing'; duration = 20; energyCost = 2;
        } else if (/刷牙|洗脸/.test(text)) {
            type = 'standing'; duration = 5; energyCost = 1;
        } else if (/上厕所/.test(text)) {
            type = 'sitting'; duration = 10; energyCost = 1;
        } else if (/快递/.test(text)) {
            type = 'standing'; duration = 15; energyCost = 2;
        } else if (/电脑|修图|剪辑|工作/.test(text)) {
            type = 'sitting'; duration = 60; energyCost = 2;
        } else if (/猫粮|喂猫|倒猫粮|加猫粮/.test(text)) {
            // 喂猫相关
            type = 'standing'; duration = 5; energyCost = 1;
        } else if (/猫砂|铲屎|铲猫砂|清理猫砂/.test(text)) {
            // 铲猫砂
            type = 'standing'; duration = 10; energyCost = 2;
        } else if (/猫水|换水|加水/.test(text)) {
            // 换猫水
            type = 'standing'; duration = 3; energyCost = 1;
        } else if (/洗猫碗|清洗猫碗/.test(text)) {
            type = 'standing'; duration = 5; energyCost = 1;
        } else if (/倒垃圾/.test(text)) {
            type = 'standing'; duration = 5; energyCost = 1;
        }
        
        // 验证方式
        if (/打扫|清洁|收拾/.test(text)) {
            verification = 'photo';
        } else if (/洗衣|洗碗/.test(text)) {
            verification = 'photo';
        } else if (/猫砂|猫粮/.test(text)) {
            verification = 'photo';
        }
        
        return {
            title: text,
            startTime: '09:00',
            duration,
            type,
            energyCost,
            location,
            floor,
            verification,
            coins: 0
        };
    },
    
    // 计算金币
    calculateCoins(task) {
        let coins = 0;
        
        if (task.type === 'standing') {
            coins = 20 + task.duration; // 基础20 + 每分钟1金币
        } else {
            coins = 10 + Math.floor(task.duration * 0.5); // 基础10 + 每分钟0.5金币
        }
        
        // 高体力任务额外奖励
        if (task.energyCost >= 4) {
            coins = Math.floor(coins * 1.2);
        }
        
        return coins;
    },
    
    // 计算上下楼次数
    calculateFloorChanges(tasks) {
        let changes = 0;
        let currentFloor = '一楼';
        
        tasks.forEach(task => {
            if (task.floor && task.floor !== currentFloor) {
                changes++;
                currentFloor = task.floor;
            }
        });
        
        return changes;
    },
    
    // ==================== 推送到时间轴 ====================
    
    // 推送所有安排好的任务到时间轴
    pushToTimeline() {
        if (this.arrangedTasks.length === 0) {
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', '没有可推送的任务', '⚠️');
            }
            return;
        }
        
        const today = this.formatDate(new Date());
        let successCount = 0;
        
        this.arrangedTasks.forEach(task => {
            const timelineTask = {
                title: task.title,
                date: today,
                startTime: task.startTime,
                duration: task.duration,
                endTime: this.addMinutesToTime(task.startTime, task.duration),
                coins: task.coins,
                energyCost: task.energyCost,
                tags: [task.location, task.type === 'standing' ? '站立任务' : '坐姿任务'],
                type: task.type,
                location: task.location,
                floor: task.floor,
                verification: task.verification,
                fromBrainDump: true
            };
            
            if (typeof App !== 'undefined' && App.addTaskToTimeline) {
                App.addTaskToTimeline(timelineTask);
                successCount++;
            } else if (typeof Storage !== 'undefined') {
                Storage.addTask(timelineTask);
                successCount++;
            }
        });
        
        // 清空已推送的任务
        this.items = [];
        this.arrangedTasks = [];
        this.arrangeSummary = null;
        this.showArrangedView = false;
        this.saveItems();
        this.refresh();
        
        // 刷新时间轴
        if (typeof App !== 'undefined' && App.loadTimeline) {
            App.loadTimeline();
        }
        
        // 播放成功音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('success');
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `🎉 已成功推送 ${successCount} 个任务到时间轴！\n` +
                `快去时间轴查看吧~`, 
                '🎉'
            );
        }
    },
    
    // 返回列表视图
    backToList() {
        this.showArrangedView = false;
        this.refresh();
    },
    
    // 重新安排
    reArrange() {
        this.showArrangedView = false;
        this.arrangedTasks = [];
        this.arrangeSummary = null;
        this.refresh();
        
        // 延迟调用AI安排
        setTimeout(() => this.aiArrange(), 100);
    },
    
    // 编辑安排后的任务
    editArrangedTask(index) {
        const task = this.arrangedTasks[index];
        if (!task) return;
        
        // 创建编辑弹窗
        const modal = document.createElement('div');
        modal.className = 'brain-dump-modal-overlay';
        modal.id = 'editTaskModal';
        modal.innerHTML = `
            <div class="brain-dump-modal">
                <div class="modal-header">
                    <span>✏️ 编辑任务</span>
                    <button class="modal-close" onclick="BrainDump.closeEditModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>任务名称</label>
                        <input type="text" id="editTaskTitle" value="${this.escapeHtml(task.title)}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>开始时间</label>
                            <input type="time" id="editTaskTime" value="${task.startTime}">
                        </div>
                        <div class="form-group">
                            <label>时长(分钟)</label>
                            <input type="number" id="editTaskDuration" value="${task.duration}" min="5" max="480">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>任务类型</label>
                            <select id="editTaskType">
                                <option value="standing" ${task.type === 'standing' ? 'selected' : ''}>🧍 站立任务</option>
                                <option value="sitting" ${task.type === 'sitting' ? 'selected' : ''}>🪑 坐姿任务</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>体力消耗</label>
                            <select id="editTaskEnergy">
                                ${[1,2,3,4,5].map(n => `<option value="${n}" ${task.energyCost === n ? 'selected' : ''}>${'💪'.repeat(n)}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>位置</label>
                        <select id="editTaskLocation">
                            <option value="厕所" ${task.location === '厕所' ? 'selected' : ''}>🚿 厕所</option>
                            <option value="客厅" ${task.location === '客厅' ? 'selected' : ''}>🛋️ 客厅</option>
                            <option value="厨房" ${task.location === '厨房' ? 'selected' : ''}>🍳 厨房</option>
                            <option value="卧室" ${task.location === '卧室' ? 'selected' : ''}>🛏️ 卧室</option>
                            <option value="工作区" ${task.location === '工作区' ? 'selected' : ''}>💻 工作区</option>
                            <option value="拍摄间" ${task.location === '拍摄间' ? 'selected' : ''}>📷 拍摄间</option>
                            <option value="洗衣区" ${task.location === '洗衣区' ? 'selected' : ''}>🧺 洗衣区</option>
                            <option value="外出" ${task.location === '外出' ? 'selected' : ''}>🚶 外出</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="BrainDump.closeEditModal()">取消</button>
                    <button class="btn-confirm" onclick="BrainDump.saveEditedTask(${index})">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 保存编辑后的任务
    saveEditedTask(index) {
        const task = this.arrangedTasks[index];
        if (!task) return;
        
        task.title = document.getElementById('editTaskTitle').value.trim() || task.title;
        task.startTime = document.getElementById('editTaskTime').value || task.startTime;
        task.duration = parseInt(document.getElementById('editTaskDuration').value) || task.duration;
        task.type = document.getElementById('editTaskType').value;
        task.energyCost = parseInt(document.getElementById('editTaskEnergy').value);
        task.location = document.getElementById('editTaskLocation').value;
        task.floor = ['卧室', '工作区', '拍摄间'].includes(task.location) ? '二楼' : '一楼';
        task.coins = this.calculateCoins(task);
        
        this.closeEditModal();
        this.refresh();
    },
    
    // 关闭编辑弹窗
    closeEditModal() {
        const modal = document.getElementById('editTaskModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 显示添加任务弹窗
    showAddTaskModal() {
        // 计算默认时间（最后一个任务结束后10分钟）
        let defaultStartTime = '09:00';
        if (this.arrangedTasks.length > 0) {
            const lastTask = this.arrangedTasks[this.arrangedTasks.length - 1];
            const lastEndMinutes = this.timeToMinutes(lastTask.startTime) + lastTask.duration + 10;
            defaultStartTime = this.minutesToTime(lastEndMinutes);
        }
        
        const modal = document.createElement('div');
        modal.className = 'brain-dump-modal-overlay';
        modal.id = 'addTaskModal';
        modal.innerHTML = `
            <div class="brain-dump-modal">
                <div class="modal-header">
                    <span>➕ 添加新任务</span>
                    <button class="modal-close" onclick="BrainDump.closeAddModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>任务名称</label>
                        <input type="text" id="newTaskTitle" placeholder="输入任务名称...">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>开始时间</label>
                            <input type="time" id="newTaskTime" value="${defaultStartTime}">
                        </div>
                        <div class="form-group">
                            <label>时长(分钟)</label>
                            <input type="number" id="newTaskDuration" value="30" min="5" max="480">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>任务类型</label>
                            <select id="newTaskType">
                                <option value="standing">🧍 站立任务</option>
                                <option value="sitting">🪑 坐姿任务</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>体力消耗</label>
                            <select id="newTaskEnergy">
                                <option value="1">💪</option>
                                <option value="2" selected>💪💪</option>
                                <option value="3">💪💪💪</option>
                                <option value="4">💪💪💪💪</option>
                                <option value="5">💪💪💪💪💪</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>位置</label>
                        <select id="newTaskLocation">
                            <option value="厕所">🚿 厕所</option>
                            <option value="客厅">🛋️ 客厅</option>
                            <option value="厨房">🍳 厨房</option>
                            <option value="卧室">🛏️ 卧室</option>
                            <option value="工作区">💻 工作区</option>
                            <option value="拍摄间">📷 拍摄间</option>
                            <option value="洗衣区">🧺 洗衣区</option>
                            <option value="外出">🚶 外出</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="BrainDump.closeAddModal()">取消</button>
                    <button class="btn-confirm" onclick="BrainDump.saveNewTask()">添加</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => {
            modal.classList.add('show');
            document.getElementById('newTaskTitle').focus();
        }, 10);
    },
    
    // 关闭添加任务弹窗
    closeAddModal() {
        const modal = document.getElementById('addTaskModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 保存新任务
    saveNewTask() {
        const title = document.getElementById('newTaskTitle').value.trim();
        if (!title) {
            alert('请输入任务名称');
            return;
        }
        
        const startTime = document.getElementById('newTaskTime').value || '09:00';
        const duration = parseInt(document.getElementById('newTaskDuration').value) || 30;
        const type = document.getElementById('newTaskType').value;
        const energyCost = parseInt(document.getElementById('newTaskEnergy').value);
        const location = document.getElementById('newTaskLocation').value;
        const floor = ['卧室', '工作区', '拍摄间'].includes(location) ? '二楼' : '一楼';
        
        const newTask = {
            title,
            startTime,
            duration,
            type,
            energyCost,
            location,
            floor,
            verification: 'check',
            coins: 0
        };
        newTask.coins = this.calculateCoins(newTask);
        
        // 添加到任务列表
        this.arrangedTasks.push(newTask);
        
        // 按时间排序
        this.arrangedTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // 更新统计
        if (this.arrangeSummary) {
            this.arrangeSummary.totalTasks = this.arrangedTasks.length;
            this.arrangeSummary.totalDuration = this.arrangedTasks.reduce((sum, t) => sum + t.duration, 0);
            this.arrangeSummary.floorChanges = this.calculateFloorChanges(this.arrangedTasks);
        }
        
        this.closeAddModal();
        this.refresh();
        
        // 播放音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('success');
        }
    },
    
    // 移除安排后的任务
    removeArrangedTask(index) {
        this.arrangedTasks.splice(index, 1);
        
        // 更新统计
        if (this.arrangeSummary) {
            this.arrangeSummary.totalTasks = this.arrangedTasks.length;
            this.arrangeSummary.totalDuration = this.arrangedTasks.reduce((sum, t) => sum + t.duration, 0);
            this.arrangeSummary.floorChanges = this.calculateFloorChanges(this.arrangedTasks);
        }
        
        this.refresh();
    },
    
    // ==================== 拖拽排序 ====================
    
    // 初始化拖拽功能
    initDragAndDrop() {
        const container = this.showArrangedView ? 
            document.getElementById('arrangedTasksContainer') : 
            document.getElementById('itemsContainer');
        
        if (!container) return;
        
        const items = container.querySelectorAll('[draggable="true"]');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    },
    
    handleDragStart(e) {
        this.dragState.dragging = true;
        this.dragState.dragIndex = parseInt(e.target.dataset.index);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },
    
    handleDragEnd(e) {
        this.dragState.dragging = false;
        this.dragState.dragIndex = null;
        e.target.classList.remove('dragging');
        
        // 移除所有拖拽样式
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    },
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },
    
    handleDragEnter(e) {
        e.preventDefault();
        const target = e.target.closest('[draggable="true"]');
        if (target && !target.classList.contains('dragging')) {
            target.classList.add('drag-over');
        }
    },
    
    handleDragLeave(e) {
        const target = e.target.closest('[draggable="true"]');
        if (target) {
            target.classList.remove('drag-over');
        }
    },
    
    handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('[draggable="true"]');
        if (!target) return;
        
        const dropIndex = parseInt(target.dataset.index);
        const dragIndex = this.dragState.dragIndex;
        
        if (dragIndex === null || dragIndex === dropIndex) return;
        
        // 重新排序
        if (this.showArrangedView) {
            // 交换两个任务的时间（而不是重新计算）
            this.swapTaskTimes(dragIndex, dropIndex);
        } else {
            const [removed] = this.items.splice(dragIndex, 1);
            this.items.splice(dropIndex, 0, removed);
            this.saveItems();
        }
        
        this.refresh();
        
        // 播放音效
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound('click');
        }
    },
    
    // 交换两个任务的时间段
    swapTaskTimes(indexA, indexB) {
        const taskA = this.arrangedTasks[indexA];
        const taskB = this.arrangedTasks[indexB];
        
        if (!taskA || !taskB) return;
        
        // 保存A的时间信息
        const tempStartTime = taskA.startTime;
        const tempDuration = taskA.duration;
        
        // 把B的时间给A
        taskA.startTime = taskB.startTime;
        taskA.duration = taskB.duration;
        
        // 把A的时间给B
        taskB.startTime = tempStartTime;
        taskB.duration = tempDuration;
        
        // 重新计算金币（因为时长可能变了）
        taskA.coins = this.calculateCoins(taskA);
        taskB.coins = this.calculateCoins(taskB);
        
        // 按时间重新排序任务列表
        this.arrangedTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // 更新统计
        if (this.arrangeSummary) {
            this.arrangeSummary.floorChanges = this.calculateFloorChanges(this.arrangedTasks);
        }
    },
    
    // 重新计算任务时间（保留备用）
    recalculateTimes() {
        if (this.arrangedTasks.length === 0) return;
        
        // 获取第一个任务的开始时间作为基准
        let currentMinutes = this.timeToMinutes(this.arrangedTasks[0].startTime);
        
        this.arrangedTasks.forEach((task, index) => {
            // 检查是否是固定时间任务
            let isFixed = false;
            for (const [keyword, time] of Object.entries(this.layoutConfig.fixedTimeTasks)) {
                if (task.title.includes(keyword)) {
                    task.startTime = time.start;
                    isFixed = true;
                    break;
                }
            }
            
            if (!isFixed) {
                const hours = Math.floor(currentMinutes / 60);
                const mins = currentMinutes % 60;
                task.startTime = hours.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0');
            }
            
            currentMinutes = this.timeToMinutes(task.startTime) + task.duration + 10;
        });
        
        // 按时间重新排序
        this.arrangedTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
    
    // ==================== 工具方法 ====================
    
    // 显示加载状态
    showLoading(message) {
        const container = document.getElementById('brainDumpBody');
        if (container) {
            const loadingHtml = `
                <div class="brain-dump-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message || '加载中...'}</div>
                </div>
            `;
            container.innerHTML = loadingHtml;
        }
    },
    
    // 隐藏加载状态
    hideLoading() {
        // refresh会重新渲染，自动移除loading
    },
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 格式化日期
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + '-' + 
               (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               d.getDate().toString().padStart(2, '0');
    },
    
    // 时间转分钟
    timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    },
    
    // 分钟转时间
    minutesToTime(minutes) {
        const h = Math.floor(minutes / 60) % 24;
        const m = minutes % 60;
        return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
    },
    
    // 给时间加分钟
    addMinutesToTime(timeStr, minutes) {
        const totalMinutes = this.timeToMinutes(timeStr) + minutes;
        return this.minutesToTime(totalMinutes);
    },
    
    // 计算两个时间的分钟差
    getMinutesDiff(startTime, endTime) {
        return this.timeToMinutes(endTime) - this.timeToMinutes(startTime);
    }
};

// 导出
window.BrainDump = BrainDump;

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => BrainDump.init(), 1000);
});
