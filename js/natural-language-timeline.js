// 自然语言时间轴控制模块 v2.0
// 增强版：更智能的模式匹配和AI辅助解析
const NaturalLanguageTimeline = {
    // 支持的指令模式（增强版，更宽松的匹配）
    commandPatterns: [
        // ========== 删除任务 ==========
        // 删除特定任务
        { pattern: /删(除|掉)?[「"'【]?(.+?)[」"'】]?(这个)?(任务)?$/i, action: 'deleteTaskByName' },
        { pattern: /把[「"'【]?(.+?)[」"'】]?(这个)?任务?删(除|掉)/i, action: 'deleteTaskByName' },
        { pattern: /取消[「"'【]?(.+?)[」"'】]?(这个)?任务?/i, action: 'deleteTaskByName' },
        { pattern: /不要[「"'【]?(.+?)[」"'】]?(这个)?任务?了/i, action: 'deleteTaskByName' },
        { pattern: /移除[「"'【]?(.+?)[」"'】]?(这个)?任务?/i, action: 'deleteTaskByName' },
        
        // 删除某时间之后的任务
        { pattern: /(删除?|删掉|清空|取消)(今天)?(下午|上午|晚上)?(\d+)[点:：]?(\d+)?之?后(的)?(所有|全部)?任务/i, action: 'deleteTasksAfter' },
        { pattern: /把(今天)?(下午|上午|晚上)?(\d+)[点:：]?(\d+)?之?后(的)?(所有|全部)?任务(都)?(删除?|删掉|清空)/i, action: 'deleteTasksAfter' },
        { pattern: /(\d+)[点:：](\d+)?之?后(的)?任务(都)?(删除?|删掉|不要了)/i, action: 'deleteTasksAfter' },
        
        // 清空某天的任务
        { pattern: /清空(\d+)[号日](的)?(所有)?任务/i, action: 'clearDayTasks' },
        { pattern: /把(\d+)[号日](的)?任务(都|全部)?删(除|掉)/i, action: 'clearDayTasks' },
        { pattern: /删(除|掉)(\d+)[号日](的)?(所有|全部)?任务/i, action: 'clearDayTasks' },
        { pattern: /清空今天(的)?(所有)?任务/i, action: 'clearTodayTasks' },
        { pattern: /把今天(的)?任务(都|全部)?删(除|掉)/i, action: 'clearTodayTasks' },
        
        // ========== 移动任务 ==========
        // 移动任务到指定时间
        { pattern: /把[「"'【]?(.+?)[」"'】]?(移|调整?|改|换)(到|成)(下午|上午|晚上)?(\d+)[点:：](\d+)?/i, action: 'moveTaskToTime' },
        { pattern: /[「"'【]?(.+?)[」"'】]?(移|调整?|改|换)(到|成)(下午|上午|晚上)?(\d+)[点:：](\d+)?/i, action: 'moveTaskToTime' },
        { pattern: /(下午|上午|晚上)?(\d+)[点:：](\d+)?(的)?[「"'【]?(.+?)[」"'】]?(移|调整?|改|换)(到|成)(下午|上午|晚上)?(\d+)[点:：](\d+)?/i, action: 'moveTaskToTimeComplex' },
        
        // 移动任务到指定日期
        { pattern: /把[「"'【]?(.+?)[」"'】]?(移|调整?|改|换)(到|成)(\d+)[号日]/i, action: 'moveTaskToDate' },
        { pattern: /把[「"'【]?(.+?)[」"'】]?(移|调整?|改|换)(到|成)(明天|后天)/i, action: 'moveTaskToRelativeDate' },
        
        // 移动某天的所有任务
        { pattern: /把(\d+)[号日](的)?(所有)?任务(移|调整?|改|换)(到|成)(\d+)[号日]/i, action: 'moveDayTasks' },
        
        // ========== 修改任务时长 ==========
        { pattern: /把[「"'【]?(.+?)[」"'】]?(的)?(时长|时间)(改|调整?|设)(成|为|到)?(\d+)(分钟|小时)/i, action: 'changeTaskDuration' },
        { pattern: /[「"'【]?(.+?)[」"'】]?(改|调整?|设)(成|为)?(\d+)(分钟|小时)/i, action: 'changeTaskDuration' },
        
        // ========== 批量调整 ==========
        { pattern: /把(今天)?(所有|全部)?任务(都)?(延后|推迟|往后)(\d+)(分钟|小时)/i, action: 'delayAllTasks' },
        { pattern: /(今天)?(所有|全部)?任务(都)?(延后|推迟|往后)(\d+)(分钟|小时)/i, action: 'delayAllTasks' },
        { pattern: /把(今天)?(所有|全部)?任务(都)?(提前|往前)(\d+)(分钟|小时)/i, action: 'advanceAllTasks' },
        { pattern: /(今天)?(所有|全部)?任务(都)?(提前|往前)(\d+)(分钟|小时)/i, action: 'advanceAllTasks' },
        
        // ========== 智能调整 ==========
        { pattern: /(自动)?(调整|解决|处理)(时间)?重叠(的)?任务/i, action: 'resolveOverlaps' },
        { pattern: /把(所有)?重叠(的)?任务(自动)?分开/i, action: 'resolveOverlaps' },
        { pattern: /优化(今天的)?时间(安排|表)/i, action: 'optimizeSchedule' },
        { pattern: /整理(一下)?(今天的)?时间(轴|表|安排)/i, action: 'optimizeSchedule' },
        
        // ========== 插入任务 ==========
        { pattern: /在(下午|上午|晚上)?(\d+)[点:：](\d+)?(插入|加|添加)[「"'【]?(.+?)[」"'】]?(并|,|，)?(顺延|往后推)?/i, action: 'insertAndShift' },
        { pattern: /(下午|上午|晚上)?(\d+)[点:：](\d+)?(加|添加|插入)[「"'【]?(.+?)[」"'】]?/i, action: 'addTaskAtTime' },
        
        // ========== 复制任务 ==========
        { pattern: /把今天(的)?任务(复制|拷贝)(到|去)(\d+)[号日]/i, action: 'copyTasksToDate' },
        { pattern: /(复制|拷贝)[「"'【]?(.+?)[」"'】]?(到|去)(\d+)[号日]/i, action: 'copyTaskToDate' },
        { pattern: /(复制|拷贝)[「"'【]?(.+?)[」"'】]?(到|去)(明天|后天)/i, action: 'copyTaskToRelativeDate' },
        
        // ========== 交换任务 ==========
        { pattern: /交换[「"'【]?(.+?)[」"'】]?和[「"'【]?(.+?)[」"'】]?(的)?(时间|位置)?/i, action: 'swapTasks' },
        { pattern: /把[「"'【]?(.+?)[」"'】]?和[「"'【]?(.+?)[」"'】]?(的)?(时间|位置)?交换/i, action: 'swapTasks' },
        
        // ========== 完成任务 ==========
        { pattern: /完成[「"'【]?(.+?)[」"'】]?(这个)?任务?/i, action: 'completeTask' },
        { pattern: /[「"'【]?(.+?)[」"'】]?(已经)?完成了?/i, action: 'completeTask' },
        { pattern: /把[「"'【]?(.+?)[」"'】]?标记?(为|成)?完成/i, action: 'completeTask' },
        
        // ========== 查询 ==========
        { pattern: /今天(还)?有(多少|几个|什么|哪些)任务/i, action: 'listTodayTasks' },
        { pattern: /(\d+)[号日]有(什么|哪些|多少|几个)任务/i, action: 'listDayTasks' },
        { pattern: /(明天|后天)有(什么|哪些|多少|几个)任务/i, action: 'listRelativeDayTasks' },
        { pattern: /查看?(今天|明天|后天)?(的)?任务/i, action: 'listTasks' },
        { pattern: /显示?(今天|明天|后天)?(的)?任务/i, action: 'listTasks' },
        
        // ========== 重命名任务 ==========
        { pattern: /把[「"'【]?(.+?)[」"'】]?(改名|重命名|改)(成|为)[「"'【]?(.+?)[」"'】]?$/i, action: 'renameTask' },
    ],
    
    // 初始化
    init() {
        console.log('自然语言时间轴控制模块 v2.0 初始化完成');
    },
    
    // 解析并执行自然语言指令
    async parseAndExecute(text) {
        // 预处理文本
        const cleanText = text.trim();
        
        // 首先尝试正则匹配
        for (const cmd of this.commandPatterns) {
            const match = cleanText.match(cmd.pattern);
            if (match) {
                console.log('匹配到指令:', cmd.action, match);
                const result = await this.executeAction(cmd.action, match, cleanText);
                if (result) return result;
            }
        }
        
        // 如果正则没匹配到，尝试智能关键词匹配
        const smartResult = await this.smartParse(cleanText);
        if (smartResult) {
            return smartResult;
        }
        
        // 没有匹配到，返回null让AI处理
        return null;
    },
    
    // 智能解析（关键词匹配）
    async smartParse(text) {
        const lowerText = text.toLowerCase();
        
        // 检测删除意图
        if (this.hasDeleteIntent(lowerText)) {
            return this.handleDeleteIntent(text);
        }
        
        // 检测移动意图
        if (this.hasMoveIntent(lowerText)) {
            return this.handleMoveIntent(text);
        }
        
        // 检测完成意图
        if (this.hasCompleteIntent(lowerText)) {
            return this.handleCompleteIntent(text);
        }
        
        // 检测查询意图
        if (this.hasQueryIntent(lowerText)) {
            return this.handleQueryIntent(text);
        }
        
        return null;
    },
    
    // 检测删除意图
    hasDeleteIntent(text) {
        const deleteKeywords = ['删除', '删掉', '取消', '不要', '移除', '清空', '去掉'];
        return deleteKeywords.some(k => text.includes(k));
    },
    
    // 检测移动意图
    hasMoveIntent(text) {
        const moveKeywords = ['移到', '移动', '调到', '调整到', '改到', '换到', '推迟', '提前', '延后'];
        return moveKeywords.some(k => text.includes(k));
    },
    
    // 检测完成意图
    hasCompleteIntent(text) {
        const completeKeywords = ['完成', '做完', '搞定', '结束'];
        return completeKeywords.some(k => text.includes(k));
    },
    
    // 检测查询意图
    hasQueryIntent(text) {
        const queryKeywords = ['有什么', '有哪些', '有多少', '几个', '查看', '显示', '列出'];
        return queryKeywords.some(k => text.includes(k));
    },
    
    // 处理删除意图
    handleDeleteIntent(text) {
        // 尝试提取任务名称
        const taskName = this.extractTaskName(text);
        if (taskName) {
            return this.deleteTaskByNameDirect(taskName);
        }
        
        // 尝试提取时间
        const timeInfo = this.extractTime(text);
        if (timeInfo && text.includes('之后')) {
            return this.deleteTasksAfterTime(timeInfo.hour, timeInfo.minute);
        }
        
        return null;
    },
    
    // 处理移动意图
    handleMoveIntent(text) {
        const taskName = this.extractTaskName(text);
        const timeInfo = this.extractTime(text);
        
        if (taskName && timeInfo) {
            return this.moveTaskToTimeDirect(taskName, timeInfo.hour, timeInfo.minute);
        }
        
        return null;
    },
    
    // 处理完成意图
    handleCompleteIntent(text) {
        const taskName = this.extractTaskName(text);
        if (taskName) {
            return this.completeTaskDirect(taskName);
        }
        return null;
    },
    
    // 处理查询意图
    handleQueryIntent(text) {
        if (text.includes('今天')) {
            return this.listTodayTasksDirect();
        }
        if (text.includes('明天')) {
            return this.listRelativeDayTasksDirect(1);
        }
        return this.listTodayTasksDirect();
    },
    
    // 提取任务名称
    extractTaskName(text) {
        // 尝试从引号中提取
        const quotedMatch = text.match(/[「"'【](.+?)[」"'】]/);
        if (quotedMatch) return quotedMatch[1];
        
        // 尝试从"把...删除"等模式提取
        const patterns = [
            /把(.+?)(删除|删掉|取消|移除|移到|调到|改到|完成)/,
            /(删除|删掉|取消|移除|完成)(.+?)(任务|$)/,
            /(.+?)(已经)?完成了?$/,
        ];
        
        for (const p of patterns) {
            const m = text.match(p);
            if (m) {
                const name = (m[1] || m[2]).trim();
                // 过滤掉常见的无意义词
                if (name && !['把', '将', '帮我', '请', '今天', '这个', '那个'].includes(name)) {
                    return name;
                }
            }
        }
        
        return null;
    },
    
    // 提取时间
    extractTime(text) {
        // 匹配 "下午3点"、"15:30"、"3点半" 等格式
        const patterns = [
            { regex: /(下午|晚上)(\d+)[点:：](\d+)?/, pmOffset: true },
            { regex: /(上午|早上)?(\d+)[点:：](\d+)?/, pmOffset: false },
            { regex: /(\d+):(\d+)/, pmOffset: false },
        ];
        
        for (const p of patterns) {
            const m = text.match(p.regex);
            if (m) {
                let hour = parseInt(m[2] || m[1]);
                const minute = parseInt(m[3] || m[2] || 0) || 0;
                
                // 处理上午/下午
                if (p.pmOffset && hour < 12) {
                    hour += 12;
                }
                
                // 处理"半"
                if (text.includes('半') && minute === 0) {
                    return { hour, minute: 30 };
                }
                
                return { hour, minute };
            }
        }
        
        return null;
    },
    
    // 执行指令
    async executeAction(action, match, originalText) {
        const handlers = {
            'deleteTaskByName': () => this.deleteTaskByName(match),
            'deleteTasksAfter': () => this.deleteTasksAfter(match, originalText),
            'clearDayTasks': () => this.clearDayTasks(match),
            'clearTodayTasks': () => this.clearTodayTasks(),
            'moveTaskToTime': () => this.moveTaskToTime(match),
            'moveTaskToTimeComplex': () => this.moveTaskToTimeComplex(match),
            'moveTaskToDate': () => this.moveTaskToDate(match),
            'moveTaskToRelativeDate': () => this.moveTaskToRelativeDate(match),
            'moveDayTasks': () => this.moveDayTasks(match),
            'changeTaskDuration': () => this.changeTaskDuration(match),
            'delayAllTasks': () => this.delayAllTasks(match),
            'advanceAllTasks': () => this.advanceAllTasks(match),
            'resolveOverlaps': () => this.resolveOverlaps(),
            'optimizeSchedule': () => this.optimizeSchedule(),
            'insertAndShift': () => this.insertAndShift(match),
            'addTaskAtTime': () => this.addTaskAtTime(match),
            'copyTasksToDate': () => this.copyTasksToDate(match),
            'copyTaskToDate': () => this.copyTaskToDate(match),
            'copyTaskToRelativeDate': () => this.copyTaskToRelativeDate(match),
            'swapTasks': () => this.swapTasks(match),
            'completeTask': () => this.completeTask(match),
            'listTodayTasks': () => this.listTodayTasksDirect(),
            'listDayTasks': () => this.listDayTasks(match),
            'listRelativeDayTasks': () => this.listRelativeDayTasks(match),
            'listTasks': () => this.listTasks(match),
            'renameTask': () => this.renameTask(match),
        };
        
        const handler = handlers[action];
        if (handler) {
            return handler();
        }
        return null;
    },
    
    // ==================== 具体指令实现 ====================
    
    // 根据名称删除任务
    deleteTaskByName(match) {
        // 从不同位置提取任务名
        const taskName = match[2] || match[1];
        return this.deleteTaskByNameDirect(taskName);
    },
    
    // 直接根据名称删除任务
    deleteTaskByNameDirect(taskName) {
        if (!taskName) {
            return { success: false, message: '❌ 请指定要删除的任务名称' };
        }
        
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        
        // 优先在今天的任务中查找
        let task = tasks.find(t => t.date === today && t.title.includes(taskName));
        
        // 如果今天没找到，在所有任务中查找
        if (!task) {
            task = tasks.find(t => t.title.includes(taskName));
        }
        
        if (!task) {
            return { success: false, message: `❌ 找不到包含「${taskName}」的任务` };
        }
        
        Storage.deleteTask(task.id);
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已删除任务「${task.title}」`
        };
    },
    
    // 移动某天的所有任务到另一天
    moveDayTasks(match) {
        const fromDay = parseInt(match[1]);
        const toDay = parseInt(match[6]);
        
        const now = new Date();
        const fromDate = new Date(now.getFullYear(), now.getMonth(), fromDay);
        const toDate = new Date(now.getFullYear(), now.getMonth(), toDay);
        
        const fromDateStr = this.formatDate(fromDate);
        const toDateStr = this.formatDate(toDate);
        
        const tasks = Storage.getTasks();
        let movedCount = 0;
        
        tasks.forEach(task => {
            if (task.date === fromDateStr) {
                Storage.updateTask(task.id, { date: toDateStr });
                movedCount++;
            }
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将${fromDay}号的 ${movedCount} 个任务移动到${toDay}号`
        };
    },
    
    // 移动特定任务到指定时间
    moveTaskToTime(match) {
        const taskName = match[1];
        const period = match[4] || '';
        let hour = parseInt(match[5]);
        const minute = parseInt(match[6]) || 0;
        
        // 处理上午/下午
        if ((period === '下午' || period === '晚上') && hour < 12) {
            hour += 12;
        }
        
        return this.moveTaskToTimeDirect(taskName, hour, minute);
    },
    
    // 复杂格式的时间移动
    moveTaskToTimeComplex(match) {
        const taskName = match[5];
        const period = match[8] || '';
        let hour = parseInt(match[9]);
        const minute = parseInt(match[10]) || 0;
        
        if ((period === '下午' || period === '晚上') && hour < 12) {
            hour += 12;
        }
        
        return this.moveTaskToTimeDirect(taskName, hour, minute);
    },
    
    // 直接移动任务到指定时间
    moveTaskToTimeDirect(taskName, hour, minute) {
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        
        // 优先在今天的任务中查找
        let task = tasks.find(t => t.date === today && t.title.includes(taskName));
        if (!task) {
            task = tasks.find(t => t.title.includes(taskName));
        }
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        const newTime = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        Storage.updateTask(task.id, { startTime: newTime });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将「${task.title}」移动到 ${newTime}`
        };
    },
    
    // 移动任务到指定日期
    moveTaskToDate(match) {
        const taskName = match[1];
        const day = parseInt(match[4]);
        
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(taskName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        Storage.updateTask(task.id, { date: targetDateStr });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将「${task.title}」移动到 ${day}号`
        };
    },
    
    // 移动任务到相对日期（明天/后天）
    moveTaskToRelativeDate(match) {
        const taskName = match[1];
        const relativeDay = match[4];
        
        const now = new Date();
        const daysToAdd = relativeDay === '明天' ? 1 : 2;
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(taskName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        Storage.updateTask(task.id, { date: targetDateStr });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将「${task.title}」移动到${relativeDay}`
        };
    },
    
    // 删除某时间之后的所有任务
    deleteTasksAfter(match, originalText) {
        let hour = parseInt(match[4] || match[3] || match[1]);
        const minute = parseInt(match[5] || match[4] || 0) || 0;
        const period = match[3] || match[2] || '';
        
        // 处理上午/下午
        if ((period === '下午' || period === '晚上') && hour < 12) {
            hour += 12;
        }
        
        return this.deleteTasksAfterTime(hour, minute);
    },
    
    // 直接删除某时间之后的任务
    deleteTasksAfterTime(hour, minute = 0) {
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks();
        const targetMinutes = hour * 60 + minute;
        let deletedCount = 0;
        const deletedTasks = [];
        
        const tasksToDelete = tasks.filter(task => {
            if (task.date !== today) return false;
            const taskParts = task.startTime.split(':');
            const taskMinutes = parseInt(taskParts[0]) * 60 + parseInt(taskParts[1] || 0);
            return taskMinutes >= targetMinutes;
        });
        
        tasksToDelete.forEach(task => {
            deletedTasks.push(task.title);
            Storage.deleteTask(task.id);
            deletedCount++;
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        const timeStr = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        
        if (deletedCount === 0) {
            return {
                success: true,
                message: `✅ ${timeStr} 之后没有任务需要删除`
            };
        }
        
        return {
            success: true,
            message: `✅ 已删除 ${timeStr} 之后的 ${deletedCount} 个任务：\n${deletedTasks.map(t => '  • ' + t).join('\n')}`
        };
    },
    
    // 清空某天的所有任务
    clearDayTasks(match) {
        const day = parseInt(match[1] || match[2]);
        
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks();
        let deletedCount = 0;
        
        tasks.filter(t => t.date === targetDateStr).forEach(task => {
            Storage.deleteTask(task.id);
            deletedCount++;
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已清空${day}号的 ${deletedCount} 个任务`
        };
    },
    
    // 清空今天的所有任务
    clearTodayTasks() {
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks();
        let deletedCount = 0;
        
        tasks.filter(t => t.date === today).forEach(task => {
            Storage.deleteTask(task.id);
            deletedCount++;
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已清空今天的 ${deletedCount} 个任务`
        };
    },
    
    // 修改任务时长
    changeTaskDuration(match) {
        const taskName = match[1];
        const duration = parseInt(match[6] || match[4]);
        const unit = match[7] || match[5];
        
        const durationMinutes = unit === '小时' ? duration * 60 : duration;
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(taskName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        Storage.updateTask(task.id, { duration: durationMinutes });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将「${task.title}」的时长改为 ${duration}${unit}`
        };
    },
    
    // 解决时间重叠
    resolveOverlaps() {
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks()
            .filter(t => t.date === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        let adjustedCount = 0;
        let lastEndMinutes = 0;
        
        tasks.forEach(task => {
            const startParts = task.startTime.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const duration = task.duration || 30;
            
            if (startMinutes < lastEndMinutes) {
                // 有重叠，调整开始时间
                const newStartMinutes = lastEndMinutes;
                const newHour = Math.floor(newStartMinutes / 60);
                const newMin = newStartMinutes % 60;
                const newTime = newHour.toString().padStart(2, '0') + ':' + newMin.toString().padStart(2, '0');
                
                Storage.updateTask(task.id, { startTime: newTime });
                adjustedCount++;
                
                lastEndMinutes = newStartMinutes + duration;
            } else {
                lastEndMinutes = startMinutes + duration;
            }
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: adjustedCount > 0 
                ? `✅ 已自动调整 ${adjustedCount} 个重叠的任务`
                : `✅ 没有发现时间重叠的任务`
        };
    },
    
    // 优化时间安排
    optimizeSchedule() {
        this.resolveOverlaps();
        
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks()
            .filter(t => t.date === today && !t.completed)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (tasks.length === 0) {
            return { success: true, message: '✅ 今天没有待处理的任务' };
        }
        
        let currentMinutes = parseInt(tasks[0].startTime.split(':')[0]) * 60 + 
                            parseInt(tasks[0].startTime.split(':')[1]);
        
        tasks.forEach(task => {
            const newHour = Math.floor(currentMinutes / 60);
            const newMin = currentMinutes % 60;
            const newTime = newHour.toString().padStart(2, '0') + ':' + newMin.toString().padStart(2, '0');
            
            Storage.updateTask(task.id, { startTime: newTime });
            currentMinutes += (task.duration || 30);
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已优化今天的时间安排，共 ${tasks.length} 个任务`
        };
    },
    
    // 插入任务并顺延后续任务
    insertAndShift(match) {
        const period = match[1] || '';
        let hour = parseInt(match[2]);
        const minute = parseInt(match[3]) || 0;
        const taskTitle = match[5];
        
        if ((period === '下午' || period === '晚上') && hour < 12) {
            hour += 12;
        }
        
        const today = this.formatDate(new Date());
        const insertTime = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        const insertMinutes = hour * 60 + minute;
        
        const tasks = Storage.getTasks()
            .filter(t => t.date === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        const newTaskDuration = 30;
        
        let shiftedCount = 0;
        tasks.forEach(task => {
            const taskParts = task.startTime.split(':');
            const taskMinutes = parseInt(taskParts[0]) * 60 + parseInt(taskParts[1]);
            
            if (taskMinutes >= insertMinutes) {
                const newMinutes = taskMinutes + newTaskDuration;
                const newHour = Math.floor(newMinutes / 60);
                const newMin = newMinutes % 60;
                const newTime = newHour.toString().padStart(2, '0') + ':' + newMin.toString().padStart(2, '0');
                
                Storage.updateTask(task.id, { startTime: newTime });
                shiftedCount++;
            }
        });
        
        const newTask = {
            title: taskTitle,
            date: today,
            startTime: insertTime,
            duration: newTaskDuration,
            coins: 5,
            energyCost: 2,
            tags: []
        };
        
        Storage.addTask(newTask);
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已在 ${insertTime} 添加「${taskTitle}」，并顺延了 ${shiftedCount} 个后续任务`
        };
    },
    
    // 在指定时间添加任务
    addTaskAtTime(match) {
        const period = match[1] || '';
        let hour = parseInt(match[2]);
        const minute = parseInt(match[3]) || 0;
        const taskTitle = match[5] || match[4];
        
        if ((period === '下午' || period === '晚上') && hour < 12) {
            hour += 12;
        }
        
        const today = this.formatDate(new Date());
        const time = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        
        const newTask = {
            title: taskTitle,
            date: today,
            startTime: time,
            duration: 30,
            coins: 5,
            energyCost: 2,
            tags: []
        };
        
        Storage.addTask(newTask);
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已在 ${time} 添加任务「${taskTitle}」`
        };
    },
    
    // 延后所有任务
    delayAllTasks(match) {
        const amount = parseInt(match[5] || match[4] || match[3]);
        const unit = match[6] || match[5] || match[4];
        
        const delayMinutes = unit === '小时' ? amount * 60 : amount;
        const today = this.formatDate(new Date());
        
        const tasks = Storage.getTasks().filter(t => t.date === today);
        
        tasks.forEach(task => {
            const parts = task.startTime.split(':');
            const currentMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            const newMinutes = currentMinutes + delayMinutes;
            const newHour = Math.floor(newMinutes / 60) % 24;
            const newMin = newMinutes % 60;
            const newTime = newHour.toString().padStart(2, '0') + ':' + newMin.toString().padStart(2, '0');
            
            Storage.updateTask(task.id, { startTime: newTime });
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将今天所有 ${tasks.length} 个任务延后 ${amount}${unit}`
        };
    },
    
    // 提前所有任务
    advanceAllTasks(match) {
        const amount = parseInt(match[5] || match[4] || match[3]);
        const unit = match[6] || match[5] || match[4];
        
        const advanceMinutes = unit === '小时' ? amount * 60 : amount;
        const today = this.formatDate(new Date());
        
        const tasks = Storage.getTasks().filter(t => t.date === today);
        
        tasks.forEach(task => {
            const parts = task.startTime.split(':');
            const currentMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            const newMinutes = Math.max(0, currentMinutes - advanceMinutes);
            const newHour = Math.floor(newMinutes / 60);
            const newMin = newMinutes % 60;
            const newTime = newHour.toString().padStart(2, '0') + ':' + newMin.toString().padStart(2, '0');
            
            Storage.updateTask(task.id, { startTime: newTime });
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将今天所有 ${tasks.length} 个任务提前 ${amount}${unit}`
        };
    },
    
    // 复制今天的任务到指定日期
    copyTasksToDate(match) {
        const day = parseInt(match[4] || match[1]);
        
        const now = new Date();
        const today = this.formatDate(now);
        const targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks().filter(t => t.date === today);
        let copiedCount = 0;
        
        tasks.forEach(task => {
            const newTask = { ...task };
            delete newTask.id;
            newTask.date = targetDateStr;
            newTask.completed = false;
            Storage.addTask(newTask);
            copiedCount++;
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将今天的 ${copiedCount} 个任务复制到${day}号`
        };
    },
    
    // 复制特定任务到指定日期
    copyTaskToDate(match) {
        const taskName = match[2] || match[1];
        const day = parseInt(match[4] || match[3]);
        
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(taskName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        const newTask = { ...task };
        delete newTask.id;
        newTask.date = targetDateStr;
        newTask.completed = false;
        Storage.addTask(newTask);
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将「${task.title}」复制到${day}号`
        };
    },
    
    // 复制任务到相对日期
    copyTaskToRelativeDate(match) {
        const taskName = match[2] || match[1];
        const relativeDay = match[4] || match[3];
        
        const now = new Date();
        const daysToAdd = relativeDay === '明天' ? 1 : 2;
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(taskName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        const newTask = { ...task };
        delete newTask.id;
        newTask.date = targetDateStr;
        newTask.completed = false;
        Storage.addTask(newTask);
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将「${task.title}」复制到${relativeDay}`
        };
    },
    
    // 交换两个任务的时间
    swapTasks(match) {
        const taskName1 = match[1];
        const taskName2 = match[2];
        
        const tasks = Storage.getTasks();
        const task1 = tasks.find(t => t.title.includes(taskName1));
        const task2 = tasks.find(t => t.title.includes(taskName2));
        
        if (!task1) {
            return { success: false, message: `❌ 找不到任务「${taskName1}」` };
        }
        if (!task2) {
            return { success: false, message: `❌ 找不到任务「${taskName2}」` };
        }
        
        const time1 = task1.startTime;
        const time2 = task2.startTime;
        
        Storage.updateTask(task1.id, { startTime: time2 });
        Storage.updateTask(task2.id, { startTime: time1 });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已交换「${task1.title}」(${time1}) 和「${task2.title}」(${time2}) 的时间`
        };
    },
    
    // 完成任务
    completeTask(match) {
        const taskName = match[1];
        return this.completeTaskDirect(taskName);
    },
    
    // 直接完成任务
    completeTaskDirect(taskName) {
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        
        // 优先在今天的任务中查找
        let task = tasks.find(t => t.date === today && t.title.includes(taskName) && !t.completed);
        if (!task) {
            task = tasks.find(t => t.title.includes(taskName) && !t.completed);
        }
        
        if (!task) {
            return { success: false, message: `❌ 找不到未完成的任务「${taskName}」` };
        }
        
        Storage.updateTask(task.id, { completed: true, completedAt: new Date().toISOString() });
        
        // 触发任务完成事件
        document.dispatchEvent(new CustomEvent('taskCompleted', { 
            detail: { taskId: task.id, task: task } 
        }));
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
            
            // 给予金币奖励
            const coins = task.coins || 5;
            const state = Storage.getGameState();
            state.coins += coins;
            state.completedTasks = (state.completedTasks || 0) + 1;
            Storage.saveGameState(state);
            App.updateGameStatus();
        }
        
        return {
            success: true,
            message: `🎉 已完成任务「${task.title}」！获得 ${task.coins || 5} 金币`
        };
    },
    
    // 重命名任务
    renameTask(match) {
        const oldName = match[1];
        const newName = match[4];
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(oldName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${oldName}」` };
        }
        
        Storage.updateTask(task.id, { title: newName });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已将「${task.title}」重命名为「${newName}」`
        };
    },
    
    // 列出今天的任务
    listTodayTasksDirect() {
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks()
            .filter(t => t.date === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (tasks.length === 0) {
            return { success: true, message: '📅 今天没有任务' };
        }
        
        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.length - completed;
        
        let message = `📅 今天共有 ${tasks.length} 个任务（✅${completed} ⏳${pending}）：\n`;
        tasks.forEach(task => {
            const status = task.completed ? '✅' : '⏳';
            message += `${status} ${task.startTime} ${task.title}\n`;
        });
        
        return { success: true, message };
    },
    
    // 列出某天的任务
    listDayTasks(match) {
        const day = parseInt(match[1]);
        
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), day);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks()
            .filter(t => t.date === targetDateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (tasks.length === 0) {
            return { success: true, message: `📅 ${day}号没有任务` };
        }
        
        let message = `📅 ${day}号的任务（共${tasks.length}个）：\n`;
        tasks.forEach(task => {
            const status = task.completed ? '✅' : '⏳';
            message += `${status} ${task.startTime} ${task.title}\n`;
        });
        
        return { success: true, message };
    },
    
    // 列出相对日期的任务
    listRelativeDayTasks(match) {
        const relativeDay = match[1];
        const daysToAdd = relativeDay === '明天' ? 1 : 2;
        
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
        const targetDateStr = this.formatDate(targetDate);
        
        const tasks = Storage.getTasks()
            .filter(t => t.date === targetDateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (tasks.length === 0) {
            return { success: true, message: `📅 ${relativeDay}没有任务` };
        }
        
        let message = `📅 ${relativeDay}的任务（共${tasks.length}个）：\n`;
        tasks.forEach(task => {
            const status = task.completed ? '✅' : '⏳';
            message += `${status} ${task.startTime} ${task.title}\n`;
        });
        
        return { success: true, message };
    },
    
    // 列出相对日期的任务（直接调用）
    listRelativeDayTasksDirect(daysToAdd) {
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
        const targetDateStr = this.formatDate(targetDate);
        const dayName = daysToAdd === 1 ? '明天' : '后天';
        
        const tasks = Storage.getTasks()
            .filter(t => t.date === targetDateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (tasks.length === 0) {
            return { success: true, message: `📅 ${dayName}没有任务` };
        }
        
        let message = `📅 ${dayName}的任务（共${tasks.length}个）：\n`;
        tasks.forEach(task => {
            const status = task.completed ? '✅' : '⏳';
            message += `${status} ${task.startTime} ${task.title}\n`;
        });
        
        return { success: true, message };
    },
    
    // 通用列出任务
    listTasks(match) {
        const dayStr = match[1] || '今天';
        
        if (dayStr === '明天') {
            return this.listRelativeDayTasksDirect(1);
        } else if (dayStr === '后天') {
            return this.listRelativeDayTasksDirect(2);
        } else {
            return this.listTodayTasksDirect();
        }
    },
    
    // ==================== 工具方法 ====================
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // 获取更多自然语言指令示例
    getCommandExamples() {
        return [
            '🗑️ 删除任务：',
            '  • "删除洗澡" / "把洗澡删掉"',
            '  • "取消下午的会议"',
            '  • "删除3点之后的任务"',
            '  • "清空今天的任务"',
            '',
            '📅 移动任务：',
            '  • "把洗澡移到下午3点"',
            '  • "洗澡改到15:30"',
            '  • "把开会移到明天"',
            '',
            '⏰ 批量调整：',
            '  • "所有任务延后30分钟"',
            '  • "把今天任务都提前1小时"',
            '',
            '➕ 添加任务：',
            '  • "下午2点加一个开会"',
            '  • "在3点插入写报告并顺延"',
            '',
            '✅ 完成任务：',
            '  • "完成洗澡" / "洗澡完成了"',
            '',
            '📋 查询任务：',
            '  • "今天有什么任务"',
            '  • "明天有哪些任务"',
            '',
            '🔄 其他操作：',
            '  • "交换洗澡和吃饭的时间"',
            '  • "把洗澡复制到明天"',
            '  • "优化时间安排"',
            '  • "把洗澡改名为淋浴"'
        ];
    },
    
    // 显示帮助信息
    showHelp() {
        const examples = this.getCommandExamples();
        return {
            success: true,
            message: '📖 时间轴控制指令帮助：\n\n' + examples.join('\n')
        };
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    NaturalLanguageTimeline.init();
});

// 导出
window.NaturalLanguageTimeline = NaturalLanguageTimeline;

