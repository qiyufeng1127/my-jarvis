import { useEffect, useState } from 'react';
import { useRPGStore } from '@/stores/rpgStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { ChevronRight, Star, TrendingUp, Target, Coins, AlertTriangle, Award, TreeDeciduous, Gift, Calendar, Sparkles, RefreshCw, FolderOpen } from 'lucide-react';
import { RPGAIAnalyzer } from '@/services/rpgAIAnalyzer';
import { RPGTaskSyncService } from '@/services/rpgTaskSyncService';
import { RPGNotificationService } from '@/services/rpgNotificationService';
import { RPGRadarUpdater } from '@/services/rpgRadarUpdater';
import { RPGTaskMonitor } from '@/services/rpgTaskMonitor';
import { RPGAchievementService } from '@/services/rpgAchievementService';
import AchievementWall from './AchievementWall';
import GrowthTree from './GrowthTree';
import SeasonPass from './SeasonPass';
import AvatarCollectionManager from './AvatarCollectionManager';
import RadarChart from './RadarChart';
import { 
  TaskCompleteAnimation, 
  LevelUpAnimation, 
  ExpGainAnimation, 
  GoldGainAnimation,
  AchievementUnlockAnimation,
  ComboAnimation
} from './RPGAnimations';

// 现代简洁配色 - 参考标签组件
const MODERN_COLORS = {
  background: '#ffffff',           // 纯白背景
  cardBg: '#f8f9fa',              // 浅灰卡片背景
  textPrimary: 'rgb(29, 29, 31)', // 主文字（深灰黑）
  textSecondary: 'rgba(0, 0, 0, 0.5)', // 次要文字（半透明黑）
  primary: 'rgb(109, 153, 120)',  // 主色（绿色）
  warning: 'rgb(255, 245, 229)',  // 警告背景（浅橙）
  warningText: 'rgb(172, 3, 39)', // 警告文字（深红）
  success: 'rgb(109, 153, 120)',  // 成功色（改为主绿色）
  personality: 'rgb(109, 153, 120)', // 性格特质色（改为主绿色）
  achievement: 'rgb(255, 193, 7)', // 成就色（金黄色）
  border: 'rgba(0, 0, 0, 0.1)',   // 边框色
};

// 复古糖果色配色
const VINTAGE_COLORS = {
  cream: '#FFF8E7',
  dustyBlue: '#A8DADC',
  sage: '#B8D4C8',
  terracotta: '#E07A5F',
  mustard: '#F4A261',
  mauve: '#C9ADA7',
  softPink: '#FFD6D6',
  burgundy: '#6B4E71',
  khaki: '#E9DCC9',
};

