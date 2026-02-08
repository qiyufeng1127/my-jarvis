import { useState, useRef, useEffect } from 'react';
import { X, Download, Share2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useAIStore } from '@/stores/aiStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTaskStore } from '@/stores/taskStore';

interface DailyReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
  tasks?: any[];
  totalGold?: number;
  isDark?: boolean;
}

interface ReceiptData {
  date: string;
  dayOfWeek: string;
  score: number;
  yesterdayScore: number;
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  yesterdayCompletionRate: number;
  income: number;
  gratitudeCount: number;
  badHabitTime: number;
  yesterdayBadHabitTime: number;
  timelineEvents: number;
  aiSummary: string;
  suggestions: string;
  taskImages: string[];
}

export default function DailyReceipt({ isOpen, onClose, date, tasks, totalGold, isDark = false }: DailyReceiptProps) { 
  const [isPrinting, setIsPrinting] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [printProgress, setPrintProgress] = useState(0); // 打印进度 0-100
  const [showConfetti, setShowConfetti] = useState(false); // 彩带特效
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 当前显示的图片索引
  const receiptRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { config, isConfigured } = useAIStore();
  const { transactions, balance } = useGoldStore();
  const { tasks: allTasks } = useTaskStore();
  
  // 如果没有传入参数，使用默认值
  const receiptDate = date || new Date();
  const receiptTasks = tasks || allTasks || [];
  const receiptTotalGold = totalGold !== undefined ? totalGold : balance;

  // 图片轮播效果
  useEffect(() => {
    if (!receiptData?.taskImages || receiptData.taskImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % receiptData.taskImages.length);
    }, 3000); // 每3秒切换一张图片
    
    return () => clearInterval(interval);
  }, [receiptData?.taskImages]);

  // 播放打印音效（更真实的滋滋滋声）
  const playPrintSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 3; // 3秒打印音效
    const now = audioContext.currentTime;

    // 创建更真实的打印机声音
    for (let i = 0; i < 30; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 随机频率模拟打印机的滋滋声
      oscillator.frequency.value = 80 + Math.random() * 150;
      oscillator.type = 'square';
      
      const startTime = now + (i * 0.1);
      gainNode.gain.setValueAtTime(0.03, startTime);
      gainNode.gain.setValueAtTime(0, startTime + 0.08);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.08);
    }
  };

  // 播放完成音效
  const playCompleteSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // 成功的"叮"声
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  };
  
  // 生成小票数据
  const generateReceiptData = async () => {
    setIsGenerating(true);
    
    try {
      // 计算基础数据
      const completedTasks = receiptTasks.filter(t => t.status === 'completed').length;
      const totalTasksCount = receiptTasks.length;
      const completionRate = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;
      
      // 计算昨天的完成率（模拟数据，实际应该从历史数据获取）
      const yesterdayCompletionRate = Math.max(0, completionRate - Math.floor(Math.random() * 20));
      
      // 计算今日副业收入（从金币交易中筛选）
      const todayStart = new Date(receiptDate);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(receiptDate);
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.timestamp);
        return transDate >= todayStart && transDate <= todayEnd && t.amount > 0;
      });
      
      const income = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // 计算感恩日记数量（模拟数据）
      const gratitudeCount = Math.floor(Math.random() * 5);
      
      // 计算坏习惯时长（模拟数据，单位：小时）
      const badHabitTime = Math.floor(Math.random() * 4);
      const yesterdayBadHabitTime = badHabitTime + Math.floor(Math.random() * 2);
      
      // 计算时间轴事件数量
      const timelineEvents = completedTasks;
      
      // 计算今日得分（0-100）
      const score = Math.min(100, Math.round(
        (completionRate * 0.6) + 
        (income / 10) + 
        (gratitudeCount * 3) -
        (badHabitTime * 2)
      ));
      
      const yesterdayScore = Math.max(0, score - Math.floor(Math.random() * 10));
      
      // 收集任务图片
      const taskImages: string[] = [];
      receiptTasks.forEach(task => {
        if (task.images && Array.isArray(task.images)) {
          taskImages.push(...task.images);
        }
      });
      
      // 生成AI总结
      let aiSummary = '';
      let suggestions = '';
      if (isConfigured()) {
        const aiResponse = await generateAISummary(
          receiptTasks, 
          completedTasks, 
          totalTasksCount, 
          income, 
          completionRate,
          gratitudeCount,
          badHabitTime
        );
        aiSummary = aiResponse.summary;
        suggestions = aiResponse.suggestions;
      } else {
        // 默认总结
        aiSummary = generateDefaultSummary(completionRate, income, gratitudeCount, badHabitTime);
        suggestions = generateDefaultSuggestions(completionRate, badHabitTime);
      }
      
      setReceiptData({
        date: `${receiptDate.getFullYear()} 年 ${receiptDate.getMonth() + 1} 月 ${receiptDate.getDate()} 日`,
        dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][receiptDate.getDay()],
        score,
        yesterdayScore,
        tasksCompleted: completedTasks,
        totalTasks: totalTasksCount,
        completionRate,
        yesterdayCompletionRate,
        income,
        gratitudeCount,
        badHabitTime,
        yesterdayBadHabitTime,
        timelineEvents,
        aiSummary,
        suggestions,
        taskImages,
      });
      
      // 播放打印音效
      playPrintSound();
      setIsPrinting(true);
      setPrintProgress(0);
      
      // 模拟打印进度（从底部到顶部，慢慢出来）
      const printInterval = setInterval(() => {
        setPrintProgress(prev => {
          if (prev >= 100) {
            clearInterval(printInterval);
            return 100;
          }
          return prev + 1.5; // 每50ms增加1.5%，总共约3.3秒
        });
      }, 50);
      
      // 3.5秒后打印完成，显示彩带特效
      setTimeout(() => {
        setIsPrinting(false);
        playCompleteSound();
        setShowConfetti(true);
        
        // 自动滚动到顶部查看完整小票
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // 5秒后隐藏彩带
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      }, 3500);
    } catch (error) {
      console.error('生成小票失败:', error);
      alert('生成小票失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 生成默认总结
  const generateDefaultSummary = (
    completionRate: number,
    income: number,
    gratitudeCount: number,
    badHabitTime: number
  ): string => {
    if (completionRate >= 80) {
      return `宝！今天整体表现我给你 ${Math.round(completionRate)} 分！${badHabitTime > 0 ? `扣的分主要是摸鱼那${badHabitTime}小时，咱说好的专注搞钱呢？` : ''}不过副业收入直接 +${income}，你这执行力我给你磕一个！${gratitudeCount > 0 ? `感恩日记写了 ${gratitudeCount} 条，说明你越来越会爱自己了，这点超棒！` : ''}`;
    } else if (completionRate >= 50) {
      return `今天还行，完成率 ${Math.round(completionRate)}%，但还有提升空间哦！${badHabitTime > 0 ? `刷视频那${badHabitTime}小时是不是有点多了？` : ''}副业收入 +${income}，继续保持！`;
    } else {
      return `宝贝，今天是不是状态不太好？完成率才 ${Math.round(completionRate)}%。要不明天少安排点，先把重要的做完？`;
    }
  };
  
  // 生成默认建议
  const generateDefaultSuggestions = (
    completionRate: number,
    badHabitTime: number
  ): string => {
    if (completionRate >= 80) {
      return badHabitTime > 0 
        ? `明天把刷视频的时间匀 1h 给目标任务，争取完成率冲 90%！晚上睡前再复盘下坏习惯触发点，咱一起把坑填上～冲鸭！你是最棒的！💪`
        : `保持这个节奏，你就是自己的人生赢家！明天继续冲！💪`;
    } else if (completionRate >= 50) {
      return `明天试试把任务拆小一点，一个个攻克会更有成就感！加油宝贝！💕`;
    } else {
      return `明天重新开始，咱们一起加油！记住，每一天都是新的开始！🌟`;
    }
  };

  // AI生成总结
  const generateAISummary = async (
    tasks: any[], 
    completed: number, 
    total: number, 
    gold: number, 
    efficiency: number,
    gratitudeCount: number,
    badHabitTime: number
  ): Promise<{ summary: string; suggestions: string }> => {
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // 找出完成和未完成的任务
    const completedTaskNames = tasks.filter(t => t.status === 'completed').map(t => t.title);
    const uncompletedTaskNames = tasks.filter(t => t.status !== 'completed').map(t => t.title);
    
    const prompt = `你是我最好的闺蜜，刚看完我今天的任务完成情况。现在要给我一段真心话。

【我今天的情况】
完成率：${completionRate}%
完成的任务：${completedTaskNames.length > 0 ? completedTaskNames.join('、') : '无'}
没完成的：${uncompletedTaskNames.length > 0 ? uncompletedTaskNames.join('、') : '无'}
效率分：${efficiency}/100

【重要！！！】
1. 小票上已经有完成率、金币这些数据了，你千万别再重复说"完成X个任务"、"获得X金币"这种话！
2. 我要的是你作为闺蜜的真心话，不是数据报告！
3. 不要说"您"、"建议您"、"继续保持"、"再接再厉"这种客套话和空话！
4. 要说人话！就像我们平时微信聊天那样！

【你要做的】
- 看到我做得好的地方，真心夸我（别敷衍，要具体）
- 看到我的问题，直接说（别客气，我们是闺蜜）
- 给我一些真正有用的建议（不是废话）
- 让我看完能有所触动，而不是"哦，知道了"就完了

【根据完成率给反馈】

完成率80%以上：
- 真心为我高兴，但别太夸张
- 可以提醒我哪个任务做得特别好
- 或者提醒我要注意休息，别累坏了
- 比如："宝，今天状态真好！就是看你'学习'那个任务拖到最后了，明天早点开始哈～"

完成率50-80%：
- 肯定我做得不错的地方
- 直接指出哪个任务拖了后腿
- 给个实在的建议
- 比如："今天还行，但'工作'那个一直没动是咋回事？是不是遇到难题了？要不要跟我说说？"

完成率30-50%：
- 温柔但直接地问我是不是遇到什么事了
- 帮我分析可能的原因
- 给我打打气
- 比如："宝贝，今天是不是状态不太好？好几个任务都没碰。要不明天少安排点，先把重要的做完？"

完成率30%以下：
- 可以毒舌一点，但要让我知道你是关心我
- 问我是不是状态不好，需不需要聊聊
- 提醒我明天重新开始
- 比如："哎呀，今天怎么回事啊？是不是遇到什么烦心事了？要不要跟我说说？明天咱们重新来过！"

【字数要求】
40-60字，简洁有力，别啰嗦。要让我一看就懂，一看就有感觉。

【禁止事项】
❌ 不要重复数据（完成X个、获得X金币）
❌ 不要说客套话（您、建议您、继续保持）
❌ 不要说空话（加油、努力、坚持）
❌ 不要太正式（要像微信聊天）
❌ 不要敷衍（要真诚、具体）

现在，请给我一段真心话。记住：我要的是闺蜜的真心话，不是AI的客套话！要让我看完能有所触动！`;

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: '你是用户最好的闺蜜，说话直接、真诚、有温度。你会根据实际情况给出真心话，该夸就夸，该批评就批评，但始终是关心对方的。你说话就像平时微信聊天一样自然，不会说客套话和空话。每次的文案都要不一样，要让人看了有感触。' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 1.0, // 最高温度，最大化多样性和创意
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error('AI生成失败');
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content.trim();
      
      // 将AI返回的内容分为总结和建议两部分
      const parts = aiContent.split('\n\n');
      return {
        summary: parts[0] || aiContent,
        suggestions: parts[1] || generateDefaultSuggestions(completionRate, badHabitTime)
      };
    } catch (error) {
      console.error('AI总结失败:', error);
      // 降级方案：不重复数据的真心话
      const uncompletedList = uncompletedTaskNames.slice(0, 2).join('、');
      let summary = '';
      if (completionRate >= 80) {
        summary = uncompletedTaskNames.length > 0 
          ? `宝，今天状态真好！就是"${uncompletedList}"没做完有点可惜，明天早点开始哈～`
          : `今天状态真好！这种节奏保持下去，你就是自己的人生赢家！💪`;
      } else if (completionRate >= 50) {
        summary = uncompletedTaskNames.length > 0
          ? `今天还行，但"${uncompletedList}"一直没动是咋回事？是不是遇到难题了？要不要跟我说说？`
          : `今天表现还不错，明天再接再厉！`;
      } else if (completionRate >= 30) {
        summary = `宝贝，今天是不是状态不太好？好几个任务都没碰。要不明天少安排点，先把重要的做完？`;
      } else {
        summary = `哎呀，今天怎么回事啊？是不是遇到什么烦心事了？要不要跟我说说？明天咱们重新来过！💕`;
      }
      
      return {
        summary,
        suggestions: generateDefaultSuggestions(completionRate, badHabitTime)
      };
    }
  };

  // 获取鼓励语
  const getEncouragement = (score: number, completionRate: number): string => {
    if (score >= 90) return '所以不管发生什么事，都请安静且愉快地接受人生，勇敢地、大胆地，而且永远地微笑着！';
    if (score >= 80) return ' 安静去做、直到成功！';
    if (score >= 70) return ' “祝你自由自在，祝你不被左右情绪”！';
    if (score >= 60) return ' 正确的开始，微小的长进，然后持续';
    if (completionRate === 0) return '不喜欢的人或事，果断拒绝。我的心态就是我的风水，我心态好，人就顺！';
    return '💫 感恩宇宙 我能创造我想要的一切！';
  };

  // 长按开始
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    const timer = setTimeout(() => {
      // 获取触摸/点击位置
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setMenuPosition({ x, y });
      setShowSaveMenu(true);
    }, 800); // 长按800ms触发
    setLongPressTimer(timer);
  };

  // 长按结束
  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 保存为 Live Photo (实际上是 GIF)
  const handleSaveLive = async () => {
    setShowSaveMenu(false);
    // TODO: 实现保存为动图的功能
    alert('保存为 Live 功能开发中...');
  };

  // 保存照片
  const handleSavePhoto = async () => {
    setShowSaveMenu(false);
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `每日小票-${receiptData?.date}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };



  // 打开时自动生成小票
  useEffect(() => {
    if (isOpen && !receiptData) {
      generateReceiptData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="relative w-full h-full md:max-w-md md:h-auto md:p-4">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* 出票口容器 */}
        <div className="relative w-full h-full md:h-auto flex flex-col items-center">
          {/* 出票口 - 粉色系 */}
          <div className="relative bg-gradient-to-b from-pink-400 via-pink-500 to-pink-600 rounded-t-2xl p-6 shadow-2xl w-full max-w-[420px]" style={{ fontFamily: "'Courier New', 'Courier', monospace" }}>
            <div className="text-center mb-4">
              <div className="text-white text-2xl font-bold mb-1 tracking-wider" style={{ fontFamily: "'Courier New', 'Courier', monospace" }}>今日成长小票</div>
              <div className="text-white/80 text-xs tracking-wide">DAILY GROWTH RECEIPT</div>
            </div>
            
            {/* 出票口开口 - 更真实的效果 */}
            <div className="relative">
              {/* 出票口外壳 */}
              <div className="bg-black/60 rounded-xl p-3 shadow-inner">
                {/* 出票口内部 - 小票从这里出来 */}
                <div className="h-10 bg-black rounded-lg relative overflow-visible shadow-2xl">
                  {/* 出票口光效 */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                  
                  {/* 出票口横线装饰 */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  {/* 打印中的闪烁效果 */}
                  {isPrinting && (
                    <div className="absolute inset-0 bg-pink-500/20 animate-pulse" />
                  )}
                </div>
              </div>
              
              {/* 出票口两侧装饰 */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-8 bg-pink-600 rounded-l-full" />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-8 bg-pink-600 rounded-r-full" />
            </div>
            
            {/* 打印状态指示 */}
            {isPrinting && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/20 rounded-full">
                  <div className="w-2 h-2 bg-pink-300 rounded-full animate-pulse" />
                  <span className="text-xs text-pink-100 font-mono">PRINTING... {Math.round(printProgress)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* 小票滚动容器 - 直接连接到出票口，无间隙 */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto bg-black md:max-h-[70vh] relative w-full flex justify-center"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4b5563 #000000',
            }}
          >
            {/* 小票内容 - 从出票口出来，宽度比出票口窄 */}
            {receiptData && (
            <div className="relative min-h-full flex items-start justify-center w-full">
              <div
                ref={receiptRef}
                className="shadow-2xl relative"
                style={{
                  backgroundColor: '#F5F5DC', // 米白色
                  fontFamily: "'Courier New', 'Courier', monospace",
                  width: '360px', // 比出票口窄
                  maxWidth: '90%',
                  transform: isPrinting 
                    ? `translateY(-${100 - printProgress}%)` 
                    : 'translateY(0)',
                  transition: isPrinting ? 'transform 0.05s linear' : 'transform 0.3s ease-out',
                  marginTop: isPrinting ? '-100%' : '0',
                }}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
              {/* 打印进度遮罩 - 从底部到顶部逐渐显示 */}
              {isPrinting && (
                <div 
                  className="absolute inset-0 bg-gray-900 z-10 pointer-events-none"
                  style={{
                    clipPath: `inset(0 0 ${printProgress}% 0)`,
                    transition: 'clip-path 0.05s linear',
                  }}
                />
              )}
              {/* 锯齿边缘（顶部）- 黑色背景 */}
              <div className="h-6 relative" style={{ backgroundColor: '#F5F5DC' }}>
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        background: i % 2 === 0 ? '#F5F5DC' : '#000000',
                        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 小票主体 */}
              <div className="px-6 py-6 space-y-4">
                {/* 顶部：今日成长得分 - 最醒目 */}
                <div className="text-center py-4">
                  <div className="text-xs text-gray-600 mb-2">✨ 今日成长得分 ✨</div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2" style={{ textShadow: '0 0 20px rgba(236, 72, 153, 0.3)' }}>
                    {receiptData?.score}/100
                  </div>
                  {receiptData && receiptData.score > receiptData.yesterdayScore && (
                    <div className="text-xs text-green-600 font-bold">
                      ✅ 比昨天进步 {receiptData.score - receiptData.yesterdayScore} 分！宝你真的在变更好！
                    </div>
                  )}
                </div>

                {/* 分隔线 */}
                <div className="border-t-2 border-dashed border-gray-400" />

                {/* 核心数据看板 - 彩色小模块 */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-700 mb-2">📊 核心数据看板</div>
                  
                  {/* 目标完成率 */}
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-xs font-medium">目标完成率</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600">{receiptData?.completionRate}%</div>
                      {receiptData && receiptData.completionRate > receiptData.yesterdayCompletionRate && (
                        <div className="text-[10px] text-green-600">昨天 {receiptData.yesterdayCompletionRate}% ✅ 进步了！</div>
                      )}
                    </div>
                  </div>

                  {/* 今日副业收入 */}
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-xs font-medium">今日副业收入</span>
                    </div>
                    <div className="text-sm font-bold text-yellow-600">+¥{receiptData?.income}</div>
                  </div>

                  {/* 感恩日记 */}
                  <div className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <span className="text-xs font-medium">感恩日记</span>
                    </div>
                    <div className="text-sm font-bold text-pink-600">{receiptData?.gratitudeCount} 条</div>
                  </div>

                  {/* 坏习惯预警 */}
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚫</span>
                      <span className="text-xs font-medium">坏习惯预警</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">刷短视频 {receiptData?.badHabitTime}h</div>
                      {receiptData && receiptData.badHabitTime < receiptData.yesterdayBadHabitTime && (
                        <div className="text-[10px] text-green-600">比昨天少 {receiptData.yesterdayBadHabitTime - receiptData.badHabitTime}h！继续冲！</div>
                      )}
                    </div>
                  </div>

                  {/* 时间轴事件 */}
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span className="text-xs font-medium">时间轴事件</span>
                    </div>
                    <div className="text-sm font-bold text-purple-600">完成 {receiptData?.timelineEvents} 张事件卡片</div>
                  </div>
                </div>

                {/* 图片轮播 - 如果有任务图片 */}
                {receiptData?.taskImages && receiptData.taskImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700">📸 今日精彩瞬间</div>
                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={receiptData.taskImages[currentImageIndex]} 
                        alt="任务图片"
                        className="w-full h-full object-cover transition-opacity duration-500"
                      />
                      {receiptData.taskImages.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {receiptData.taskImages.map((_, idx) => (
                            <div 
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 分隔线 */}
                <div className="border-t-2 border-dashed border-gray-400" />

                {/* 今日总结 - 闺蜜风 */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-700">💬 今日总结</div>
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 text-xs leading-relaxed text-gray-800">
                    {receiptData?.aiSummary || '宝，今天表现不错哦！继续加油！💪'}
                  </div>
                </div>

                {/* 落地建议 */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-700">👉 落地建议</div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-xs leading-relaxed text-gray-800">
                    {receiptData?.suggestions || '明天继续保持这个节奏，你一定可以的！🌟'}
                  </div>
                </div>

                {/* 分隔线 */}
                <div className="border-t-2 border-dashed border-gray-400" />

                {/* 底部信息 - 精简 */}
                <div className="text-center space-y-2">
                  <div className="text-sm font-bold text-purple-600">Keep going. 💪</div>
                  <div className="text-[10px] text-gray-500">
                    {receiptData?.date} {receiptData?.dayOfWeek}
                  </div>
                </div>
              </div>

              {/* 锯齿边缘（底部）- 黑色背景 */}
              <div className="h-6 relative" style={{ backgroundColor: '#F5F5DC' }}>
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        background: i % 2 === 0 ? '#F5F5DC' : '#000000',
                        clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
            )}
        </div>

        {/* 长按菜单 */}
        {showSaveMenu && (
          <>
            {/* 遮罩层 */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowSaveMenu(false)}
            />
            {/* 菜单 */}
            <div 
              className="fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{
                left: `${menuPosition.x}px`,
                top: `${menuPosition.y}px`,
                transform: 'translate(-50%, -50%)',
                minWidth: '200px',
              }}
            >
              <button
                onClick={handleSavePhoto}
                className="w-full px-6 py-4 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 border-b border-gray-200"
              >
                <Download className="w-5 h-5 text-blue-600" />
                <span className="font-medium">保存照片</span>
              </button>
              <button
                onClick={handleSaveLive}
                className="w-full px-6 py-4 text-left hover:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full border-2 border-purple-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                </div>
                <span className="font-medium">保存为 Live</span>
              </button>
            </div>
          </>
        )}

        {/* 彩带特效 - 大尺寸真实撒落效果 */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-ribbon"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2.5 + Math.random() * 1.5}s`,
                }}
              >
                <div
                  className="ribbon"
                  style={{
                    width: '12px',
                    height: '60px',
                    background: ['linear-gradient(45deg, #FFD700, #FFA500)', 'linear-gradient(45deg, #FF69B4, #FF1493)', 'linear-gradient(45deg, #00CED1, #1E90FF)', 'linear-gradient(45deg, #FF6347, #DC143C)', 'linear-gradient(45deg, #9370DB, #8A2BE2)'][Math.floor(Math.random() * 5)],
                    borderRadius: '2px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 加载状态 */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg z-50">
            <div className="text-center">
              <Printer className="w-12 h-12 mx-auto mb-4 animate-bounce text-white" />
              <div className="text-lg font-bold text-white">正在生成小票...</div>
              <div className="text-sm text-white/70 mt-2">滋滋滋~ 📄</div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ribbon {
          0% {
            transform: translateY(0) rotateZ(0deg) rotateY(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg) rotateY(360deg);
            opacity: 0.8;
          }
        }
        .animate-ribbon {
          animation: ribbon 3s ease-out forwards;
        }
        .ribbon {
          transform-style: preserve-3d;
        }
        
        /* 自定义滚动条 */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #000000;
        }
        ::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}}></style>
        </div>
      </div>
    </>
  );
}


