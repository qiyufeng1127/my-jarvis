import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ClipboardList, Database, Sparkles, Trash2 } from 'lucide-react';
import eventBus from '@/utils/eventBus';
import { useGoalStore } from '@/stores/goalStore';
import { useTaskStore } from '@/stores/taskStore';
import { useHQBridgeStore } from '@/stores/hqBridgeStore';
import { useGoalContributionStore } from '@/stores/goalContributionStore';

const GOAL_STORAGE_KEY = 'manifestos-goals-storage';
const TASK_STORAGE_KEY = 'manifestos-tasks-storage';
const HQ_STORAGE_KEY = 'manifestos-hq-bridge-storage';
const GOAL_CONTRIBUTION_STORAGE_KEY = 'manifestos-goal-contribution-storage';

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function jumpToModule(module: 'timeline' | 'goals' | 'money', message: string, navigate: ReturnType<typeof useNavigate>) {
  eventBus.emit('dashboard:navigate-module', { module });
  navigate('/');
  window.setTimeout(() => {
    alert(message);
  }, 260);
}

export default function TestGuideLab() {
  const navigate = useNavigate();
  const { goals, createGoal } = useGoalStore();
  const { tasks, createTask } = useTaskStore();
  const { activeLoop, accountabilityRecords, setActiveLoop, addAccountabilityRecord } = useHQBridgeStore();
  const { records, addRecord, clearAll } = useGoalContributionStore();
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const summary = useMemo(
    () => ({
      goals: goals.length,
      tasks: tasks.length,
      loops: accountabilityRecords.length + (activeLoop ? 1 : 0),
      records: records.length,
    }),
    [goals.length, tasks.length, accountabilityRecords.length, activeLoop, records.length]
  );

  const clearDemoData = async () => {
    setWorking(true);
    setMessage('正在清空测试数据…');

    useGoalStore.setState({ goals: [], isLoading: false, error: null });
    useTaskStore.setState({ tasks: [], selectedTask: null, isLoading: false, error: null });
    useHQBridgeStore.setState({ activeLoop: null, accountabilityRecords: [] });
    useGoalContributionStore.setState({ records: [] });

    localStorage.removeItem(GOAL_STORAGE_KEY);
    localStorage.removeItem(TASK_STORAGE_KEY);
    localStorage.removeItem(HQ_STORAGE_KEY);
    localStorage.removeItem(GOAL_CONTRIBUTION_STORAGE_KEY);
    clearAll();

    setMessage('测试数据已清空。你看懂后可以随时删掉这个页面。');
    setWorking(false);
  };

  const seedDemoData = async () => {
    setWorking(true);
    setMessage('正在帮你塞入一批看得懂的示例数据…');

    await clearDemoData();

    const now = new Date();
    const today0900 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const today1030 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0);
    const today1400 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
    const today1530 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30, 0);

    const goalA = createGoal({
      name: '30天内做出可演示版本',
      description: '把产品从能用推进到能给别人看懂，重点是首页、时间轴和目标闭环。',
      goalType: 'numeric',
      targetValue: 100,
      currentValue: 42,
      unit: '%',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      estimatedTotalHours: 48,
      dimensions: [
        { id: 'demo-ui', name: '界面完成度', unit: '%', targetValue: 60, currentValue: 28, weight: 0.6 },
        { id: 'demo-flow', name: '主流程通顺度', unit: '%', targetValue: 40, currentValue: 14, weight: 0.4 },
      ],
      projectBindings: [{ id: 'proj-demo', name: '测试教程页', color: '#c96bff' }],
      theme: { color: '#c96bff', label: '霓虹紫' },
      relatedDimensions: [],
      milestones: [],
    });

    const goalB = createGoal({
      name: '副业卡片能一眼看出赚钱路径',
      description: '让目标、任务、贡献记录之间的关系更直观。',
      goalType: 'numeric',
      targetValue: 20,
      currentValue: 6,
      unit: '项',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 5, 23, 59, 59),
      estimatedTotalHours: 30,
      dimensions: [
        { id: 'income-path', name: '路径拆解', unit: '项', targetValue: 10, currentValue: 3, weight: 0.5 },
        { id: 'delivery', name: '可交付动作', unit: '项', targetValue: 10, currentValue: 3, weight: 0.5 },
      ],
      projectBindings: [{ id: 'proj-sidehustle', name: '副业增长', color: '#4ecdc4' }],
      theme: { color: '#4ecdc4', label: '薄荷青' },
      relatedDimensions: [],
      milestones: [],
    });

    const taskA = await createTask({
      title: '把时间轴里的“目标贡献”入口补全',
      description: '用户点开时间轴任务后，能直接填写这次动作对目标推进了多少。',
      taskType: 'work',
      priority: 1,
      durationMinutes: 90,
      scheduledStart: today0900,
      scheduledEnd: today1030,
      status: 'in_progress',
      longTermGoals: { [goalA.id]: 70, [goalB.id]: 30 },
      identityTags: ['tutorial', 'timeline', 'goal-contribution'],
      tags: ['时间轴', '目标贡献', '演示链路'],
    });

    const taskB = await createTask({
      title: '补一个“快速新建目标/KR”的顺手路径',
      description: '在任务编辑弹层里顺手建目标，避免用户来回跳页面。',
      taskType: 'work',
      priority: 2,
      durationMinutes: 90,
      scheduledStart: today1400,
      scheduledEnd: today1530,
      status: 'pending',
      longTermGoals: { [goalA.id]: 100 },
      identityTags: ['tutorial', 'quick-create'],
      tags: ['快速新建', '目标', 'KR'],
    });

    addAccountabilityRecord({
      goalId: goalA.id,
      goalName: goalA.name,
      taskId: taskA.id,
      taskTitle: taskA.title,
      painLabel: '明明知道要做，但总卡在最后一步不愿收口',
      promise: '今天先把入口打通，不追求大而全。',
      trigger: 'start_delay',
      triggeredAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      submittedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      answers: [
        { question: '为什么拖了？', answer: '因为觉得需求描述太绕，越想越不敢下手。' },
        { question: '现在先做哪一步？', answer: '先把时间轴里的入口补出来，再考虑教程怎么写。' },
      ],
    });

    setActiveLoop({
      goalId: goalA.id,
      taskId: taskA.id,
      goalName: goalA.name,
      taskTitle: taskA.title,
      painLabel: '已经被上游指到这个点上，今天必须有闭环结果。',
      promise: '先给用户一个能点、能看、能理解的样子。',
      accountabilityForm: {
        trigger: 'start_delay',
        triggeredAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        submittedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        answers: [
          { question: '这次卡住的根因？', answer: '术语太抽象，用户根本不知道 HQ 点名是什么意思。' },
          { question: '这次准备怎么改？', answer: '直接做一个测试页，把示例目标、任务、追责、贡献都摆出来。' },
        ],
      },
      timelineTaskCompletedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      goalContributionRecordedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      closureNote: '这里的“HQ”你可以直接理解成“上游明确指派”。',
    });

    addRecord({
      goalId: goalA.id,
      taskId: taskA.id,
      taskTitle: taskA.title,
      startTime: today0900,
      endTime: today1030,
      durationMinutes: 90,
      qualityScore: 4,
      note: '把入口和演示路径先做出来，用户终于能看懂“任务如何推进目标”。',
      source: 'timeline',
      accountabilitySnapshot: {
        trigger: 'start_delay',
        painLabel: '术语太黑话，看的人不知道在说什么',
        submittedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        answers: [
          { question: '为什么先做测试页？', answer: '因为用户想先看到一眼能懂的例子。' },
        ],
      },
      dimensionResults: [
        { dimensionId: 'demo-ui', dimensionName: '界面完成度', unit: '%', value: 12 },
        { dimensionId: 'demo-flow', dimensionName: '主流程通顺度', unit: '%', value: 8 },
      ],
    });

    addRecord({
      goalId: goalB.id,
      taskId: taskA.id,
      taskTitle: '把“目标贡献”写成一眼能懂的人话',
      startTime: today1400,
      endTime: today1530,
      durationMinutes: 45,
      qualityScore: 5,
      note: '把 HQ 点名改解释成上游明确指派，副业路径也更清楚。',
      source: 'manual',
      dimensionResults: [
        { dimensionId: 'income-path', dimensionName: '路径拆解', unit: '项', value: 2 },
        { dimensionId: 'delivery', dimensionName: '可交付动作', unit: '项', value: 1 },
      ],
    });

    setMessage('示例数据已生成。现在你可以回主页看目标、任务、贡献记录；也可以留在这里先看说明。');
    setWorking(false);
  };

  const storySteps = [
    '先点“一键生成示例数据”。',
    '再点“跳到时间轴”，直接看示例任务有没有出现在主界面。',
    '再点“跳到目标页”，直接看示例目标、维度、进度有没有联动出来。',
    '这里原来写的 HQ 点名，现在你直接理解成“上游明确指派”。',
    '看懂以后，回这个页面点“清空测试数据”即可。',
  ];

  return (
    <div
      className="min-h-screen px-6 py-10 text-white"
      style={{
        background:
          'radial-gradient(circle at top, rgba(201,107,255,0.28), transparent 28%), radial-gradient(circle at 80% 20%, rgba(78,205,196,0.24), transparent 22%), linear-gradient(180deg, #120f1f 0%, #0a0912 48%, #050507 100%)',
      }}
    >
      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col gap-6"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/6 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-8 px-7 py-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-4 py-1 text-sm text-fuchsia-100">
                <Sparkles size={16} />
                临时测试页 · 看懂后可直接删除
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">给你一个一眼能懂的测试页</h1>
                <p className="max-w-2xl text-base leading-7 text-white/72 lg:text-lg">
                  这个页面的目的不是讲黑话，而是帮你快速看到：目标、任务、上游指派、追责记录、目标贡献，
                  到底分别长什么样，彼此怎么串起来。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={seedDemoData}
                  disabled={working}
                  className="inline-flex items-center gap-2 rounded-2xl bg-fuchsia-500 px-5 py-3 font-semibold text-white shadow-lg shadow-fuchsia-900/30 transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Database size={18} />
                  一键生成示例数据
                </button>

                <button
                  onClick={clearDemoData}
                  disabled={working}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 py-3 font-semibold text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={18} />
                  清空测试数据
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  onClick={() => jumpToModule('timeline', '我已经帮你切到时间轴模块。现在去找示例任务：把时间轴里的“目标贡献”入口补全。', navigate)}
                  className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-left font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
                >
                  <div className="text-sm text-cyan-100/70">联动入口 01</div>
                  <div className="mt-2 text-lg text-white">跳到时间轴</div>
                  <div className="mt-2 text-sm font-normal leading-6 text-white/70">看示例任务有没有出现在时间轴 / 今日安排里。</div>
                </button>

                <button
                  onClick={() => jumpToModule('goals', '我已经帮你切到目标模块。现在重点看新生成的两个示例目标和它们的维度。', navigate)}
                  className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-5 py-4 text-left font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/15"
                >
                  <div className="text-sm text-fuchsia-100/70">联动入口 02</div>
                  <div className="mt-2 text-lg text-white">跳到目标页</div>
                  <div className="mt-2 text-sm font-normal leading-6 text-white/70">看“30天内做出可演示版本”等目标是否已经出现。</div>
                </button>

                <button
                  onClick={() => jumpToModule('money', '我已经帮你切到副业模块。这里主要是让你看“副业路径”那个示例目标的语义。', navigate)}
                  className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-left font-semibold text-emerald-100 transition hover:bg-emerald-300/15"
                >
                  <div className="text-sm text-emerald-100/70">联动入口 03</div>
                  <div className="mt-2 text-lg text-white">跳到副业页</div>
                  <div className="mt-2 text-sm font-normal leading-6 text-white/70">看“副业卡片能一眼看出赚钱路径”这类示例目标的对应语境。</div>
                </button>
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-6 text-emerald-100">
                <strong className="mr-2">现在你只要记一句：</strong>
                原来教程里写的 <span className="font-semibold text-white">HQ 点名</span>，这里统一按
                <span className="font-semibold text-white">“上游明确指派”</span> 来理解。
              </div>

              {message && (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                  {message}
                </div>
              )}

              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
                我已经把这个副页改成了“带联动入口”的版本：不是让你自己脑补，而是你点一下按钮，就会直接跳到
                <span className="font-semibold text-white">时间轴 / 目标 / 副业</span> 对应模块。
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {[
                { label: '目标', value: summary.goals, color: '#c96bff' },
                { label: '任务', value: summary.tasks, color: '#4ecdc4' },
                { label: '追责闭环', value: summary.loops, color: '#ffb84d' },
                { label: '目标贡献记录', value: summary.records, color: '#7ce38b' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-white/10 bg-black/18 p-5"
                  style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,.05), 0 18px 38px -28px ${item.color}` }}
                >
                  <div className="text-sm text-white/55">{item.label}</div>
                  <div className="mt-3 text-4xl font-black text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <motion.section
          className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-7 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3 text-xl font-bold text-white">
              <ClipboardList size={20} />
              你该怎么测试
            </div>
            <ol className="space-y-4">
              {storySteps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-white/8 bg-black/15 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500 font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="pt-1 text-sm leading-6 text-white/78">{step}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-7 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3 text-xl font-bold text-white">
              <CheckCircle2 size={20} />
              这批示例数据到底代表什么
            </div>

            <div className="space-y-4 text-sm leading-7 text-white/78">
              <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/8 p-4">
                <div className="font-semibold text-white">目标</div>
                <div>是长期方向，比如“30天内做出可演示版本”。它下面有维度，有进度，有截止时间。</div>
              </div>

              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4">
                <div className="font-semibold text-white">任务</div>
                <div>是今天要做的动作，比如“补全时间轴里的目标贡献入口”。任务可以挂到一个或多个目标上。</div>
              </div>

              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/8 p-4">
                <div className="font-semibold text-white">上游明确指派（原 HQ 点名）</div>
                <div>意思就是：这不是你随手记一下的普通任务，而是上面明确指定你要处理的点。</div>
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4">
                <div className="font-semibold text-white">目标贡献记录</div>
                <div>表示你这次任务完成后，到底给目标推进了多少，不再只是“做了”，而是“推进了什么”。</div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="grid gap-6 lg:grid-cols-3"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-[28px] border border-white/10 bg-black/18 p-6">
            <div className="mb-3 text-lg font-bold text-white">示例目标</div>
            <div className="space-y-3 text-sm text-white/75">
              {goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="font-semibold text-white">{goal.name}</div>
                  <div className="mt-1">进度：{goal.currentValue}/{goal.targetValue}{goal.unit}</div>
                  {goal.endDate && <div>截止：{formatDate(new Date(goal.endDate))}</div>}
                </div>
              ))}
              {!goals.length && <div className="text-white/45">还没有示例目标，先点上面的生成按钮。</div>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/18 p-6">
            <div className="mb-3 text-lg font-bold text-white">示例任务</div>
            <div className="space-y-3 text-sm text-white/75">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="font-semibold text-white">{task.title}</div>
                  <div className="mt-1">状态：{task.status}</div>
                  <div>时长：{task.durationMinutes} 分钟</div>
                  {task.scheduledStart && <div>开始：{formatDate(new Date(task.scheduledStart))}</div>}
                </div>
              ))}
              {!tasks.length && <div className="text-white/45">还没有示例任务，先点上面的生成按钮。</div>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/18 p-6">
            <div className="mb-3 text-lg font-bold text-white">示例闭环</div>
            <div className="space-y-3 text-sm text-white/75">
              {activeLoop ? (
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <div className="font-semibold text-white">{activeLoop.taskTitle}</div>
                  <div className="mt-1">关联目标：{activeLoop.goalName}</div>
                  {activeLoop.promise && <div>承诺：{activeLoop.promise}</div>}
                  {activeLoop.closureNote && <div>备注：{activeLoop.closureNote}</div>}
                </div>
              ) : (
                <div className="text-white/45">还没有示例闭环，先点上面的生成按钮。</div>
              )}
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

