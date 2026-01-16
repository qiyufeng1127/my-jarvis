// ============================================================
// 指令-动作映射层 v4.0
// 将自然语言指令映射到具体动作
// ============================================================

const CommandMapper = {
    // 指令模式库
    patterns: [
        // ==================== 计时器/专注 ====================
        {
            patterns: [
                /开始(\d+)分钟?(的)?专注/,
                /专注(\d+)分钟/,
                /(\d+)分钟(的)?倒计时/,
                /开始倒计时(\d+)分钟/,
                /番茄钟(\d+)分钟/
            ],
            action: 'start_timer',
            extract: (match) => ({ duration: parseInt(match[1]) }),
            reply: (params) => `好的，开始${params.duration}分钟专注`
        },
        {
            patterns: [
                /开始专注/,
                /开始倒计时/,
                /番茄钟/
            ],
            action: 'start_timer',
            extract: () => ({ duration: 25 }),
            reply: () => '好的，开始25分钟专注'
        },
        
        // ==================== 任务完成 ====================
        {
            patterns: [
                /我(刚)?完成了(.+)/,
                /(.+)已经完成了/,
                /(.+)做完了/,
                /完成(.+)/
            ],
            action: 'complete_task',
            extract: (match) => ({ taskName: match[2] || match[1] }),
            reply: (params) => `好的，正在标记任务完成`
        },
        {
            patterns: [
                /任务完成/,
                /完成了/,
                /做完了/,
                /搞定了/
            ],
            action: 'complete_task',
            extract: () => ({}),
            reply: () => '好的，正在标记当前任务完成'
        },
        
        // ==================== 添加任务 ====================
        {
            patterns: [
                /我?(\d+)点要(.+)/,
                /(\d+)点(有|安排)?(.+)/,
                /(\d+):(\d+)(.+)/
            ],
            action: 'add_task',
            extract: (match) => {
                if (match[2] && match[3]) {
                    // HH:MM格式
                    return {
                        startTime: match[1].padStart(2, '0') + ':' + match[2].padStart(2, '0'),
                        title: match[3].trim()
                    };
                }
                return {
                    startTime: match[1].padStart(2, '0') + ':00',
                    title: (match[3] || match[2]).trim()
                };
            },
            reply: (params) => `好的，已添加${params.startTime}的任务：${params.title}`
        },
        {
            patterns: [
                /添加任务(.+)/,
                /新建任务(.+)/,
                /创建任务(.+)/
            ],
            action: 'add_task',
            extract: (match) => ({ title: match[1].trim() }),
            reply: (params) => `好的，已添加任务：${params.title}`
        },
        
        // ==================== 收入记录 ====================
        {
            patterns: [
                /收入(\d+)(元|块|rmb)?(.+)?/i,
                /赚了(\d+)(元|块|rmb)?(.+)?/i,
                /到账(\d+)(元|块|rmb)?(.+)?/i,
                /卖出.+收入(\d+)(元|块)?/,
                /(.+)收入(\d+)(元|块)?/
            ],
            action: 'add_income',
            extract: (match) => {
                // 处理不同匹配模式
                let amount, description;
                if (match[2] && /\d+/.test(match[2])) {
                    amount = parseInt(match[2]);
                    description = match[1] || match[3] || '';
                } else {
                    amount = parseInt(match[1]);
                    description = match[3] || '';
                }
                return { amount, description: description.trim() };
            },
            reply: (params) => `好的，已记录收入${params.amount}元`
        },
        {
            patterns: [
                /今天卖出了?(.+)[,，]?收入(\d+)(元|块)?/,
                /(.+)卖了(\d+)(元|块)?/
            ],
            action: 'add_income',
            extract: (match) => ({
                amount: parseInt(match[2]),
                description: match[1].trim()
            }),
            reply: (params) => `好的，已记录${params.description}收入${params.amount}元`
        },
        
        // ==================== 支出记录 ====================
        {
            patterns: [
                /花了(\d+)(元|块)?(.+)?/,
                /支出(\d+)(元|块)?(.+)?/,
                /买了?(.+)(\d+)(元|块)?/
            ],
            action: 'add_expense',
            extract: (match) => {
                if (/\d+/.test(match[2])) {
                    return {
                        amount: parseInt(match[2]),
                        description: match[1] || match[3] || ''
                    };
                }
                return {
                    amount: parseInt(match[1]),
                    description: match[3] || ''
                };
            },
            reply: (params) => `好的，已记录支出${params.amount}元`
        },
        
        // ==================== 状态查询 ====================
        {
            patterns: [
                /我(有)?多少金币/,
                /金币余额/,
                /查询金币/
            ],
            action: 'query_status',
            extract: () => ({ type: 'coins' }),
            reply: () => null // 由执行函数回复
        },
        {
            patterns: [
                /今天(赚了)?多少(钱|收入)/,
                /今日收入/,
                /查询收入/
            ],
            action: 'query_status',
            extract: () => ({ type: 'finance' }),
            reply: () => null
        },
        {
            patterns: [
                /今天(有)?多少任务/,
                /任务(完成)?情况/,
                /查询任务/
            ],
            action: 'query_status',
            extract: () => ({ type: 'tasks' }),
            reply: () => null
        },
        {
            patterns: [
                /我(的)?能量/,
                /能量(值)?多少/,
                /查询能量/
            ],
            action: 'query_status',
            extract: () => ({ type: 'energy' }),
            reply: () => null
        },
        {
            patterns: [
                /当前状态/,
                /我的状态/,
                /查询状态/
            ],
            action: 'query_status',
            extract: () => ({ type: 'all' }),
            reply: () => null
        },
        
        // ==================== 监控控制 ====================
        {
            patterns: [
                /开启监控/,
                /启动监控/,
                /打开监控/
            ],
            action: 'control_monitor',
            extract: () => ({ action: 'start' }),
            reply: () => '好的，监控已开启'
        },
        {
            patterns: [
                /关闭监控/,
                /停止监控/,
                /暂停监控/
            ],
            action: 'control_monitor',
            extract: () => ({ action: 'stop' }),
            reply: () => '好的，监控已关闭'
        },
        {
            patterns: [
                /我(已经)?开始了/,
                /已启动/,
                /开始执行/
            ],
            action: 'control_monitor',
            extract: () => ({ action: 'complete' }),
            reply: () => '太棒了！'
        },
        
        // ==================== 通用确认 ====================
        {
            patterns: [
                /^(好的?|确认|是的?|对|可以|行|没问题)$/
            ],
            action: 'confirm',
            extract: () => ({}),
            reply: () => '好的'
        },
        {
            patterns: [
                /^(不|取消|算了|不要|停)$/
            ],
            action: 'cancel',
            extract: () => ({}),
            reply: () => '好的，已取消'
        }
    ],
    
    // 匹配指令
    matchCommand(text) {
        const normalizedText = text.toLowerCase().trim();
        
        for (const pattern of this.patterns) {
            for (const regex of pattern.patterns) {
                const match = normalizedText.match(regex);
                if (match) {
                    const params = pattern.extract(match);
                    const reply = pattern.reply ? pattern.reply(params) : null;
                    
                    return {
                        matched: true,
                        action: pattern.action,
                        params: params,
                        reply: reply
                    };
                }
            }
        }
        
        return { matched: false };
    },
    
    // 添加自定义指令模式
    addPattern(config) {
        this.patterns.push(config);
    },
    
    // 获取所有支持的指令示例
    getExamples() {
        return [
            '开始25分钟专注',
            '我3点要开会',
            '完成写周报任务',
            '今天卖出一套插画，收入1500元',
            '花了50块买咖啡',
            '我有多少金币',
            '今天任务情况',
            '开启监控',
            '我已经开始了'
        ];
    }
};

// 导出
window.CommandMapper = CommandMapper;

