// AI服务模块 - DeepSeek API集成
const AIService = {
    baseUrl: 'https://api.deepseek.com/v1',
    
    // 检查API连接状态
    async checkConnection() {
        const apiKey = Storage.getApiKey();
        if (!apiKey) return false;
        
        try {
            const response = await fetch(this.baseUrl + '/models', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + apiKey
                }
            });
            return response.ok;
        } catch (e) {
            console.error('API connection check failed:', e);
            return false;
        }
    },

    // 发送聊天请求
    async chat(messages, systemPrompt) {
        const apiKey = Storage.getApiKey();
        if (!apiKey) {
            throw new Error('请先设置API Key');
        }

        const allMessages = [];
        if (systemPrompt) {
            allMessages.push({ role: 'system', content: systemPrompt });
        }
        allMessages.push.apply(allMessages, messages);

        try {
            const response = await fetch(this.baseUrl + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: allMessages,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error('API请求失败: ' + response.status);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (e) {
            console.error('AI chat error:', e);
            throw e;
        }
    },

    // 解析用户输入，提取任务和情绪（支持多任务和上下文）
    async parseUserInput(input, contextInfo) {
        const prompts = Storage.getPrompts();
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 基础上下文
        let contextStr = `当前时间：${now.toLocaleString('zh-CN')}
今天日期：${this.formatDate(now)}
明天日期：${this.formatDate(tomorrow)}
当前精力值：${Storage.getGameState().energy}/10`;
        
        // 添加AI记忆库的个性化上下文
        if (typeof AIMemory !== 'undefined') {
            const personalContext = AIMemory.getPersonalizedContext();
            if (personalContext) {
                contextStr += `\n\n【用户个人信息】\n${personalContext}`;
            }
        }
        
        // 添加AI副驾驶提供的上下文
        if (contextInfo) {
            if (contextInfo.userWorkTypes && contextInfo.userWorkTypes.length > 0) {
                contextStr += `\n用户主要工作类型：${contextInfo.userWorkTypes.join('、')}`;
            }
            if (contextInfo.peakHours && contextInfo.peakHours.length > 0) {
                contextStr += `\n用户高效时间段：${contextInfo.peakHours.map(p => p.start + '-' + p.end).join('、')}`;
            }
            if (contextInfo.recentTasks && contextInfo.recentTasks.length > 0) {
                contextStr += `\n最近提到的任务：${contextInfo.recentTasks.map(t => t.title).join('、')}`;
            }
            if (contextInfo.todayTasks && contextInfo.todayTasks.length > 0) {
                const pending = contextInfo.todayTasks.filter(t => !t.completed);
                if (pending.length > 0) {
                    contextStr += `\n今日待完成任务：${pending.map(t => t.title).join('、')}`;
                }
            }
        }
        
        // 获取秘书名字
        const secretaryName = typeof AIMemory !== 'undefined' ? AIMemory.getSecretaryName() : 'KiiKii';
        
        // 增强的系统提示
        const enhancedPrompt = prompts.taskParse + `

【AI秘书身份】
你是用户的专属AI秘书${secretaryName}，要用温暖、亲切的语气回应。
根据用户的个人信息，给出个性化的回应和建议。

【上下文理解增强】
1. 如果用户说"那个"、"这个"等指代词，请根据"最近提到的任务"推断具体指什么
2. 如果用户只说时间（如"明天"、"下午"）没说具体几点，请根据"用户高效时间段"安排
3. 如果用户提到的任务类型在"用户主要工作类型"中，请自动补充相关信息
4. 对于摄影类任务，默认时长2-4小时，价值500-2000元
5. 对于插画类任务，默认时长1-3小时，价值200-1000元
6. 对于运营类任务，默认时长30-60分钟，价值50-200元
7. 请主动为任务估算价值(value字段)，单位为元
8. 如果用户表达情绪，要给予共情和支持
9. 如果用户提到新的个人信息，在回复中自然地确认`;
        
        try {
            const response = await this.chat([
                { role: 'user', content: contextStr + '\n\n用户输入：' + input }
            ], enhancedPrompt);
            
            // 尝试解析JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                
                // 处理多任务情况
                if (result.tasks && result.tasks.length > 0) {
                    // 为每个任务计算结束时间
                    result.tasks.forEach(function(task) {
                        if (task.startTime && task.duration) {
                            task.endTime = AIService.addMinutesToTime(task.startTime, task.duration);
                        }
                        // 确保有默认值
                        task.coins = task.coins || 5;
                        task.energyCost = task.energyCost || 2;
                        task.tags = task.tags || [task.type || '任务'];
                        // 确保有价值估算
                        task.value = task.value || AIService.estimateTaskValue(task);
                        
                        // 智能推荐步数验证
                        if (!task.verificationType) {
                            const stepInfo = AIService.suggestStepVerification(task);
                            if (stepInfo.suitable) {
                                task.verificationType = 'steps';
                                task.targetSteps = stepInfo.steps;
                                task.verificationReason = stepInfo.reason;
                            }
                        }
                    });
                }
                
                // 处理记忆/情绪
                if (result.memories && result.memories.length > 0) {
                    result.memories.forEach(function(memory) {
                        // 转换emotion格式
                        if (memory.emotion === 'negative') memory.emotion = 'anxious';
                        if (memory.emotion === 'positive') memory.emotion = 'happy';
                        if (memory.emotion === 'neutral') memory.emotion = 'calm';
                    });
                }
                
                return result;
            }
            return { reply: response };
        } catch (e) {
            console.error('Parse input error:', e);
            return { reply: '抱歉，我暂时无法理解，请稍后再试~', error: true };
        }
    },
    
    // 智能推荐步数验证
    suggestStepVerification(task) {
        const title = (task.title || '').toLowerCase();
        
        // 步数验证关键词和对应步数
        const stepKeywords = {
            // 家务类
            '打扫': { steps: 1000, reason: '打扫需要来回走动' },
            '清洁': { steps: 800, reason: '清洁工作需要活动' },
            '整理': { steps: 500, reason: '整理物品需要走动' },
            '收拾': { steps: 500, reason: '收拾房间需要活动' },
            '拖地': { steps: 800, reason: '拖地需要来回走动' },
            '扫地': { steps: 600, reason: '扫地需要走动' },
            '吸尘': { steps: 600, reason: '吸尘需要走动' },
            '擦': { steps: 400, reason: '擦拭需要活动' },
            '洗碗': { steps: 300, reason: '洗碗需要站立活动' },
            '洗衣': { steps: 400, reason: '洗衣需要来回走动' },
            '做饭': { steps: 600, reason: '做饭需要在厨房活动' },
            '做菜': { steps: 500, reason: '做菜需要活动' },
            '厨房': { steps: 800, reason: '厨房工作需要走动' },
            
            // 运动类
            '运动': { steps: 2000, reason: '运动任务' },
            '散步': { steps: 3000, reason: '散步任务' },
            '跑步': { steps: 5000, reason: '跑步任务' },
            '健身': { steps: 1500, reason: '健身需要活动' },
            '锻炼': { steps: 1500, reason: '锻炼需要活动' },
            '走': { steps: 2000, reason: '步行任务' },
            '跑': { steps: 3000, reason: '跑步任务' },
            '遛狗': { steps: 2500, reason: '遛狗需要走动' },
            
            // 外出类
            '购物': { steps: 2000, reason: '购物需要走动' },
            '逛': { steps: 2000, reason: '逛街需要走动' },
            '买': { steps: 1000, reason: '外出购买需要走动' },
            '取': { steps: 500, reason: '取东西需要走动' },
            '寄': { steps: 500, reason: '寄东西需要外出' },
        };
        
        // 检查是否匹配关键词
        for (const [keyword, info] of Object.entries(stepKeywords)) {
            if (title.includes(keyword)) {
                return {
                    suitable: true,
                    steps: info.steps,
                    reason: info.reason
                };
            }
        }
        
        // 检查任务类型标签
        const tags = task.tags || [];
        const activityTags = ['运动', '健身', '家务', '清洁', '外出'];
        for (const tag of tags) {
            if (activityTags.some(t => tag.includes(t))) {
                return {
                    suitable: true,
                    steps: 500,
                    reason: '活动类任务'
                };
            }
        }
        
        return { suitable: false };
    },
    
    // 估算任务价值
    estimateTaskValue(task) {
        const title = (task.title || '').toLowerCase();
        const duration = task.duration || 60;
        
        // 根据任务类型估算
        if (title.includes('摄影') || title.includes('拍照') || title.includes('拍摄')) {
            return Math.round(duration * 8); // 约480元/小时
        }
        if (title.includes('插画') || title.includes('画') || title.includes('设计')) {
            return Math.round(duration * 5); // 约300元/小时
        }
        if (title.includes('运营') || title.includes('小红书') || title.includes('发布')) {
            return Math.round(duration * 2); // 约120元/小时
        }
        if (title.includes('写') || title.includes('文案') || title.includes('文章')) {
            return Math.round(duration * 3); // 约180元/小时
        }
        
        // 默认估算
        return Math.round(duration * 1.5);
    },

    // 任务拆解（增强版）
    async breakdownTask(task) {
        const prompts = Storage.getPrompts();
        const prompt = prompts.taskBreakdown
            .replace('[任务名称]', task.title)
            .replace('[任务描述]', task.notes || task.title)
            .replace('[总分钟数]', task.duration || 30);
        
        try {
            const response = await this.chat([
                { role: 'user', content: '请拆解这个任务：' + task.title }
            ], prompt);
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                if (result.steps) {
                    return result.steps.map(function(step) {
                        return {
                            title: step.title,
                            duration: step.duration || 10,
                            difficulty: step.difficulty || 2,
                            tip: step.tip || ''
                        };
                    });
                }
            }
            return [];
        } catch (e) {
            console.error('Breakdown task error:', e);
            return [];
        }
    },

    // 间隙活动建议（增强版，返回3个选项）
    async suggestGapActivity(beforeTask, afterTask, gapMinutes) {
        const prompts = Storage.getPrompts();
        const gameState = Storage.getGameState();
        
        const prompt = prompts.gapSuggestion
            .replace('[间隔]', gapMinutes)
            .replace('[任务A]', beforeTask ? beforeTask.title : '无')
            .replace('[任务B]', afterTask ? afterTask.title : '无')
            .replace('[精力值]', gameState.energy);
        
        try {
            const response = await this.chat([
                { role: 'user', content: `间隙时间：${gapMinutes}分钟\n前任务：${beforeTask ? beforeTask.title : '无'}\n后任务：${afterTask ? afterTask.title : '无'}` }
            ], prompt);
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                if (result.suggestions && result.suggestions.length > 0) {
                    // 返回第一个建议作为默认，但保留所有建议
                    const suggestion = result.suggestions[0];
                    return {
                        title: suggestion.title,
                        duration: suggestion.duration || gapMinutes,
                        reason: suggestion.reason,
                        energyEffect: suggestion.energyEffect || 0,
                        type: suggestion.type,
                        allSuggestions: result.suggestions
                    };
                }
            }
            return { 
                title: '休息一下', 
                duration: gapMinutes, 
                reason: '适当休息有助于恢复精力',
                energyEffect: 2,
                type: 'rest'
            };
        } catch (e) {
            console.error('Suggest gap activity error:', e);
            return { 
                title: '休息一下', 
                duration: gapMinutes, 
                reason: '适当休息有助于恢复精力',
                energyEffect: 2,
                type: 'rest'
            };
        }
    },

    // 情绪分析（增强版）
    async analyzeEmotion(text) {
        const prompts = Storage.getPrompts();
        const prompt = prompts.emotionAnalysis.replace('[用户输入]', text);
        
        try {
            const response = await this.chat([
                { role: 'user', content: text }
            ], prompt);
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    type: result.emotion || 'calm',
                    intensity: result.intensity || 0.5,
                    causes: result.causes || [],
                    suggestion: result.suggestion || '',
                    emoji: result.emoji || '😐'
                };
            }
            
            // 简单关键词匹配作为后备
            const emotions = ['happy', 'calm', 'anxious', 'sad', 'angry'];
            const found = emotions.find(function(e) {
                return response.toLowerCase().includes(e);
            });
            return { type: found || 'calm', intensity: 0.5 };
        } catch (e) {
            console.error('Analyze emotion error:', e);
            return { type: 'calm', intensity: 0.5 };
        }
    },

    // 任务金币分配
    async allocateCoins(task) {
        const prompts = Storage.getPrompts();
        const prompt = prompts.coinAllocation
            .replace('[任务名称]', task.title)
            .replace('[类型]', task.type || '一般任务')
            .replace('[分钟]', task.duration || 30)
            .replace('[描述]', task.notes || task.title);
        
        try {
            const response = await this.chat([
                { role: 'user', content: `任务：${task.title}\n时长：${task.duration || 30}分钟` }
            ], prompt);
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    coins: result.totalCoins || 5,
                    energyCost: result.energyCost || 2,
                    reasoning: result.reasoning || ''
                };
            }
            return { coins: 5, energyCost: 2 };
        } catch (e) {
            console.error('Allocate coins error:', e);
            return { coins: 5, energyCost: 2 };
        }
    },

    // 生成鼓励语
    async generateEncouragement(context) {
        try {
            const response = await this.chat([
                { role: 'user', content: '请根据以下情况，给出一句简短温暖的鼓励语（不超过30字），适合ADHD用户：' + context }
            ], '你是一个温暖友好的助手，专门帮助ADHD用户。回复要简短、积极、有力量感。');
            return response.trim();
        } catch (e) {
            const defaults = [
                '你做得很棒！继续加油！💪',
                '每一小步都是进步！🌟',
                '相信自己，你可以的！✨',
                '休息一下也是为了走更远的路~🌈',
                '完成比完美更重要！🎯',
                '你已经在行动了，这就是胜利！🏆'
            ];
            return defaults[Math.floor(Math.random() * defaults.length)];
        }
    },

    // 工具方法：格式化日期
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + '-' + 
               (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               d.getDate().toString().padStart(2, '0');
    },

    // 工具方法：时间加分钟
    addMinutesToTime(timeStr, minutes) {
        const parts = timeStr.split(':');
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1] || 0);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return newH.toString().padStart(2, '0') + ':' + newM.toString().padStart(2, '0');
    },

    // AI智能分析任务
    async analyzeTask(title, notes, substeps) {
        try {
            const substepsText = substeps && substeps.length > 0 
                ? '\n子步骤: ' + substeps.map(s => s.title).join(', ')
                : '';
            
            const prompt = `请分析以下任务，返回JSON格式的分析结果：
任务名称: ${title}
${notes ? '备注: ' + notes : ''}${substepsText}

请返回以下格式的JSON（不要包含其他文字）：
{
    "tags": ["标签1", "标签2"],
    "verifyMethod": "验证方式描述",
    "coins": 金币数量(1-20),
    "energyCost": 精力消耗(1-5),
    "difficulty": 难度(1-5),
    "priority": "high/medium/low"
}

标签建议：💼工作、📚学习、💪健康、🏠家务、🎮休闲、🛒购物、📌其他
验证方式建议：完成打卡、拍照验证、截图验证、步数验证、时长验证等`;

            const response = await this.chat([
                { role: 'user', content: prompt }
            ], '你是一个任务分析助手，专门帮助用户分析任务属性。只返回JSON格式，不要其他文字。');
            
            // 尝试解析JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    tags: result.tags || ['📌 其他'],
                    verifyMethod: result.verifyMethod || '完成打卡',
                    coins: Math.min(20, Math.max(1, result.coins || 5)),
                    energyCost: Math.min(5, Math.max(1, result.energyCost || 2)),
                    difficulty: result.difficulty || 3,
                    priority: result.priority || 'medium'
                };
            }
            
            return null;
        } catch (e) {
            console.error('AI分析任务失败:', e);
            return null;
        }
    }
};

// 导出
window.AIService = AIService;
