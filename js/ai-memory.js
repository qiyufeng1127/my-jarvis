// KiiKii记忆库模块 - 关于用户的一切
const AIMemory = {
    // 记忆数据结构
    memories: {
        // 基本信息
        profile: {
            nickname: '',           // 用户昵称
            birthday: null,         // 生日
            location: '',           // 所在地
            occupation: '',         // 职业
            workStyle: '',          // 工作风格
            lastUpdated: null
        },
        
        // 工作相关
        work: {
            mainJobs: [],           // 主要工作类型
            skills: [],             // 技能列表
            clients: [],            // 客户信息
            projects: [],           // 项目历史
            pricing: {},            // 定价习惯
            peakHours: [],          // 高效时间段
            workPatterns: [],       // 工作模式
            achievements: []        // 成就记录
        },
        
        // 生活相关
        life: {
            routines: [],           // 日常习惯
            hobbies: [],            // 爱好
            pets: [],               // 宠物
            family: [],             // 家庭成员
            importantDates: [],     // 重要日期
            preferences: {}         // 偏好设置
        },
        
        // 健康相关
        health: {
            sleepPattern: null,     // 睡眠模式
            energyPattern: null,    // 精力模式
            exerciseHabits: [],     // 运动习惯
            healthGoals: [],        // 健康目标
            medications: [],        // 用药提醒
            mentalHealth: []        // 心理健康记录
        },
        
        // 情绪相关
        emotions: {
            moodHistory: [],        // 心情历史
            triggers: {             // 情绪触发器
                positive: [],
                negative: []
            },
            copingStrategies: [],   // 应对策略
            supportNeeds: []        // 支持需求
        },
        
        // 习惯相关
        habits: {
            good: [],               // 好习惯
            bad: [],                // 坏习惯
            procrastination: {      // 拖延相关
                triggers: [],
                patterns: [],
                solutions: []
            },
            productivity: {         // 效率相关
                bestConditions: [],
                distractions: [],
                focusTips: []
            }
        },
        
        // 财务相关
        finance: {
            incomeStreams: [],      // 收入来源
            expenses: [],           // 支出类型
            financialGoals: [],     // 财务目标
            spendingHabits: [],     // 消费习惯
            savingsPattern: null    // 储蓄模式
        },
        
        // 性格特点
        personality: {
            strengths: [],          // 优点
            weaknesses: [],         // 缺点
            values: [],             // 价值观
            fears: [],              // 恐惧/担忧
            dreams: [],             // 梦想/愿望
            motivations: []         // 动力来源
        },
        
        // 对话记忆
        conversations: {
            topics: [],             // 讨论过的话题
            preferences: [],        // 沟通偏好
            insideJokes: [],        // 内部笑话/梗
            importantMentions: []   // 重要提及
        },
        
        // 学习进度
        learningProgress: {
            totalInteractions: 0,
            memoriesCount: 0,
            lastLearned: null,
            confidenceLevel: 0      // 了解程度 0-100
        }
    },
    
    // AI秘书配置
    secretaryConfig: {
        name: 'KiiKii',
        personality: 'warm',        // warm, professional, playful
        speakingStyle: 'casual',    // casual, formal
        emoji: true
    },
    
    // 初始化
    init() {
        // 加载保存的记忆
        const savedMemories = Storage.load('adhd_ai_memories', null);
        if (savedMemories) {
            this.deepMerge(this.memories, savedMemories);
        }
        
        const savedConfig = Storage.load('adhd_secretary_config', null);
        if (savedConfig) {
            Object.assign(this.secretaryConfig, savedConfig);
        }
        
        // 监听对话事件
        this.startListening();
        
        console.log('KiiKii记忆库初始化完成');
    },
    
    // 深度合并对象
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    },
    
    // 开始监听
    startListening() {
        // 监听聊天消息
        document.addEventListener('userMessage', (e) => {
            this.learnFromMessage(e.detail.message, 'user');
        });
        
        // 监听任务完成
        document.addEventListener('taskCompleted', (e) => {
            this.learnFromTask(e.detail);
        });
    },
    
    // 从消息中学习
    learnFromMessage(message, sender) {
        if (sender !== 'user' || !message) return;
        
        const text = message.toLowerCase();
        
        // 提取个人信息
        this.extractPersonalInfo(text, message);
        
        // 提取情绪信息
        this.extractEmotionInfo(text, message);
        
        // 提取工作信息
        this.extractWorkInfo(text, message);
        
        // 提取习惯信息
        this.extractHabitInfo(text, message);
        
        // 更新学习进度
        this.memories.learningProgress.totalInteractions++;
        this.memories.learningProgress.lastLearned = new Date().toISOString();
        this.updateConfidenceLevel();
        
        this.saveMemories();
    },
    
    // 提取个人信息
    extractPersonalInfo(text, original) {
        // 提取昵称
        const nicknamePatterns = [
            /叫我(.{1,10})/,
            /我叫(.{1,10})/,
            /我是(.{1,10})/,
            /名字是(.{1,10})/
        ];
        for (const pattern of nicknamePatterns) {
            const match = original.match(pattern);
            if (match && match[1].length < 10) {
                this.memories.profile.nickname = match[1].trim();
                this.addMemoryItem('profile', '昵称', match[1].trim());
                break;
            }
        }
        
        // 提取职业
        const occupations = ['设计师', '插画师', '摄影师', '程序员', '写手', '运营', '自由职业', '学生', '老师'];
        for (const occ of occupations) {
            if (text.includes(occ)) {
                if (!this.memories.profile.occupation.includes(occ)) {
                    this.memories.profile.occupation = occ;
                    this.addMemoryItem('work', '职业', occ);
                }
            }
        }
        
        // 提取地点
        const locationMatch = original.match(/在(.{2,10})(住|生活|工作)/);
        if (locationMatch) {
            this.memories.profile.location = locationMatch[1];
            this.addMemoryItem('profile', '所在地', locationMatch[1]);
        }
    },
    
    // 提取情绪信息
    extractEmotionInfo(text, original) {
        const emotions = {
            positive: ['开心', '高兴', '兴奋', '满足', '感谢', '期待', '喜欢', '爱'],
            negative: ['累', '烦', '焦虑', '担心', '害怕', '难过', '生气', '压力', '崩溃']
        };
        
        const now = new Date().toISOString();
        
        for (const emotion of emotions.positive) {
            if (text.includes(emotion)) {
                this.memories.emotions.moodHistory.push({
                    type: 'positive',
                    emotion: emotion,
                    context: original.substring(0, 50),
                    date: now
                });
                // 只保留最近100条
                if (this.memories.emotions.moodHistory.length > 100) {
                    this.memories.emotions.moodHistory.shift();
                }
            }
        }
        
        for (const emotion of emotions.negative) {
            if (text.includes(emotion)) {
                this.memories.emotions.moodHistory.push({
                    type: 'negative',
                    emotion: emotion,
                    context: original.substring(0, 50),
                    date: now
                });
                if (this.memories.emotions.moodHistory.length > 100) {
                    this.memories.emotions.moodHistory.shift();
                }
            }
        }
    },
    
    // 提取工作信息
    extractWorkInfo(text, original) {
        // 提取客户信息
        const clientMatch = original.match(/客户(.{1,20})|(.{1,10})客户|给(.{1,10})做/);
        if (clientMatch) {
            const clientName = (clientMatch[1] || clientMatch[2] || clientMatch[3]).trim();
            if (clientName && !this.memories.work.clients.some(c => c.name === clientName)) {
                this.memories.work.clients.push({
                    name: clientName,
                    firstMention: new Date().toISOString(),
                    projects: []
                });
                this.addMemoryItem('work', '客户', clientName);
            }
        }
        
        // 提取项目信息
        const projectPatterns = [
            /做(.{2,20})(项目|任务)/,
            /(.{2,20})(项目|任务).*?(完成|开始|进行)/
        ];
        for (const pattern of projectPatterns) {
            const match = original.match(pattern);
            if (match) {
                const projectName = match[1].trim();
                if (!this.memories.work.projects.some(p => p.name === projectName)) {
                    this.memories.work.projects.push({
                        name: projectName,
                        firstMention: new Date().toISOString(),
                        status: 'mentioned'
                    });
                }
            }
        }
        
        // 提取定价信息
        const priceMatch = original.match(/(\d+)\s*[元块].*?(插画|摄影|设计|文案|项目)/i);
        if (priceMatch) {
            const price = parseInt(priceMatch[1]);
            const type = priceMatch[2];
            if (!this.memories.work.pricing[type]) {
                this.memories.work.pricing[type] = { prices: [], avg: 0 };
            }
            this.memories.work.pricing[type].prices.push(price);
            this.memories.work.pricing[type].avg = Math.round(
                this.memories.work.pricing[type].prices.reduce((a, b) => a + b, 0) / 
                this.memories.work.pricing[type].prices.length
            );
        }
    },
    
    // 提取习惯信息
    extractHabitInfo(text, original) {
        // 提取拖延触发器
        if (text.includes('拖延') || text.includes('不想做') || text.includes('懒得')) {
            const context = original.substring(0, 50);
            if (!this.memories.habits.procrastination.triggers.includes(context)) {
                this.memories.habits.procrastination.triggers.push(context);
                this.addMemoryItem('habits', '拖延触发', context);
            }
        }
        
        // 提取好习惯
        if (text.includes('习惯') && (text.includes('每天') || text.includes('坚持'))) {
            const habitMatch = original.match(/每天(.{2,20})|坚持(.{2,20})/);
            if (habitMatch) {
                const habit = (habitMatch[1] || habitMatch[2]).trim();
                if (!this.memories.habits.good.includes(habit)) {
                    this.memories.habits.good.push(habit);
                    this.addMemoryItem('habits', '好习惯', habit);
                }
            }
        }
        
        // 提取分心因素
        if (text.includes('分心') || text.includes('走神') || text.includes('刷')) {
            const distractionMatch = original.match(/刷(.{1,10})|看(.{1,10})分心/);
            if (distractionMatch) {
                const distraction = (distractionMatch[1] || distractionMatch[2]).trim();
                if (!this.memories.habits.productivity.distractions.includes(distraction)) {
                    this.memories.habits.productivity.distractions.push(distraction);
                }
            }
        }
    },
    
    // 从任务中学习
    learnFromTask(taskData) {
        if (!taskData) return;
        
        // 记录工作类型
        const taskType = taskData.category || taskData.type;
        if (taskType && !this.memories.work.mainJobs.includes(taskType)) {
            this.memories.work.mainJobs.push(taskType);
        }
        
        // 记录完成时间模式
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        
        if (!this.memories.work.workPatterns.some(p => p.type === taskType && p.time === timeOfDay)) {
            this.memories.work.workPatterns.push({
                type: taskType,
                time: timeOfDay,
                count: 1
            });
        } else {
            const pattern = this.memories.work.workPatterns.find(p => p.type === taskType && p.time === timeOfDay);
            if (pattern) pattern.count++;
        }
        
        // 记录成就
        if (taskData.value && taskData.value > 500) {
            this.memories.work.achievements.push({
                title: taskData.title,
                value: taskData.value,
                date: new Date().toISOString()
            });
        }
        
        this.saveMemories();
    },
    
    // 添加记忆项
    addMemoryItem(category, type, content) {
        this.memories.learningProgress.memoriesCount++;
        
        // 广播学习事件
        const event = new CustomEvent('memoryLearned', {
            detail: { category, type, content }
        });
        document.dispatchEvent(event);
    },
    
    // 手动添加记忆
    addManualMemory(category, subcategory, content) {
        if (!this.memories[category]) return false;
        
        if (Array.isArray(this.memories[category][subcategory])) {
            if (!this.memories[category][subcategory].includes(content)) {
                this.memories[category][subcategory].push(content);
                this.addMemoryItem(category, subcategory, content);
                this.saveMemories();
                return true;
            }
        } else if (typeof this.memories[category][subcategory] === 'string') {
            this.memories[category][subcategory] = content;
            this.addMemoryItem(category, subcategory, content);
            this.saveMemories();
            return true;
        }
        return false;
    },
    
    // 更新了解程度
    updateConfidenceLevel() {
        let score = 0;
        const maxScore = 100;
        
        // 基本信息 (20分)
        if (this.memories.profile.nickname) score += 5;
        if (this.memories.profile.occupation) score += 5;
        if (this.memories.profile.location) score += 5;
        if (this.memories.profile.workStyle) score += 5;
        
        // 工作信息 (25分)
        score += Math.min(10, this.memories.work.mainJobs.length * 2);
        score += Math.min(5, this.memories.work.clients.length);
        score += Math.min(5, Object.keys(this.memories.work.pricing).length * 2);
        score += Math.min(5, this.memories.work.workPatterns.length);
        
        // 习惯信息 (20分)
        score += Math.min(5, this.memories.habits.good.length);
        score += Math.min(5, this.memories.habits.procrastination.triggers.length);
        score += Math.min(5, this.memories.habits.productivity.distractions.length);
        score += Math.min(5, this.memories.habits.productivity.focusTips.length);
        
        // 情绪信息 (15分)
        score += Math.min(10, this.memories.emotions.moodHistory.length / 5);
        score += Math.min(5, this.memories.emotions.copingStrategies.length);
        
        // 性格信息 (20分)
        score += Math.min(5, this.memories.personality.strengths.length);
        score += Math.min(5, this.memories.personality.weaknesses.length);
        score += Math.min(5, this.memories.personality.motivations.length);
        score += Math.min(5, this.memories.personality.dreams.length);
        
        this.memories.learningProgress.confidenceLevel = Math.min(maxScore, Math.round(score));
    },
    
    // 获取记忆摘要
    getMemorySummary() {
        const m = this.memories;
        return {
            profile: {
                nickname: m.profile.nickname || '还不知道你的名字',
                occupation: m.profile.occupation || '还不了解你的职业',
                location: m.profile.location || ''
            },
            workSummary: {
                mainJobs: m.work.mainJobs.slice(0, 5),
                clientCount: m.work.clients.length,
                projectCount: m.work.projects.length,
                avgPricing: m.work.pricing
            },
            habitsSummary: {
                goodHabits: m.habits.good.slice(0, 5),
                procrastinationTriggers: m.habits.procrastination.triggers.slice(0, 3),
                distractions: m.habits.productivity.distractions.slice(0, 3)
            },
            emotionsSummary: {
                recentMood: this.getRecentMoodTrend(),
                moodCount: m.emotions.moodHistory.length
            },
            personalitySummary: {
                strengths: m.personality.strengths.slice(0, 5),
                weaknesses: m.personality.weaknesses.slice(0, 3),
                motivations: m.personality.motivations.slice(0, 3)
            },
            progress: m.learningProgress
        };
    },
    
    // 获取最近心情趋势
    getRecentMoodTrend() {
        const recent = this.memories.emotions.moodHistory.slice(-10);
        if (recent.length === 0) return 'unknown';
        
        const positive = recent.filter(m => m.type === 'positive').length;
        const negative = recent.filter(m => m.type === 'negative').length;
        
        if (positive > negative * 2) return 'very_positive';
        if (positive > negative) return 'positive';
        if (negative > positive * 2) return 'very_negative';
        if (negative > positive) return 'negative';
        return 'neutral';
    },
    
    // 获取所有记忆（用于展示）
    getAllMemories() {
        return this.memories;
    },
    
    // 获取分类记忆
    getCategoryMemories(category) {
        return this.memories[category] || null;
    },
    
    // 搜索记忆
    searchMemories(keyword) {
        const results = [];
        const search = (obj, path = '') => {
            for (const key in obj) {
                const newPath = path ? `${path}.${key}` : key;
                if (typeof obj[key] === 'string' && obj[key].includes(keyword)) {
                    results.push({ path: newPath, value: obj[key] });
                } else if (Array.isArray(obj[key])) {
                    obj[key].forEach((item, index) => {
                        if (typeof item === 'string' && item.includes(keyword)) {
                            results.push({ path: `${newPath}[${index}]`, value: item });
                        } else if (typeof item === 'object') {
                            search(item, `${newPath}[${index}]`);
                        }
                    });
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    search(obj[key], newPath);
                }
            }
        };
        search(this.memories);
        return results;
    },
    
    // 获取个性化回应上下文
    getPersonalizedContext() {
        const m = this.memories;
        let context = '';
        
        if (m.profile.nickname) {
            context += `用户昵称：${m.profile.nickname}。`;
        }
        if (m.profile.occupation) {
            context += `职业：${m.profile.occupation}。`;
        }
        if (m.work.mainJobs.length > 0) {
            context += `主要工作：${m.work.mainJobs.join('、')}。`;
        }
        if (m.habits.procrastination.triggers.length > 0) {
            context += `容易拖延的情况：${m.habits.procrastination.triggers.slice(0, 2).join('、')}。`;
        }
        if (m.personality.strengths.length > 0) {
            context += `优点：${m.personality.strengths.join('、')}。`;
        }
        if (m.personality.weaknesses.length > 0) {
            context += `需要注意：${m.personality.weaknesses.join('、')}。`;
        }
        
        const moodTrend = this.getRecentMoodTrend();
        if (moodTrend !== 'unknown') {
            const moodLabels = {
                very_positive: '最近心情很好',
                positive: '最近心情不错',
                neutral: '最近心情平稳',
                negative: '最近有些低落',
                very_negative: '最近压力较大'
            };
            context += moodLabels[moodTrend] + '。';
        }
        
        return context;
    },
    
    // 设置秘书名字
    setSecretaryName(name) {
        this.secretaryConfig.name = name;
        Storage.save('adhd_secretary_config', this.secretaryConfig);
    },
    
    // 获取秘书名字
    getSecretaryName() {
        return this.secretaryConfig.name;
    },
    
    // 保存记忆
    saveMemories() {
        Storage.save('adhd_ai_memories', this.memories);
    },
    
    // 清除所有记忆
    clearAllMemories() {
        this.memories = {
            profile: { nickname: '', birthday: null, location: '', occupation: '', workStyle: '', lastUpdated: null },
            work: { mainJobs: [], skills: [], clients: [], projects: [], pricing: {}, peakHours: [], workPatterns: [], achievements: [] },
            life: { routines: [], hobbies: [], pets: [], family: [], importantDates: [], preferences: {} },
            health: { sleepPattern: null, energyPattern: null, exerciseHabits: [], healthGoals: [], medications: [], mentalHealth: [] },
            emotions: { moodHistory: [], triggers: { positive: [], negative: [] }, copingStrategies: [], supportNeeds: [] },
            habits: { good: [], bad: [], procrastination: { triggers: [], patterns: [], solutions: [] }, productivity: { bestConditions: [], distractions: [], focusTips: [] } },
            finance: { incomeStreams: [], expenses: [], financialGoals: [], spendingHabits: [], savingsPattern: null },
            personality: { strengths: [], weaknesses: [], values: [], fears: [], dreams: [], motivations: [] },
            conversations: { topics: [], preferences: [], insideJokes: [], importantMentions: [] },
            learningProgress: { totalInteractions: 0, memoriesCount: 0, lastLearned: null, confidenceLevel: 0 }
        };
        this.saveMemories();
    }
};

// 导出
window.AIMemory = AIMemory;

