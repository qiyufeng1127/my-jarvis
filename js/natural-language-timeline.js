// 自然语言时间轴控制模块
const NaturalLanguageTimeline = {
    // 支持的指令模式
    commandPatterns: [
        // 移动任务
        { pattern: /把(\d+)号的(所有)?任务移到(\d+)号/i, action: 'moveTasks' },
        { pattern: /把(.+)移到(\d+)点/i, action: 'moveTaskToTime' },
        { pattern: /把(.+)移到(\d+)号/i, action: 'moveTaskToDate' },
        
        // 批量删除
        { pattern: /把今天(下午|上午)?(\d+)点之后的任务(全部)?删(掉|除)/i, action: 'deleteTasksAfter' },
        { pattern: /删(掉|除)今天(下午|上午)?(\d+)点之后的(所有)?任务/i, action: 'deleteTasksAfter' },
        { pattern: /清空(\d+)号的(所有)?任务/i, action: 'clearDayTasks' },
        
        // 智能调整
        { pattern: /把(所有)?时间重叠的任务(自动)?分开/i, action: 'resolveOverlaps' },
        { pattern: /自动调整(所有)?重叠(的)?任务/i, action: 'resolveOverlaps' },
        { pattern: /优化今天的时间安排/i, action: 'optimizeSchedule' },
        
        // 插入与顺延
        { pattern: /在(下午|上午)?(\d+)点(帮我)?加一个[「"']?(.+?)[」"']?的?任务.*往后顺延/i, action: 'insertAndShift' },
        { pattern: /在(\d+):(\d+)(帮我)?插入[「"']?(.+?)[」"']?/i, action: 'insertTask' },
        { pattern: /(\d+)点(帮我)?加(一个)?[「"']?(.+?)[」"']?/i, action: 'addTaskAtTime' },
        
        // 批量修改
        { pattern: /把今天(所有)?任务(都)?延后(\d+)(分钟|小时)/i, action: 'delayAllTasks' },
        { pattern: /把今天(所有)?任务(都)?提前(\d+)(分钟|小时)/i, action: 'advanceAllTasks' },
        
        // 复制任务
        { pattern: /把今天的任务复制到(\d+)号/i, action: 'copyTasksToDate' },
        { pattern: /复制[「"']?(.+?)[」"']?到(\d+)号/i, action: 'copyTaskToDate' },
        
        // 交换任务
        { pattern: /交换[「"']?(.+?)[」"']?和[「"']?(.+?)[」"']?的时间/i, action: 'swapTasks' },
        
        // 设置提醒
        { pattern: /给[「"']?(.+?)[」"']?设置(\d+)分钟(的)?提醒/i, action: 'setReminder' },
        
        // 查询
        { pattern: /今天还有(多少|几个)任务/i, action: 'countTasks' },
        { pattern: /(\d+)号有(什么|哪些)任务/i, action: 'listDayTasks' }
    ],
    
    // 初始化
    init() {
        console.log('自然语言时间轴控制模块初始化完成');
    },
    
    // 解析并执行自然语言指令
    async parseAndExecute(text) {
        for (const cmd of this.commandPatterns) {
            const match = text.match(cmd.pattern);
            if (match) {
                console.log('匹配到指令:', cmd.action, match);
                return await this.executeAction(cmd.action, match, text);
            }
        }
        
        // 没有匹配到预设模式，返回null让AI处理
        return null;
    },
    
    // 执行指令
    async executeAction(action, match, originalText) {
        switch (action) {
            case 'moveTasks':
                return this.moveTasks(match);
            case 'moveTaskToTime':
                return this.moveTaskToTime(match);
            case 'moveTaskToDate':
                return this.moveTaskToDate(match);
            case 'deleteTasksAfter':
                return this.deleteTasksAfter(match, originalText);
            case 'clearDayTasks':
                return this.clearDayTasks(match);
            case 'resolveOverlaps':
                return this.resolveOverlaps();
            case 'optimizeSchedule':
                return this.optimizeSchedule();
            case 'insertAndShift':
                return this.insertAndShift(match);
            case 'insertTask':
                return this.insertTask(match);
            case 'addTaskAtTime':
                return this.addTaskAtTime(match);
            case 'delayAllTasks':
                return this.delayAllTasks(match);
            case 'advanceAllTasks':
                return this.advanceAllTasks(match);
            case 'copyTasksToDate':
                return this.copyTasksToDate(match);
            case 'copyTaskToDate':
                return this.copyTaskToDate(match);
            case 'swapTasks':
                return this.swapTasks(match);
            case 'setReminder':
                return this.setReminder(match);
            case 'countTasks':
                return this.countTasks();
            case 'listDayTasks':
                return this.listDayTasks(match);
            default:
                return null;
        }
    },
    
    // ==================== 具体指令实现 ====================
    
    // 移动某天的所有任务到另一天
    moveTasks(match) {
        const fromDay = parseInt(match[1]);
        const toDay = parseInt(match[3]);
        
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
        const hour = parseInt(match[2]);
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(taskName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        const newTime = hour.toString().padStart(2, '0') + ':00';
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
        const day = parseInt(match[2]);
        
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
    
    // 删除某时间之后的所有任务
    deleteTasksAfter(match, originalText) {
        let hour = parseInt(match[2] || match[3]);
        const period = match[1] || '';
        
        // 处理上午/下午
        if (period === '下午' && hour < 12) {
            hour += 12;
        }
        
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks();
        let deletedCount = 0;
        
        const tasksToDelete = tasks.filter(task => {
            if (task.date !== today) return false;
            const taskHour = parseInt(task.startTime.split(':')[0]);
            return taskHour >= hour;
        });
        
        tasksToDelete.forEach(task => {
            Storage.deleteTask(task.id);
            deletedCount++;
        });
        
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
        
        return {
            success: true,
            message: `✅ 已删除今天 ${hour}:00 之后的 ${deletedCount} 个任务`
        };
    },
    
    // 清空某天的所有任务
    clearDayTasks(match) {
        const day = parseInt(match[1]);
        
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
        // 先解决重叠
        this.resolveOverlaps();
        
        // 然后压缩空隙
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks()
            .filter(t => t.date === today && !t.completed)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (tasks.length === 0) {
            return { success: true, message: '✅ 今天没有待处理的任务' };
        }
        
        // 从第一个任务开始，紧凑排列
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
        const taskTitle = match[4];
        
        if (period === '下午' && hour < 12) {
            hour += 12;
        }
        
        const today = this.formatDate(new Date());
        const insertTime = hour.toString().padStart(2, '0') + ':00';
        const insertMinutes = hour * 60;
        
        // 获取今天的任务
        const tasks = Storage.getTasks()
            .filter(t => t.date === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // 新任务默认30分钟
        const newTaskDuration = 30;
        
        // 顺延插入时间之后的所有任务
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
        
        // 添加新任务
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
    
    // 在指定时间插入任务
    insertTask(match) {
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        const taskTitle = match[4];
        
        const today = this.formatDate(new Date());
        const insertTime = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        
        const newTask = {
            title: taskTitle,
            date: today,
            startTime: insertTime,
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
            message: `✅ 已在 ${insertTime} 添加任务「${taskTitle}」`
        };
    },
    
    // 在指定时间添加任务
    addTaskAtTime(match) {
        const hour = parseInt(match[1]);
        const taskTitle = match[4];
        
        const today = this.formatDate(new Date());
        const time = hour.toString().padStart(2, '0') + ':00';
        
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
        const amount = parseInt(match[3]);
        const unit = match[4];
        
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
            message: `✅ 已将今天所有任务延后 ${amount}${unit}`
        };
    },
    
    // 提前所有任务
    advanceAllTasks(match) {
        const amount = parseInt(match[3]);
        const unit = match[4];
        
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
            message: `✅ 已将今天所有任务提前 ${amount}${unit}`
        };
    },
    
    // 复制今天的任务到指定日期
    copyTasksToDate(match) {
        const day = parseInt(match[1]);
        
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
        const taskName = match[1];
        const day = parseInt(match[2]);
        
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
    
    // 交换两个任务的时间
    swapTasks(match) {
        const taskName1 = match[1];
        const taskName2 = match[2];
        
        const tasks = Storage.getTasks();
        const task1 = tasks.find(t => t.title.includes(taskName1));
        const task2 = tasks.find(t => t.title.includes(taskName2));
        
        if (!task1 || !task2) {
            return { success: false, message: `❌ 找不到指定的任务` };
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
            message: `✅ 已交换「${task1.title}」和「${task2.title}」的时间`
        };
    },
    
    // 设置提醒
    setReminder(match) {
        const taskName = match[1];
        const minutes = parseInt(match[2]);
        
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.title.includes(taskName));
        
        if (!task) {
            return { success: false, message: `❌ 找不到任务「${taskName}」` };
        }
        
        Storage.updateTask(task.id, { reminderMinutes: minutes });
        
        return {
            success: true,
            message: `✅ 已为「${task.title}」设置 ${minutes} 分钟提前提醒`
        };
    },
    
    // 统计今天的任务数量
    countTasks() {
        const today = this.formatDate(new Date());
        const tasks = Storage.getTasks().filter(t => t.date === today);
        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.length - completed;
        
        return {
            success: true,
            message: `📊 今天共有 ${tasks.length} 个任务\n✅ 已完成: ${completed}\n⏳ 待完成: ${pending}`
        };
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
        
        let message = `📅 ${day}号的任务：\n`;
        tasks.forEach(task => {
            const status = task.completed ? '✅' : '⏳';
            message += `${status} ${task.startTime} ${task.title}\n`;
        });
        
        return { success: true, message };
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
            '📅 移动任务：',
            '  • "把15号的所有任务移到14号"',
            '  • "把洗澡移到3点"',
            '',
            '🗑️ 批量删除：',
            '  • "把今天下午2点之后的任务全部删掉"',
            '  • "清空20号的所有任务"',
            '',
            '⚡ 智能调整：',
            '  • "把所有时间重叠的任务自动分开"',
            '  • "优化今天的时间安排"',
            '',
            '➕ 插入任务：',
            '  • "在下午2点帮我加一个写报告的任务，把后面的任务都往后顺延"',
            '  • "3点加一个开会"',
            '',
            '⏰ 批量调整：',
            '  • "把今天所有任务都延后30分钟"',
            '  • "把今天所有任务都提前1小时"',
            '',
            '📋 复制任务：',
            '  • "把今天的任务复制到20号"',
            '  • "复制洗澡到明天"',
            '',
            '🔄 交换时间：',
            '  • "交换洗澡和吃饭的时间"',
            '',
            '📊 查询：',
            '  • "今天还有多少任务"',
            '  • "15号有什么任务"'
        ];
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    NaturalLanguageTimeline.init();
});

// 导出
window.NaturalLanguageTimeline = NaturalLanguageTimeline;

