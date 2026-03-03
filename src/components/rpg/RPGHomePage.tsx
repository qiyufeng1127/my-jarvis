import { useEffect, useState } from 'react';
import { useRPGStore } from '@/stores/rpgStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { ChevronRight, Star, TrendingUp, Target, Coins, AlertTriangle, Award, TreeDeciduous, Gift, Calendar, Sparkles, RefreshCw, FolderOpen } from 'lucide-react';
import { RPGAIAnalyzer } from '@/services/rpgAIAnalyzer';
import { RPGTaskSyncService } from '@/services/rpgTaskSyncService';
import { RPGNotificationService } from '@/services/rpgNotificationService';
import AchievementWall from './AchievementWall';
import GrowthTree from './GrowthTree';
import SeasonPass from './SeasonPass';
import AvatarCollectionManager from './AvatarCollectionManager';
import { 
  TaskCompleteAnimation, 
  LevelUpAnimation, 
  ExpGainAnimation, 
  GoldGainAnimation,
  AchievementUnlockAnimation,
  ComboAnimation
} from './RPGAnimations';

// iOS复古风格颜色 - 根据参考图片更新
const VINTAGE_COLORS = {
  cream: '#FFF4E6',        // 奶油白
  softPink: '#F5D5CB',     // 柔粉
  dustyRose: '#E8B4B8',    // 灰玫瑰
  mauve: '#C8A2C8',        // 淡紫
  deepPurple: '#6B4C6B',   // 深紫
  beige: '#E8DCC4',        // 米色
  khaki: '#D4C5A0',        // 卡其
  sage: '#B8C5A8',         // 鼠尾草绿
  dustyBlue: '#A8B8C8',    // 灰蓝
  terracotta: '#C97064',   // 陶土红
  mustard: '#D4A574',      // 芥末黄
  burgundy: '#43302E',     // 深褐
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

  // 自动生成每日任务（使用AI）
  useEffect(() => {
    const initTasks = async () => {
      if (dailyTasks.length === 0) {
        setIsGenerating(true);
        try {
          const aiTasks = await RPGAIAnalyzer.generateDailyTasks();
          aiTasks.forEach(task => {
            useRPGStore.getState().addDailyTask(task);
          });
          
          // 同时更新角色画像
          const profile = await RPGAIAnalyzer.updateCharacterProfile();
          updateCharacter(profile);
        } catch (error) {
          console.error('AI生成任务失败：', error);
          // 回退到默认生成
          generateDailyTasks();
        } finally {
          setIsGenerating(false);
        }
      }
    };
    
    initTasks();
  }, []);

  // 处理任务完成
  const handleCompleteTask = (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
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
    
    // 显示动画
    setShowTaskCompleteAnim(true);
    setShowExpGain({ show: true, amount: task.expReward });
    setShowGoldGain({ show: true, amount: task.goldReward });
    
    // 显示通知
    RPGNotificationService.showTaskComplete(task.title, task.expReward, task.goldReward);
    
    // 检查是否升级
    if (newLevel > oldLevel) {
      setTimeout(() => {
        setShowLevelUpAnim(true);
        RPGNotificationService.showLevelUp(newLevel, character.title);
      }, 1000);
    }
    
    // 改进任务特殊提示
    if (task.isImprovement) {
      setTimeout(() => {
        RPGNotificationService.showImprovementComplete(task.title);
      }, 1500);
    }
  };

  // 一键领取所有任务（智能同步）
  const handleClaimAllTasks = async () => {
    setIsSyncing(true);
    try {
      const result = await RPGTaskSyncService.smartScheduleTasks(dailyTasks.filter(t => !t.completed));
      
      RPGNotificationService.show({
        type: 'success',
        title: '✅ 同步成功',
        message: `已将 ${result.success} 个任务同步到时间轴`,
        duration: 3000,
      });
    } catch (error) {
      console.error('同步失败：', error);
      RPGNotificationService.showWarning('同步失败', '请稍后重试');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // 重新生成任务
  const handleRegenerateTasks = async () => {
    setIsGenerating(true);
    try {
      const aiTasks = await RPGAIAnalyzer.generateDailyTasks();
      // 清空现有任务
      useRPGStore.setState({ dailyTasks: [] });
      // 添加新任务
      aiTasks.forEach(task => {
        useRPGStore.getState().addDailyTask(task);
      });
      
      RPGNotificationService.show({
        type: 'success',
        title: '✨ 任务已更新',
        message: '已根据你的数据生成新任务',
        duration: 3000,
      });
    } catch (error) {
      console.error('重新生成失败：', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20" style={{ backgroundColor: VINTAGE_COLORS.cream }}>
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
        className="fixed top-4 right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: VINTAGE_COLORS.mauve }}
      >
        <FolderOpen className="w-6 h-6 text-white" />
      </button>
      
      {/* 角色信息面板 */}
      <div 
        className="rounded-2xl p-6 mb-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.beige }}
      >
        {/* 头像和基本信息 */}
        <div className="flex items-start gap-4 mb-4">
          {/* 头像 - 可点击更换 */}
          <button
            onClick={() => setShowAvatarManager(true)}
            className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-sm overflow-hidden flex-shrink-0"
            style={{ backgroundColor: VINTAGE_COLORS.dustyBlue }}
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
              <span className="text-2xl font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
                Lv.{character.level}
              </span>
              <span className="text-sm px-2 py-0.5 rounded" style={{ 
                backgroundColor: VINTAGE_COLORS.mustard,
                color: '#fff'
              }}>
                {character.title}
              </span>
            </div>
            
            {/* 经验条 */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: VINTAGE_COLORS.burgundy }}>
                <span>经验值</span>
                <span>{character.exp}/{character.maxExp}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: VINTAGE_COLORS.khaki }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${(character.exp / character.maxExp) * 100}%`,
                    backgroundColor: VINTAGE_COLORS.sage
                  }}
                />
              </div>
            </div>
            
            {/* 精力值和心情值 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs mb-1" style={{ color: VINTAGE_COLORS.burgundy }}>
                  <span>⚡</span>
                  <span>精力 {character.energy}/100</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: VINTAGE_COLORS.khaki }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${character.energy}%`,
                      backgroundColor: VINTAGE_COLORS.dustyBlue
                    }}
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs mb-1" style={{ color: VINTAGE_COLORS.burgundy }}>
                  <span>😊</span>
                  <span>心情 {character.mood}/100</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: VINTAGE_COLORS.khaki }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${character.mood}%`,
                      backgroundColor: VINTAGE_COLORS.softPink
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 今日状态标签 */}
        <div className="mb-4">
          <div className="text-xs font-semibold mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
            📊 今日状态
          </div>
          <div className="flex flex-wrap gap-2">
            {todayStatus.map((status, index) => (
              <span 
                key={index}
                className="text-xs px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: VINTAGE_COLORS.dustyBlue,
                  color: VINTAGE_COLORS.burgundy
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
            <div className="text-xs font-semibold mb-1.5" style={{ color: VINTAGE_COLORS.burgundy }}>
              💭 性格特质
            </div>
            <div className="flex flex-wrap gap-2">
              {character.personality.map((trait, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: VINTAGE_COLORS.mauve,
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
            <div className="text-xs font-semibold mb-1.5" style={{ color: VINTAGE_COLORS.burgundy }}>
              ✅ 优势能力
            </div>
            {character.strengths.map((strength, index) => (
              <div 
                key={index}
                className="text-xs p-2 rounded mb-1.5"
                style={{ backgroundColor: VINTAGE_COLORS.sage }}
              >
                <div className="font-semibold mb-0.5" style={{ color: VINTAGE_COLORS.burgundy }}>
                  {strength.label}
                </div>
                <div className="text-xs opacity-80" style={{ color: VINTAGE_COLORS.burgundy }}>
                  {strength.description}
                </div>
              </div>
            ))}
          </div>
          
          {/* 待改进行为 */}
          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: VINTAGE_COLORS.burgundy }}>
              ⚠️ 待改进行为
            </div>
            {character.improvements.map((improvement, index) => (
              <div 
                key={index}
                className="p-2 rounded mb-1.5"
                style={{ backgroundColor: VINTAGE_COLORS.softPink }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold" style={{ color: VINTAGE_COLORS.burgundy }}>
                    {improvement.label}
                  </span>
                  <span className="text-xs" style={{ color: VINTAGE_COLORS.burgundy }}>
                    {improvement.progress}%
                  </span>
                </div>
                <div className="text-xs mb-1.5 opacity-80" style={{ color: VINTAGE_COLORS.burgundy }}>
                  {improvement.description}
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: VINTAGE_COLORS.khaki }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${improvement.progress}%`,
                      backgroundColor: VINTAGE_COLORS.terracotta
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 头像收集展示区域 */}
      {useAvatarStore.getState().collections.length > 0 && (
        <div className="mb-4 space-y-3">
          {useAvatarStore.getState().collections.map((collection) => {
            const unlockedCount = collection.avatars.filter(a => a.unlocked).length;
            const totalCount = collection.avatars.length;
            
            return (
              <div 
                key={collection.id}
                className="rounded-2xl overflow-hidden shadow-sm"
                style={{ backgroundColor: VINTAGE_COLORS.beige }}
              >
                {/* 集合头部 - 可点击折叠/展开 */}
                <button
                  onClick={() => useAvatarStore.getState().toggleCollapse(collection.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{collection.emoji}</span>
                    <div className="text-left">
                      <div className="font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
                        已收集 {collection.title}
                      </div>
                      <div className="text-xs opacity-70" style={{ color: VINTAGE_COLORS.burgundy }}>
                        {unlockedCount}/{totalCount} 已解锁
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight 
                    className={`w-5 h-5 transition-transform ${collection.collapsed ? '' : 'rotate-90'}`}
                    style={{ color: VINTAGE_COLORS.burgundy }}
                  />
                </button>
                
                {/* 头像网格 - 展开时显示 */}
                {!collection.collapsed && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-5 gap-2">
                      {collection.avatars.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => {
                            if (avatar.unlocked) {
                              useAvatarStore.getState().setCurrentAvatar(avatar.imageUrl);
                            }
                          }}
                          className="aspect-square rounded-xl overflow-hidden relative transition-all"
                          style={{
                            backgroundColor: VINTAGE_COLORS.khaki,
                            opacity: avatar.unlocked ? 1 : 0.5,
                            border: currentAvatarUrl === avatar.imageUrl ? `3px solid ${VINTAGE_COLORS.sage}` : 'none',
                          }}
                        >
                          <img 
                            src={avatar.imageUrl} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                          
                          {/* 未解锁遮罩 */}
                          {!avatar.unlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                              <div className="text-white text-xs font-bold mb-1">🔒</div>
                              <div className="text-white text-xs font-semibold">
                                {avatar.requiredExp}
                              </div>
                              <div className="text-white text-[10px]">EXP</div>
                            </div>
                          )}
                          
                          {/* 已选中标记 */}
                          {currentAvatarUrl === avatar.imageUrl && (
                            <div 
                              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: VINTAGE_COLORS.sage }}
                            >
                              <span className="text-xs text-white">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 目标系统 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.dustyBlue }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />
            <span className="font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
              🎯 人生目标
            </span>
          </div>
          <button 
            onClick={() => setShowGoals(true)}
            className="text-xs px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: VINTAGE_COLORS.beige,
              color: VINTAGE_COLORS.burgundy
            }}
          >
            查看全部
          </button>
        </div>
        
        {goals.slice(0, 2).map((goal) => (
          <div key={goal.id} className="mb-3 last:mb-0">
            <div className="flex justify-between text-sm mb-1" style={{ color: VINTAGE_COLORS.burgundy }}>
              <span className="font-semibold">{goal.title}</span>
              <span>{goal.progress}/{goal.maxProgress}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: VINTAGE_COLORS.khaki }}>
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${(goal.progress / goal.maxProgress) * 100}%`,
                  backgroundColor: VINTAGE_COLORS.mustard
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 财富系统 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.mustard }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-white" />
          <span className="font-bold text-white">💰 财富状况</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
            <div className="text-xs text-white opacity-80 mb-1">当前余额</div>
            <div className="text-xl font-bold text-white">{wealth.balance}</div>
          </div>
          
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
            <div className="text-xs text-white opacity-80 mb-1">今日收入</div>
            <div className="text-xl font-bold text-white">+{wealth.todayEarned}</div>
          </div>
        </div>
        
        {wealth.todaySpent > wealth.budget && (
          <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: VINTAGE_COLORS.terracotta, color: '#fff' }}>
            ⚠️ 今日支出超预算 {wealth.todaySpent - wealth.budget} 元
          </div>
        )}
      </div>

      {/* 每日任务系统 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm"
        style={{ backgroundColor: '#fff' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />
            <span className="font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
              📝 每日任务宝箱
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRegenerateTasks}
              disabled={isGenerating}
              className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
              style={{ 
                backgroundColor: VINTAGE_COLORS.dustyBlue,
                color: VINTAGE_COLORS.burgundy,
                opacity: isGenerating ? 0.5 : 1
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? '生成中' : '重新生成'}
            </button>
            <button 
              onClick={handleClaimAllTasks}
              disabled={isSyncing}
              className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ 
                backgroundColor: VINTAGE_COLORS.sage,
                color: '#fff',
                opacity: isSyncing ? 0.5 : 1
              }}
            >
              {isSyncing ? '同步中...' : '一键领取'}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {dailyTasks.map((task) => (
            <div 
              key={task.id}
              className="p-3 rounded-xl border-2 transition-all"
              style={{ 
                backgroundColor: task.completed ? VINTAGE_COLORS.sage : '#fff',
                borderColor: task.isImprovement ? VINTAGE_COLORS.terracotta : VINTAGE_COLORS.khaki,
                opacity: task.completed ? 0.6 : 1
              }}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => !task.completed && handleCompleteTask(task.id)}
                  className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: task.completed ? VINTAGE_COLORS.sage : VINTAGE_COLORS.khaki,
                    color: '#fff'
                  }}
                  disabled={task.completed}
                >
                  {task.completed && '✓'}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {task.isImprovement && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                        backgroundColor: VINTAGE_COLORS.terracotta,
                        color: '#fff'
                      }}>
                        ⚠️ 改进
                      </span>
                    )}
                    {task.type === 'surprise' && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                        backgroundColor: VINTAGE_COLORS.mauve,
                        color: '#fff'
                      }}>
                        🎁 惊喜
                      </span>
                    )}
                  </div>
                  
                  <div className="font-semibold text-sm mb-1" style={{ 
                    color: VINTAGE_COLORS.burgundy,
                    textDecoration: task.completed ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </div>
                  
                  <div className="text-xs opacity-70 mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
                    {task.description}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: VINTAGE_COLORS.sage }}>
                      ⭐ +{task.expReward} 经验
                    </span>
                    <span style={{ color: VINTAGE_COLORS.mustard }}>
                      💰 +{task.goldReward} 金币
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 任务完成进度 */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: VINTAGE_COLORS.khaki }}>
          <div className="flex justify-between text-xs mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
            <span>今日完成度</span>
            <span>{dailyTasks.filter(t => t.completed).length}/{dailyTasks.length}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: VINTAGE_COLORS.khaki }}>
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${(dailyTasks.filter(t => t.completed).length / dailyTasks.length) * 100}%`,
                backgroundColor: VINTAGE_COLORS.sage
              }}
            />
          </div>
        </div>
      </div>

      {/* 成就墙预览 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm cursor-pointer"
        style={{ backgroundColor: VINTAGE_COLORS.mauve }}
        onClick={() => setShowAchievements(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-white" />
            <span className="font-bold text-white">🏅 成就勋章</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {achievements.slice(0, 5).map((achievement) => (
            <div 
              key={achievement.id}
              className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
              style={{ 
                backgroundColor: achievement.unlocked ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                opacity: achievement.unlocked ? 1 : 0.4
              }}
            >
              {achievement.icon}
            </div>
          ))}
        </div>
      </div>

      {/* 成长树和赛季通行证 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setShowGrowthTree(true)}
          className="rounded-2xl p-4 shadow-sm text-left"
          style={{ backgroundColor: VINTAGE_COLORS.sage }}
        >
          <TreeDeciduous className="w-6 h-6 mb-2" style={{ color: VINTAGE_COLORS.burgundy }} />
          <div className="font-bold text-sm mb-1" style={{ color: VINTAGE_COLORS.burgundy }}>
            成长之树
          </div>
          <div className="text-xs opacity-70" style={{ color: VINTAGE_COLORS.burgundy }}>
            {character.level} 级
          </div>
        </button>
        
        <button
          onClick={() => setShowSeasonPass(true)}
          className="rounded-2xl p-4 shadow-sm text-left"
          style={{ backgroundColor: VINTAGE_COLORS.mauve }}
        >
          <Gift className="w-6 h-6 mb-2 text-white" />
          <div className="font-bold text-sm mb-1 text-white">
            赛季通行证
          </div>
          <div className="text-xs opacity-80 text-white">
            第1赛季
          </div>
        </button>
      </div>

      {/* 成长数据面板 */}
      <div 
        className="rounded-2xl p-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.sage }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5" style={{ color: VINTAGE_COLORS.burgundy }} />
          <span className="font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
            📊 今日数据
          </span>
        </div>
        
        <div className="text-sm mb-2" style={{ color: VINTAGE_COLORS.burgundy }}>
          <span className="font-semibold">👍 今天超棒！</span>
          专注时长比昨天多30分钟
        </div>
        
        <div className="text-sm" style={{ color: VINTAGE_COLORS.burgundy }}>
          <span className="font-semibold">⚠️ 需要注意：</span>
          拖延次数增加1次，明天优化拖延，就能解锁额外奖励～
        </div>
      </div>
    </div>
  );
}

