// 时间轴控制器模块 - 处理自然语言对时间轴的操作
const TimelineController = {
    
    // 初始化
    init() {
        console.log('时间轴控制器模块初始化完成');
    },
    
    // 解析并执行时间轴操作
    async parseAndExecute(input) {
        const prompts = Storage.getPrompts();
        const timelineControlPrompt = prompts.timelineControl;
        
        if (!timelineControlPrompt) {
            console.warn('时间轴控制提示词未配置');
            return null;
        }
        
        // 构建上下文
        const now = new Date();
        const today = this.formatDate(now);
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        // 获取今天的任务列表作为上下文
        const tasks = Storage.getTasks();
        const todayTasks = tasks.filter(t => t.date === today);
        const taskListStr = todayTasks.map(t => 
            `- ${t.title} (${t.startTime}, ${t.duration || 30}分钟)`
        ).join('\n');
        
        const contextStr = `当前时间：${now.toLocaleString('zh-CN')}
今天日期：${today}
当前时间：${currentTime}

今天的任务列表：
${taskListStr || '（暂无任务）'}

用户输入：${input}`;
        
        try {
            const response = await AIService.chat([
                { role: 'user', content: contextStr }
            ], timelineControlPrompt);
            
            // 解析JSON响应
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                
                // 执行操作
                await this.executeOperation(result);
                
                return result;
            }
            
            return { reply: response, operation: 'unknown' };
        } catch (e) {
            console.error('时间轴控制解析失败:', e);
            return { 
                reply: '抱歉，我没能理解您的指令，请换个说法试试~', 
                operation: 'error',
                error: e.message 
            };
        }
    },
    
    // 执行时间轴操作
    async executeOperation(result) {
        const operation = result.operation;
        const params = result.parameters || {};
        const tasks = result.tasks || [];
        
        console.log('执行时间轴操作:', operation, params);
        
        switch (operation) {
            case 'add_task':
                this.executeAddTask(tasks, params);
                break;
                
            case 'delete_task':
                this.executeDeleteTask(params);
                break;
                
            case 'move_task':
                this.executeMoveTask(params);
                break;
                
            case 'update_task':
                this.executeUpdateTask(tasks, params);
                break;
                
            case 'reschedule':
                this.executeReschedule(params);
                break;
                
            case 'insert_and_shift':
                this.executeInsertAndShift(tasks, params);
                break;
                
            case 'resolve_conflict':
                this.executeResolveConflict(params);
                break;
                
            case 'add_memory':
                // 情绪记录由主流程处理
                break;
                
            default:
                console.log('未知操作类型:', operation);
        }
        
        // 刷新时间轴
        if (typeof App !== 'undefined') {
            App.loadTimeline();
        }
    },
    
    // 添加任务
    executeAddTask(tasks, params) {
        if (!tasks || tasks.length === 0) return;
        
        tasks.forEach(task => {
            // 确保必要字段
            const newTask = {
                title: task.title,
                date: task.date || this.formatDate(new Date()),
                startTime: task.startTime || '09:00',
                duration: task.duration || 30,
                endTime: task.endTime || this.addMinutes(task.startTime || '09:00', task.duration || 30),
                type: task.type || '日常',
                coins: task.coins || 5,
                energyCost: task.energyCost || 2,
                tags: [task.type || '日常'],
                completed: false
            };
            
            Storage.addTask(newTask);
            console.log('添加任务:', newTask.title);
        });
    },
    
    // 删除任务
    executeDeleteTask(params) {
        const allTasks = Storage.getTasks();
        let tasksToDelete = [];
        
        // 根据条件筛选要删除的任务
        if (params.target_date) {
            tasksToDelete = allTasks.filter(t => t.date === params.target_date);
        }
        
        if (params.from_time) {
            tasksToDelete = tasksToDelete.filter(t => t.startTime >= params.from_time);
        }
        
        if (params.to_time) {
            tasksToDelete = tasksToDelete.filter(t => t.startTime <= params.to_time);
        }
        
        if (params.task_title) {
            tasksToDelete = tasksToDelete.filter(t => 
                t.title.includes(params.task_title)
            );
        }
        
        // 执行删除
        tasksToDelete.forEach(task => {
            Storage.deleteTask(task.id);
            console.log('删除任务:', task.title);
        });
        
        return tasksToDelete.length;
    },
    
    // 移动任务
    executeMoveTask(params) {
        const allTasks = Storage.getTasks();
        
        // 查找目标任务
        let targetTask = null;
        
        if (params.task_title) {
            targetTask = allTasks.find(t => t.title.includes(params.task_title));
        }
        
        if (params.original_time && !targetTask) {
            const today = this.formatDate(new Date());
            targetTask = allTasks.find(t => 
                t.startTime === params.original_time && 
                (t.date === params.original_date || t.date === today)
            );
        }
        
        if (targetTask) {
            const updates = {};
            
            if (params.new_time) {
                updates.startTime = params.new_time;
                updates.endTime = this.addMinutes(params.new_time, targetTask.duration || 30);
            }
            
            if (params.new_date) {
                updates.date = params.new_date;
            }
            
            Storage.updateTask(targetTask.id, updates);
            console.log('移动任务:', targetTask.title, '到', params.new_time || params.new_date);
        }
    },
    
    // 更新任务
    executeUpdateTask(tasks, params) {
        if (!tasks || tasks.length === 0) return;
        
        const allTasks = Storage.getTasks();
        
        tasks.forEach(taskUpdate => {
            // 查找要更新的任务
            let targetTask = null;
            
            if (taskUpdate.id) {
                targetTask = allTasks.find(t => t.id === taskUpdate.id);
            } else if (taskUpdate.title) {
                targetTask = allTasks.find(t => t.title.includes(taskUpdate.title));
            }
            
            if (targetTask) {
                const updates = {};
                if (taskUpdate.newTitle) updates.title = taskUpdate.newTitle;
                if (taskUpdate.duration) {
                    updates.duration = taskUpdate.duration;
                    updates.endTime = this.addMinutes(targetTask.startTime, taskUpdate.duration);
                }
                if (taskUpdate.startTime) {
                    updates.startTime = taskUpdate.startTime;
                    updates.endTime = this.addMinutes(taskUpdate.startTime, targetTask.duration || 30);
                }
                
                Storage.updateTask(targetTask.id, updates);
                console.log('更新任务:', targetTask.title);
            }
        });
    },
    
    // 顺延任务
    executeReschedule(params) {
        const allTasks = Storage.getTasks();
        const targetDate = params.date || this.formatDate(new Date());
        const afterTime = params.after_time || '00:00';
        const shiftMinutes = params.shift_minutes || 30;
        
        // 筛选需要顺延的任务
        const tasksToShift = allTasks.filter(t => 
            t.date === targetDate && t.startTime >= afterTime
        ).sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // 执行顺延
        tasksToShift.forEach(task => {
            const newStartTime = this.addMinutes(task.startTime, shiftMinutes);
            const newEndTime = this.addMinutes(task.endTime || this.addMinutes(task.startTime, task.duration || 30), shiftMinutes);
            
            Storage.updateTask(task.id, {
                startTime: newStartTime,
                endTime: newEndTime
            });
            console.log('顺延任务:', task.title, '从', task.startTime, '到', newStartTime);
        });
        
        return tasksToShift.length;
    },
    
    // 插入任务并顺延后续
    executeInsertAndShift(tasks, params) {
        if (!tasks || tasks.length === 0) return;
        
        const insertTask = tasks[0];
        const insertTime = params.insert_at || insertTask.startTime;
        const targetDate = insertTask.date || this.formatDate(new Date());
        
        // 先顺延后续任务
        if (params.shift_after) {
            const shiftMinutes = insertTask.duration || params.shift_minutes || 30;
            this.executeReschedule({
                date: targetDate,
                after_time: insertTime,
                shift_minutes: shiftMinutes
            });
        }
        
        // 再添加新任务
        this.executeAddTask(tasks, params);
    },
    
    // 解决时间冲突
    executeResolveConflict(params) {
        const targetDate = params.date || this.formatDate(new Date());
        const gapMinutes = params.gap_minutes || 5;
        const allTasks = Storage.getTasks();
        
        // 获取目标日期的任务并排序
        const dayTasks = allTasks.filter(t => t.date === targetDate && !t.completed)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (dayTasks.length < 2) return 0;
        
        let adjustedCount = 0;
        let currentEndTime = null;
        
        dayTasks.forEach((task, index) => {
            if (index === 0) {
                currentEndTime = task.endTime || this.addMinutes(task.startTime, task.duration || 30);
                return;
            }
            
            const taskStartMinutes = this.timeToMinutes(task.startTime);
            const currentEndMinutes = this.timeToMinutes(currentEndTime);
            
            // 检查是否有重叠
            if (taskStartMinutes < currentEndMinutes + gapMinutes) {
                // 需要调整
                const newStartTime = this.addMinutes(currentEndTime, gapMinutes);
                const newEndTime = this.addMinutes(newStartTime, task.duration || 30);
                
                Storage.updateTask(task.id, {
                    startTime: newStartTime,
                    endTime: newEndTime
                });
                
                currentEndTime = newEndTime;
                adjustedCount++;
                console.log('调整冲突任务:', task.title, '新时间:', newStartTime);
            } else {
                currentEndTime = task.endTime || this.addMinutes(task.startTime, task.duration || 30);
            }
        });
        
        return adjustedCount;
    },
    
    // 检测是否是时间轴控制指令
    isTimelineControlCommand(input) {
        const controlKeywords = [
            // 删除相关
            '删除', '删掉', '去掉', '取消', '清除', '移除', '清空',
            // 移动相关
            '移到', '改到', '调整到', '换到', '移动', '调到',
            // 顺延相关
            '顺延', '推迟', '延后', '往后', '后移', '延迟',
            // 提前相关
            '提前', '往前', '前移',
            // 插入相关
            '插入', '加入', '中间加',
            // 冲突相关
            '重叠', '冲突', '分开', '排开',
            // 批量操作
            '所有任务', '全部任务', '今天的任务', '明天的任务',
            // 复制交换
            '复制到', '交换'
        ];
        
        return controlKeywords.some(keyword => input.includes(keyword));
    },
    
    // 工具方法：格式化日期
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + '-' + 
               (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               d.getDate().toString().padStart(2, '0');
    },
    
    // 工具方法：时间加分钟
    addMinutes(timeStr, minutes) {
        const parts = timeStr.split(':');
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1] || 0);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return newH.toString().padStart(2, '0') + ':' + newM.toString().padStart(2, '0');
    },
    
    // 工具方法：时间转分钟
    timeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    TimelineController.init();
});

// 导出
window.TimelineController = TimelineController;

