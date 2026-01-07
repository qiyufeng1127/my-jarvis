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

    // 解析用户输入，提取任务和情绪（支持多任务和删除操作）
    async parseUserInput(input) {
        const prompts = Storage.getPrompts();
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const contextInfo = `当前时间：${now.toLocaleString('zh-CN')}
今天日期：${this.formatDate(now)}
明天日期：${this.formatDate(tomorrow)}
当前年份：${now.getFullYear()}
当前月份：${now.getMonth() + 1}
当前精力值：${Storage.getGameState().energy}/10`;
        
        try {
            const response = await this.chat([
                { role: 'user', content: contextInfo + '\n\n用户输入：' + input }
            ], prompts.taskParse);
            
            // 尝试解析JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                
                // 处理删除操作
                if (result.deleteActions && result.deleteActions.length > 0) {
                    result.deleteActions.forEach(function(action) {
                        var deletedCount = 0;
                        if (action.type === 'delete_by_date' && action.date) {
                            deletedCount = Storage.deleteTasksByDate(action.date);
                            action.deletedCount = deletedCount;
                        } else if (action.type === 'delete_by_title' && action.title) {
                            deletedCount = Storage.deleteTasksByTitle(action.title);
                            action.deletedCount = deletedCount;
                        } else if (action.type === 'delete_all') {
                            deletedCount = Storage.deleteAllTasks();
                            action.deletedCount = deletedCount;
                        }
                    });
                }
                
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
    }
};

// 导出
window.AIService = AIService;
