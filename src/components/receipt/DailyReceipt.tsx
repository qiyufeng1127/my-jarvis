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
  tasksCompleted: number;
  totalTasks: number;
  goldEarned: number;
  totalGold: number;
  efficiency: number;
  aiSummary: string;
  achievements: string[];
  encouragement: string;
}

export default function DailyReceipt({ isOpen, onClose, date, tasks, totalGold, isDark = false }: DailyReceiptProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [printProgress, setPrintProgress] = useState(0); // 打印进度 0-100
  const [showConfetti, setShowConfetti] = useState(false); // 撒花特效
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const receiptRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { config, isConfigured } = useAIStore();
  const { transactions, balance } = useGoldStore();
  const { tasks: allTasks } = useTaskStore();
  
  // 如果没有传入参数，使用默认值
  const receiptDate = date || new Date();
  const receiptTasks = tasks || allTasks || [];
  const receiptTotalGold = totalGold !== undefined ? totalGold : balance;

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
      const completionRate = totalTasksCount > 0 ? (completedTasks / totalTasksCount) * 100 : 0;
      
      // 计算今日获得的金币
      const todayStart = new Date(receiptDate);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(receiptDate);
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.timestamp);
        return transDate >= todayStart && transDate <= todayEnd && t.amount > 0;
      });
      
      const goldEarned = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // 计算效率分数（0-100）
      const efficiency = Math.min(100, Math.round(
        (completionRate * 0.5) + 
        (goldEarned / 10) + 
        (completedTasks * 5)
      ));
      
      // 计算今日得分（0-100）
      const score = Math.min(100, Math.round(
        (completionRate * 0.6) + 
        (efficiency * 0.4)
      ));
      
      // 生成成就标签
      const achievements: string[] = [];
      if (completedTasks >= 10) achievements.push('🏆 任务达人');
      if (completionRate === 100) achievements.push('💯 完美一天');
      if (goldEarned >= 500) achievements.push('💰 金币大户');
      if (efficiency >= 80) achievements.push('⚡ 效率之星');
      if (completedTasks >= 5 && completionRate >= 80) achievements.push('🎯 执行力MAX');
      
      // 生成AI总结
      let aiSummary = '';
      if (isConfigured()) {
        aiSummary = await generateAISummary(receiptTasks, completedTasks, totalTasksCount, goldEarned, efficiency);
      } else {
        // 默认总结
        aiSummary = `今日完成${completedTasks}个任务，获得${goldEarned}金币。${
          completionRate >= 80 ? '表现优秀！' : completionRate >= 60 ? '继续加油！' : '明天会更好！'
        }`;
      }
      
      // 生成鼓励语
      const encouragement = getEncouragement(score, completionRate);
      
      setReceiptData({
        date: receiptDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][receiptDate.getDay()],
        score,
        tasksCompleted: completedTasks,
        totalTasks: totalTasksCount,
        goldEarned,
        totalGold: receiptTotalGold,
        efficiency,
        aiSummary,
        achievements,
        encouragement,
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
      
      // 3.5秒后打印完成，显示撒花特效
      setTimeout(() => {
        setIsPrinting(false);
        playCompleteSound();
        setShowConfetti(true);
        
        // 自动滚动到顶部查看完整小票
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // 3秒后隐藏撒花
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      }, 3500);
    } catch (error) {
      console.error('生成小票失败:', error);
      alert('生成小票失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI生成总结
  const generateAISummary = async (
    tasks: any[], 
    completed: number, 
    total: number, 
    gold: number, 
    efficiency: number
  ): Promise<string> => {
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
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI总结失败:', error);
      // 降级方案：不重复数据的真心话
      const uncompletedList = uncompletedTaskNames.slice(0, 2).join('、');
      if (completionRate >= 80) {
        return uncompletedTaskNames.length > 0 
          ? `宝，今天状态真好！就是"${uncompletedList}"没做完有点可惜，明天早点开始哈～`
          : `今天状态真好！这种节奏保持下去，你就是自己的人生赢家！💪`;
      } else if (completionRate >= 50) {
        return uncompletedTaskNames.length > 0
          ? `今天还行，但"${uncompletedList}"一直没动是咋回事？是不是遇到难题了？要不要跟我说说？`
          : `今天表现还不错，明天再接再厉！`;
      } else if (completionRate >= 30) {
        return `宝贝，今天是不是状态不太好？好几个任务都没碰。要不明天少安排点，先把重要的做完？`;
      } else {
        return `哎呀，今天怎么回事啊？是不是遇到什么烦心事了？要不要跟我说说？明天咱们重新来过！💕`;
      }
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



  // 初始化时生成数据
  useEffect(() => {
    if (isOpen && !receiptData) {
      generateReceiptData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
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
          {/* 出票口 - 玫粉色/暗红色 */}
          <div className="relative bg-gradient-to-b from-rose-900 via-rose-800 to-rose-900 rounded-t-2xl p-6 shadow-2xl w-full max-w-[420px]">
            <div className="text-center mb-4">
              <div className="text-white text-2xl font-bold mb-1 tracking-wider">WANNABE 商店</div>
              <div className="text-white/70 text-sm tracking-wide">今日结算小票</div>
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
                    <div className="absolute inset-0 bg-rose-500/20 animate-pulse" />
                  )}
                </div>
              </div>
              
              {/* 出票口两侧装饰 */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-8 bg-rose-700 rounded-l-full" />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-8 bg-rose-700 rounded-r-full" />
            </div>
            
            {/* 打印状态指示 */}
            {isPrinting && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 rounded-full">
                  <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                  <span className="text-xs text-rose-300 font-mono">PRINTING... {Math.round(printProgress)}%</span>
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
            <div className="relative min-h-full flex items-start justify-center w-full">
              <div
                ref={receiptRef}
                className="bg-white shadow-2xl relative"
                style={{
                  fontFamily: "'Courier New', monospace",
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
              {/* 锯齿边缘（顶部）- 确保可见 */}
              <div className="h-6 bg-white relative">
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        background: i % 2 === 0 ? '#ffffff' : '#f3f4f6',
                        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 小票主体 */}
              <div className="px-8 py-6 space-y-4">
                {/* 标题 - WANNABE商店 */}
                <div className="text-center border-b-2 border-dashed border-gray-300 pb-4">
                  <div className="text-2xl font-bold mb-1">WANNABE 商店</div>
                  <div className="text-sm text-gray-600">今日结算小票</div>
                  <div className="text-xs text-gray-400 mt-1">DAILY RECEIPT</div>
                </div>

              {/* 日期 */}
              <div className="text-center py-2">
                <div className="text-lg font-bold">{receiptData?.date}</div>
                <div className="text-sm text-gray-600">{receiptData?.dayOfWeek}</div>
              </div>

              {/* 分隔线 */}
              <div className="border-t-2 border-dashed border-gray-300" />

              {/* 核心数据 */}
              <div className="space-y-3">
                {/* 今日得分 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">📊 今日得分</span>
                  <span className="text-2xl font-bold text-blue-600">{receiptData?.score}分</span>
                </div>

                {/* 任务完成 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">✅ 任务完成</span>
                  <span className="font-bold">{receiptData?.tasksCompleted}/{receiptData?.totalTasks}</span>
                </div>

                {/* 金币获得 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">💰 今日金币</span>
                  <span className="font-bold text-yellow-600">+{receiptData?.goldEarned}</span>
                </div>

                {/* 总金币 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">💎 总金币</span>
                  <span className="font-bold">{receiptData?.totalGold}</span>
                </div>

                {/* 效率分数 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">⚡ 效率指数</span>
                  <span className="font-bold text-green-600">{receiptData?.efficiency}%</span>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="border-t-2 border-dashed border-gray-300" />

              {/* 成就标签 */}
              {receiptData?.achievements && receiptData.achievements.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-gray-700">🏅 今日成就</div>
                  <div className="flex flex-wrap gap-2">
                    {receiptData.achievements.map((achievement, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full text-xs font-bold"
                      >
                        {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI总结 */}
              {receiptData?.aiSummary && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-gray-700">🤖 AI智能总结</div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 text-sm leading-relaxed">
                    {receiptData.aiSummary}
                  </div>
                </div>
              )}

              {/* 分隔线 */}
              <div className="border-t-2 border-dashed border-gray-300" />

              {/* 鼓励语 */}
              <div className="text-center py-2">
                <div className="text-lg font-bold text-purple-600">
                  {receiptData?.encouragement}
                </div>
              </div>

              {/* 底部信息 */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <div>感谢使用本系统 ❤️</div>
                <div>Keep Going, Keep Growing!</div>
                <div className="pt-2 text-[10px]">
                  {new Date().toLocaleString('zh-CN')}
                </div>
              </div>
            </div>

              {/* 锯齿边缘（底部）- 确保可见 */}
              <div className="h-6 bg-white relative">
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        background: i % 2 === 0 ? '#ffffff' : '#f3f4f6',
                        clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
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

          {/* 撒花特效 */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10%',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random() * 1}s`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB'][Math.floor(Math.random() * 5)],
                    }}
                  />
                </div>
              ))}
            </div>
          )}


        </div>

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
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
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
  );
}

