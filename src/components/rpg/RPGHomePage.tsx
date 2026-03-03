import { useEffect, useState } from 'react';
import { useRPGStore } from '@/stores/rpgStore';
import { useTaskStore } from '@/stores/taskStore';
import { ChevronRight, Star, TrendingUp, Target, Coins, AlertTriangle, Award, TreeDeciduous, Gift, Calendar } from 'lucide-react';

// iOS复古风格颜色
const VINTAGE_COLORS = {
  buttermilk: '#FFF1B5',
  pastelBlue: '#C1DBE8',
  burgundy: '#43302E',
  tangerine: '#EAA239',
  cream: '#FFF4A1',
  leaves: '#8F9E25',
  wisteria: '#C3A5C1',
  mulberry: '#97332C',
  khaki: '#D4C5A0',
  softPink: '#F5D5CB',
  paleGreen: '#C8D5B9',
  dustyRed: '#C97064',
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
  } = useRPGStore();
  
  const { tasks } = useTaskStore();
  
  const [showTaskDetail, setShowTaskDetail] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  // 自动生成每日任务
  useEffect(() => {
    generateDailyTasks();
  }, []);

  // 处理任务完成
  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
    // 显示iOS式简洁提示
    // TODO: 添加toast提示
  };

  // 一键领取所有任务
  const handleClaimAllTasks = () => {
    // TODO: 将任务同步到时间轴
    alert('任务已同步到时间轴！');
  };

  return (
    <div className="min-h-screen p-4 pb-20" style={{ backgroundColor: VINTAGE_COLORS.cream }}>
      {/* 角色信息面板 */}
      <div 
        className="rounded-2xl p-6 mb-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.buttermilk }}
      >
        {/* 头像和基本信息 */}
        <div className="flex items-start gap-4 mb-4">
          {/* 头像 */}
          <div 
            className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-sm"
            style={{ backgroundColor: VINTAGE_COLORS.pastelBlue }}
          >
            🧑💼
          </div>
          
          {/* 等级和称号 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold" style={{ color: VINTAGE_COLORS.burgundy }}>
                Lv.{character.level}
              </span>
              <span className="text-sm px-2 py-0.5 rounded" style={{ 
                backgroundColor: VINTAGE_COLORS.tangerine,
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
                    backgroundColor: VINTAGE_COLORS.leaves
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
                      backgroundColor: VINTAGE_COLORS.pastelBlue
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
                  backgroundColor: VINTAGE_COLORS.pastelBlue,
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
                    backgroundColor: VINTAGE_COLORS.wisteria,
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
                style={{ backgroundColor: VINTAGE_COLORS.paleGreen }}
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
                      backgroundColor: VINTAGE_COLORS.dustyRed
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 目标系统 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.pastelBlue }}
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
              backgroundColor: VINTAGE_COLORS.buttermilk,
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
                  backgroundColor: VINTAGE_COLORS.tangerine
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 财富系统 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.tangerine }}
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
          <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: VINTAGE_COLORS.dustyRed, color: '#fff' }}>
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
          <button 
            onClick={handleClaimAllTasks}
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ 
              backgroundColor: VINTAGE_COLORS.leaves,
              color: '#fff'
            }}
          >
            一键领取
          </button>
        </div>
        
        <div className="space-y-2">
          {dailyTasks.map((task) => (
            <div 
              key={task.id}
              className="p-3 rounded-xl border-2 transition-all"
              style={{ 
                backgroundColor: task.completed ? VINTAGE_COLORS.paleGreen : '#fff',
                borderColor: task.isImprovement ? VINTAGE_COLORS.dustyRed : VINTAGE_COLORS.khaki,
                opacity: task.completed ? 0.6 : 1
              }}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => !task.completed && handleCompleteTask(task.id)}
                  className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: task.completed ? VINTAGE_COLORS.leaves : VINTAGE_COLORS.khaki,
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
                        backgroundColor: VINTAGE_COLORS.dustyRed,
                        color: '#fff'
                      }}>
                        ⚠️ 改进
                      </span>
                    )}
                    {task.type === 'surprise' && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                        backgroundColor: VINTAGE_COLORS.wisteria,
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
                    <span style={{ color: VINTAGE_COLORS.leaves }}>
                      ⭐ +{task.expReward} 经验
                    </span>
                    <span style={{ color: VINTAGE_COLORS.tangerine }}>
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
                backgroundColor: VINTAGE_COLORS.leaves
              }}
            />
          </div>
        </div>
      </div>

      {/* 成就墙预览 */}
      <div 
        className="rounded-2xl p-4 mb-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.wisteria }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-white" />
            <span className="font-bold text-white">🏅 成就勋章</span>
          </div>
          <button 
            onClick={() => setShowAchievements(true)}
            className="text-xs px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.3)',
              color: '#fff'
            }}
          >
            查看全部
          </button>
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

      {/* 成长数据面板 */}
      <div 
        className="rounded-2xl p-4 shadow-sm"
        style={{ backgroundColor: VINTAGE_COLORS.paleGreen }}
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