export default function RPGHomePage() {
  const {
    character,
    dailyTasks,
    achievements,
    goals,
    wealth,
    todayStatus,
    generateDailyTasks,
    completeTask,
    addExp,
    addGold,
    updateCharacter,
  } = useRPGStore();
  
  const { tasks } = useTaskStore();
  const { currentAvatarUrl, checkAndUnlockAvatars } = useAvatarStore();
  
  const [showTaskDetail, setShowTaskDetail] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showGrowthTree, setShowGrowthTree] = useState(false);
  const [showSeasonPass, setShowSeasonPass] = useState(false);
  const [showAvatarManager, setShowAvatarManager] = useState(false);
  const [showRadarChart, setShowRadarChart] = useState(false);
  const [showDailyTasks, setShowDailyTasks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 动画状态
  const [showTaskCompleteAnim, setShowTaskCompleteAnim] = useState(false);
  const [showLevelUpAnim, setShowLevelUpAnim] = useState(false);
  const [showExpGain, setShowExpGain] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const [showGoldGain, setShowGoldGain] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const [showAchievementUnlock, setShowAchievementUnlock] = useState<{ show: boolean; achievement?: any }>({ show: false });
  const [combo, setCombo] = useState(0);
  const [lastCompleteTime, setLastCompleteTime] = useState(0);

  // 检查并解锁头像
  useEffect(() => {
    checkAndUnlockAvatars(character.exp);
  }, [character.exp]);

  // 自动生成每日任务（P0-1 & P0-2集成）
  useEffect(() => {
    const initTasks = async () => {
      // 初始化成就系统（P1）
      RPGAchievementService.initializeAchievements();
      
      // 检查是否需要生成新任务
      const today = new Date().toDateString();
      const lastGenDate = useRPGStore.getState().lastTaskGenerationDate;
      
      if (dailyTasks.length === 0 || lastGenDate !== today) {
        setIsGenerating(true);
        console.log('🎯 开始初始化RPG系统...');
        
        try {
          // 1. 分析用户行为模式（P0-1）
          console.log('📊 步骤1: 分析用户行为模式...');
          const behaviorPattern = await RPGAIAnalyzer.analyzeUserBehavior();
          
          // 2. 生成智能任务（P0-2）
          console.log('🎯 步骤2: 生成智能任务...');
          const aiTasks = await RPGAIAnalyzer.generateDailyTasks();
          
          // 3. 更新角色画像
          console.log('👤 步骤3: 更新角色画像...');
          const profile = await RPGAIAnalyzer.updateCharacterProfile();
          updateCharacter(profile);
          
          // 4. 重新计算雷达图（P0-5）
          console.log('📊 步骤4: 重新计算雷达图...');
          await RPGRadarUpdater.recalculateRadarFromHistory();
          
          // 5. 检查成就（P1）
          console.log('🏆 步骤5: 检查成就...');
          await RPGAchievementService.checkAndUnlockAchievements();
          
          // 6. 添加任务到store
          console.log('💾 步骤6: 保存任务...');
          useRPGStore.setState({ 
            dailyTasks: aiTasks,
            lastTaskGenerationDate: today,
          });
          
          console.log('✅ RPG系统初始化完成！生成', aiTasks.length, '个任务');
          
          // 显示欢迎提示
          RPGNotificationService.show({
            type: 'success',
            title: '🎮 RPG系统已就绪',
            message: `已为你生成${aiTasks.length}个任务，点击"一键领取"同步到时间轴`,
            duration: 5000,
          });
          
        } catch (error) {
          console.error('❌ RPG系统初始化失败：', error);
          // 回退到默认生成
          generateDailyTasks();
          
          RPGNotificationService.showWarning(
            '使用默认任务',
            '无法分析历史数据，已生成默认任务'
          );
        } finally {
          setIsGenerating(false);
        }
      }
    };
    
    initTasks();
  }, []);
  
  // 启动任务监控（P1）
  useEffect(() => {
    console.log('🔍 启动任务监控服务...');
    RPGTaskMonitor.startMonitoring();
    
    // 组件卸载时停止监控
    return () => {
      console.log('🛑 停止任务监控服务...');
      RPGTaskMonitor.stopMonitoring();
    };
  }, []);

  // 处理任务完成（P0-4 & P0-5 & P1集成）
  const handleCompleteTask = async (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    console.log('🎯 任务完成:', task.title);
    
    // 检查连击
    const now = Date.now();
    if (now - lastCompleteTime < 10000) { // 10秒内连续完成
      setCombo(prev => prev + 1);
    } else {
      setCombo(1);
    }
    setLastCompleteTime(now);
    
    // 完成任务
    const oldLevel = character.level;
    completeTask(taskId);
    const newLevel = useRPGStore.getState().character.level;
    
    // P0-4: 显示即时反馈动画
    setShowTaskCompleteAnim(true);
    setShowExpGain({ show: true, amount: task.expReward });
    setShowGoldGain({ show: true, amount: task.goldReward });
    
    // 显示通知
    RPGNotificationService.showTaskComplete(task.title, task.expReward, task.goldReward);
    
    // P0-5: 更新雷达图
    setTimeout(() => {
      console.log('📊 更新雷达图...');
      RPGRadarUpdater.updateRadarOnTaskComplete(task);
      
      // 显示能力提升提示
      if (task.isImprovement) {
        RPGNotificationService.show({
          type: 'success',
          title: '🎊 改进成功！',
          message: '负向行为降低，正向能力提升！',
          duration: 3000,
        });
      }
    }, 1000);
    
    // P1: 检查成就
    setTimeout(async () => {
      console.log('🏆 检查成就...');
      await RPGAchievementService.checkAndUnlockAchievements();
    }, 1500);
    
    // 检查是否升级
    if (newLevel > oldLevel) {
      setTimeout(() => {
        setShowLevelUpAnim(true);
        RPGNotificationService.showLevelUp(newLevel, character.title);
        
        // 升级时检查头像解锁
        checkAndUnlockAvatars(useRPGStore.getState().character.exp);
        
        // 升级时再次检查成就
        RPGAchievementService.checkAndUnlockAchievements();
      }, 2000);
    }
    
    // 改进任务特殊提示
    if (task.isImprovement) {
      setTimeout(() => {
        RPGNotificationService.showImprovementComplete(task.title);
      }, 2500);
    }
    
    // iOS haptic反馈
    if (navigator.vibrate) {
      navigator.vibrate([10, 20, 10]);
    }
  };

  // 一键领取所有任务（P0-3智能同步）
  const handleClaimAllTasks = async () => {
    setIsSyncing(true);
    console.log('📥 开始一键领取任务...');
    
    try {
      // 使用智能调度同步任务
      const result = await RPGTaskSyncService.smartScheduleTasks(
        dailyTasks.filter(t => !t.completed)
      );
      
      console.log('✅ 同步完成，成功:', result.success, '失败:', result.failed);
      
      if (result.success > 0) {
        RPGNotificationService.show({
          type: 'success',
          title: '✅ 同步成功',
          message: `已将 ${result.success} 个任务智能安排到时间轴`,
          duration: 3000,
        });
      }
      
      if (result.failed > 0) {
        RPGNotificationService.showWarning(
          '部分任务同步失败',
          `${result.failed} 个任务无法安排，请手动调整时间轴`
        );
      }
    } catch (error) {
      console.error('❌ 同步失败：', error);
      RPGNotificationService.showWarning('同步失败', '请稍后重试');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // 重新生成任务（P0-2）
  const handleRegenerateTasks = async () => {
    setIsGenerating(true);
    console.log('🔄 重新生成任务...');
    
    try {
      // 1. 重新分析用户行为
      const behaviorPattern = await RPGAIAnalyzer.analyzeUserBehavior();
      
      // 2. 生成新任务
      const aiTasks = await RPGAIAnalyzer.generateDailyTasks();
      
      // 3. 清空现有任务并添加新任务
      useRPGStore.setState({ 
        dailyTasks: aiTasks,
        lastTaskGenerationDate: new Date().toDateString(),
      });
      
      console.log('✅ 任务重新生成完成，共', aiTasks.length, '个任务');
      
      RPGNotificationService.show({
        type: 'success',
        title: '✨ 任务已更新',
        message: `已根据你的最新数据生成${aiTasks.length}个任务`,
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ 重新生成失败:', error);
      
      RPGNotificationService.showWarning(
        '生成失败',
        '请稍后重试'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20" style={{ backgroundColor: MODERN_COLORS.background }}>
      {/* 动画层 */}
      <TaskCompleteAnimation 
        show={showTaskCompleteAnim} 
        onComplete={() => setShowTaskCompleteAnim(false)} 
      />
      <LevelUpAnimation 
        show={showLevelUpAnim} 
        onComplete={() => setShowLevelUpAnim(false)} 
      />
      <ExpGainAnimation show={showExpGain.show} amount={showExpGain.amount} />
      <GoldGainAnimation show={showGoldGain.show} amount={showGoldGain.amount} />
      <AchievementUnlockAnimation 
        show={showAchievementUnlock.show} 
        achievement={showAchievementUnlock.achievement}
        onComplete={() => setShowAchievementUnlock({ show: false })}
      />
      <ComboAnimation show={combo > 1} combo={combo} />
      
      {/* 弹窗 */}
      <AchievementWall isOpen={showAchievements} onClose={() => setShowAchievements(false)} />
      <GrowthTree isOpen={showGrowthTree} onClose={() => setShowGrowthTree(false)} />
      <SeasonPass isOpen={showSeasonPass} onClose={() => setShowSeasonPass(false)} />
      <AvatarCollectionManager 
        isOpen={showAvatarManager} 
        onClose={() => setShowAvatarManager(false)}
        currentExp={character.exp}
      />
      
      {/* 头像管理按钮 - 右上角 */}
      <button
        onClick={() => setShowAvatarManager(true)}
        className="fixed top-4 right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={{ backgroundColor: MODERN_COLORS.primary }}
      >
        <FolderOpen className="w-6 h-6 text-white" />
      </button>
      
      {/* 头像预览收集区 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm"
        style={{ backgroundColor: MODERN_COLORS.cardBg }}
      >
        <div className="text-xs font-semibold mb-3" style={{ color: MODERN_COLORS.textPrimary }}>
          🎨 已收集头像
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {/* 当前头像 */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowAvatarManager(true)}
              className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-sm overflow-hidden relative"
              style={{ backgroundColor: MODERN_COLORS.cardBg }}
            >
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                '🧑💼'
              )}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center"
              >
                当前
              </div>
            </button>
          </div>
          
          {/* 待解锁头像框 */}
          {[1, 2, 3, 4].map((level) => {
            const requiredExp = level * 200; // 每级需要200经验
            const isUnlocked = character.level > level;
            
            return (
              <div key={level} className="flex-shrink-0">
                <button
                  onClick={() => setShowAvatarManager(true)}
                  className="w-20 h-20 rounded-xl flex flex-col items-center justify-center shadow-sm overflow-hidden relative"
                  style={{ 
                    backgroundColor: isUnlocked ? MODERN_COLORS.success : MODERN_COLORS.cardBg,
                    opacity: isUnlocked ? 1 : 0.6
                  }}
                >
                  {isUnlocked ? (
                    <>
                      <span className="text-2xl">✓</span>
                      <div className="text-[10px] mt-1" style={{ color: MODERN_COLORS.textPrimary }}>
                        已解锁
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🔒</span>
                      <div className="text-[10px] mt-1" style={{ color: MODERN_COLORS.textSecondary }}>
                        Lv.{level + 1}
                      </div>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 角色信息面板 */}
      <div 
        className="rounded-2xl p-6 mb-4 shadow-sm"
        style={{ backgroundColor: MODERN_COLORS.cardBg }}
      >
        {/* 头像和基本信息 */}
        <div className="flex items-start gap-4 mb-4">
          {/* 头像 - 可点击更换 */}
          <button
            onClick={() => setShowAvatarManager(true)}
            className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-sm overflow-hidden flex-shrink-0"
            style={{ backgroundColor: '#ffffff' }}
          >
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              '🧑💼'
            )}
          </button>
          
          {/* 等级和称号 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold" style={{ color: MODERN_COLORS.textPrimary }}>
                Lv.{character.level}
              </span>
              <span className="text-sm px-2 py-0.5 rounded" style={{ 
                backgroundColor: MODERN_COLORS.primary,
                color: '#fff'
              }}>
                {character.title}
              </span>
            </div>
            
            {/* 经验条 */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: MODERN_COLORS.textSecondary }}>
                <span>经验值</span>
                <span>{character.exp}/{character.maxExp}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: MODERN_COLORS.border }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${(character.exp / character.maxExp) * 100}%`,
                    backgroundColor: MODERN_COLORS.primary
                  }}
                />
              </div>
            </div>
            
            {/* 精力值和心情值 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs mb-1" style={{ color: MODERN_COLORS.textSecondary }}>
                  <span>⚡</span>
                  <span>精力 {character.energy}/100</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: MODERN_COLORS.border }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${character.energy}%`,
                      backgroundColor: MODERN_COLORS.achievement
                    }}
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs mb-1" style={{ color: MODERN_COLORS.textSecondary }}>
                  <span>😊</span>
                  <span>心情 {character.mood}/100</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: MODERN_COLORS.border }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${character.mood}%`,
                      backgroundColor: MODERN_COLORS.success
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 今日状态标签 */}
        <div className="mb-4">
          <div className="text-xs font-semibold mb-2" style={{ color: MODERN_COLORS.textPrimary }}>
            📊 今日状态
          </div>
          <div className="flex flex-wrap gap-2">
            {todayStatus.map((status, index) => (
              <span 
                key={index}
                className="text-xs px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: MODERN_COLORS.cardBg,
                  color: MODERN_COLORS.textPrimary,
                  border: `1px solid ${MODERN_COLORS.border}`
                }}
              >
                {status}
              </span>
            ))}
          </div>
        </div>
        
        {/* 性格、优势、待改进 */}
        <div className="space-y-3">
          {/* 性格 */}
          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: MODERN_COLORS.textPrimary }}>
              💭 性格特质
            </div>
            <div className="flex flex-wrap gap-2">
              {character.personality.map((trait, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: MODERN_COLORS.personality,
                    color: '#fff'
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
          
          {/* 优势 */}
          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: MODERN_COLORS.textPrimary }}>
              ✅ 优势能力
            </div>
            {character.strengths.map((strength, index) => (
              <div 
                key={index}
                className="text-xs p-2 rounded mb-1.5"
                style={{ 
                  backgroundColor: '#ffffff',
                  border: `1px solid ${MODERN_COLORS.border}`
                }}
              >
                <div className="font-semibold mb-0.5" style={{ color: MODERN_COLORS.textPrimary }}>
                  {strength.label}
                </div>
                <div className="text-xs opacity-80" style={{ color: MODERN_COLORS.textSecondary }}>
                  {strength.description}
                </div>
              </div>
            ))}
          </div>
          
          {/* 待改进行为 */}
          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: MODERN_COLORS.textPrimary }}>
              ⚠️ 待改进行为
            </div>
            {character.improvements.map((improvement, index) => (
              <div 
                key={index}
                className="p-2 rounded mb-1.5"
                style={{ backgroundColor: MODERN_COLORS.warning }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold" style={{ color: MODERN_COLORS.warningText }}>
                    {improvement.label}
                  </span>
                  <span className="text-xs" style={{ color: MODERN_COLORS.warningText }}>
                    {improvement.progress}%
                  </span>
                </div>
                <div className="text-xs mb-1.5 opacity-80" style={{ color: MODERN_COLORS.warningText }}>
                  {improvement.description}
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(172, 3, 39, 0.2)' }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${improvement.progress}%`,
                      backgroundColor: MODERN_COLORS.warningText
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 快捷功能卡片区 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* 能力雷达 */}
        <button
          onClick={() => setShowRadarChart(true)}
          className="rounded-2xl p-4 shadow-sm text-left active:scale-95 transition-transform"
          style={{ 
            backgroundColor: MODERN_COLORS.cardBg,
            border: `1px solid ${MODERN_COLORS.border}`
          }}
        >
          <Star className="w-6 h-6 mb-2" style={{ color: MODERN_COLORS.primary }} />
          <div className="font-bold text-sm mb-1" style={{ color: MODERN_COLORS.textPrimary }}>
            📊 能力雷达
          </div>
          <div className="text-xs opacity-70" style={{ color: MODERN_COLORS.textSecondary }}>
            查看详细数据
          </div>
        </button>
        
        {/* 目标系统 */}
        <button
          onClick={() => setShowGoals(true)}
          className="rounded-2xl p-4 shadow-sm text-left active:scale-95 transition-transform"
          style={{ 
            backgroundColor: MODERN_COLORS.cardBg,
            border: `1px solid ${MODERN_COLORS.border}`
          }}
        >
          <Target className="w-6 h-6 mb-2" style={{ color: MODERN_COLORS.primary }} />
          <div className="font-bold text-sm mb-1" style={{ color: MODERN_COLORS.textPrimary }}>
            🎯 人生目标
          </div>
          <div className="text-xs opacity-70" style={{ color: MODERN_COLORS.textSecondary }}>
            {goals.length} 个进行中
          </div>
        </button>
        
        {/* 每日任务 */}
        <button
          onClick={() => setShowDailyTasks(true)}
          className="rounded-2xl p-4 shadow-sm text-left active:scale-95 transition-transform"
          style={{ 
            backgroundColor: MODERN_COLORS.primary,
          }}
        >
          <Gift className="w-6 h-6 mb-2 text-white" />
          <div className="font-bold text-sm mb-1 text-white">
            📝 每日任务
          </div>
          <div className="text-xs opacity-80 text-white">
            {dailyTasks.filter(t => t.completed).length}/{dailyTasks.length} 已完成
          </div>
        </button>
        
        {/* 成就墙 */}
        <button
          onClick={() => setShowAchievements(true)}
          className="rounded-2xl p-4 shadow-sm text-left active:scale-95 transition-transform"
          style={{ 
            backgroundColor: MODERN_COLORS.achievement,
          }}
        >
          <Award className="w-6 h-6 mb-2 text-white" />
          <div className="font-bold text-sm mb-1 text-white">
            🏅 成就勋章
          </div>
          <div className="text-xs opacity-80 text-white">
            {achievements.filter(a => a.unlocked).length} 个已解锁
          </div>
        </button>
        
        {/* 成长树 */}
        <button
          onClick={() => setShowGrowthTree(true)}
          className="rounded-2xl p-4 shadow-sm text-left active:scale-95 transition-transform"
          style={{ 
            backgroundColor: MODERN_COLORS.cardBg,
            border: `1px solid ${MODERN_COLORS.border}`
          }}
        >
          <TreeDeciduous className="w-6 h-6 mb-2" style={{ color: MODERN_COLORS.success }} />
          <div className="font-bold text-sm mb-1" style={{ color: MODERN_COLORS.textPrimary }}>
            🌳 成长之树
          </div>
          <div className="text-xs opacity-70" style={{ color: MODERN_COLORS.textSecondary }}>
            Lv.{character.level}
          </div>
        </button>
        
        {/* 赛季通行证 */}
        <button
          onClick={() => setShowSeasonPass(true)}
          className="rounded-2xl p-4 shadow-sm text-left active:scale-95 transition-transform"
          style={{ 
            backgroundColor: MODERN_COLORS.cardBg,
            border: `1px solid ${MODERN_COLORS.border}`
          }}
        >
          <Sparkles className="w-6 h-6 mb-2" style={{ color: MODERN_COLORS.primary }} />
          <div className="font-bold text-sm mb-1" style={{ color: MODERN_COLORS.textPrimary }}>
            🎁 赛季通行证
          </div>
          <div className="text-xs opacity-70" style={{ color: MODERN_COLORS.textSecondary }}>
            第1赛季
          </div>
        </button>
      </div>
      
      {/* 能力雷达弹窗 */}
      {showRadarChart && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRadarChart(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: MODERN_COLORS.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: MODERN_COLORS.textPrimary }}>
                📊 能力雷达图
              </h2>
              <button
                onClick={() => setShowRadarChart(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ backgroundColor: MODERN_COLORS.cardBg }}
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 正向能力雷达图 */}
              <div 
                className="rounded-2xl p-6 shadow-sm"
                style={{ 
                  backgroundColor: MODERN_COLORS.cardBg,
                  border: `1px solid ${MODERN_COLORS.border}`
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5" style={{ color: MODERN_COLORS.primary }} />
                  <h3 className="font-bold text-lg" style={{ color: MODERN_COLORS.textPrimary }}>
                    ✨ 正向能力
                  </h3>
                </div>
                <RadarChart type="positive" data={character.positiveStats || []} />
                <p className="text-xs text-center mt-4 opacity-70" style={{ color: MODERN_COLORS.textSecondary }}>
                  基于你的任务完成情况和行为数据实时更新
                </p>
              </div>

              {/* 负向行为雷达图 */}
              <div 
                className="rounded-2xl p-6 shadow-sm"
                style={{ 
                  backgroundColor: MODERN_COLORS.cardBg,
                  border: `1px solid ${MODERN_COLORS.border}`
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" style={{ color: MODERN_COLORS.warningText }} />
                  <h3 className="font-bold text-lg" style={{ color: MODERN_COLORS.textPrimary }}>
                    ⚠️ 待改进行为
                  </h3>
                </div>
                <RadarChart type="negative" data={character.negativeStats || []} />
                <p className="text-xs text-center mt-4 opacity-70" style={{ color: MODERN_COLORS.textSecondary }}>
                  数值越低越好，持续改进可降低负面行为
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 每日任务弹窗 */}
      {showDailyTasks && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDailyTasks(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: MODERN_COLORS.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: MODERN_COLORS.textPrimary }}>
                📝 每日任务宝箱
              </h2>
              <button
                onClick={() => setShowDailyTasks(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ backgroundColor: MODERN_COLORS.cardBg }}
              >
                ✕
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button 
                onClick={handleRegenerateTasks}
                disabled={isGenerating}
                className="text-sm px-4 py-2 rounded-full font-semibold flex items-center gap-2 active:scale-95 transition-transform"
                style={{ 
                  backgroundColor: MODERN_COLORS.cardBg,
                  color: MODERN_COLORS.textPrimary,
                  opacity: isGenerating ? 0.5 : 1,
                  border: `1px solid ${MODERN_COLORS.border}`
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? '生成中' : '重新生成'}
              </button>
              <button 
                onClick={handleClaimAllTasks}
                disabled={isSyncing}
                className="text-sm px-4 py-2 rounded-full font-semibold active:scale-95 transition-transform"
                style={{ 
                  backgroundColor: MODERN_COLORS.primary,
                  color: '#fff',
                  opacity: isSyncing ? 0.5 : 1
                }}
              >
                {isSyncing ? '同步中...' : '一键领取'}
              </button>
            </div>
            
            <div className="space-y-3">
              {dailyTasks.map((task) => (
                <div 
                  key={task.id}
                  className="p-4 rounded-xl transition-all"
                  style={{ 
                    backgroundColor: task.completed ? MODERN_COLORS.cardBg : '#ffffff',
                    border: `2px solid ${task.isImprovement ? MODERN_COLORS.warningText : MODERN_COLORS.border}`,
                    opacity: task.completed ? 0.6 : 1
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => !task.completed && handleCompleteTask(task.id)}
                      className="mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: task.completed ? MODERN_COLORS.success : MODERN_COLORS.cardBg,
                        color: '#fff'
                      }}
                      disabled={task.completed}
                    >
                      {task.completed && '✓'}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {task.isImprovement && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ 
                            backgroundColor: MODERN_COLORS.warning,
                            color: MODERN_COLORS.warningText
                          }}>
                            ⚠️ 改进
                          </span>
                        )}
                        {task.type === 'surprise' && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ 
                            backgroundColor: MODERN_COLORS.achievement,
                            color: '#fff'
                          }}>
                            🎁 惊喜
                          </span>
                        )}
                      </div>
                      
                      <div className="font-semibold mb-1" style={{ 
                        color: MODERN_COLORS.textPrimary,
                        textDecoration: task.completed ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                      
                      <div className="text-sm opacity-70 mb-2" style={{ color: MODERN_COLORS.textSecondary }}>
                        {task.description}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <span style={{ color: MODERN_COLORS.primary }}>
                          ⭐ +{task.expReward} 经验
                        </span>
                        <span style={{ color: MODERN_COLORS.success }}>
                          💰 +{task.goldReward} 金币
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 任务完成进度 */}
            <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${MODERN_COLORS.border}` }}>
              <div className="flex justify-between text-sm mb-2" style={{ color: MODERN_COLORS.textPrimary }}>
                <span>今日完成度</span>
                <span>{dailyTasks.filter(t => t.completed).length}/{dailyTasks.length}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: MODERN_COLORS.border }}>
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(dailyTasks.filter(t => t.completed).length / dailyTasks.length) * 100}%`,
                    backgroundColor: MODERN_COLORS.primary
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

