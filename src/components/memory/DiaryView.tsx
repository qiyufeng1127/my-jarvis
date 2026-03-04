import { useState } from 'react';
import { Sparkles, Heart, TrendingUp, Loader2, MessageCircle, Clock, Tag as TagIcon } from 'lucide-react';
import { useMemoryStore, EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAIStore } from '@/stores/aiStore';

interface DiaryViewProps {
  isDark?: boolean;
  bgColor?: string;
  selectedDate: Date;
  diaryType: 'content' | 'emotion' | 'success';
}

export default function DiaryView({ 
  isDark = false, 
  bgColor = '#ffffff',
  selectedDate,
  diaryType
}: DiaryViewProps) {
  const { memories } = useMemoryStore();
  const { tasks } = useTaskStore();
  const { chat } = useAIStore();
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCoachAdvice, setShowCoachAdvice] = useState(false);
  const [showEmotionReview, setShowEmotionReview] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [emotionReview, setEmotionReview] = useState<string>('');
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // 日记系统配色 - 参考坏习惯组件
  const DIARY_COLORS = {
    espresso: '#542916',
    eauTrouble: '#b79858',
    terreCuite: '#a13a1e',
    nuageDeLait: '#fefaf0',
    mielDore: '#f1c166',
    
    glassmorphism: {
      light: 'rgba(254, 250, 240, 0.8)',
      accent: 'rgba(241, 193, 102, 0.6)',
    },
    
    shadows: {
      card: '0 2px 8px rgba(84, 41, 22, 0.15)',
    },
  };
  
  const cardBg = DIARY_COLORS.glassmorphism.light;
  const textColor = DIARY_COLORS.espresso;
  const accentColor = DIARY_COLORS.eauTrouble;

  // 获取当天的数据（包括所有任务详情）
  const dateStr = selectedDate.toDateString();
  const dayMemories = memories.filter(m => new Date(m.date).toDateString() === dateStr);
  const dayTasks = tasks.filter(t => {
    const taskDate = t.scheduledStart ? new Date(t.scheduledStart) : null;
    return taskDate && taskDate.toDateString() === dateStr;
  });

  // 生成日记
  const generateDiary = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    
    try {
      let prompt = '';
      
      if (diaryType === 'content') {
        // 内容结构分析日记 - 获取完整的任务和记忆数据
        const timelineData = [...dayMemories, ...dayTasks]
          .sort((a, b) => {
            const timeA = 'scheduledStart' in a ? new Date(a.scheduledStart).getTime() : new Date(a.date).getTime();
            const timeB = 'scheduledStart' in b ? new Date(b.scheduledStart).getTime() : new Date(b.date).getTime();
            return timeA - timeB;
          })
          .map(item => {
            if ('scheduledStart' in item) {
              // 任务数据
              const startTime = new Date(item.scheduledStart).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
              const endTime = item.scheduledEnd ? new Date(item.scheduledEnd).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
              const duration = item.durationMinutes || 0;
              const status = item.status === 'completed' ? '✅已完成' : item.status === 'in_progress' ? '⏳进行中' : '⏸️未开始';
              const efficiency = item.completionEfficiency ? `${item.completionEfficiency}%` : '';
              const notes = item.completionNotes || item.description || '';
              
              return `${startTime}-${endTime} (${duration}分钟) ${status}
📋 任务: ${item.title}
${efficiency ? `📊 完成效率: ${efficiency}\n` : ''}${notes ? `📝 备注/反思:\n${notes}\n` : ''}`;
            } else {
              // 记忆数据
              const time = new Date(item.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
              const typeLabel = item.type === 'mood' ? '💭心情' : item.type === 'thought' ? '💡想法' : item.type === 'todo' ? '📌待办' : item.type === 'success' ? '🌟成功' : '🙏感恩';
              return `${time} ${typeLabel}: ${item.content}`;
            }
          }).join('\n\n');

        prompt = `你是一位资深的生活记录分析师、心理咨询师和行为模式专家。请对${selectedDate.toLocaleDateString('zh-CN')}这一天进行**深度、多维度、洞察性**的分析。

【时间轴完整数据】
${timelineData || '当天暂无记录'}

【深度分析框架】

## 一、时间与能量流动分析（深挖时间背后的故事）

1. **时间分配的真相**
   - 列出所有任务的时间占比（工作、生活、休息、社交等）
   - 识别"时间黑洞"：哪些任务耗时超出预期？为什么？
   - 发现"高光时刻"：哪些时段效率最高？是什么因素促成的？
   - 分析时间碎片化程度：任务切换频率、专注时长

2. **能量曲线追踪**
   - 根据效率分数和反思内容，绘制一天的能量曲线
   - 识别能量高峰期（什么时候状态最好）
   - 识别能量低谷期（什么时候最疲惫、最拖延）
   - 分析能量消耗的真正原因（不只是任务本身，还有情绪、环境、心理负担）

3. **时间与情绪的交织**
   - 哪些时间点情绪波动最大？
   - 时间压力如何影响情绪和表现？
   - 拖延背后的深层原因是什么？（恐惧、完美主义、逃避？）

## 二、情绪与心理状态深度解析

1. **情绪地图绘制**
   - 从反思内容中提取所有情绪词（焦虑、委屈、无力、兴奋等）
   - 区分表层情绪（如"烦躁"）和深层情绪（如"不被理解的委屈"）
   - 追踪情绪的起伏轨迹：什么触发了情绪？情绪如何演变？

2. **自动想法与认知模式**
   - 提取反思中的"自动想法"（如"我做不好"、"我不够好"）
   - 识别认知扭曲模式（灾难化思维、非黑即白、过度概括等）
   - 分析这些想法如何影响行为和感受

3. **身心反应链条**
   - 从反思中提取身体感受（心跳加快、肩膀紧绷、胃部不适等）
   - 分析情绪-想法-身体-行为的完整链条
   - 识别压力的身体信号和预警

4. **未被满足的核心需求**
   - 深挖情绪背后的需求：被理解、被认可、安全感、掌控感、归属感？
   - 分析哪些需求长期未被满足
   - 这些未满足的需求如何影响日常表现

## 三、行为模式与习惯洞察

1. **重复模式识别**
   - 哪些行为模式反复出现？（如拖延、逃避、完美主义）
   - 这些模式在什么情境下被触发？
   - 模式背后的心理机制是什么？

2. **应对策略分析**
   - 面对压力和困难时，我用了什么应对方式？
   - 哪些应对方式有效？哪些无效甚至有害？
   - 从"认知重评"中提取有效的应对策略

3. **自我对话模式**
   - 我如何跟自己说话？（严厉批评 vs 温和鼓励）
   - 自我对话如何影响动力和表现？
   - 发现更有建设性的自我对话方式

## 四、效率与表现的深层分析

1. **效率背后的真相**
   - 不只看效率分数，更要分析：为什么这个分数？
   - 低效率的根本原因：技能不足？情绪干扰？环境因素？动力缺失？
   - 高效率的成功要素：什么做对了？如何复制？

2. **拖延的深层解码**
   - 识别所有拖延行为
   - 分析拖延的真正原因：恐惧失败？完美主义？任务模糊？缺乏意义感？
   - 拖延时我在逃避什么？

3. **动力与意义感**
   - 哪些任务做起来有动力？为什么？
   - 哪些任务感觉"没意义"？背后的原因是什么？
   - 如何重新建立与任务的连接？

## 五、成长与突破的证据

1. **微小进步的放大**
   - 即使是小小的进步，也要看见和肯定
   - 对比以往，今天有哪些不同？
   - 从反思中提取成长的迹象

2. **优势与资源盘点**
   - 今天展现了哪些优势和能力？
   - 哪些内在资源帮助我度过困难？
   - 如何更好地利用这些优势？

3. **突破性时刻**
   - 有没有打破旧模式的时刻？
   - 有没有新的尝试和探索？
   - 这些突破带来了什么启发？

## 六、深层洞察与反思

1. **这一天真正在告诉我什么？**
   - 超越表面的事件，看到更深的主题
   - 今天的经历反映了我生活中的什么议题？
   - 有什么重要的信号被我忽略了？

2. **模式与根源**
   - 今天的问题是偶然的，还是长期模式的一部分？
   - 这些模式的根源是什么？（童年经历、核心信念、环境影响？）
   - 如何从根源上改变？

3. **自我认知的更新**
   - 今天的经历让我对自己有什么新的认识？
   - 哪些关于自己的假设需要更新？
   - 我想成为什么样的人？今天的我离那个目标有多远？

## 七、具体可行的改变方向

1. **立即可以改变的**
   - 3个明天就能做的小调整
   - 每个调整要具体到行动步骤

2. **需要持续练习的**
   - 2-3个值得培养的新习惯
   - 如何开始？如何坚持？

3. **需要深入探索的**
   - 哪些议题需要更多的自我探索？
   - 是否需要寻求专业帮助？

【输出要求】
- 字数：2000-3000字，深度优先
- 语言：温暖、专业、有洞察力，像一位智慧的朋友在跟我深度对话
- 结构：清晰的章节，每个洞察都要有具体的数据支撑
- 避免：空泛的鼓励、表面的分析、说教式的建议

请帮我看清这一天的深层真相，发现我自己都没意识到的模式和需求。`;

      } else if (diaryType === 'emotion') {
        // 情绪链条日记 - 包含任务完成时的情绪反思
        const emotionData = [
          ...dayMemories
            .filter(m => m.emotionTags.length > 0 || m.type === 'mood')
            .map(m => ({
              time: new Date(m.date),
              emotions: m.emotionTags.map(id => {
                const tag = EMOTION_TAGS.find(t => t.id === id);
                return tag ? `${tag.emoji}${tag.label}` : id;
              }).join('、'),
              content: m.content,
              type: 'memory'
            })),
          ...dayTasks
            .filter(t => t.completionNotes)
            .map(t => ({
              time: new Date(t.scheduledStart),
              emotions: '',
              content: `任务"${t.title}"完成反思:\n${t.completionNotes}`,
              type: 'task'
            }))
        ]
          .sort((a, b) => a.time.getTime() - b.time.getTime())
          .map(item => {
            const time = item.time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            if (item.type === 'memory') {
              return `${time} ${item.emotions ? `[${item.emotions}]` : ''}\n${item.content}`;
            } else {
              return `${time}\n${item.content}`;
            }
          }).join('\n\n');

        prompt = `你是一位资深的情绪心理学家、精神分析师和身心医学专家。请对${selectedDate.toLocaleDateString('zh-CN')}这一天进行**深度情绪解析和心理动力学分析**。

【情绪完整记录】
${emotionData || '当天暂无情绪记录'}

【深度情绪分析框架】

## 一、情绪的多层次解构（像剥洋葱一样层层深入）

1. **表层情绪识别**
   - 列出所有直接表达的情绪词（焦虑、烦躁、开心、失望等）
   - 标注每种情绪的强度（1-10分）和持续时间
   - 绘制情绪的时间曲线：什么时候最强烈？什么时候缓解？

2. **中层情绪挖掘**
   - 烦躁背后可能是"无力感"
   - 焦虑背后可能是"对失控的恐惧"
   - 愤怒背后可能是"被忽视的委屈"
   - 从表层情绪推导出中层情绪

3. **深层情绪核心**
   - 所有情绪最终指向什么核心感受？
   - 是"我不够好"？"我不被爱"？"我不安全"？"我没有价值"？
   - 这个核心感受从何而来？（童年经历、核心信念、创伤记忆？）

4. **情绪的身体地图**
   - 从反思中提取所有身体感受（心跳、呼吸、肌肉紧张、胃部不适等）
   - 绘制"情绪的身体地图"：每种情绪在身体哪个部位？
   - 分析身体反应的意义：身体在告诉我什么？
   - 识别身体的预警信号：什么时候情绪即将失控？

## 二、情绪触发机制的深度解析

1. **触发点的表面分析**
   - 列出所有触发情绪的具体事件
   - 分析事件的共同特征（人际冲突、时间压力、自我怀疑等）

2. **触发点的深层分析**
   - 为什么这个事件会触发我？别人可能不会有这么强的反应
   - 这个触发点激活了我的什么核心信念？
   - 这个情境让我想起了什么过往经历？（移情、创伤重现）

3. **情绪的连锁反应**
   - 一个情绪如何引发另一个情绪？
   - 情绪如何影响想法？想法如何强化情绪？
   - 识别"情绪螺旋"：如何从小情绪升级到情绪崩溃？

4. **情绪的功能分析**
   - 每种情绪在保护我什么？
   - 焦虑可能在保护我免受失败
   - 愤怒可能在保护我的边界
   - 悲伤可能在帮我放下和哀悼

## 三、自动想法与认知模式的深度剖析

1. **自动想法的完整提取**
   - 从反思中提取所有"脑海里闪过的念头"
   - 这些想法有多真实？有多少是事实？有多少是解读？

2. **认知扭曲模式识别**
   - 灾难化思维："一定会很糟糕"
   - 非黑即白："要么完美要么失败"
   - 过度概括："我总是做不好"
   - 读心术："他们一定觉得我很差"
   - 情绪推理："我感觉不好，所以事情一定很糟"
   - 应该思维："我应该更好"

3. **核心信念的挖掘**
   - 这些自动想法背后的核心信念是什么？
   - "我不够好"、"我不值得被爱"、"世界是危险的"、"我必须完美"？
   - 这些信念从何而来？如何形成的？

4. **想法-情绪-行为的完整链条**
   - 触发事件 → 自动想法 → 情绪反应 → 身体感受 → 行为冲动 → 实际行为 → 后果
   - 分析每个环节如何相互影响
   - 找到可以干预的关键节点

## 四、未被满足的核心需求深度探索

1. **需求的层次分析**
   - 生理需求：休息、饮食、运动
   - 安全需求：稳定、可预测、掌控感
   - 归属需求：被接纳、被理解、连接
   - 尊重需求：被认可、被看见、有价值
   - 自我实现需求：成长、意义、创造

2. **长期未被满足的需求**
   - 哪些需求长期被忽视？
   - 这些未满足的需求如何影响我的情绪和行为？
   - 我用什么方式（往往是无效的）试图满足这些需求？

3. **需求冲突分析**
   - 有没有内在需求的冲突？
   - 比如：想要自由 vs 想要安全
   - 想要亲密 vs 害怕受伤
   - 想要成功 vs 害怕失败

4. **需求的健康满足方式**
   - 如何用更健康的方式满足这些需求？
   - 需要向外求助吗？需要改变环境吗？需要改变自己吗？

## 五、情绪应对模式的深度分析

1. **当前应对策略盘点**
   - 从"实际行为"中提取我的应对方式
   - 逃避、压抑、发泄、转移、理性化、升华？
   - 哪些是适应性的？哪些是不适应的？

2. **应对模式的根源**
   - 这些应对方式从哪里学来的？
   - 在过去可能有用，但现在还适用吗？
   - 这些模式在保护我什么？代价是什么？

3. **情绪调节能力评估**
   - 我能识别自己的情绪吗？
   - 我能容纳强烈的情绪吗？还是会被淹没？
   - 我能调节情绪吗？用什么方法？

4. **更有效的应对策略**
   - 从"认知重评"中提取有效的策略
   - 什么时候我成功地调节了情绪？
   - 如何培养更好的情绪调节能力？

## 六、情绪模式与人生主题

1. **重复出现的情绪模式**
   - 今天的情绪是偶然的，还是长期模式的一部分？
   - 这个模式多久出现一次？
   - 什么情境下最容易被激活？

2. **情绪背后的人生主题**
   - 今天的情绪反映了我人生中的什么核心议题？
   - 关系议题？自我价值议题？掌控议题？意义议题？
   - 这个议题在我生活的其他领域如何体现？

3. **创伤与未完成事件**
   - 今天的情绪是否激活了过去的创伤？
   - 有什么未完成的情绪需要处理？
   - 有什么需要哀悼、放下或和解的？

## 七、深层洞察与转化

1. **情绪想告诉我什么？**
   - 如果情绪会说话，它想告诉我什么？
   - 情绪是敌人还是信使？
   - 如何与情绪建立新的关系？

2. **从情绪中学习**
   - 今天的情绪体验教会了我什么？
   - 我对自己有什么新的认识？
   - 我需要做出什么改变？

3. **情绪的转化与成长**
   - 如何将痛苦转化为成长？
   - 如何从情绪中提取智慧？
   - 这次经历如何让我成为更完整的人？

## 八、具体的情绪管理策略

1. **即时情绪急救**
   - 当情绪来临时，3个立即可用的方法
   - 呼吸、接地、自我安抚

2. **中期情绪调节**
   - 培养情绪觉察能力
   - 建立情绪表达的出口
   - 发展自我关怀的能力

3. **长期情绪疗愈**
   - 需要处理的核心议题
   - 是否需要专业心理咨询？
   - 如何建立更健康的情绪模式？

【输出要求】
- 字数：2500-3500字，深度优先，不怕长
- 语言：温暖、专业、有深度，像一位智慧的心理咨询师在做深度分析
- 结构：清晰的层次，从表层到深层，层层递进
- 避免：表面的安慰、简单的归因、说教式的建议

请帮我看清情绪的深层真相，发现我自己都没意识到的心理动力和模式。`;

      } else {
        // 成功日记 - 包含所有完成的任务和成功记录
        const successData = [
          ...dayMemories
            .filter(m => m.type === 'success')
            .map(m => `💫 ${new Date(m.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${m.content}`),
          ...dayTasks
            .filter(t => t.status === 'completed')
            .map(t => {
              const time = new Date(t.scheduledStart).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
              const efficiency = t.completionEfficiency ? ` (效率${t.completionEfficiency}%)` : '';
              const notes = t.completionNotes ? `\n   反思: ${t.completionNotes}` : '';
              return `✅ ${time} - 完成任务: ${t.title}${efficiency}${notes}`;
            })
        ].join('\n\n');

        prompt = `你是一位积极心理学专家、优势教练和成长导师。请对${selectedDate.toLocaleDateString('zh-CN')}进行**深度优势分析和成长潜能挖掘**。

【今天的成就记录】
${successData || '当天暂无成功记录'}

【深度成功分析框架】

## 一、成就的多维度解构（不放过任何闪光点）

1. **显性成就盘点**
   - 列出所有完成的任务（无论大小）
   - 特别标注高效率完成的任务（效率>70%）
   - 识别超出预期的表现

2. **隐性成就挖掘**
   - 那些"理所当然"但其实不容易的事
   - 克服了什么困难？（即使很小）
   - 做出了什么选择？（即使不起眼）
   - 坚持了什么？（即使想放弃）

3. **过程中的闪光时刻**
   - 不只看结果，更要看过程
   - 什么时候我全情投入？
   - 什么时候我感到"心流"？
   - 什么时候我感到"这就是我"？

4. **微小但重要的进步**
   - 对比以往，今天有什么不同？
   - 哪怕只是"今天没有拖延"也是进步
   - 哪怕只是"今天对自己温柔了一点"也值得肯定

## 二、优势与能力的深度识别

1. **显性优势提取**
   - 从完成的任务中识别展现的能力
   - 技术能力：专业技能、知识储备
   - 认知能力：分析、创造、学习、解决问题
   - 执行能力：计划、组织、坚持、完成
   - 人际能力：沟通、协作、影响、共情

2. **隐性优势挖掘**
   - 性格优势：勇气、坚韧、好奇、热情、感恩、希望
   - 情绪优势：情绪觉察、情绪调节、情绪表达
   - 关系优势：建立连接、维护关系、给予支持
   - 意义优势：寻找意义、创造价值、超越自我

3. **独特优势识别**
   - 什么是"只有我能做到"或"我做得特别好"的？
   - 我的优势组合是什么？（不是单一优势，而是组合）
   - 这些优势如何相互增强？

4. **潜在优势发现**
   - 从反思中发现尚未充分发挥的优势
   - 什么能力我还没有意识到？
   - 什么潜能还在沉睡？

## 三、成功背后的深层分析

1. **成功的关键要素**
   - 为什么这次能成功？
   - 外部因素：环境、资源、支持、机会
   - 内部因素：动机、能力、策略、状态
   - 哪些因素是可控的？哪些是可复制的？

2. **成功的心理机制**
   - 什么信念支持了我？（"我可以"、"这有意义"）
   - 什么情绪推动了我？（热情、好奇、责任感）
   - 什么需求被满足了？（成就感、掌控感、连接感）

3. **成功的行为模式**
   - 我用了什么有效的策略？
   - 我做出了什么好的选择？
   - 我如何克服了困难和阻力？

4. **成功的意义探索**
   - 这个成功对我意味着什么？
   - 它满足了我的什么深层需求？
   - 它如何连接到我的价值观和人生目标？

## 四、成长证据的系统梳理

1. **能力成长**
   - 对比以往，我掌握了什么新技能？
   - 我在什么方面变得更熟练？
   - 我解决了什么以前解决不了的问题？

2. **认知成长**
   - 从反思中提取认知的进步
   - 我对自己有什么新的认识？
   - 我对问题有什么新的理解？
   - 我的思维方式有什么改变？

3. **情绪成长**
   - 我的情绪调节能力有提升吗？
   - 我对情绪的理解更深了吗？
   - 我与情绪的关系更健康了吗？

4. **行为成长**
   - 我打破了什么旧模式？
   - 我尝试了什么新行为？
   - 我建立了什么新习惯？

5. **关系成长**
   - 我在人际关系中有什么进步？
   - 我的沟通方式更好了吗？
   - 我的边界更清晰了吗？

## 五、优势模式的提炼与复制

1. **高效模式识别**
   - 什么时候我效率最高？
   - 什么条件下我表现最好？
   - 什么因素激发了我的最佳状态？

2. **成功公式提炼**
   - 我的"成功公式"是什么？
   - 哪些要素的组合最有效？
   - 如何在其他场景复制这个公式？

3. **优势的迁移应用**
   - 这些优势可以用在哪些其他领域？
   - 如何将优势从一个领域迁移到另一个领域？
   - 如何放大优势的影响？

4. **优势的组合创新**
   - 如何组合不同的优势创造独特价值？
   - 如何用优势弥补弱点？
   - 如何与他人的优势互补？

## 六、自信与自我效能的建设

1. **具体成功证据**
   - 用今天的事实证明"我可以"
   - 列出所有"我做到了"的证据
   - 这些证据如何挑战"我不行"的信念？

2. **能力的确认与强化**
   - 我确实拥有这些能力（不是运气）
   - 我可以在需要时调用这些能力
   - 我有能力应对挑战和困难

3. **积极自我认知的建立**
   - 从"我不够好"到"我有优势"
   - 从"我总是失败"到"我也能成功"
   - 从"我没有价值"到"我能创造价值"

4. **未来信心的培养**
   - 今天的成功如何增强对未来的信心？
   - 我相信自己能做到什么？
   - 我对未来有什么期待和希望？

## 七、持续成长的路径规划

1. **值得保持的习惯**
   - 哪些做法今天证明有效？
   - 如何将偶然的成功变成稳定的习惯？
   - 如何设计环境和系统支持这些习惯？

2. **优势的深化发展**
   - 如何进一步发展现有优势？
   - 需要学习什么？练习什么？
   - 如何从"擅长"到"精通"？

3. **新领域的探索**
   - 基于现有优势，可以探索什么新领域？
   - 什么新挑战能激发我的潜能？
   - 如何在舒适区边缘成长？

4. **意义与目标的连接**
   - 今天的成功如何连接到长期目标？
   - 如何让每天的努力更有意义？
   - 我想成为什么样的人？今天的我离那个目标更近了吗？

## 八、具体的成长行动计划

1. **明天就能做的**
   - 3个基于今天成功经验的具体行动
   - 如何复制今天的成功？
   - 如何避免今天的失误？

2. **本周要培养的**
   - 2个值得培养的新习惯
   - 具体的开始方式和坚持策略
   - 如何追踪进展？

3. **长期要发展的**
   - 1-2个核心优势的深化方向
   - 需要的资源和支持
   - 里程碑和检查点

【输出要求】
- 字数：2500-3500字，深度优先
- 语言：温暖、肯定、有力量，像一位智慧的导师在帮我看到自己的光芒
- 结构：从具体成就到深层优势，从现在到未来
- 避免：空泛的夸奖、表面的鼓励、不切实际的期待

请帮我看到自己的闪光点，发现我自己都没意识到的优势和潜能，给我真正的信心和成长方向。`;
      }

      const response = await chat([
        { role: 'system', content: '你是一位温暖、专业的生活教练，擅长帮助用户整理思绪、分析情绪、发现优势。' },
        { role: 'user', content: prompt }
      ]);

      if (response.success && response.content) {
        setAiAnalysis(response.content);
      } else {
        setAiAnalysis('生成失败，请检查AI配置或稍后重试。');
      }
    } catch (error) {
      console.error('生成日记失败:', error);
      setAiAnalysis('生成失败，请稍后重试。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 教练建议
  const getCoachAdvice = async () => {
    setIsLoadingCoach(true);
    setShowCoachAdvice(true);
    setCoachAdvice('');
    
    try {
      // 获取完整的当天数据
      const contextData = [
        '【任务完成情况】',
        ...dayTasks.map(t => {
          const status = t.status === 'completed' ? '✅已完成' : t.status === 'in_progress' ? '⏳进行中' : '⏸️未开始';
          const efficiency = t.completionEfficiency ? ` (效率${t.completionEfficiency}%)` : '';
          const notes = t.completionNotes ? `\n反思: ${t.completionNotes}` : '';
          return `${status} ${t.title}${efficiency}${notes}`;
        }),
        '',
        '【心情和想法记录】',
        ...dayMemories.map(m => {
          const emotions = m.emotionTags.map(id => {
            const tag = EMOTION_TAGS.find(t => t.id === id);
            return tag ? tag.label : id;
          }).join('、');
          return `${emotions ? `[${emotions}] ` : ''}${m.content}`;
        })
      ].join('\n');
      
      const prompt = `你是一位实战派生活教练、行为改变专家和心理咨询师。基于我今天的完整记录，请给我**深度、具体、立即可执行**的建议。

【今天的完整记录】
${contextData || '暂无记录'}

【深度建议框架】

## 一、当下最需要的支持（急救式建议）

1. **情绪急救**
   - 如果现在情绪很糟糕，3个立即可用的方法
   - 具体到：做什么动作、说什么话、想什么画面
   - 为什么这些方法有用？（心理学原理）

2. **认知重构**
   - 识别今天最困扰我的想法
   - 提供3个替代性的、更有建设性的想法
   - 如何练习这种新的思维方式？

3. **行为干预**
   - 如果今天有拖延或逃避，明天如何打破？
   - 具体的第一步是什么？（小到不可能失败）
   - 如何创造支持性的环境？

## 二、短期改善策略（本周可以做的）

1. **时间与能量管理**
   - 基于今天的能量曲线，如何优化明天的安排？
   - 什么时段做什么事最高效？
   - 如何保护高能量时段？如何恢复低能量时段？

2. **效率提升方法**
   - 针对今天的低效环节，3个具体改进方法
   - 每个方法包含：
     * 🎯 具体做法（步骤化）
     * ⏰ 什么时候做
     * 💡 为什么有效
     * 📊 如何衡量效果

3. **情绪调节练习**
   - 基于今天的情绪模式，设计3个日常练习
   - 比如：每天3次情绪觉察、睡前感恩日记、压力释放仪式
   - 如何将练习融入日常？

4. **关系改善行动**
   - 如果今天有人际困扰，如何改善？
   - 需要沟通的话如何说？（提供话术）
   - 需要设置的边界如何设？（具体方法）

## 三、中期习惯培养（本月要建立的）

1. **核心习惯设计**
   - 基于今天的问题，最值得培养的2个习惯
   - 每个习惯的设计：
     * 触发点：什么时候/什么情境下做
     * 行为：具体做什么（越小越好）
     * 奖励：如何让自己想继续做
     * 追踪：如何记录进展

2. **环境优化方案**
   - 如何设计环境让好习惯更容易？
   - 如何设计环境让坏习惯更难？
   - 需要改变什么物理环境？社交环境？

3. **支持系统建立**
   - 需要什么外部支持？（人、工具、资源）
   - 如何寻求帮助？向谁寻求？
   - 如何建立问责机制？

## 四、深层模式改变（长期要探索的）

1. **核心议题识别**
   - 今天的问题反映了什么深层议题？
   - 这个议题在生活的其他领域如何体现？
   - 需要做什么深度工作？（自我探索、心理咨询？）

2. **信念系统重建**
   - 哪些核心信念需要更新？
   - 从"我不够好"到"我正在成长"
   - 如何通过行动证明新信念？

3. **人生方向调整**
   - 今天的经历让我思考什么？
   - 我真正想要的是什么？
   - 需要做出什么重要决定或改变？

## 五、具体行动清单（按优先级排序）

### 🔴 今晚睡前必做（最重要）
1. [具体行动1] - 为什么重要 - 如何做
2. [具体行动2] - 为什么重要 - 如何做

### 🟡 明天要做（高优先级）
1. [具体行动1] - 什么时候做 - 如何做
2. [具体行动2] - 什么时候做 - 如何做
3. [具体行动3] - 什么时候做 - 如何做

### 🟢 本周要开始（中优先级）
1. [具体行动1] - 如何开始 - 如何坚持
2. [具体行动2] - 如何开始 - 如何坚持

### 🔵 长期要探索（低优先级但重要）
1. [具体方向1] - 为什么重要 - 第一步是什么

## 六、预防性建议（避免重蹈覆辙）

1. **识别预警信号**
   - 什么信号表明我又要陷入旧模式？
   - 如何早期识别？如何早期干预？

2. **应急预案**
   - 如果明天又遇到类似情况，如何应对？
   - Plan A、Plan B、Plan C
   - 什么时候需要求助？

3. **自我关怀计划**
   - 如何对自己更温柔？
   - 如何在困难时支持自己？
   - 如何庆祝小进步？

## 七、资源与工具推荐

1. **立即可用的工具**
   - 推荐3个具体的工具/方法/技巧
   - 如何使用？在哪里找？

2. **值得学习的知识**
   - 推荐1-2本书/课程/文章
   - 为什么推荐？如何应用？

3. **可能需要的专业帮助**
   - 什么情况下需要心理咨询？
   - 如何选择咨询师？
   - 如何开始第一步？

【输出要求】
- 字数：2000-3000字
- 语言：温暖、实用、有力量，像一位经验丰富的教练在给我制定行动计划
- 结构：从紧急到长期，从简单到复杂，从行动到反思
- 避免：空泛的大道理、不可执行的建议、说教式的语气

请给我真正有用的、立即可以行动的建议，帮我缓解焦虑、提升状态、持续成长。`;

      const response = await chat([
        { role: 'system', content: '你是一位实战派生活教练，擅长给出具体可行的建议，帮助用户解决实际问题。' },
        { role: 'user', content: prompt }
      ]);

      if (response.success && response.content) {
        setCoachAdvice(response.content);
      } else {
        setCoachAdvice('生成失败，请检查AI配置或稍后重试。');
      }
    } catch (error) {
      console.error('生成建议失败:', error);
      setCoachAdvice('生成失败，请稍后重试。');
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // 情绪复盘
  const getEmotionReview = async () => {
    setIsLoadingReview(true);
    setShowEmotionReview(true);
    setEmotionReview('');
    
    try {
      // 获取历史情绪记录（最近30天）
      const thirtyDaysAgo = new Date(selectedDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const historicalEmotions = memories
        .filter(m => {
          const mDate = new Date(m.date);
          return mDate >= thirtyDaysAgo && mDate < selectedDate && (m.emotionTags.length > 0 || m.type === 'mood');
        })
        .slice(0, 30) // 最多取30条
        .map(m => {
          const emotions = m.emotionTags.map(id => {
            const tag = EMOTION_TAGS.find(t => t.id === id);
            return tag ? tag.label : id;
          }).join('、');
          return `${new Date(m.date).toLocaleDateString('zh-CN')} ${new Date(m.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} [${emotions}]\n${m.content}`;
        }).join('\n\n');

      // 获取历史任务的完成反思
      const historicalTasks = tasks
        .filter(t => {
          const tDate = t.scheduledStart ? new Date(t.scheduledStart) : null;
          return tDate && tDate >= thirtyDaysAgo && tDate < selectedDate && t.completionNotes;
        })
        .slice(0, 20)
        .map(t => {
          const date = new Date(t.scheduledStart).toLocaleDateString('zh-CN');
          return `${date} 任务"${t.title}"完成反思:\n${t.completionNotes}`;
        }).join('\n\n');

      const todayEmotions = [
        ...dayMemories
          .filter(m => m.emotionTags.length > 0 || m.type === 'mood')
          .map(m => {
            const emotions = m.emotionTags.map(id => {
              const tag = EMOTION_TAGS.find(t => t.id === id);
              return tag ? tag.label : id;
            }).join('、');
            const time = new Date(m.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            return `${time} [${emotions}]\n${m.content}`;
          }),
        ...dayTasks
          .filter(t => t.completionNotes)
          .map(t => {
            const time = new Date(t.scheduledStart).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            return `${time} 任务"${t.title}"完成反思:\n${t.completionNotes}`;
          })
      ].join('\n\n');

      const prompt = `你是一位资深的情绪心理学家、精神分析师和模式识别专家。请对我的情绪进行**深度历史对比分析和模式挖掘**。

【历史情绪记录（最近30天）】
${historicalEmotions || '暂无历史情绪记录'}

${historicalTasks ? `【历史任务反思】\n${historicalTasks}\n` : ''}

【今天的情绪记录】
${todayEmotions || '暂无今日记录'}

【深度情绪复盘框架】

## 一、历史情绪模式的深度挖掘

1. **高频情绪识别**
   - 统计最近30天出现最多的情绪（前5名）
   - 每种情绪出现的频率、强度、持续时间
   - 这些情绪的时间分布规律（什么时候最容易出现）

2. **情绪触发模式**
   - 提取所有触发情绪的场景和事件
   - 分类触发点：人际冲突、工作压力、自我怀疑、身体疲劳、环境变化
   - 识别最常见的触发模式（前3名）
   - 分析为什么这些情境特别容易触发我

3. **情绪演变轨迹**
   - 情绪如何随时间变化？
   - 有改善的趋势吗？还是在恶化？
   - 什么时候情绪最好？什么时候最糟？
   - 识别情绪的周期性规律（每周、每月）

4. **深层情绪核心**
   - 所有表层情绪背后的共同核心是什么？
   - 是"我不够好"？"我不安全"？"我不被爱"？"我没有掌控"？
   - 这个核心情绪从何而来？（童年、创伤、核心信念）
   - 它如何影响我的生活？

## 二、今日情绪的深度解析

1. **今日情绪全景**
   - 列出今天所有的情绪及其触发点
   - 绘制今天的情绪曲线
   - 识别情绪的转折点（什么让情绪变好/变坏）

2. **今日情绪的独特性**
   - 今天有什么新的情绪体验？
   - 今天的情绪强度与以往相比如何？
   - 今天的应对方式有什么不同？

3. **今日情绪的深层分析**
   - 今天的情绪激活了什么核心议题？
   - 今天的情绪反映了什么未被满足的需求？
   - 今天的情绪想告诉我什么？

## 三、历史与今日的深度对比

1. **核心重合点分析**
   - 今天和历史记录中相似的情绪模式
   - 相似的触发点和应对方式
   - 重复出现的想法和行为
   - **这些重合点说明了什么？**
     * 这是我的核心模式
     * 这个模式有多顽固？
     * 这个模式的根源是什么？
     * 这个模式的代价是什么？

2. **显著差异点分析**
   - 今天与以往不同的地方
   - 新出现的情绪或应对方式
   - 改善的迹象或恶化的信号
   - **这些差异点说明了什么？**
     * 我在成长吗？
     * 我在退步吗？
     * 什么因素导致了这些变化？
     * 如何巩固好的变化？如何扭转坏的变化？

3. **模式的演变分析**
   - 对比30天前和现在，模式有什么变化？
   - 哪些模式在减弱？哪些在加强？
   - 什么因素促成了这些变化？
   - 我的情绪调节能力有提升吗？

## 四、触发机制的深度解构

1. **外部触发因素**
   - 人际关系：哪些人、哪些互动模式容易触发？
   - 工作/学习：哪些任务、哪些情境容易触发？
   - 环境因素：时间、地点、氛围如何影响？
   - 生理因素：睡眠、饮食、运动如何影响？

2. **内部触发因素**
   - 核心信念：哪些信念在驱动情绪？
   - 自动想法：哪些想法反复出现？
   - 未满足需求：哪些需求长期被忽视？
   - 创伤记忆：哪些过往经历被激活？

3. **触发的连锁反应**
   - 一个小触发如何升级为情绪风暴？
   - 情绪如何影响想法？想法如何强化情绪？
   - 如何打破这个恶性循环？

## 五、应对模式的深度评估

1. **历史应对策略盘点**
   - 我用过哪些应对方式？
   - 哪些有效？哪些无效？哪些有害？
   - 我最常用的应对方式是什么？为什么？

2. **应对模式的根源**
   - 这些应对方式从哪里学来的？
   - 它们在过去可能有用，但现在还适用吗？
   - 它们在保护我什么？代价是什么？

3. **今日应对的新尝试**
   - 今天有没有尝试新的应对方式？
   - 效果如何？
   - 值得继续吗？

4. **更有效的应对策略**
   - 基于历史数据，什么应对方式最有效？
   - 如何在情绪来临时记得使用？
   - 如何培养更好的情绪调节能力？

## 六、核心需求的深度探索

1. **长期未被满足的需求**
   - 从历史记录中识别反复出现的需求
   - 被理解、被认可、安全感、掌控感、归属感、意义感
   - 哪些需求最迫切？哪些最被忽视？

2. **需求满足的障碍**
   - 为什么这些需求长期未被满足？
   - 外部障碍：环境、关系、资源
   - 内部障碍：信念、恐惧、模式
   - 如何移除这些障碍？

3. **需求的健康满足方式**
   - 如何用更健康的方式满足这些需求？
   - 需要改变什么？需要寻求什么帮助？
   - 第一步是什么？

## 七、成长与变化的证据

1. **进步的迹象**
   - 对比历史，我有什么进步？
   - 情绪觉察能力提升了吗？
   - 情绪调节能力提升了吗？
   - 对自己更温柔了吗？

2. **有效改变的因素**
   - 什么因素促成了这些进步？
   - 哪些做法有效？
   - 如何巩固和扩大这些进步？

3. **仍需努力的方向**
   - 哪些模式还很顽固？
   - 哪些问题还没解决？
   - 下一步的成长方向是什么？

## 八、深层洞察与转化

1. **情绪模式的人生意义**
   - 这些情绪模式在我人生中扮演什么角色？
   - 它们如何塑造了我？
   - 它们如何限制了我？

2. **核心议题的识别**
   - 所有情绪最终指向什么核心议题？
   - 关系议题？自我价值议题？掌控议题？意义议题？
   - 这个议题的根源是什么？

3. **转化的可能性**
   - 如何将情绪的痛苦转化为成长？
   - 如何从情绪中提取智慧？
   - 如何与情绪建立新的关系？

4. **疗愈的方向**
   - 需要做什么深度工作？
   - 需要专业心理咨询吗？
   - 如何开始疗愈之旅？

## 九、具体的改变计划

1. **短期情绪管理策略**
   - 基于历史数据，设计3个最有效的情绪管理方法
   - 每个方法包含：触发条件、具体步骤、预期效果

2. **中期模式改变计划**
   - 选择1-2个最需要改变的模式
   - 如何打破旧模式？如何建立新模式？
   - 30天行动计划

3. **长期疗愈方向**
   - 核心议题的深度工作
   - 需要的资源和支持
   - 里程碑和检查点

【输出要求】
- 字数：3000-4000字，深度优先，不怕长
- 语言：温暖、专业、有深度，像一位智慧的心理咨询师在做深度案例分析
- 结构：从历史到现在，从表层到深层，从模式到转化
- 避免：表面的安慰、简单的归因、说教式的建议

请帮我看清情绪的深层规律和模式，发现我自己都没意识到的心理动力，给我真正的洞察和改变方向。`;

      const response = await chat([
        { role: 'system', content: '你是一位情绪分析专家，擅长发现情绪模式，帮助用户理解自己的情绪规律。' },
        { role: 'user', content: prompt }
      ]);

      if (response.success && response.content) {
        setEmotionReview(response.content);
      } else {
        setEmotionReview('生成失败，请检查AI配置或稍后重试。');
      }
    } catch (error) {
      console.error('生成复盘失败:', error);
      setEmotionReview('生成失败，请稍后重试。');
    } finally {
      setIsLoadingReview(false);
    }
  };

  return (
    <div 
      className="space-y-4"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}
    >
      {/* 日期标题 - iOS风格卡片 */}
      <div 
        className="rounded-2xl p-6"
        style={{ 
          backgroundColor: cardBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 
              className="font-bold mb-2"
              style={{ 
                fontSize: '20px',
                fontWeight: 600,
                color: textColor,
              }}
            >
              {selectedDate.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </h3>
            <div className="text-sm" style={{ color: accentColor, fontWeight: 300 }}>
              {diaryType === 'content' && '📋 内容结构分析日记'}
              {diaryType === 'emotion' && '💗 情绪链条日记'}
              {diaryType === 'success' && '⭐ 成功日记'}
            </div>
          </div>
          
          <button
            onClick={generateDiary}
            disabled={isAnalyzing}
            className="px-6 py-3 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: DIARY_COLORS.espresso,
              color: DIARY_COLORS.nuageDeLait,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>生成日记</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 原始数据展示 - iOS风格卡片 */}
      <div 
        className="rounded-2xl p-6 space-y-3"
        style={{ 
          backgroundColor: cardBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        <div className="font-semibold flex items-center space-x-2" style={{ color: textColor, fontSize: '14px' }}>
          <span>📋</span>
          <span>当天记录</span>
        </div>
        
        {dayMemories.length === 0 && dayTasks.length === 0 ? (
          <div className="text-center py-8" style={{ color: accentColor }}>
            <div className="text-3xl mb-2">📝</div>
            <div className="text-sm">这一天还没有记录</div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 任务 */}
            {dayTasks.length > 0 && (
              <div className="space-y-2">
                {dayTasks.map(task => {
                  const startTime = task.scheduledStart ? new Date(task.scheduledStart).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
                  const endTime = task.scheduledEnd ? new Date(task.scheduledEnd).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
                  const status = task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '⏳' : '⏸️';
                  const efficiency = task.completionEfficiency ? ` (${task.completionEfficiency}%)` : '';
                  
                  return (
                    <div key={task.id} className="flex items-start space-x-2 text-sm">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3B82F6' }} />
                      <div className="flex-1" style={{ color: textColor }}>
                        <div>
                          <span className="font-medium">{startTime}</span>
                          {endTime && <span> - {endTime}</span>}
                          <span className="ml-2">{status} {task.title}</span>
                          {efficiency && <span className="text-xs ml-1" style={{ color: accentColor }}>{efficiency}</span>}
                        </div>
                        {task.completionNotes && (
                          <div className="text-xs mt-1 pl-2 border-l-2" style={{ color: accentColor, borderColor: accentColor }}>
                            {task.completionNotes.split('\n').slice(0, 2).join(' ')}
                            {task.completionNotes.split('\n').length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* 记忆 */}
            {dayMemories.length > 0 && (
              <div className="space-y-2">
                {dayMemories.map(memory => (
                  <div key={memory.id} className="flex items-start space-x-2 text-sm">
                    <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ 
                      color: memory.type === 'success' ? '#F59E0B' : memory.type === 'mood' ? '#EC4899' : '#8B5CF6' 
                    }} />
                    <div className="flex-1">
                      <div style={{ color: textColor }}>
                        <span className="font-medium">
                          {new Date(memory.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {' - '}
                        <span>{memory.content}</span>
                      </div>
                      {memory.emotionTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {memory.emotionTags.map(tagId => {
                            const tag = EMOTION_TAGS.find(t => t.id === tagId);
                            return tag ? (
                              <span
                                key={tagId}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: tag.color + '20',
                                  color: tag.color,
                                }}
                              >
                                {tag.emoji} {tag.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI生成的日记 - iOS风格卡片 */}
      {aiAnalysis && (
        <div 
          className="rounded-2xl p-6 space-y-3"
          style={{ 
            backgroundColor: cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="font-semibold flex items-center space-x-2" style={{ color: textColor, fontSize: '14px' }}>
            <Sparkles className="w-4 h-4" />
            <span>✨ AI日记</span>
          </div>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: textColor, fontWeight: 300 }}
          >
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* 操作按钮 - iOS风格 */}
      {aiAnalysis && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={getCoachAdvice}
            disabled={isLoadingCoach}
            className="px-4 py-3 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: DIARY_COLORS.mielDore,
              color: DIARY_COLORS.espresso,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            {isLoadingCoach ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>💚 教练建议</span>
              </div>
            )}
          </button>

          <button
            onClick={getEmotionReview}
            disabled={isLoadingReview}
            className="px-4 py-3 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: DIARY_COLORS.eauTrouble,
              color: DIARY_COLORS.nuageDeLait,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            {isLoadingReview ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>💜 情绪复盘</span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* 教练建议 - iOS风格卡片 */}
      {showCoachAdvice && coachAdvice && (
        <div 
          className="rounded-2xl p-6 space-y-3"
          style={{ 
            backgroundColor: DIARY_COLORS.glassmorphism.accent,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="font-semibold flex items-center space-x-2" style={{ color: DIARY_COLORS.espresso, fontSize: '14px' }}>
            <Heart className="w-4 h-4" />
            <span>💚 教练给的小建议</span>
          </div>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: DIARY_COLORS.espresso, fontWeight: 300 }}
          >
            {coachAdvice}
          </div>
        </div>
      )}

      {/* 情绪复盘 - iOS风格卡片 */}
      {showEmotionReview && emotionReview && (
        <div 
          className="rounded-2xl p-6 space-y-3"
          style={{ 
            backgroundColor: cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="font-semibold flex items-center space-x-2" style={{ color: DIARY_COLORS.terreCuite, fontSize: '14px' }}>
            <TrendingUp className="w-4 h-4" />
            <span>💜 情绪复盘</span>
          </div>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: textColor, fontWeight: 300 }}
          >
            {emotionReview}
          </div>
        </div>
      )}
    </div>
  );
}

