import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, Sparkles, Volume2, VolumeX, TimerReset, Pause, Play, Mic, Brain, Heart, CheckCircle2, Pencil, Trash2, ArrowUp, ArrowDown, ChevronLeft, Wand2, ChevronDown, ChevronUp, Save, Target, X, Plus } from 'lucide-react';
import { AIUnifiedService } from '@/services/aiUnifiedService';
import { useNavigationPreferenceStore } from '@/stores/navigationPreferenceStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGoalStore } from '@/stores/goalStore';
import { useGoalContributionStore } from '@/stores/goalContributionStore';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import GoalForm, { type GoalFormData } from '@/components/growth/GoalForm';
import { buildGoalPayloadFromForm, buildQuickGoalFormData } from '@/utils/goalSubmission';
import type { LongTermGoal } from '@/types';
import type { NavigationBottleEntry, NavigationExecutionStep, NavigationSession, NavigationStateSnapshot, NavigationTimelineGroup, NavigationEmojiPreference } from '@/types/navigation';
import './navigation.css';

const NAVIGATION_EMOJI_SUGGESTIONS = ['🚀', '🪄', '🌱', '🧹', '🧼', '👟', '🚪', '👜', '🍳', '🥣', '✅', '🌙'];

function NavigationEmojiEditor({
  currentEmoji,
  onSelect,
  onClose,
}: {
  currentEmoji: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [customEmoji, setCustomEmoji] = useState(currentEmoji);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isCustomMode) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isCustomMode]);

  return (
    <div className="navigation-emoji-editor" role="dialog" aria-label="编辑步骤 emoji">
      <div className="navigation-emoji-editor-header">
        {isCustomMode ? (
          <input
            ref={inputRef}
            className="navigation-inline-input navigation-emoji-editor-input"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="输入 emoji"
            maxLength={8}
          />
        ) : (
          <button
            type="button"
            className="navigation-emoji-custom-trigger"
            onClick={() => setIsCustomMode(true)}
            title="自定义输入 emoji"
          >
            <span aria-hidden="true">{customEmoji || '🙂'}</span>
          </button>
        )}
        <button type="button" className="navigation-icon-button" onClick={onClose} title="关闭 emoji 编辑器">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="navigation-emoji-editor-grid">
        {NAVIGATION_EMOJI_SUGGESTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`navigation-emoji-choice ${emoji === currentEmoji ? 'is-active' : ''}`}
            onClick={() => onSelect(emoji)}
            title={`使用 ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="navigation-emoji-editor-actions">
        <button
          type="button"
          className="navigation-primary-button navigation-emoji-editor-apply"
          onClick={() => isCustomMode && customEmoji.trim() && onSelect(customEmoji.trim())}
          disabled={!isCustomMode || !customEmoji.trim()}
        >
          确定
        </button>
      </div>
    </div>
  );
}

function NavigationLongPressSheet({
  title,
  subtitle,
  onClose,
  onInsertBefore,
  onInsertAfter,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="navigation-sheet-backdrop navigation-longpress-backdrop" onClick={onClose}>
      <div className="navigation-sheet-card navigation-longpress-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="navigation-longpress-header">
          <div className="navigation-longpress-title">{title}</div>
          {subtitle ? <div className="navigation-longpress-subtitle">{subtitle}</div> : null}
        </div>
        <div className="navigation-longpress-actions">
          <button type="button" className="navigation-longpress-action" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
            <span>编辑</span>
          </button>
          <button type="button" className="navigation-longpress-action" onClick={onInsertBefore}>
            <ChevronUp className="w-4 h-4" />
            <span>在之前插入</span>
          </button>
          <button type="button" className="navigation-longpress-action" onClick={onInsertAfter}>
            <ChevronDown className="w-4 h-4" />
            <span>在之后插入</span>
          </button>
          <button type="button" className="navigation-longpress-action is-danger" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>
        </div>
        <button type="button" className="navigation-secondary-button navigation-longpress-cancel" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}

function NavigationSwipeActionRow({
  children,
  onInsertBefore,
  onInsertAfter,
  onDelete,
}: {
  children: React.ReactNode;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onDelete: () => void;
}) {
  const ACTIONS_WIDTH = 172;
  const startXRef = useRef<number | null>(null);
  const startOffsetRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const visualOffset = startXRef.current !== null ? dragOffset : (isOpen ? -ACTIONS_WIDTH : 0);

  const closeActions = () => {
    startXRef.current = null;
    startOffsetRef.current = 0;
    setDragOffset(0);
    setIsOpen(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    startXRef.current = event.clientX;
    startOffsetRef.current = isOpen ? -ACTIONS_WIDTH : 0;
    setDragOffset(startOffsetRef.current);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const delta = event.clientX - startXRef.current;
    const nextOffset = Math.max(-ACTIONS_WIDTH, Math.min(0, startOffsetRef.current + delta));
    setDragOffset(nextOffset);
  };

  const handlePointerEnd = () => {
    if (startXRef.current === null) return;
    const shouldOpen = dragOffset <= -(ACTIONS_WIDTH * 0.35);
    startXRef.current = null;
    startOffsetRef.current = 0;
    setDragOffset(0);
    setIsOpen(shouldOpen);
  };

  const handleAction = (action: () => void) => {
    closeActions();
    action();
  };

  return (
    <div className={`navigation-swipe-row ${isOpen ? 'is-open' : ''}`}>
      <div className="navigation-swipe-row-actions" aria-hidden={!isOpen}>
        <button type="button" className="navigation-swipe-action-chip" onClick={() => handleAction(onInsertBefore)}>
          前插
        </button>
        <button type="button" className="navigation-swipe-action-chip" onClick={() => handleAction(onInsertAfter)}>
          后插
        </button>
        <button type="button" className="navigation-swipe-action-chip is-danger" onClick={() => handleAction(onDelete)}>
          删除
        </button>
      </div>
      <div
        className="navigation-swipe-row-content"
        style={{ transform: `translateX(${visualOffset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        {children}
      </div>
    </div>
  );
}

function buildInsertedFlowResponseText(message: string | undefined, currentStepTitle: string) {
  if (message?.trim()) return message.trim();
  return `好，我们先把你刚刚想先做的这段事顺一顺。做完后，再慢慢接回「${currentStepTitle}」。`;
}

function getDeltaTone(delta: number) {
  if (delta >= 18) return { emoji: '🚀', label: '明显上扬' };
  if (delta >= 8) return { emoji: '✨', label: '稳稳变好' };
  if (delta >= 1) return { emoji: '🌤️', label: '有点回暖' };
  if (delta <= -18) return { emoji: '🫠', label: '消耗很大' };
  if (delta <= -8) return { emoji: '🌧️', label: '有点下滑' };
  if (delta <= -1) return { emoji: '😮‍💨', label: '略有透支' };
  return { emoji: '🌙', label: '整体持平' };
}

function formatDelta(delta?: number) {
  if (delta === undefined || Number.isNaN(delta)) return '—';
  if (delta === 0) return '±0';
  return `${delta > 0 ? '+' : ''}${Math.round(delta)}`;
}

function formatMinutesLabel(minutes?: number) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} 小时 ${rest} 分` : `${hours} 小时`;
}

function buildMiniTrendPoints(session: NavigationSession) {
  const preBrain = session.preState?.brainState;
  const postBrain = session.postState?.brainState;
  const preEmotion = session.preState?.emotionState;
  const postEmotion = session.postState?.emotionState;
  const preDifficulty = session.preState?.perceivedDifficulty ? session.preState.perceivedDifficulty * 25 : undefined;
  const postDifficulty = session.postState?.actualDifficulty ? session.postState.actualDifficulty * 25 : undefined;
  const achievement = session.postState?.achievementSense;

  return [
    {
      key: 'brain',
      label: '脑力',
      emoji: '🧠',
      values: [preBrain, Math.round(((preBrain ?? postBrain ?? 50) + (postBrain ?? preBrain ?? 50)) / 2), postBrain],
      colorClass: 'is-brain',
    },
    {
      key: 'emotion',
      label: '情绪',
      emoji: '💗',
      values: [preEmotion, Math.round(((preEmotion ?? postEmotion ?? 50) + (postEmotion ?? preEmotion ?? 50)) / 2), postEmotion],
      colorClass: 'is-emotion',
    },
    {
      key: 'difficulty',
      label: '难度体感',
      emoji: '🧩',
      values: [preDifficulty, Math.round(((preDifficulty ?? postDifficulty ?? 50) + (postDifficulty ?? preDifficulty ?? 50)) / 2), postDifficulty],
      colorClass: 'is-difficulty',
    },
    {
      key: 'achievement',
      label: '成就感',
      emoji: '🏆',
      values: [undefined, Math.max(achievement ?? 0, 8), achievement],
      colorClass: 'is-achievement',
    },
  ];
}

function clampScore(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function formatClockLabel(dateLike?: string) {
  if (!dateLike) return '时间未记录';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '时间未记录';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function buildTrendStory(session: NavigationSession) {
  const completedSteps = session.executionSteps.filter((step) => step.status === 'completed');
  const skippedSteps = session.executionSteps.filter((step) => step.status === 'skipped');
  const firstCompleted = completedSteps[0];
  const lastCompleted = completedSteps[completedSteps.length - 1];
  const completionRate = session.executionSteps.length > 0
    ? Math.round((completedSteps.length / session.executionSteps.length) * 100)
    : 0;

  const moodValues = buildMiniTrendPoints(session).find((item) => item.key === 'emotion')?.values ?? [50, 52, 54];
  const startMood = clampScore(moodValues[0] ?? 48);
  const midMood = clampScore(moodValues[1] ?? startMood + 4);
  const endMood = clampScore(moodValues[2] ?? midMood);

  const startExecution = clampScore(((session.preState?.brainState ?? 46) * 0.45) + ((session.preState?.emotionState ?? 44) * 0.25) + (100 - ((session.preState?.perceivedDifficulty ?? 2) * 18)) * 0.3);
  const midExecution = clampScore(startExecution + completedSteps.length * 8 - skippedSteps.length * 4 + (lastCompleted ? 6 : 0));
  const endExecution = clampScore(Math.round((session.executionScore * 0.55) + (completionRate * 0.45)));

  const startAchievement = clampScore(Math.max(12, Math.round(startExecution * 0.45)));
  const midAchievement = clampScore(Math.max(startAchievement + 10, Math.round((completionRate * 0.55) + (completedSteps.length * 9))));
  const endAchievement = clampScore(session.postState?.achievementSense ?? midAchievement);

  const compositeValues = [
    clampScore((startMood * 0.3) + (startExecution * 0.45) + (startAchievement * 0.25)),
    clampScore((midMood * 0.3) + (midExecution * 0.45) + (midAchievement * 0.25)),
    clampScore((endMood * 0.3) + (endExecution * 0.45) + (endAchievement * 0.25)),
  ];

  const strongestStep = completedSteps.reduce<NavigationExecutionStep | null>((best, step) => {
    if (!best) return step;
    return (step.focusMinutes ?? step.estimatedMinutes ?? 0) > (best.focusMinutes ?? best.estimatedMinutes ?? 0) ? step : best;
  }, null);

  const stages = [
    {
      id: 'start',
      label: '开始前',
      timeLabel: formatClockLabel(session.startedAt || session.preState?.recordedAt || session.createdAt),
      emoji: startMood >= 60 ? '🌤️' : '😮‍💨',
      doing: session.rawInput || '准备开始这次导航',
      summary: session.preState?.reflection || '刚开始时更像是在评估自己有没有力气、这件事会不会难。',
      metrics: {
        mood: startMood,
        execution: startExecution,
        achievement: startAchievement,
        composite: compositeValues[0],
      },
      bullets: [
        `更容易卡在「${difficultyLabel(session.preState?.perceivedDifficulty)}」的心理预期上`,
        `适合先做 ${session.executionSteps[0]?.title || '一个最小动作'} 这种低门槛起手`,
        session.preState?.brainState && session.preState.brainState < 45 ? '🧠 脑力偏低时，不要一上来就要求自己连续输出' : '🫶 起步状态不算差，关键是别让犹豫拖太久',
      ],
    },
    {
      id: 'mid',
      label: '推进中',
      timeLabel: formatClockLabel(firstCompleted?.completedAt || lastCompleted?.startedAt || session.lastProgressAt),
      emoji: midExecution >= startExecution ? '📈' : '🫠',
      doing: firstCompleted ? `正在推进：${firstCompleted.title}${lastCompleted && lastCompleted.id !== firstCompleted.id ? ` → ${lastCompleted.title}` : ''}` : '还在试图把事情推起来',
      summary: completedSteps.length
        ? `你已经真正推进了 ${completedSteps.length} 步，说明不是没做，而是在找最顺的节奏。`
        : '这一段更像是起步摩擦期，说明阻力主要发生在真正进入执行之前。',
      metrics: {
        mood: midMood,
        execution: midExecution,
        achievement: midAchievement,
        composite: compositeValues[1],
      },
      bullets: [
        strongestStep ? `⚡ 最能带动状态的是「${strongestStep.title}」这类有明确动作边界的步骤` : '⚡ 你需要一个更具体的中继动作，状态才容易真正起来',
        skippedSteps.length > 0 ? `🧩 中途跳过了 ${skippedSteps.length} 步，说明你对高摩擦步骤会本能绕开` : '✅ 中途几乎没有绕路，说明你一旦启动就能继续往前推',
        completedSteps.length >= 2 ? '📌 你的执行力往往不是一开始就高，而是做起来后才逐渐回暖' : '📌 这次中段还偏脆弱，最好把第二步再拆小一点',
      ],
    },
    {
      id: 'end',
      label: '完成后',
      timeLabel: formatClockLabel(session.completedAt || session.postState?.recordedAt),
      emoji: endAchievement >= 70 ? '🏆' : endMood >= startMood ? '✨' : '🌙',
      doing: lastCompleted ? `刚完成：${lastCompleted.title}` : '结束了这次导航',
      summary: session.postState?.reflection || '完成后的感受，通常最能说明什么事情真的值得继续保留。',
      metrics: {
        mood: endMood,
        execution: endExecution,
        achievement: endAchievement,
        composite: compositeValues[2],
      },
      bullets: [
        endMood > startMood ? '💗 做完后情绪明显更稳，说明这类任务对你有“做了就会舒服一点”的效果' : '💗 做完后情绪没有明显抬升，说明这类任务更偏责任驱动，不是情绪奖励型',
        endAchievement >= 65 ? '🎯 你对“有结果、有收尾感”的事情反馈最好' : '🎯 这次虽然做完了，但成就感一般，可能还缺一个更清晰的结果物',
        completionRate >= 70 ? '🌱 你的优势是只要路线被拆清楚，就能把事情带到终点' : '🛟 真正的痛点不是能力，而是中途那几个高阻力节点需要更柔和的过渡',
      ],
    },
  ];

  const lineConfigs = [
    { key: 'mood', label: '情绪线', emoji: '💗', colorClass: 'is-emotion', strokeClass: 'is-solid' },
    { key: 'execution', label: '执行力线', emoji: '⚡', colorClass: 'is-brain', strokeClass: 'is-dashed' },
    { key: 'achievement', label: '成就感线', emoji: '🏆', colorClass: 'is-achievement', strokeClass: 'is-dotted' },
    { key: 'composite', label: '综合线', emoji: '🌌', colorClass: 'is-composite', strokeClass: 'is-solid-strong' },
  ] as const;

  const overallInsights = [
    {
      emoji: compositeValues[2] > compositeValues[0] ? '🚀' : '🧭',
      title: compositeValues[2] > compositeValues[0] ? '你是做起来后变强的人' : '你更需要先把阻力降下来',
      text: compositeValues[2] > compositeValues[0]
        ? '这次综合状态是越做越高，说明你的核心优势不是“天生就有劲”，而是只要开始推进，状态会自己被拉起来。'
        : '这次综合状态没有明显抬升，说明任务设计还不够贴你当前状态，下一次要先减压再推进。',
    },
    {
      emoji: endMood > startMood ? '😊' : '🧠',
      title: endMood > startMood ? '能让你开心的，不是空想，是推进感' : '你对结果敏感，但对过程负担也敏感',
      text: endMood > startMood
        ? '从情绪线看，你更容易因为“事情终于动起来了”而回暖，所以最适合你的不是鸡汤，而是一个能立刻做的起步动作。'
        : '如果任务只有责任、没有即时反馈，你会更容易拖。给任务加一个可见结果，会更有帮助。',
    },
    {
      emoji: skippedSteps.length > 0 ? '🪤' : '🛠️',
      title: skippedSteps.length > 0 ? '你的痛点在高摩擦节点' : '你的强项在于路线一旦明确就能跟上',
      text: skippedSteps.length > 0
        ? `这次跳过了 ${skippedSteps.length} 步，说明你会本能避开模糊、费脑或切换成本高的环节。下次这些节点要拆成更具体的动作。`
        : '这次基本没有明显断裂，说明你的问题不是执行意愿太差，而是过去缺少一个足够贴身的路线图。',
    },
  ];

  return { stages, lineConfigs, overallInsights };
}

function getEmojiByScore(score: number) {
  if (score >= 96) return '🤩';
  if (score >= 90) return '🥳';
  if (score >= 84) return '😁';
  if (score >= 78) return '😆';
  if (score >= 72) return '😄';
  if (score >= 66) return '😊';
  if (score >= 58) return '🙂';
  if (score >= 50) return '😉';
  if (score >= 42) return '😌';
  if (score >= 34) return '😐';
  if (score >= 26) return '🥺';
  if (score >= 18) return '😵‍💫';
  if (score >= 10) return '😮‍💨';
  return '😶';
}

function getLearnedStepMeaningEmoji(stepTitle: string, guidance = '', emojiPreferences: NavigationEmojiPreference[] = []) {
  const text = `${stepTitle} ${guidance}`.toLowerCase();
  let bestEmoji = '';
  let bestScore = 0;

  emojiPreferences.forEach((item) => {
    const keyword = item.keyword?.trim().toLowerCase();
    if (!keyword || !item.emoji) return;

    let score = 0;
    if (text.includes(keyword)) {
      score = keyword.length * 10 + item.weight * 5;
    } else {
      score = scoreKeywordMatch(text.replace(/\s+/g, ''), keyword.replace(/\s+/g, '')) + item.weight * 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestEmoji = item.emoji;
    }
  });

  return bestScore > 0 ? bestEmoji : '';
}

function getStepMeaningEmoji(stepTitle: string, guidance = '', customEmoji?: string, emojiPreferences: NavigationEmojiPreference[] = []) {
  if (customEmoji?.trim()) return customEmoji.trim();

  const learnedEmoji = getLearnedStepMeaningEmoji(stepTitle, guidance, emojiPreferences);
  if (learnedEmoji) return learnedEmoji;

  const title = stepTitle.toLowerCase().replace(/\s+/g, '');

  let bestEmoji = '🧩';
  let bestScore = 0;

  for (const rule of STEP_EMOJI_RULES) {
    let ruleScore = 0;
    for (const keyword of rule.keywords) {
      ruleScore = Math.max(ruleScore, scoreKeywordMatch(title, keyword));
    }
    if (ruleScore > bestScore) {
      bestScore = ruleScore;
      bestEmoji = rule.emoji;
    }
  }

  if (bestScore > 0) return bestEmoji;

  if (/(收|拿|放|开|关|去|回|做|弄|搞|处理|整理)/.test(title)) return '👐';
  if (/(看|读|听|想|记|查)/.test(title)) return '🧠';
  if (/(走|跑|动|上|下)/.test(title)) return '🚶';
  return '🧷';
}

function isSleepProtectedStep(stepTitle?: string) {
  const title = (stepTitle || '').toLowerCase().replace(/\s+/g, '');
  return /(睡|睡觉|入睡|午睡|补觉|躺下|休息|闭眼|就寝|上床)/.test(title);
}

interface NavigationCollectedEmojiItem {
  id: string;
  emoji: string;
  stepId: string;
  isFresh?: boolean;
}

const STEP_EMOJI_RULES: { emoji: string; keywords: string[] }[] = [
  { emoji: '💡', keywords: ['关灯', '开灯', '灯', '照明', '台灯'] },
  { emoji: '🕯️', keywords: ['夜灯', '氛围灯', '床头灯'] },
  { emoji: '🚽', keywords: ['洗手间', '厕所', '卫生间', '马桶'] },
  { emoji: '🪠', keywords: ['通厕', '疏通', '马桶刷'] },
  { emoji: '🚰', keywords: ['水龙头', '洗手', '接水', '冲水', '水'] },
  { emoji: '🫗', keywords: ['倒水', '倒茶', '倒饮料', '续水'] },
  { emoji: '🗑️', keywords: ['垃圾', '倒垃圾', '扔垃圾', '垃圾袋', '垃圾桶'] },
  { emoji: '♻️', keywords: ['回收', '分类垃圾', '可回收'] },
  { emoji: '🪥', keywords: ['洗漱', '刷牙', '牙', '漱口', '牙刷'] },
  { emoji: '🦷', keywords: ['牙线', '护牙', '牙套'] },
  { emoji: '🧴', keywords: ['洗脸', '护肤', '面膜', '乳液', '擦脸'] },
  { emoji: '🧼', keywords: ['香皂', '肥皂', '清洁皮肤'] },
  { emoji: '🛁', keywords: ['洗澡', '沐浴', '泡澡'] },
  { emoji: '🚿', keywords: ['淋浴', '冲澡'] },
  { emoji: '🫧', keywords: ['洗头', '吹头', '泡泡', '清洁'] },
  { emoji: '🪮', keywords: ['梳头', '整理头发', '扎头发'] },
  { emoji: '💧', keywords: ['喝水', '热水', '温水'] },
  { emoji: '🥤', keywords: ['果汁', '汽水', '饮品', '冷饮'] },
  { emoji: '🍽️', keywords: ['吃饭', '早餐', '午饭', '晚饭', '做饭', '煮饭', '用餐'] },
  { emoji: '🍳', keywords: ['煎蛋', '炒菜', '下厨', '备餐'] },
  { emoji: '🍎', keywords: ['水果', '苹果', '香蕉', '吃点东西', '加餐'] },
  { emoji: '🥗', keywords: ['沙拉', '轻食', '蔬菜'] },
  { emoji: '☕', keywords: ['咖啡', '奶茶', '饮料', '茶'] },
  { emoji: '🫖', keywords: ['泡茶', '茶壶', '热茶'] },
  { emoji: '🛏️', keywords: ['起床', '下床', '坐起来', '上床'] },
  { emoji: '⏰', keywords: ['闹钟', '叫醒', '定时'] },
  { emoji: '👕', keywords: ['穿衣', '换衣', '衣服', '换鞋', '整理穿搭'] },
  { emoji: '🧥', keywords: ['外套', '穿外套', '披衣服'] },
  { emoji: '🧦', keywords: ['袜子', '鞋', '鞋子'] },
  { emoji: '👟', keywords: ['运动鞋', '出门鞋', '穿鞋'] },
  { emoji: '🚪', keywords: ['出门', '离开', '进去', '进门', '回家', '开门', '关门'] },
  { emoji: '🪪', keywords: ['门禁', '工卡', '刷卡'] },
  { emoji: '🔑', keywords: ['钥匙', '锁门', '开锁'] },
  { emoji: '🔐', keywords: ['反锁', '密码锁', '上锁'] },
  { emoji: '🚌', keywords: ['通勤', '坐车', '地铁', '公交', '打车'] },
  { emoji: '🚇', keywords: ['地铁站', '乘地铁'] },
  { emoji: '🚶', keywords: ['走路', '散步', '下楼', '上楼', '去一趟'] },
  { emoji: '🪜', keywords: ['楼梯', '爬楼'] },
  { emoji: '🏃', keywords: ['运动', '锻炼', '拉伸', '跑步', '跳操'] },
  { emoji: '🏋️', keywords: ['力量训练', '健身', '举铁'] },
  { emoji: '🧘', keywords: ['冥想', '呼吸', '放松', '平静一下'] },
  { emoji: '😮‍💨', keywords: ['深呼吸', '缓一缓', '喘口气'] },
  { emoji: '📚', keywords: ['学习', '看书', '复习', '背诵', '阅读'] },
  { emoji: '📝', keywords: ['笔记', '记笔记', '摘抄'] },
  { emoji: '✍️', keywords: ['写', '文档', '总结', '方案', '作业', '记录'] },
  { emoji: '🗒️', keywords: ['列清单', '草稿', '便签'] },
  { emoji: '💻', keywords: ['电脑', '代码', '开发', '表格', '整理文件', '办公'] },
  { emoji: '⌨️', keywords: ['打字', '键盘', '输入'] },
  { emoji: '📱', keywords: ['手机', '消息', '微信', '打开 app', '回复消息'] },
  { emoji: '📲', keywords: ['回消息', '刷手机', '查看通知'] },
  { emoji: '💬', keywords: ['沟通', '聊天', '回复', '发消息', '联系'] },
  { emoji: '🗣️', keywords: ['讨论', '交流', '说明'] },
  { emoji: '📞', keywords: ['电话', '打电话', '语音'] },
  { emoji: '🎧', keywords: ['语音会议', '开会', '听会'] },
  { emoji: '🧹', keywords: ['清理', '整理', '收拾', '打扫', '擦桌子'] },
  { emoji: '🪣', keywords: ['拖地', '打水', '清洁桶'] },
  { emoji: '🧺', keywords: ['洗衣', '晾衣', '叠衣', '收衣服'] },
  { emoji: '🧷', keywords: ['缝补', '别针', '整理小物'] },
  { emoji: '🛍️', keywords: ['买', '采购', '购物', '下单', '快递'] },
  { emoji: '🛒', keywords: ['购物车', '逛超市', '采购清单'] },
  { emoji: '📦', keywords: ['快递', '拆包', '收包裹'] },
  { emoji: '✂️', keywords: ['拆快递', '剪开包裹'] },
  { emoji: '🐾', keywords: ['猫', '狗', '宠物', '喂猫', '喂狗', '铲猫砂'] },
  { emoji: '🦴', keywords: ['宠物零食', '遛狗', '逗猫'] },
  { emoji: '💊', keywords: ['药', '吃药', '看病', '医院'] },
  { emoji: '🩺', keywords: ['体检', '问诊', '测体温'] },
  { emoji: '🌙', keywords: ['睡', '休息', '午睡', '躺下'] },
  { emoji: '😴', keywords: ['入眠', '困了', '打盹'] },
  { emoji: '🗂️', keywords: ['计划', '安排', '拆解', '待办', '梳理'] },
  { emoji: '📆', keywords: ['日程', '排期', '日历'] },
  { emoji: '🧾', keywords: ['账单', '报销', '付款', '缴费'] },
  { emoji: '💸', keywords: ['转账', '付款码', '花钱'] },
  { emoji: '🪴', keywords: ['植物', '浇花'] },
  { emoji: '🌱', keywords: ['发芽', '照料植物', '修剪植物'] },
  { emoji: '🪟', keywords: ['窗', '窗户', '拉窗帘', '开窗', '关窗'] },
  { emoji: '🪞', keywords: ['镜子', '照镜子'] },
  { emoji: '🛋️', keywords: ['沙发', '坐下', '整理房间'] },
  { emoji: '🪑', keywords: ['椅子', '坐回工位', '搬椅子'] },
  { emoji: '📖', keywords: ['翻书', '读资料', '教材'] },
  { emoji: '🔍', keywords: ['查资料', '搜索', '查找'] },
  { emoji: '🧠', keywords: ['思考', '想一想', '构思'] },
  { emoji: '🎯', keywords: ['专注', '完成目标', '攻克'] },
  { emoji: '✅', keywords: ['完成', '搞定', '结束', '收尾'] },
  { emoji: '🫶', keywords: ['鼓励自己', '奖励自己', '庆祝一下'] },
];

function scoreKeywordMatch(title: string, keyword: string) {
  if (!keyword) return 0;
  if (title.includes(keyword)) return keyword.length * 10;

  const cleanKeyword = keyword.replace(/\s+/g, '');
  if (cleanKeyword.length <= 2) return 0;

  const uniqueChars = Array.from(new Set(cleanKeyword.split('').filter((char) => char.trim())));
  const overlap = uniqueChars.filter((char) => title.includes(char)).length;
  const overlapRatio = uniqueChars.length > 0 ? overlap / uniqueChars.length : 0;

  if (uniqueChars.length >= 4 && overlapRatio >= 0.75) return uniqueChars.length * 2;
  if (uniqueChars.length >= 3 && overlapRatio >= 1) return uniqueChars.length * 2.5;
  return 0;
}

function hashEmojiLayoutSeed(value: string) {
  return value.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function getCollectedEmojiLayout(index: number, seedKey: string, columnCount: number) {
  const row = Math.floor(index / columnCount);
  const column = index % columnCount;
  const seed = hashEmojiLayoutSeed(seedKey);
  const rowBaseLeft = 12;
  const spacing = 7.4;
  const rowFill = Math.min(columnCount, index + 1 - row * columnCount);
  const rowStartLeft = rowBaseLeft + ((columnCount - rowFill) * spacing) / 2;
  const horizontalJitter = ((seed % 7) - 3) * (row === 0 ? 0.55 : 0.42);
  const verticalJitter = (((Math.floor(seed / 7)) % 5) - 2) * 0.45;
  const rotate = ((Math.floor(seed / 13) % 9) - 4) * 4;
  const left = rowStartLeft + (column * spacing) + horizontalJitter;
  const bottom = 3 + row * 8.8 + verticalJitter;

  return { left, bottom, rotate };
}


function buildCollectedStepEmojis(session: NavigationSession, emojiPreferences: NavigationEmojiPreference[] = [], now = Date.now()) {
  const completedSteps = session.executionSteps
    .filter((step) => step.status === 'completed' && step.completedAt)
    .sort((a, b) => new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime());

  const uniqueCompletedSteps = completedSteps.filter((step, index, list) => list.findIndex((item) => item.id === step.id) === index);

  return uniqueCompletedSteps.map((step, index, list) => ({
    id: `collected-${step.id}`,
    emoji: getStepMeaningEmoji(step.title, step.guidance, step.meaningEmoji, emojiPreferences),
    stepId: step.id,
    isFresh: index === list.length - 1 && session.status === 'active' && now - new Date(step.completedAt || now).getTime() < 90000,
  }));
}

function formatCollectionDateTag(date?: string) {
  if (!date) return '今天';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '今天';
  return `${value.getMonth() + 1}月${value.getDate()}日`;
}

function formatBottleHistoryDate(date: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return `${value.getMonth() + 1}月${value.getDate()}日`;
}

function toLocalDateKey(dateLike?: string | number | Date) {
  const value = dateLike ? new Date(dateLike) : new Date();
  if (Number.isNaN(value.getTime())) return new Date().toISOString().slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function buildBottleStackLayout(items: string[], seedKey: string, columnCount: number) {
  return items.map((emoji, index) => {
    const layout = getCollectedEmojiLayout(index, `${seedKey}-${emoji}-${index}`, columnCount);
    return {
      emoji,
      left: layout.left,
      bottom: Math.max(2, layout.bottom),
      rotate: layout.rotate,
    };
  });
}

function buildDailyBottleGroups(entries: NavigationBottleEntry[]) {
  const groups = new Map<string, NavigationBottleEntry[]>();
  entries.forEach((entry) => {
    const list = groups.get(entry.date) || [];
    list.push(entry);
    groups.set(entry.date, list);
  });

  return Array.from(groups.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, dayEntries]) => ({
      date,
      entries: [...dayEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      emojis: dayEntries.flatMap((entry) => entry.emojis),
      inefficiencyMarks: dayEntries.reduce((sum, entry) => sum + entry.inefficiencyMarks, 0),
    }));
}

function difficultyLabel(value?: number) {
  return ['简单', '一般', '有点挑战', '很难'][Math.max(0, (value || 1) - 1)] || '一般';
}

function buildHandsFreeSpeech(step: NavigationExecutionStep) {
  const guidance = step.guidance?.trim();
  if (!guidance) {
    return `现在${step.title}。`;
  }

  return `现在${step.title}，${guidance}。`;
}

function normalizeVoiceTranscript(transcript: string) {
  return transcript
    .replace(/[，。！？、,.!?"]+/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function matchesVoiceCommand(normalized: string, keywords: string[]) {
  return keywords.some((keyword) => normalized.includes(keyword));
}

function isWeakConfirmCommand(normalized: string) {
  return ['嗯', '嗯嗯', '好', '好的', '好了', '行', '可以', 'ok'].includes(normalized.toLowerCase());
}

function playCoinDrop() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const now = context.currentTime;

  const playTone = ({
    frequency,
    start,
    duration,
    volume,
    type,
    endFrequency,
  }: {
    frequency: number;
    start: number;
    duration: number;
    volume: number;
    type: OscillatorType;
    endFrequency?: number;
  }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  playTone({ frequency: 820, start: now, duration: 0.07, volume: 0.08, type: 'sine', endFrequency: 620 });
  playTone({ frequency: 1560, start: now + 0.01, duration: 0.13, volume: 0.18, type: 'triangle', endFrequency: 1760 });
  playTone({ frequency: 2090, start: now + 0.05, duration: 0.12, volume: 0.15, type: 'triangle', endFrequency: 2380 });
  playTone({ frequency: 2630, start: now + 0.095, duration: 0.16, volume: 0.14, type: 'sine', endFrequency: 3010 });

  window.setTimeout(() => {
    void context.close().catch(() => undefined);
  }, 420);
}

function playFocusCompleteTone() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const now = context.currentTime;

  const playTone = ({
    frequency,
    start,
    duration,
    volume,
    type,
  }: {
    frequency: number;
    start: number;
    duration: number;
    volume: number;
    type: OscillatorType;
  }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };

  playTone({ frequency: 784, start: now, duration: 0.18, volume: 0.12, type: 'triangle' });
  playTone({ frequency: 1046, start: now + 0.2, duration: 0.2, volume: 0.14, type: 'triangle' });
  playTone({ frequency: 1318, start: now + 0.44, duration: 0.26, volume: 0.16, type: 'sine' });
  playTone({ frequency: 1046, start: now + 0.78, duration: 0.22, volume: 0.12, type: 'triangle' });
  playTone({ frequency: 1568, start: now + 1.02, duration: 0.36, volume: 0.18, type: 'sine' });

  window.setTimeout(() => {
    void context.close().catch(() => undefined);
  }, 1800);
}

function formatFocusCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getCurrentNavigationGroup(session: NavigationSession) {
  const currentStep = session.executionSteps[session.currentStepIndex];
  if (!currentStep) return null;
  return session.timelineGroups.find((group) => group.id === currentStep.groupId) || null;
}

function createNavigationGoalDraft(goal?: LongTermGoal | null): GoalFormData {
  if (!goal) {
    return buildQuickGoalFormData('');
  }

  return {
    name: goal.name,
    description: goal.description,
    type: goal.goalType,
    startDate: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
    endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
    estimatedTotalHours: goal.estimatedTotalHours || 0,
    targetIncome: goal.targetIncome || 0,
    dimensions: goal.dimensions.length > 0 ? goal.dimensions : [{
      id: `metric-${goal.id}`,
      name: goal.name,
      unit: goal.unit || '',
      targetValue: goal.targetValue || 1,
      currentValue: goal.currentValue,
      weight: 100,
    }],
    theme: goal.theme,
  };
}

function buildNavigationGroupContributionKey(sessionId: string, groupId: string) {
  return `navigation-group:${sessionId}:${groupId}`;
}

function getNavigationGroupTiming(session: NavigationSession, groupId: string) {
  const relatedSteps = session.executionSteps.filter((step) => step.groupId === groupId);
  const startTimes = relatedSteps.map((step) => step.startedAt).filter(Boolean) as string[];
  const endTimes = relatedSteps.map((step) => step.completedAt).filter(Boolean) as string[];

  if (!startTimes.length || !endTimes.length) {
    return {
      actualStart: undefined,
      actualEnd: undefined,
      durationMinutes: 1,
    };
  }

  const actualStart = new Date(Math.min(...startTimes.map((time) => new Date(time).getTime())));
  const actualEnd = new Date(Math.max(...endTimes.map((time) => new Date(time).getTime())));

  return {
    actualStart,
    actualEnd,
    durationMinutes: Math.max(1, Math.round((actualEnd.getTime() - actualStart.getTime()) / 60000)),
  };
}

function NavigationKRSheet({
  session,
  group,
  mode = 'active',
  onClose,
}: {
  session: NavigationSession;
  group: NavigationTimelineGroup;
  mode?: 'preview' | 'active';
  onClose: () => void;
}) {
  const goals = useGoalStore((state) => state.goals);
  const createGoal = useGoalStore((state) => state.createGoal);
  const addGoalContributionRecord = useGoalContributionStore((state) => state.addRecord);
  const updateGoalContributionRecord = useGoalContributionStore((state) => state.updateRecord);
  const contributionRecords = useGoalContributionStore((state) => state.records);
  const saveGroupGoalLink = useNavigationStore((state) => state.saveGroupGoalLink);
  const contributionKey = buildNavigationGroupContributionKey(session.id, group.id);
  const isPreviewMode = mode === 'preview';
  const activeGoals = useMemo(() => goals.filter((goal) => goal.isActive && !goal.isCompleted), [goals]);
  const matchedGoals = useMemo(() => {
    const keywords = `${group.title} ${group.description || ''}`.split(/\s+/).filter(Boolean);
    return useGoalStore.getState().findMatchingGoals(group.title, keywords).slice(0, 3);
  }, [group.description, group.title]);
  const selectableGoals = useMemo(() => {
    const map = new Map<string, LongTermGoal>();
    [...matchedGoals, ...activeGoals].forEach((goal) => map.set(goal.id, goal));
    return Array.from(map.values());
  }, [activeGoals, matchedGoals]);
  const existingRecord = useMemo(
    () => contributionRecords.find((record) => record.taskId === contributionKey),
    [contributionKey, contributionRecords]
  );
  const persistedGoalId = group.linkedGoalId || '';
  const initialGoalId = existingRecord?.goalId || persistedGoalId || selectableGoals[0]?.id || '';
  const [selectedGoalId, setSelectedGoalId] = useState(initialGoalId);
  const [note, setNote] = useState(existingRecord?.note || group.krNote || '');
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (existingRecord) {
      return existingRecord.dimensionResults.reduce<Record<string, string>>((acc, item) => {
        acc[item.dimensionId] = String(item.value);
        return acc;
      }, {});
    }

    return Object.entries(group.krDimensionValues || {}).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {});
  });
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGoalDraft, setNewGoalDraft] = useState<GoalFormData>(() => buildQuickGoalFormData(group.title));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const selectedGoal = selectableGoals.find((goal) => goal.id === selectedGoalId) || null;
  const timing = useMemo(() => getNavigationGroupTiming(session, group.id), [group.id, session]);
  const actualDurationMinutes = timing.durationMinutes;

  useEffect(() => {
    if (!selectedGoal) return;
    setValues((prev) => {
      const nextValues = { ...prev };
      selectedGoal.dimensions.forEach((dimension) => {
        if (nextValues[dimension.id] === undefined) {
          const existingValue = existingRecord?.dimensionResults.find((item) => item.dimensionId === dimension.id)?.value;
          nextValues[dimension.id] = existingValue !== undefined ? String(existingValue) : '';
        }
      });
      return nextValues;
    });
  }, [existingRecord, selectedGoal]);

  const handleCreateGoal = (goalData: GoalFormData) => {
    const newGoal = createGoal(buildGoalPayloadFromForm(goalData));
    setSelectedGoalId(newGoal.id);
    setShowCreateGoal(false);
    setNewGoalDraft(createNavigationGoalDraft(newGoal));
    setSaveSuccess(`已新建目标「${newGoal.name}」`);
    setSaveError(null);
  };

  const handleSave = () => {
    if (!selectedGoal) {
      setSaveError('请先选择或新建一个目标。');
      setSaveSuccess(null);
      return;
    }

    const dimensionResults = selectedGoal.dimensions
      .map((dimension) => ({
        dimensionId: dimension.id,
        dimensionName: dimension.name,
        unit: dimension.unit,
        value: Number(values[dimension.id] || 0),
      }))
      .filter((item) => item.value > 0);

    if (dimensionResults.length === 0) {
      setSaveError('请至少填写一个大于 0 的关键结果。');
      setSaveSuccess(null);
      return;
    }

    const startedAt = timing.actualStart;
    const completedAt = timing.actualEnd;
    const dimensionValueMap = dimensionResults.reduce<Record<string, number>>((acc, item) => {
      acc[item.dimensionId] = item.value;
      return acc;
    }, {});

    saveGroupGoalLink(group.id, {
      goalId: selectedGoal.id,
      note,
      dimensionValues: dimensionValueMap,
    });

    if (!isPreviewMode) {
      if (existingRecord) {
        updateGoalContributionRecord(existingRecord.id, {
          goalId: selectedGoal.id,
          taskTitle: group.title,
          note,
          startTime: startedAt,
          endTime: completedAt,
          durationMinutes: actualDurationMinutes,
          dimensionResults,
        });
      } else {
        addGoalContributionRecord({
          goalId: selectedGoal.id,
          taskId: contributionKey,
          taskTitle: group.title,
          startTime: startedAt,
          endTime: completedAt,
          durationMinutes: actualDurationMinutes,
          note,
          source: 'manual',
          dimensionResults,
        });
      }
    }

    setSaveError(null);
    setSaveSuccess(isPreviewMode ? `已绑定到任务「${group.title}」` : `已保存到任务「${group.title}」`);
  };

  if (showCreateGoal) {
    return (
      <div className="navigation-sheet-backdrop">
        <div className="navigation-sheet-card navigation-kr-form-sheet">
          <GoalForm
            initialData={newGoalDraft}
            dimensions={[]}
            onSave={handleCreateGoal}
            onCancel={() => setShowCreateGoal(false)}
            bgColor="#efeff4"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="navigation-sheet-backdrop">
      <div className="navigation-sheet-card navigation-kr-sheet">
        <div className="navigation-sheet-header navigation-kr-sheet-header">
          <div className="navigation-kr-sheet-title-block">
            <h3>给当前任务补目标 / KR</h3>
            <div className="navigation-kr-task-pill" title={group.title}>{group.title}</div>
          </div>
          <button onClick={onClose} className="navigation-icon-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="navigation-kr-section">
          <div className="navigation-kr-label-row">
            <span>关联目标</span>
            <button
              className="navigation-chip navigation-kr-create-chip"
              onClick={() => {
                setNewGoalDraft(buildQuickGoalFormData(group.title));
                setShowCreateGoal(true);
              }}
            >
              新建目标
            </button>
          </div>
          <select
            value={selectedGoalId}
            onChange={(e) => {
              setSelectedGoalId(e.target.value);
              setSaveError(null);
              setSaveSuccess(null);
            }}
            className="navigation-composer navigation-kr-goal-select"
          >
            <option value="">请选择目标</option>
            {selectableGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.name}</option>
            ))}
          </select>
        </div>

        {selectedGoal && (
          <div className="navigation-kr-section">
            <div className="navigation-kr-label-row">
              <span>关键结果</span>
              <span className="navigation-small-note">保存到任务标题，不保存到小步骤</span>
            </div>
            <div className="navigation-kr-dimension-list">
              {selectedGoal.dimensions.map((dimension) => {
                const currentValue = Number(values[dimension.id] || 0);
                const progressPercent = Math.min(100, (currentValue / Math.max(dimension.targetValue, 1)) * 100);

                return (
                <label key={dimension.id} className="navigation-kr-dimension-card">
                  <div className="navigation-kr-dimension-head">
                    <strong>{dimension.name}</strong>
                    <span>{dimension.targetValue} {dimension.unit}</span>
                  </div>
                  <div className="navigation-kr-progress-track">
                    <div className="navigation-kr-progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="navigation-kr-dimension-input-row">
                    <button
                      type="button"
                      className="navigation-kr-stepper"
                      onClick={() => setValues((prev) => ({ ...prev, [dimension.id]: String(Math.max(0, currentValue - (Number.isInteger(dimension.targetValue) ? 1 : 0.1))) }))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      step={Number.isInteger(dimension.targetValue) ? 1 : 0.1}
                      value={values[dimension.id] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [dimension.id]: e.target.value }))}
                      className="navigation-inline-input navigation-kr-number-input"
                      placeholder="本次新增"
                    />
                    <span>{dimension.unit}</span>
                    <button
                      type="button"
                      className="navigation-kr-stepper is-plus"
                      onClick={() => setValues((prev) => ({ ...prev, [dimension.id]: String(currentValue + (Number.isInteger(dimension.targetValue) ? 1 : 0.1)) }))}
                    >
                      +
                    </button>
                  </div>
                </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="navigation-kr-section">
          <div className="navigation-kr-label-row">
            <span>说明</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="navigation-composer"
            placeholder="例如：这个任务推进了哪些结果，顺手记一下"
          />
        </div>

        {(saveError || saveSuccess) && (
          <div className={`navigation-kr-feedback ${saveError ? 'is-error' : 'is-success'}`}>
            {saveError || saveSuccess}
          </div>
        )}

        <div className="navigation-sheet-actions column-on-mobile">
          <button className="navigation-secondary-button" onClick={onClose}>关闭</button>
          <button className="navigation-primary-button" onClick={handleSave}>保存到当前任务</button>
        </div>
      </div>
    </div>
  );
}

function NavigationGroupGoalSummary({ group }: { group: NavigationTimelineGroup }) {
  const linkedGoal = useGoalStore((state) => (group.linkedGoalId ? state.getGoalById(group.linkedGoalId) : null));
  const krCount = group.krDimensionValues
    ? Object.values(group.krDimensionValues).filter((value) => Number(value) > 0).length
    : 0;

  return (
    <div className="navigation-group-goal-row">
      <div className={`navigation-group-goal-chip ${linkedGoal ? 'is-linked' : ''}`}>
        <Target className="w-4 h-4" />
        <span>{linkedGoal ? linkedGoal.name : '暂未关联目标'}</span>
      </div>
      {krCount > 0 && <span className="navigation-group-goal-meta">已填 {krCount} 项 KR</span>}
    </div>
  );
}

function NavigationSettingsSheet({ onClose }: { onClose: () => void }) {
  const { preferences, updatePreferences, setCustomPrompt, resetPreferences, removeEmojiPreference } = useNavigationPreferenceStore();

  return (
    <div className="navigation-sheet-backdrop">
      <div className="navigation-sheet-card">
        <div className="navigation-sheet-header">
          <h3>导航偏好</h3>
          <button onClick={onClose} className="navigation-icon-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="navigation-field">
          <span>长期提示词</span>
          <textarea
            value={preferences.customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={12}
          />
        </label>

        <div className="navigation-grid-two">
          <label className="navigation-field">
            <span>步骤粒度</span>
            <select
              value={preferences.granularity}
              onChange={(e) => updatePreferences({ granularity: e.target.value as typeof preferences.granularity })}
            >
              <option value="ultra_fine">超细</option>
              <option value="balanced">平衡</option>
              <option value="slightly_coarse">稍粗</option>
            </select>
          </label>

          <label className="navigation-field">
            <span>起步风格</span>
            <select
              value={preferences.easyStartMode}
              onChange={(e) => updatePreferences({ easyStartMode: e.target.value as typeof preferences.easyStartMode })}
            >
              <option value="gentle">无痛启动</option>
              <option value="normal">正常启动</option>
              <option value="direct">直接进入</option>
            </select>
          </label>

          <label className="navigation-field">
            <span>顺手任务强度</span>
            <select
              value={preferences.sideTaskIntensity}
              onChange={(e) => updatePreferences({ sideTaskIntensity: e.target.value as typeof preferences.sideTaskIntensity })}
            >
              <option value="light">少量</option>
              <option value="medium">适中</option>
              <option value="rich">尽量多</option>
            </select>
          </label>

          <label className="navigation-field">
            <span>语气</span>
            <select
              value={preferences.tone}
              onChange={(e) => updatePreferences({ tone: e.target.value as typeof preferences.tone })}
            >
              <option value="gentle">温柔陪伴</option>
              <option value="calm">冷静简洁</option>
              <option value="encouraging">轻轻鼓励</option>
            </select>
          </label>
        </div>

        <label className="navigation-field">
          <span>家里动线</span>
          <textarea
            value={preferences.homeLayout}
            onChange={(e) => updatePreferences({ homeLayout: e.target.value })}
            rows={3}
          />
        </label>

        <div className="navigation-field">
          <span>已学会的 Emoji 习惯</span>
          <div className="navigation-card-list">
            {preferences.emojiPreferences.length === 0 ? (
              <div className="navigation-group-card">
                <strong>还没有学习记录</strong>
                <p>你在导航里双击步骤 emoji 手动修改后，我会慢慢记住你的习惯。</p>
              </div>
            ) : (
              preferences.emojiPreferences.slice(0, 24).map((item) => (
                <div key={`${item.keyword}-${item.emoji}`} className="navigation-group-card">
                  <div className="navigation-inline-row">
                    <strong>{item.emoji} {item.keyword}</strong>
                    <button
                      className="navigation-inline-icon-button"
                      onClick={() => removeEmojiPreference({ keyword: item.keyword, emoji: item.emoji })}
                      title="删除这条学习记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p>学习次数：{item.weight} · 最近更新：{new Date(item.updatedAt).toLocaleDateString('zh-CN')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="navigation-sheet-actions">
          <button className="navigation-secondary-button" onClick={resetPreferences}>恢复默认</button>
          <button className="navigation-primary-button" onClick={onClose}>保存</button>
        </div>
      </div>
    </div>
  );
}

function NavigationStateRecorder({
  title,
  subtitle,
  confirmLabel,
  initialValue,
  includeEstimatedDuration,
  includeAchievementSense,
  onSubmit,
  onSkip,
}: {
  title: string;
  subtitle: string;
  confirmLabel: string;
  initialValue?: NavigationStateSnapshot;
  includeEstimatedDuration?: boolean;
  includeAchievementSense?: boolean;
  onSubmit: (value: NavigationStateSnapshot) => void;
  onSkip: () => void;
}) {
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(initialValue?.estimatedDurationMinutes || 100);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4>(initialValue?.perceivedDifficulty || initialValue?.actualDifficulty || 2);
  const [brainState, setBrainState] = useState(initialValue?.brainState ?? 50);
  const [emotionState, setEmotionState] = useState(initialValue?.emotionState ?? 50);
  const [achievementSense, setAchievementSense] = useState(initialValue?.achievementSense ?? 70);
  const [reflection, setReflection] = useState(initialValue?.reflection || '');

  return (
    <div className="navigation-state-screen">
      <div className="navigation-state-card navigation-state-reference-card">
        <div className="navigation-state-header navigation-state-reference-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {includeEstimatedDuration && (
          <div className="navigation-state-block navigation-state-reference-block">
            <div className="navigation-state-label-row navigation-state-inline-label-row">
              <span>你觉得这件事要花多少时间？</span>
              <strong>{estimatedDurationMinutes < 60 ? `${estimatedDurationMinutes} 分钟` : `${Math.floor(estimatedDurationMinutes / 60)}小时 ${estimatedDurationMinutes % 60}分钟`}</strong>
            </div>
            <input className="navigation-reference-range navigation-reference-range-rose" type="range" min={5} max={360} step={5} value={estimatedDurationMinutes} onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))} />
          <div className="navigation-range-labels navigation-reference-range-labels">
            <span>5分钟</span><span>3小时</span><span>6小时以上</span>
          </div>
          </div>
        )}

        <div className="navigation-state-block navigation-state-reference-block">
          <div className="navigation-state-label-row">
            <span>{includeEstimatedDuration ? '你觉得这件事难度如何？' : '你觉得这件事实际难度如何？'}</span>
          </div>
          <div className="navigation-choice-row navigation-reference-choice-row">
            {[1, 2, 3, 4].map((item) => (
              <button
                key={item}
                className={`navigation-choice-chip navigation-reference-choice-chip ${difficulty === item ? 'is-active' : ''}`}
                onClick={() => setDifficulty(item as 1 | 2 | 3 | 4)}
              >
                {difficultyLabel(item)}
              </button>
            ))}
          </div>
        </div>

        <div className="navigation-state-block navigation-state-reference-block">
          <div className="navigation-state-label-row">
            <span>此刻大脑感受如何？</span>
          </div>
          <input className="navigation-reference-range navigation-reference-range-rose-soft" type="range" min={0} max={100} step={1} value={brainState} onChange={(e) => setBrainState(Number(e.target.value))} />
          <div className="navigation-range-labels navigation-reference-range-labels"><span>非常昏沉</span><span>一般</span><span>非常清晰</span></div>
        </div>

        <div className="navigation-state-block navigation-state-reference-block">
          <div className="navigation-state-label-row">
            <span>此刻情绪感受如何？</span>
          </div>
          <input className="navigation-reference-range navigation-reference-range-rose-soft" type="range" min={0} max={100} step={1} value={emotionState} onChange={(e) => setEmotionState(Number(e.target.value))} />
          <div className="navigation-range-labels navigation-reference-range-labels"><span>非常低落</span><span>一般</span><span>非常愉快</span></div>
        </div>

        {includeAchievementSense && (
          <div className="navigation-state-block navigation-state-reference-block">
            <div className="navigation-state-label-row">
              <span>完成后成就感如何？</span>
            </div>
            <input className="navigation-reference-range navigation-reference-range-rose" type="range" min={0} max={100} step={1} value={achievementSense} onChange={(e) => setAchievementSense(Number(e.target.value))} />
            <div className="navigation-range-labels navigation-reference-range-labels"><span>没有</span><span>一般</span><span>很强</span></div>
          </div>
        )}

        {includeAchievementSense && (
          <div className="navigation-state-block navigation-state-reference-block">
            <div className="navigation-state-label-row"><span>完成后的感受与想法</span></div>
            <textarea
              className="navigation-composer navigation-reference-textarea"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              placeholder="可以写写此刻的感受、这次的收获，或者给自己一句鼓励的话～"
            />
          </div>
        )}

        <div className="navigation-state-footer-actions navigation-state-footer-actions-inline">
          <button className="navigation-secondary-button" onClick={onSkip}>跳过</button>
          <button
            className="navigation-primary-button"
            onClick={() => onSubmit({
              estimatedDurationMinutes: includeEstimatedDuration ? estimatedDurationMinutes : undefined,
              perceivedDifficulty: includeEstimatedDuration ? difficulty : undefined,
              actualDifficulty: includeEstimatedDuration ? undefined : difficulty,
              brainState,
              emotionState,
              achievementSense: includeAchievementSense ? achievementSense : undefined,
              reflection: includeAchievementSense ? reflection : undefined,
            })}
          >
            {confirmLabel}
          </button>
        </div>

        {!includeAchievementSense && <div className="navigation-small-note">*所有选项都是可选项，按你自己的意愿填写或跳过</div>}
      </div>
    </div>
  );
}

function NavigationHandsFreeIntro({
  onClose,
  onEnable,
  preferredVoiceMode,
  onChangeVoiceMode,
  isEdgeVoiceConfigured,
  playbackSource,
  didFallbackToSystem,
}: {
  onClose: () => void;
  onEnable: () => void;
  preferredVoiceMode: 'system' | 'edge';
  onChangeVoiceMode: (mode: 'system' | 'edge') => void;
  isEdgeVoiceConfigured: boolean;
  playbackSource: 'system' | 'edge';
  didFallbackToSystem: boolean;
}) {
  return (
    <div className="navigation-sheet-backdrop">
      <div className="navigation-sheet-card navigation-handsfree-sheet">
        <div className="navigation-sheet-header">
          <button onClick={onClose} className="navigation-icon-button">
            <X className="w-4 h-4" />
          </button>
          <h3>语音模式</h3>
          <div style={{ width: 38 }} />
        </div>

        <div className="navigation-handsfree-icon">
          <Mic className="w-8 h-8" />
        </div>

        <p className="navigation-handsfree-text">
          开启后，我会自动读出当前步骤的标题和备注，方便你在不方便点屏幕时知道下一步要做什么。
        </p>
        <p className="navigation-handsfree-text secondary">你可以直接说：继续、下一步、完成、跳过、重说、暂停、恢复。</p>

        <div className="navigation-handsfree-voice-picker">
          <button
            className={`navigation-choice-chip ${preferredVoiceMode === 'system' ? 'is-active' : ''}`}
            onClick={() => onChangeVoiceMode('system')}
          >
            系统语音
          </button>
          <button
            className={`navigation-choice-chip ${preferredVoiceMode === 'edge' ? 'is-active' : ''}`}
            onClick={() => onChangeVoiceMode('edge')}
            disabled={!isEdgeVoiceConfigured}
            title={isEdgeVoiceConfigured ? '使用 Edge TTS 接口播报' : '需要先配置 VITE_EDGE_TTS_ENDPOINT'}
          >
            更自然语音
          </button>
        </div>

        <p className="navigation-handsfree-text secondary">
          {isEdgeVoiceConfigured
            ? '已检测到更自然语音接口配置，开启后会优先使用它播报。'
            : '当前默认使用浏览器系统语音。若想更像真人，可后续配置免费的 Edge TTS 接口。'}
        </p>

        <div className="navigation-handsfree-source-status">
          <span className={`navigation-handsfree-source-badge ${playbackSource === 'edge' && !didFallbackToSystem ? 'is-edge' : 'is-system'}`}>
            当前语音源：{playbackSource === 'edge' && !didFallbackToSystem ? 'Edge 自然语音' : '系统语音'}
          </span>
          {didFallbackToSystem && (
            <p className="navigation-handsfree-text secondary">更自然语音暂时不可用，本次已自动回退为系统语音。</p>
          )}
        </div>

        <div className="navigation-sheet-actions column-on-mobile">
          <button className="navigation-secondary-button" onClick={onClose}>先不用</button>
          <button className="navigation-primary-button" onClick={onEnable}>开启语音模式</button>
        </div>
      </div>
    </div>
  );
}

function NavigationComposer({ initialInput = '' }: { initialInput?: string }) {
  const preferences = useNavigationPreferenceStore((state) => state.preferences);
  const createDraftSession = useNavigationStore((state) => state.createDraftSession);
  const restoreSession = useNavigationStore((state) => state.restoreSession);
  const restoreArchivedSession = useNavigationStore((state) => state.restoreArchivedSession);
  const archivedSessions = useNavigationStore((state) => state.archivedSessions);
  const setGenerating = useNavigationStore((state) => state.setGenerating);
  const applyStreamingPlan = useNavigationStore((state) => state.applyStreamingPlan);
  const clearSession = useNavigationStore((state) => state.clearSession);
  const [input, setInput] = useState(initialInput);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const generationRequestIdRef = useRef(0);
  const latestPreviewSessionRef = useRef<NavigationSession | null>(null);

  const handleGenerate = async () => {
    const rawInput = input.trim();
    console.log('[导航] 点击生成导航', { rawInputLength: rawInput.length, rawInput });
    if (!rawInput) {
      console.warn('[导航] 输入为空，跳过生成');
      return;
    }

    const requestId = Date.now();
    generationRequestIdRef.current = requestId;
    latestPreviewSessionRef.current = null;
    console.log('[导航] 创建草稿会话并准备请求', { requestId });
    createDraftSession(rawInput);
    setGenerating(true);

    const result = await AIUnifiedService.planNavigationSession(rawInput, preferences, (partial) => {
      console.log('[导航] 收到流式 partial', partial);
      const streamingSession = useNavigationStore.getState().currentSession;
      if (
        generationRequestIdRef.current !== requestId
        || !streamingSession
        || streamingSession.rawInput !== rawInput
        || !['preview', 'active', 'paused'].includes(streamingSession.status)
      ) {
        return;
      }

      applyStreamingPlan(rawInput, partial, false);
      const refreshedSession = useNavigationStore.getState().currentSession;
      if (
        refreshedSession
        && refreshedSession.rawInput === rawInput
        && ['preview', 'active', 'paused'].includes(refreshedSession.status)
      ) {
        latestPreviewSessionRef.current = refreshedSession;
      }
    });
    const pendingSession = useNavigationStore.getState().currentSession;
    console.log('[导航] planNavigationSession 返回', { result, pendingSession });
    if (
      generationRequestIdRef.current !== requestId
      || !pendingSession
      || pendingSession.rawInput !== rawInput
      || !['preview', 'active', 'paused'].includes(pendingSession.status)
    ) {
      return;
    }

    if (result.success && result.data) {
      applyStreamingPlan(rawInput, result.data, true);
      const finalSession = useNavigationStore.getState().currentSession;
      if (
        finalSession
        && finalSession.rawInput === rawInput
        && ['preview', 'active', 'paused'].includes(finalSession.status)
      ) {
        latestPreviewSessionRef.current = finalSession;
      }
      return;
    }

    const latestSession = useNavigationStore.getState().currentSession;
    const fallbackSession = latestSession && latestSession.rawInput === rawInput
      ? latestSession
      : latestPreviewSessionRef.current;
    const hasPreviewContent = !!fallbackSession && fallbackSession.rawInput === rawInput && (
      fallbackSession.executionSteps.length > 0 || fallbackSession.timelineGroups.length > 0
    );

    if (hasPreviewContent) {
      restoreSession({
        ...fallbackSession,
        generationStage: 'idle',
        generationProgress: {
          revealedStepCount: fallbackSession.executionSteps.length,
          totalStepCount: fallbackSession.executionSteps.length,
          revealedGroupCount: fallbackSession.timelineGroups.length,
          totalGroupCount: fallbackSession.timelineGroups.length,
          done: true,
        },
        lastProgressAt: new Date().toISOString(),
      });
      console.warn('[导航] AI 收尾失败，但已保留已有预览内容', result.error);
      return;
    }

    setGenerating(false);
    console.error('[导航] 智能拆解失败', result.error);
  };

  return (
    <div className="navigation-shell navigation-session-shell">

      <div className="navigation-topbar">
        <div>
          <h2 className="navigation-title">导航模式</h2>
          <p className="navigation-subtitle">把这一串事，整理成一条能走下去的路线。</p>
        </div>
        <button className="navigation-icon-button" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="navigation-panel">
        <div className="navigation-badge-row">
          <span className="navigation-badge">已套用你的导航偏好</span>
          <span className="navigation-badge">默认无痛启动</span>
        </div>

        {archivedSessions.length > 0 && (
          <div className="navigation-home-archived-section">
            <div className="navigation-home-archived-section-header">
              <strong>存档中的导航</strong>
              <span>{archivedSessions.length} 个未完成任务</span>
            </div>
            <div className="navigation-home-archived-grid">
              {archivedSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className="navigation-home-archived-card"
                  onClick={() => restoreArchivedSession(session.id)}
                >
                  <div className="navigation-home-archived-card-top">
                    <span className="navigation-home-archived-kicker">已存档</span>
                    <span className="navigation-home-archived-step-index">
                      {Math.min(session.currentStepIndex + 1, session.executionSteps.length)} / {session.executionSteps.length}
                    </span>
                  </div>
                  <div className="navigation-home-archived-copy">
                    <p>{session.title || '导航模式'}</p>
                    <span>{session.rawInput}</span>
                  </div>
                  <div className="navigation-home-archived-meta">
                    <span>{session.archivedAt ? formatArchivedTime(session.archivedAt) : '待继续'}</span>
                    <span className="navigation-home-archived-action">继续</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          className="navigation-composer"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="比如：我现在不想起床，但是得起床穿衣服下楼洗衣服洗漱给猫倒猫粮再倒水喝"
          rows={4}
        />

        <div className="navigation-action-row">
          <button className="navigation-primary-button" onClick={handleGenerate}>
            <Sparkles className="w-4 h-4" />
            生成导航
          </button>
        </div>
      </div>

      {isSettingsOpen && <NavigationSettingsSheet onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

const EARLY_START_GROUP_THRESHOLD = 1;
const EARLY_START_STEP_THRESHOLD = 2;
const PREVIEW_REVEAL_INTERVAL_MS = 220;

function NavigationBuildingPreview({
  session,
  onReturnToComposer,
}: {
  session: NavigationSession;
  onReturnToComposer: (rawInput: string) => void;
}) {
  const startSession = useNavigationStore((state) => state.startSession);
  const revealPreviewProgress = useNavigationStore((state) => state.revealPreviewProgress);
  const updatePreviewGroup = useNavigationStore((state) => state.updatePreviewGroup);
  const updatePreviewStep = useNavigationStore((state) => state.updatePreviewStep);
  const movePreviewStep = useNavigationStore((state) => state.movePreviewStep);
  const removePreviewStep = useNavigationStore((state) => state.removePreviewStep);
  const removePreviewGroup = useNavigationStore((state) => state.removePreviewGroup);
  const clearSession = useNavigationStore((state) => state.clearSession);
  const restoreSuspendedSession = useNavigationStore((state) => state.restoreSuspendedSession);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isInsertedFlowPreview = session.previewMode === 'inserted_flow';

  useEffect(() => {
    if (session.generationStage === 'waiting_ai' || session.generationProgress?.done) return;
    if (
      (session.generationProgress?.revealedGroupCount || 0) >= (session.generationProgress?.totalGroupCount || 0)
      && (session.generationProgress?.revealedStepCount || 0) >= (session.generationProgress?.totalStepCount || 0)
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      revealPreviewProgress();
    }, PREVIEW_REVEAL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [
    revealPreviewProgress,
    session.generationStage,
    session.generationProgress?.done,
    session.generationProgress?.revealedGroupCount,
    session.generationProgress?.revealedStepCount,
    session.generationProgress?.totalGroupCount,
    session.generationProgress?.totalStepCount,
  ]);

  const isDone = !!session.generationProgress?.done;
  const isWaitingAI = session.generationStage === 'waiting_ai';
  const visibleGroups = isDone
    ? session.timelineGroups
    : session.timelineGroups.slice(0, session.generationProgress?.revealedGroupCount || 0);
  const visibleSteps = isDone
    ? session.executionSteps
    : session.executionSteps.slice(0, session.generationProgress?.revealedStepCount || 0);
  const canStartEarly = visibleGroups.length >= EARLY_START_GROUP_THRESHOLD && visibleSteps.length >= EARLY_START_STEP_THRESHOLD;
  const startButtonLabel = isInsertedFlowPreview ? '开始解决' : '开始导航';

  return (
    <div className="navigation-shell navigation-state-shell">
      <div className="navigation-topbar">
        <div className="navigation-topbar-main">
          <button
            className="navigation-back-chip"
            onClick={() => {
              if (isInsertedFlowPreview) {
                restoreSuspendedSession();
                return;
              }
              onReturnToComposer(session.rawInput);
              clearSession();
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            {isInsertedFlowPreview ? '返回当前步骤' : '返回修改'}
          </button>
          <div>
            <h2 className="navigation-title">{isDone ? (isInsertedFlowPreview ? '这段插入事项已经理好了' : '路线已整理好') : isWaitingAI ? (isInsertedFlowPreview ? 'AI 正在整理你想先做的这段事...' : 'AI 正在认真整理你的路线...') : (isInsertedFlowPreview ? '正在把这段插入事项写出来...' : '正在把路线写出来...')}</h2>
            <p className="navigation-subtitle">
              {isDone
                ? (isInsertedFlowPreview ? '你可以先看一眼这段插入事项，确认后就先解决它，再回主线。' : '你可以先改一改这些步骤，确认后再开始导航。')
                : canStartEarly
                  ? (isInsertedFlowPreview ? '第一张任务和前五个步骤已经出来了，你现在就可以先开始，这段插入事项剩下的部分会继续在后台补全。' : '第一个任务和前五个步骤已经出来了，你现在就可以先开始导航，后面的步骤会继续在后台补全。')
                  : isWaitingAI
                    ? (isInsertedFlowPreview ? '这次会沿用你原来导航的拆解规则、动线和启动偏好。' : '这次会优先使用你的长期提示词、动线偏好和启动规则。')
                    : `AI 已经开始往外写了，当前看到 ${visibleSteps.length} / ${session.generationProgress?.totalStepCount || visibleSteps.length || '?'} 步`}
            </p>
          </div>
        </div>
        <button className="navigation-icon-button" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="navigation-progress-track">
        <div
          className="navigation-progress-fill"
          style={{
            width: `${isWaitingAI ? 12 : Math.max(
              ((session.generationProgress?.revealedStepCount || 0) / Math.max(1, session.generationProgress?.totalStepCount || 1)) * 100,
              6
            )}%`,
          }}
        />
      </div>

      <div className="navigation-action-row navigation-action-row-top">
        <button
          className="navigation-solid-button navigation-solid-button-secondary"
          onClick={() => {
            if (isInsertedFlowPreview) {
              restoreSuspendedSession();
              return;
            }
            onReturnToComposer(session.rawInput);
            clearSession();
          }}
        >
          {isInsertedFlowPreview ? '返回当前步骤' : isWaitingAI ? '返回修改这段话' : '返回修改'}
        </button>
        <button
          className="navigation-solid-button navigation-solid-button-secondary"
          onClick={() => {
            if (isInsertedFlowPreview) {
              restoreSuspendedSession();
              return;
            }
            clearSession();
          }}
        >
          {isInsertedFlowPreview ? '先不插入这段事' : '重新来一条'}
        </button>
        <button className="navigation-solid-button navigation-solid-button-primary" onClick={() => startSession()} disabled={!isDone && !canStartEarly}>
          {startButtonLabel}
        </button>
      </div>

      {isWaitingAI ? (
        <div className="navigation-section">
          <h3>{isInsertedFlowPreview ? '先把你想插入的这段事理出来' : '这次正在调用你的导航脑子'}</h3>
          <div className="navigation-card-list">
            <div className="navigation-preview-placeholder">{isInsertedFlowPreview ? (session.previewContext?.assistantMessage || '我会先顺着你现在更想做的这段事，再慢慢接回主线。') : '正在读取你的长期提示词、起步偏好、顺手任务规则和家里动线...'}</div>
            <div className="navigation-preview-placeholder">{isInsertedFlowPreview ? `会先预览这段插入事项的时间轴标题和小步骤；确认后，就先解决它，再回到「${session.previewContext?.returnStepTitle || '原来的步骤'}」。` : '这次仍然走原来的智能拆解，不是简化快版。你可以随时取消，或者返回重写这段话。'}</div>
          </div>
        </div>
      ) : (
        <>
          {isInsertedFlowPreview && session.previewContext?.returnStepTitle && (
            <div className="navigation-section">
              <div className="navigation-group-card">
                <strong>这段事解决完后</strong>
                <p>会回到：{session.previewContext.returnStepTitle}</p>
              </div>
            </div>
          )}
          <div className="navigation-section">
            <h3>这次完成后，时间轴会记录这些任务</h3>
            <div className="navigation-card-list">
              {visibleGroups.map((group) => (
                <div key={group.id} className="navigation-group-card">
                  {isDone ? (
                    <>
                      <div className="navigation-inline-row">
                        <input
                          className="navigation-inline-input navigation-inline-title"
                          value={group.title}
                          onChange={(e) => updatePreviewGroup(group.id, { title: e.target.value })}
                        />
                        <button
                          className="navigation-inline-icon-button"
                          onClick={() => removePreviewGroup(group.id)}
                          title="删除这个任务块"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        className="navigation-inline-input"
                        value={group.description || ''}
                        placeholder="这里留空也可以"
                        onChange={(e) => updatePreviewGroup(group.id, { description: e.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <strong>{group.title}</strong>
                      {group.description ? <p>{group.description}</p> : null}
                    </>
                  )}
                </div>
              ))}
              {!visibleGroups.length && <div className="navigation-preview-placeholder">先把大任务块给你整理出来…</div>}
            </div>
          </div>

          <div className="navigation-section">
            <h3>执行步骤</h3>
            <div className="navigation-metadata">
              {isDone ? `共 ${session.executionSteps.length} 步 · 现在可以编辑` : '步骤会一条一条出现，你可以直接看见进度'}
            </div>
            <div className="navigation-step-preview-list">
              {visibleSteps.map((step, index) => (
                <div key={step.id} className={`navigation-preview-item ${isDone ? 'navigation-preview-item-editable' : ''}`}>
                  <span>{index + 1}</span>
                  <div>
                    {isDone ? (
                      <>
                        <div className="navigation-inline-row navigation-inline-row-top">
                          <input
                            className="navigation-inline-input navigation-inline-title"
                            value={step.title}
                            onChange={(e) => updatePreviewStep(step.id, { title: e.target.value })}
                          />
                          <div className="navigation-inline-actions">
                            <button
                              className="navigation-inline-icon-button"
                              onClick={() => movePreviewStep(step.id, 'up')}
                              disabled={index === 0}
                              title="上移一步"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              className="navigation-inline-icon-button"
                              onClick={() => movePreviewStep(step.id, 'down')}
                              disabled={index === visibleSteps.length - 1}
                              title="下移一步"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              className="navigation-inline-icon-button"
                              onClick={() => removePreviewStep(step.id)}
                              title="删除这一步"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="navigation-inline-textarea"
                          rows={2}
                          value={step.guidance}
                          onChange={(e) => updatePreviewStep(step.id, { guidance: e.target.value })}
                        />
                      </>
                    ) : (
                      <>
                        <strong>{step.title}</strong>
                        <p>{step.guidance}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!isDone && (
                <div className="navigation-preview-item navigation-preview-item-pending">
                  <span>…</span>
                  <div>
                    <strong>{canStartEarly ? '你可以先开始，后台还在继续补全' : '正在继续往下写'}</strong>
                    <p>{canStartEarly ? '当前已经够你起步了，后面的步骤会边生成边补到导航里。' : '这次是 AI 真正在按你的提示词整理，不是机械快版。'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {isSettingsOpen && <NavigationSettingsSheet onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

function NavigationPreview({
  session,
  onReturnToComposer,
}: {
  session: NavigationSession;
  onReturnToComposer: (rawInput: string) => void;
}) {
  const startSession = useNavigationStore((state) => state.startSession);
  const savePreState = useNavigationStore((state) => state.savePreState);
  const clearSession = useNavigationStore((state) => state.clearSession);
  const restoreSuspendedSession = useNavigationStore((state) => state.restoreSuspendedSession);
  const updatePreviewGroup = useNavigationStore((state) => state.updatePreviewGroup);
  const replacePreviewGroups = useNavigationStore((state) => state.replacePreviewGroups);
  const updatePreviewStep = useNavigationStore((state) => state.updatePreviewStep);
  const replacePreviewSteps = useNavigationStore((state) => state.replacePreviewSteps);
  const preferences = useNavigationPreferenceStore((state) => state.preferences);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPreState, setShowPreState] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [isRegeneratingTitles, setIsRegeneratingTitles] = useState(false);
  const [isRegeneratingSteps, setIsRegeneratingSteps] = useState(false);
  const [emojiEditingStepId, setEmojiEditingStepId] = useState<string | null>(null);
  const [krSheetGroupId, setKrSheetGroupId] = useState<string | null>(null);
  const isInsertedFlowPreview = session.previewMode === 'inserted_flow';
  const krSheetGroup = krSheetGroupId
    ? session.timelineGroups.find((group) => group.id === krSheetGroupId) || null
    : null;

  if (!session.generationProgress?.done) {
    return <NavigationBuildingPreview session={session} onReturnToComposer={onReturnToComposer} />;
  }

  if (showPreState) {
    return (
      <div className="navigation-shell">
        <NavigationStateRecorder
          title="记录开始前状态"
          subtitle="任务完成后，你会看到前后对照变化。"
          confirmLabel="开始导航"
          initialValue={session.preState}
          includeEstimatedDuration
          onSubmit={(value) => {
            savePreState(value);
            startSession();
            setShowPreState(false);
          }}
          onSkip={() => {
            startSession();
            setShowPreState(false);
          }}
        />
      </div>
    );
  }

  const handleRegenerateTitles = async () => {
    setIsRegeneratingTitles(true);
    const result = await AIUnifiedService.regenerateTimelineTitles(
      session.rawInput,
      session.timelineGroups,
    );
    if (result.success && result.data) {
      replacePreviewGroups(result.data);
    } else {
      console.warn('[导航] 重新生成时间轴标题失败', result.error);
    }
    setIsRegeneratingTitles(false);
  };

  const handleRegenerateSteps = async () => {
    setIsRegeneratingSteps(true);
    const result = await AIUnifiedService.regenerateExecutionSteps(session.rawInput, preferences, session.timelineGroups);
    if (result.success && result.data) {
      replacePreviewSteps(result.data.map((step, index) => ({
        ...step,
        status: 'pending',
        sortOrder: index,
      })));
    }
    setIsRegeneratingSteps(false);
  };

  const handleEditPreviewStepEmoji = (step: NavigationExecutionStep, nextEmoji: string) => {
    const currentEmoji = getStepMeaningEmoji(step.title, step.guidance, step.meaningEmoji, preferences.emojiPreferences);
    if (!nextEmoji || nextEmoji === currentEmoji) return;

    updatePreviewStep(step.id, { meaningEmoji: nextEmoji });
    setEmojiEditingStepId(null);
  };

  return (
    <div className="navigation-shell navigation-state-shell">
      <div className="navigation-topbar">
        <div className="navigation-topbar-main">
          <button
            className="navigation-back-chip"
            onClick={() => {
              if (isInsertedFlowPreview) {
                restoreSuspendedSession();
                return;
              }
              onReturnToComposer(session.rawInput);
              clearSession();
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            {isInsertedFlowPreview ? '返回当前步骤' : '返回修改'}
          </button>
        <div>
          <h2 className="navigation-title">{isInsertedFlowPreview ? '插入事项已生成' : '导航已生成'}</h2>
          <p className="navigation-subtitle">{isInsertedFlowPreview ? `你可以先检查这段插入事项，确认后就先解决它，再回到「${session.previewContext?.returnStepTitle || '主线'}」。` : '你可以先检查步骤，确认后再开始导航。'}</p>
        </div>
        </div>
        <div className="navigation-topbar-actions">
          <button
            className={`navigation-icon-button ${isEditMode ? 'is-active' : ''}`}
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setEditingTarget(null);
            }}
            aria-label={isEditMode ? '完成编辑' : '进入编辑'}
            title={isEditMode ? '完成编辑' : '编辑'}
          >
            <Pencil className="w-4 h-4" />
          </button>
        <button className="navigation-icon-button" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </button>
        </div>
      </div>

      <div className="navigation-action-row navigation-action-row-top">
        <button
          className="navigation-solid-button navigation-solid-button-secondary"
          onClick={() => {
            if (isInsertedFlowPreview) {
              restoreSuspendedSession();
              return;
            }
            onReturnToComposer(session.rawInput);
            clearSession();
          }}
        >
          {isInsertedFlowPreview ? '返回当前步骤' : '返回修改'}
        </button>
        <button
          className="navigation-solid-button navigation-solid-button-secondary"
          onClick={() => {
            if (isInsertedFlowPreview) {
              restoreSuspendedSession();
              return;
            }
            clearSession();
          }}
        >
          {isInsertedFlowPreview ? '先不插入这段事' : '重新来一条'}
        </button>
        <button
          className="navigation-solid-button navigation-solid-button-primary"
          onClick={() => isInsertedFlowPreview ? startSession() : setShowPreState(true)}
        >
          {isInsertedFlowPreview ? '开始解决' : '开始导航'}
        </button>
      </div>

      {isInsertedFlowPreview && session.previewContext?.returnStepTitle && (
        <div className="navigation-section">
          <div className="navigation-group-card">
            <strong>这段事解决完后</strong>
            <p>会回到：{session.previewContext.returnStepTitle}</p>
          </div>
        </div>
      )}

      <div className="navigation-section">
        <div className="navigation-section-heading-row">
        <h3>这次完成后，时间轴会记录这些任务</h3>
          <button className="navigation-icon-button" onClick={handleRegenerateTitles} disabled={isRegeneratingTitles} title="重新生成时间轴标题">
            <TimerReset className="w-4 h-4" />
          </button>
        </div>
        <div className="navigation-card-list">
          {session.timelineGroups.map((group) => {
            const isTitleEditing = editingTarget === `${group.id}:title`;
            const isDescriptionEditing = editingTarget === `${group.id}:description`;
            return (
            <div key={group.id} className="navigation-group-card">
                <div className="navigation-group-card-top">
                  <div className="navigation-group-card-main">
                {isTitleEditing ? (
                  <input
                    className="navigation-inline-input navigation-inline-title"
                    value={group.title}
                    autoFocus
                    onChange={(e) => updatePreviewGroup(group.id, { title: e.target.value })}
                    onBlur={() => setEditingTarget(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingTarget(null);
                      if (e.key === 'Escape') setEditingTarget(null);
                    }}
                  />
                ) : (
                  <strong
                    onClick={() => isEditMode && setEditingTarget(`${group.id}:title`)}
                    onDoubleClick={() => isEditMode && setEditingTarget(`${group.id}:title`)}
                    className={isEditMode ? 'navigation-editable-text' : ''}
                  >
                    {group.title}
                  </strong>
                )}
                {isDescriptionEditing ? (
                  <input
                    className="navigation-inline-input"
                    value={group.description || ''}
                    autoFocus
                    placeholder="这里留空也可以"
                    onChange={(e) => updatePreviewGroup(group.id, { description: e.target.value })}
                    onBlur={() => setEditingTarget(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingTarget(null);
                      if (e.key === 'Escape') setEditingTarget(null);
                    }}
                  />
                ) : (
                  !!group.description && (
                    <p
                      onClick={() => isEditMode && setEditingTarget(`${group.id}:description`)}
                      onDoubleClick={() => isEditMode && setEditingTarget(`${group.id}:description`)}
                      className={isEditMode ? 'navigation-editable-text' : ''}
                    >
                      {group.description}
                    </p>
                  )
                )}
                  </div>
                  <button
                    className={`navigation-kr-pill navigation-kr-pill-inline ${group.linkedGoalId ? 'is-linked' : ''}`}
                    onClick={() => setKrSheetGroupId(group.id)}
                    title="给这个任务补目标和关键结果"
                  >
                    <Target className="w-4 h-4" />
                    <span>KR</span>
                  </button>
                </div>
                <NavigationGroupGoalSummary group={group} />
            </div>
            );
          })}
        </div>
      </div>

      <div className="navigation-section">
        <div className="navigation-section-heading-row">
        <h3>执行时会拆成更容易做的小步骤</h3>
          <button className="navigation-icon-button" onClick={handleRegenerateSteps} disabled={isRegeneratingSteps} title="重新生成小步骤">
            <TimerReset className="w-4 h-4" />
          </button>
        </div>
        <div className="navigation-metadata">共 {session.executionSteps.length} 步 · 第一步会尽量无痛启动 · 点步骤前面的 emoji 就能改</div>
        <div className="navigation-step-preview-list">
          {session.executionSteps.map((step, index) => {
            const isTitleEditing = editingTarget === `${step.id}:title`;
            const isGuidanceEditing = editingTarget === `${step.id}:guidance`;
            return (
            <div key={step.id} className="navigation-preview-item">
              <span>{index + 1}</span>
              <div>
                  {isTitleEditing ? (
                    <input
                      className="navigation-inline-input navigation-inline-title"
                      value={step.title}
                      autoFocus
                      onChange={(e) => updatePreviewStep(step.id, { title: e.target.value })}
                      onBlur={() => setEditingTarget(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingTarget(null);
                        if (e.key === 'Escape') setEditingTarget(null);
                      }}
                    />
                  ) : (
                    <div className="navigation-inline-row navigation-inline-row-top">
                      <div className="navigation-emoji-anchor">
                        <button
                          type="button"
                          className={`navigation-inline-icon-button is-active ${emojiEditingStepId === step.id ? 'is-open' : ''}`}
                          onClick={() => setEmojiEditingStepId((prev) => prev === step.id ? null : step.id)}
                          onDoubleClick={() => setEmojiEditingStepId((prev) => prev === step.id ? null : step.id)}
                          title="点这里修改这一步的 emoji"
                        >
                          <span aria-hidden="true">{getStepMeaningEmoji(step.title, step.guidance, step.meaningEmoji, preferences.emojiPreferences)}</span>
                        </button>
                        {emojiEditingStepId === step.id && (
                          <NavigationEmojiEditor
                            currentEmoji={getStepMeaningEmoji(step.title, step.guidance, step.meaningEmoji, preferences.emojiPreferences)}
                            onSelect={(emoji) => handleEditPreviewStepEmoji(step, emoji)}
                            onClose={() => setEmojiEditingStepId(null)}
                          />
                        )}
                      </div>
                      <strong
                        onClick={() => isEditMode && setEditingTarget(`${step.id}:title`)}
                        className={isEditMode ? 'navigation-editable-text' : ''}
                      >
                        {step.title}
                      </strong>
                    </div>
                  )}
                  {isGuidanceEditing ? (
                    <textarea
                      className="navigation-inline-textarea"
                      rows={2}
                      value={step.guidance}
                      autoFocus
                      onChange={(e) => updatePreviewStep(step.id, { guidance: e.target.value })}
                      onBlur={() => setEditingTarget(null)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') setEditingTarget(null);
                        if (e.key === 'Escape') setEditingTarget(null);
                      }}
                    />
                  ) : (
                    <>
                      <p
                        onClick={() => isEditMode && setEditingTarget(`${step.id}:guidance`)}
                        onDoubleClick={() => isEditMode && setEditingTarget(`${step.id}:guidance`)}
                        className={isEditMode ? 'navigation-editable-text' : ''}
                      >
                        {step.guidance}
                      </p>
                    </>
                  )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {krSheetGroup && (
        <NavigationKRSheet
          session={session}
          group={krSheetGroup}
          mode="preview"
          onClose={() => setKrSheetGroupId(null)}
        />
      )}

      {isSettingsOpen && <NavigationSettingsSheet onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

function formatElapsedCompact(startedAt?: string, now = Date.now()) {
  if (!startedAt) return '00:00';
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return '00:00';

  const elapsedSeconds = Math.max(0, Math.floor((now - started) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatArchivedTime(dateLike?: string) {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NavigationScene({
  executionScore,
  energyLevel,
  recentGain,
  elapsedLabel,
  sceneElapsedMinutes,
  totalElapsedMinutes,
  currentStepTitle,
  currentStepGuidance,
  currentStepEmoji,
  emojiPreferences,
  collectedEmojis,
  idleMarkCount,
  snowProgress,
  driftOffset,
}: {
  executionScore: number;
  energyLevel: number;
  recentGain: number;
  elapsedLabel: string;
  sceneElapsedMinutes: number;
  totalElapsedMinutes: number;
  currentStepTitle: string;
  currentStepGuidance: string;
  currentStepEmoji?: string;
  emojiPreferences: NavigationEmojiPreference[];
  collectedEmojis: NavigationCollectedEmojiItem[];
  idleMarkCount: number;
  snowProgress: number;
  driftOffset: { x: number; y: number };
}) {
  const feelingEmoji = getEmojiByScore(executionScore);
  const stepEmoji = getStepMeaningEmoji(currentStepTitle, currentStepGuidance, currentStepEmoji, emojiPreferences);
  const normalizedScore = clampScore(executionScore);
  const normalizedEnergy = clampScore(energyLevel);
  const sceneProgress = clampScore((normalizedScore * 0.72) + (normalizedEnergy * 0.28));
  const snowFillRatio = Math.max(0, Math.min(1, snowProgress));
  const snowDepth = 148 * snowFillRatio;
  const pairScale = 0.48 + (sceneProgress / 100) * 0.92 + Math.min(recentGain, 20) * 0.008;
  const currentPairBottom = Math.max(20, Math.min(40, snowDepth - 8));
  const starLayout = [
    { left: '4%', top: '8%', duration: '6.6s', delay: '0.3s', size: '6px' },
    { left: '9%', top: '18%', duration: '7.1s', delay: '1.1s', size: '5px' },
    { left: '14%', top: '6%', duration: '6.1s', delay: '2.1s', size: '7px' },
    { left: '19%', top: '25%', duration: '7.5s', delay: '0.8s', size: '5px' },
    { left: '24%', top: '12%', duration: '6.4s', delay: '1.6s', size: '6px' },
    { left: '30%', top: '7%', duration: '6.9s', delay: '2.7s', size: '6px' },
    { left: '35%', top: '21%', duration: '6.5s', delay: '0.2s', size: '5px' },
    { left: '40%', top: '10%', duration: '7.2s', delay: '1.4s', size: '6px' },
    { left: '46%', top: '5%', duration: '6.0s', delay: '2.4s', size: '7px' },
    { left: '51%', top: '18%', duration: '7.6s', delay: '0.7s', size: '5px' },
    { left: '56%', top: '9%', duration: '6.6s', delay: '1.9s', size: '6px' },
    { left: '61%', top: '24%', duration: '7.0s', delay: '0.5s', size: '5px' },
    { left: '67%', top: '11%', duration: '6.2s', delay: '2.2s', size: '6px' },
    { left: '72%', top: '6%', duration: '7.4s', delay: '1.2s', size: '7px' },
    { left: '77%', top: '17%', duration: '6.8s', delay: '2.8s', size: '5px' },
    { left: '82%', top: '8%', duration: '6.4s', delay: '1.5s', size: '6px' },
    { left: '87%', top: '22%', duration: '7.1s', delay: '0.9s', size: '5px' },
    { left: '92%', top: '10%', duration: '6.7s', delay: '2.5s', size: '6px' },
    { left: '12%', top: '33%', duration: '7.2s', delay: '3.1s', size: '5px' },
    { left: '26%', top: '36%', duration: '6.5s', delay: '3.5s', size: '6px' },
    { left: '41%', top: '34%', duration: '7.0s', delay: '2.9s', size: '5px' },
    { left: '57%', top: '35%', duration: '6.6s', delay: '3.3s', size: '6px' },
    { left: '71%', top: '37%', duration: '7.3s', delay: '3.0s', size: '5px' },
    { left: '85%', top: '32%', duration: '6.9s', delay: '3.4s', size: '6px' },
  ];

  return (
    <div className="navigation-scene-frame">
      <div
        className="navigation-scene"
        style={{
          transform: `translate3d(${driftOffset.x}px, ${driftOffset.y}px, 0)`,
        }}
      >
        {recentGain > 0 && <div className="navigation-execution-burst is-highlighted">+{recentGain} 执行力</div>}
        <div className="navigation-scene-elapsed">{elapsedLabel}</div>
        <div className="navigation-sparkles navigation-sparkles-back" style={{ opacity: 0.18 + (normalizedEnergy / 100) * 0.2 }} />
        <div className="navigation-sparkles navigation-sparkles-mid" style={{ opacity: 0.24 + (normalizedEnergy / 100) * 0.26 }} />
        <div className="navigation-snowflakes" aria-hidden="true">
          {starLayout.map((star, index) => (
            <span
              key={index}
              style={{
                left: star.left,
                top: star.top,
                animationDuration: star.duration,
                animationDelay: star.delay,
                fontSize: star.size,
              }}
            >
              ✦
            </span>
          ))}
        </div>
        <div className="navigation-collection-bed" aria-hidden="true">
          {collectedEmojis.map((item, index) => {
            const layout = getCollectedEmojiLayout(index, item.stepId, 10);
            return (
              <span
                key={item.id}
                className={`navigation-collected-emoji ${item.isFresh ? 'is-fresh' : ''}`}
                style={{
                  left: `${layout.left}%`,
                  bottom: `${layout.bottom}px`,
                  transform: `rotate(${layout.rotate}deg)`,
                }}
              >
                {item.emoji}
              </span>
            );
          })}
          {Array.from({ length: idleMarkCount }).map((_, index) => {
            const layout = getCollectedEmojiLayout(index, `idle-cross-${index}`, 10);
            return (
              <span
                key={`idle-cross-${index}`}
                className="navigation-idle-cross-emoji"
                style={{
                  left: `${layout.left}%`,
                  bottom: `${Math.max(2, layout.bottom - 1)}px`,
                  transform: `rotate(${layout.rotate}deg)`,
                }}
              >
                ❌
              </span>
            );
          })}
        </div>
        <div className="navigation-snowbank" style={{ height: `${snowDepth}px` }}>
          <div className="navigation-snowbank-fill" />
          <svg className="navigation-snowbank-wave" viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true">
            <path
              className="navigation-snowbank-wave-back"
              d="M0 102 C18 98 38 96 58 99 C78 102 98 106 118 103 C138 100 158 96 178 98 C198 100 218 104 238 102 C258 100 278 96 298 98 C308 99 315 100 320 100 L320 120 L0 120 Z"
            />
            <path
              className="navigation-snowbank-wave-front"
              d="M0 108 C18 105 38 103 58 106 C78 109 98 112 118 109 C138 106 158 103 178 105 C198 107 218 110 238 108 C258 106 278 103 298 105 C308 106 315 107 320 107 L320 120 L0 120 Z"
            />
          </svg>
        </div>
        <div className="navigation-current-pair" style={{ bottom: `${currentPairBottom}px`, transform: `translateX(-50%) scale(${pairScale})` }}>
          <span className="navigation-current-pair-emoji is-feeling" role="img" aria-label="当前情绪">{feelingEmoji}</span>
          <span className="navigation-current-pair-emoji is-step" role="img" aria-label="当前步骤含义">{stepEmoji}</span>
        </div>
      </div>
    </div>
  );
}

function NavigationFocusSheet({
  stepTitle,
  defaultMinutes,
  onStart,
  onClose,
}: {
  stepTitle: string;
  defaultMinutes: number;
  onStart: (minutes: number) => void;
  onClose: () => void;
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes || 10);

  return (
    <div className="navigation-sheet-backdrop">
      <div className="navigation-sheet-card navigation-focus-sheet">
        <div className="navigation-sheet-header">
          <div>
            <h3>给这一步开个专注倒计时</h3>
            <p>{stepTitle}</p>
          </div>
          <button onClick={onClose} className="navigation-icon-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="navigation-focus-options">
          {[5, 10, 15, 25, 30, 60].map((minutes) => (
            <button
              key={minutes}
              className={`navigation-chip ${selectedMinutes === minutes ? 'is-active' : ''}`}
              onClick={() => setSelectedMinutes(minutes)}
            >
              {minutes}m
            </button>
          ))}
        </div>

        <div className="navigation-sheet-actions">
          <button className="navigation-primary-button" onClick={() => onStart(selectedMinutes)}>开始专注</button>
        </div>
      </div>
    </div>
  );
}

function NavigationDifficultySheet({
  isLoading,
  message,
  onClose,
  onSubmit,
}: {
  isLoading: boolean;
  message: string;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [input, setInput] = useState(message);

  return (
    <div className="navigation-sheet-backdrop">
      <div className="navigation-sheet-card navigation-difficulty-sheet">
        <div className="navigation-sheet-header">
          <div>
            <h3>想先插入一段别的事，也可以</h3>
            <p>把你现在更想先做的事直接告诉我，我会先顺着你理一段，再带你回主线。</p>
          </div>
          <button onClick={onClose} className="navigation-icon-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          className="navigation-composer"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder="比如：我想先做20分钟运动；我想先下楼接猫、倒猫粮、铲猫砂；我现在脑子有点乱，你帮我顺一下"
        />

        <div className="navigation-difficulty-hints">
          <span>一句话也可以，一大段也可以</span>
          <span>可以直接说你现在更想先做什么</span>
          <span>我会先顺着这段事走，再把你带回原来的步骤</span>
        </div>

        <div className="navigation-sheet-actions column-on-mobile">
          <button className="navigation-secondary-button" onClick={onClose}>先自己缓一下</button>
          <button className="navigation-primary-button" onClick={() => onSubmit(input.trim())} disabled={isLoading || !input.trim()}>
            {isLoading ? '正在帮你顺这段事…' : '先帮我顺一下'}
          </button>
        </div>
      </div>
    </div>
  );
}

function sessionMoodScore(step: NavigationExecutionStep | undefined, isDetourStep: boolean, session: NavigationSession) {
  const title = step?.title || '';
  const reflection = session.preState?.reflection || '';
  let base = isDetourStep ? 18 : 30;

  if (title.includes('坐起来') || title.includes('起床')) base = 24;
  else if (title.includes('洗漱') || title.includes('出门')) base = 36;

  if (/(烦|累|崩溃|难受|焦虑|糟|困)/.test(reflection)) {
    base -= 10;
  } else if (/(轻松|有劲|不错|开心|还行)/.test(reflection)) {
    base += 6;
  }

  return Math.max(8, Math.min(100, Math.round((base + session.executionScore) / 2)));
}

function sessionMoodEnergy(step: NavigationExecutionStep | undefined, isDetourStep: boolean, session: NavigationSession) {
  const title = step?.title || '';
  const reflection = session.preState?.reflection || '';
  let base = isDetourStep ? 26 : 34;

  if (title.includes('坐起来') || title.includes('起床')) base = 30;
  else if (title.includes('洗漱') || title.includes('出门')) base = 40;

  if (/(烦|累|崩溃|难受|焦虑|糟|困)/.test(reflection)) {
    base -= 8;
  } else if (/(轻松|有劲|不错|开心|还行)/.test(reflection)) {
    base += 5;
  }

  return Math.max(10, Math.min(100, Math.round((base + session.energyLevel) / 2)));
}

function NavigationStepCard({
  step,
  stepIndex,
  stepCount,
  elapsedLabel,
  sceneElapsedMinutes,
  totalSessionElapsedMinutes,
  nextStepTitle,
  onContinue,
  onCompleteNavigation,
  isFinalStepAwaitingCompletion,
  onOpenDifficulty,
  onOpenFocus,
  onOpenHandsFree,
  onEditStepEmoji,
  onOpenStepTitleMenu,
  onOpenStepGuidanceEditor,
  isEmojiEditorOpen,
  emojiEditor,
  isVoiceMode,
  isListening,
  voiceStatusText,
  lastTranscript,
  playbackSource,
  didFallbackToSystem,
  difficultyMessage,
  isResolvingDifficulty,
  executionScore,
  energyLevel,
  recentExecutionGain,
  collectedEmojis,
  emojiPreferences,
  idleMarkCount,
  snowProgress,
  driftOffset,
}: {
  step: NavigationExecutionStep;
  stepIndex: number;
  stepCount: number;
  elapsedLabel: string;
  sceneElapsedMinutes: number;
  totalSessionElapsedMinutes: number;
  nextStepTitle?: string;
  onContinue: () => void;
  onCompleteNavigation: () => void;
  isFinalStepAwaitingCompletion: boolean;
  onOpenDifficulty: () => void;
  onOpenFocus: () => void;
  onOpenHandsFree: () => void;
  onEditStepEmoji: () => void;
  onOpenStepTitleMenu: () => void;
  onOpenStepGuidanceEditor: () => void;
  isEmojiEditorOpen: boolean;
  emojiEditor?: React.ReactNode;
  isVoiceMode: boolean;
  isListening: boolean;
  voiceStatusText: string;
  lastTranscript?: string;
  playbackSource: 'system' | 'edge';
  didFallbackToSystem: boolean;
  difficultyMessage?: string;
  isResolvingDifficulty: boolean;
  executionScore: number;
  energyLevel: number;
  recentExecutionGain: number;
  collectedEmojis: NavigationCollectedEmojiItem[];
  emojiPreferences: NavigationEmojiPreference[];
  idleMarkCount: number;
  snowProgress: number;
  driftOffset: { x: number; y: number };
}) {
  return (
    <div className="navigation-step-card navigation-step-reference-card">
      <div className="navigation-step-reference-count">第 {stepIndex + 1} 步 / 共 {stepCount} 步</div>

      {nextStepTitle && (
        <div className="navigation-step-next-preview" aria-label="下一步预告">
          <span className="navigation-step-next-preview-label">下一步</span>
          <strong className="navigation-step-next-preview-title">{nextStepTitle}</strong>
        </div>
      )}

      <div className="navigation-step-reference-visual-wrap" title="步骤表意场景">
        <NavigationScene
          key={`${step.id}-${recentExecutionGain}-${Math.floor(sceneElapsedMinutes / 2)}-${collectedEmojis.length}-${step.meaningEmoji || ''}`}
          executionScore={executionScore}
          energyLevel={energyLevel}
          recentGain={recentExecutionGain}
          elapsedLabel={elapsedLabel}
          sceneElapsedMinutes={sceneElapsedMinutes}
          totalElapsedMinutes={totalSessionElapsedMinutes}
          currentStepTitle={step.title}
          currentStepGuidance={step.guidance}
          currentStepEmoji={step.meaningEmoji}
          emojiPreferences={emojiPreferences}
          collectedEmojis={collectedEmojis}
          idleMarkCount={idleMarkCount}
          snowProgress={snowProgress}
          driftOffset={driftOffset}
        />
      </div>

      <div className="navigation-step-reference-copy">
        <div className="navigation-step-reference-copy-card">
          <div className="navigation-inline-row navigation-inline-row-top">
            <div className="navigation-emoji-anchor navigation-emoji-anchor-inline">
              <button
                type="button"
                className={`navigation-inline-icon-button ${isEmojiEditorOpen ? 'is-open' : ''}`}
                onClick={onEditStepEmoji}
                onDoubleClick={onEditStepEmoji}
                title="点这里修改这一步的 emoji"
              >
                <span aria-hidden="true">{getStepMeaningEmoji(step.title, step.guidance, step.meaningEmoji, emojiPreferences)}</span>
              </button>
              {isEmojiEditorOpen ? emojiEditor : null}
            </div>
            <h3
              onDoubleClick={onOpenStepTitleMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                onOpenStepTitleMenu();
              }}
            >
              {step.title}
            </h3>
          </div>
          <p
            onDoubleClick={onOpenStepGuidanceEditor}
            onContextMenu={(e) => {
              e.preventDefault();
              onOpenStepGuidanceEditor();
            }}
          >
            {step.guidance}
          </p>
        </div>
      </div>

      {difficultyMessage && (
        <div className="navigation-difficulty-response navigation-reference-help-card">
          <Wand2 className="w-4 h-4" />
          <p>{difficultyMessage}</p>
        </div>
      )}

      {isVoiceMode && (
        <div className="navigation-voice-status navigation-reference-voice-status">
          <span className={`navigation-voice-dot ${isListening ? 'is-listening' : ''}`} />
          <span>{voiceStatusText}</span>
          <strong className="navigation-voice-source-inline">{didFallbackToSystem ? '已回退到系统语音' : playbackSource === 'edge' ? 'Edge 自然语音' : '系统语音'}</strong>
          {lastTranscript && <em>“{lastTranscript}”</em>}
        </div>
      )}

      <div className="navigation-step-reference-mode-row">
        <button className="navigation-reference-mode-button" onClick={onOpenFocus}>
          <TimerReset className="w-5 h-5" />
        </button>
        <button className="navigation-reference-mode-button" onClick={onOpenHandsFree}>
          {isVoiceMode ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <button className="navigation-primary-button navigation-reference-continue-button" onClick={onContinue}>
        {isFinalStepAwaitingCompletion ? '我已经开始做了' : '继续'}
      </button>

      {isFinalStepAwaitingCompletion && (
        <button className="navigation-secondary-button navigation-reference-complete-button" onClick={onCompleteNavigation}>
          完成本次导航
        </button>
      )}

      <div className="navigation-step-reference-bottom-row">
        <button className="navigation-reference-side-button" onClick={onOpenDifficulty} disabled={isResolvingDifficulty}>
          {isResolvingDifficulty ? '正在帮你换个走法…' : '想换个走法'}
        </button>
        <button className="navigation-reference-side-button navigation-reference-side-button-wide" onClick={onOpenDifficulty} disabled={isResolvingDifficulty}>
          我想先做别的
        </button>
      </div>

      <div className="navigation-footer-note navigation-step-reference-note">
        {isFinalStepAwaitingCompletion ? '你现在可以一直做这一步，计时会继续。等你真的做完，再点「完成本次导航」。' : '你现在只需要看这一小步。做完了，就继续。'}
      </div>
    </div>
  );
}

function NavigationActivePlanEditor({
  session,
  onClose,
  initialEditingTarget,
}: {
  session: NavigationSession;
  onClose: () => void;
  initialEditingTarget?: string | null;
}) {
  const preferences = useNavigationPreferenceStore((state) => state.preferences);
  const updateActiveGroup = useNavigationStore((state) => state.updateActiveGroup);
  const updateActiveStep = useNavigationStore((state) => state.updateActiveStep);
  const insertSessionGroup = useNavigationStore((state) => state.insertSessionGroup);
  const insertSessionStep = useNavigationStore((state) => state.insertSessionStep);
  const removeSessionGroup = useNavigationStore((state) => state.removeSessionGroup);
  const removeSessionStep = useNavigationStore((state) => state.removeSessionStep);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [hasSavedFeedback, setHasSavedFeedback] = useState(false);
  const currentStepRef = useRef<HTMLDivElement | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify({
    timelineGroups: session.timelineGroups,
    executionSteps: session.executionSteps,
  }));
  const previousPlanShapeRef = useRef({
    groupCount: session.timelineGroups.length,
    stepCount: session.executionSteps.length,
  });

  const currentSnapshot = useMemo(() => JSON.stringify({
    timelineGroups: session.timelineGroups,
    executionSteps: session.executionSteps,
  }), [session.timelineGroups, session.executionSteps]);
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;

  useEffect(() => {
    if (!hasSavedFeedback) return;
    const timer = window.setTimeout(() => setHasSavedFeedback(false), 1600);
    return () => window.clearTimeout(timer);
  }, [hasSavedFeedback]);

  useEffect(() => {
    setEditingTarget(initialEditingTarget || null);
  }, [initialEditingTarget]);

  useEffect(() => {
    setCollapsedGroups((prev) => session.timelineGroups.reduce<Record<string, boolean>>((acc, group) => {
      const relatedSteps = session.executionSteps.filter((step) => step.groupId === group.id);
      const hasCurrentStep = relatedSteps.some((step) => session.executionSteps.findIndex((item) => item.id === step.id) === session.currentStepIndex);
      const isNewGroup = !(group.id in prev);
      acc[group.id] = isNewGroup ? false : (prev[group.id] ?? !hasCurrentStep);
      return acc;
    }, {}));
  }, [session.timelineGroups, session.executionSteps, session.currentStepIndex]);

  useEffect(() => {
    const previousShape = previousPlanShapeRef.current;
    const hasNewStreamedContent = session.timelineGroups.length > previousShape.groupCount || session.executionSteps.length > previousShape.stepCount;

    if (hasNewStreamedContent) {
      setSavedSnapshot(JSON.stringify({
        timelineGroups: session.timelineGroups,
        executionSteps: session.executionSteps,
      }));
    }

    previousPlanShapeRef.current = {
      groupCount: session.timelineGroups.length,
      stepCount: session.executionSteps.length,
    };
  }, [session.timelineGroups, session.executionSteps]);

  const handleSave = () => {
    setEditingTarget(null);
    setSavedSnapshot(currentSnapshot);
    setHasSavedFeedback(true);
  };

  const handleInsertGroup = (targetGroupId: string, position: 'before' | 'after') => {
    const insertedId = insertSessionGroup(targetGroupId, position, { title: '新任务', description: '' });
    if (!insertedId) return;
    setCollapsedGroups((prev) => ({ ...prev, [insertedId]: false }));
    setEditingTarget(`${insertedId}:title`);
  };

  const openGroupDescriptionEditor = (groupId: string) => {
    setEditingTarget(`${groupId}:description`);
  };

  const openStepGuidanceEditor = (stepId: string) => {
    setEditingTarget(`${stepId}:guidance`);
  };

  const handleDeleteGroup = (groupId: string) => {
    removeSessionGroup(groupId);
  };

  const handleInsertStep = (targetStepId: string, position: 'before' | 'after') => {
    const insertedId = insertSessionStep(targetStepId, position, { title: '新步骤', guidance: '' });
    if (!insertedId) return;
    const insertedStep = useNavigationStore.getState().currentSession?.executionSteps.find((step) => step.id === insertedId);
    if (insertedStep) {
      setCollapsedGroups((prev) => ({ ...prev, [insertedStep.groupId]: false }));
    }
    setEditingTarget(`${insertedId}:title`);
  };

  const handleDeleteStep = (stepId: string) => {
    removeSessionStep(stepId);
  };

  return (
    <div className="navigation-plan-editor-shell">
      <div className="navigation-active-plan-fullscreen">
        <div className="navigation-active-plan-topbar">
          <div className="navigation-active-plan-topbar-copy">
            <strong>任务列表</strong>
            <p>双击文字直接修改；向左滑动任务或步骤，可前插、后插或删除。</p>
          </div>
          <div className="navigation-active-plan-topbar-actions">
            <button
              className={`navigation-secondary-button navigation-plan-save-button ${hasUnsavedChanges ? 'is-dirty' : ''}`}
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              <Save className="w-4 h-4" />
              {hasSavedFeedback ? '已保存' : hasUnsavedChanges ? '保存' : '已同步'}
            </button>
            <button
              className="navigation-icon-button navigation-plan-close-button"
              onClick={onClose}
              aria-label="关闭任务列表"
              title="关闭任务列表"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="navigation-active-plan-body">
          <div className="navigation-active-plan-stack">
            {session.timelineGroups.map((group) => {
              const isTitleEditing = editingTarget === `${group.id}:title`;
              const isDescriptionEditing = editingTarget === `${group.id}:description`;
              const relatedSteps = session.executionSteps.filter((step) => step.groupId === group.id);
              const hasCurrentStep = relatedSteps.some((step) => {
                const globalIndex = session.executionSteps.findIndex((item) => item.id === step.id);
                return globalIndex === session.currentStepIndex;
              });
              const isCollapsed = collapsedGroups[group.id] ?? !hasCurrentStep;

              return (
                <NavigationSwipeActionRow
                  key={group.id}
                  onInsertBefore={() => handleInsertGroup(group.id, 'before')}
                  onInsertAfter={() => handleInsertGroup(group.id, 'after')}
                  onDelete={() => handleDeleteGroup(group.id)}
                >
                  <div className={`navigation-group-card navigation-active-group-card ${hasCurrentStep ? 'is-current' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
                    <div className="navigation-active-group-header">
                      <div className="navigation-active-group-main">
                        {isTitleEditing ? (
                          <input
                            className="navigation-inline-input navigation-inline-title navigation-inline-input-compact"
                            value={group.title}
                            autoFocus
                            onChange={(e) => updateActiveGroup(group.id, { title: e.target.value })}
                            onBlur={() => setEditingTarget(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingTarget(null);
                              if (e.key === 'Escape') setEditingTarget(null);
                            }}
                          />
                        ) : (
                          <strong
                            onDoubleClick={() => setEditingTarget(`${group.id}:title`)}
                            className="navigation-editable-text navigation-active-group-title"
                          >
                            {group.title}
                          </strong>
                        )}

                        {isDescriptionEditing ? (
                          <input
                            className="navigation-inline-input navigation-inline-input-compact"
                            value={group.description || ''}
                            autoFocus
                            placeholder="可留空"
                            onChange={(e) => updateActiveGroup(group.id, { description: e.target.value })}
                            onBlur={() => setEditingTarget(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingTarget(null);
                              if (e.key === 'Escape') setEditingTarget(null);
                            }}
                          />
                        ) : (
                          <p
                            onDoubleClick={() => openGroupDescriptionEditor(group.id)}
                            className="navigation-editable-text navigation-plan-muted"
                          >
                            {group.description || '双击补充这个任务的说明'}
                          </p>
                        )}
                      </div>

                      <div className="navigation-active-group-actions">
                        {hasCurrentStep && <em className="navigation-plan-current-badge">当前任务</em>}
                        <button
                          type="button"
                          className="navigation-inline-icon-button navigation-group-collapse-button"
                          onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.id]: !isCollapsed }))}
                          aria-label={isCollapsed ? '展开任务' : '收起任务'}
                          title={isCollapsed ? '展开任务' : '收起任务'}
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="navigation-active-step-list">
                        {relatedSteps.map((step, index) => {
                          const isTitleEditing = editingTarget === `${step.id}:title`;
                          const isGuidanceEditing = editingTarget === `${step.id}:guidance`;
                          const globalIndex = session.executionSteps.findIndex((item) => item.id === step.id);
                          const isCurrent = globalIndex === session.currentStepIndex;
                          return (
                            <NavigationSwipeActionRow
                              key={step.id}
                              onInsertBefore={() => handleInsertStep(step.id, 'before')}
                              onInsertAfter={() => handleInsertStep(step.id, 'after')}
                              onDelete={() => handleDeleteStep(step.id)}
                            >
                              <div
                                ref={isCurrent ? currentStepRef : null}
                                className={`navigation-active-step-item ${isCurrent ? 'is-current' : ''} ${step.status === 'completed' ? 'is-completed' : ''}`}
                              >
                                <div className="navigation-active-step-index">{index + 1}</div>
                                <div className="navigation-active-step-content">
                                  <div className="navigation-plan-step-head">
                                    {isTitleEditing ? (
                                      <input
                                        className="navigation-inline-input navigation-inline-title navigation-inline-input-compact"
                                        value={step.title}
                                        autoFocus
                                        onChange={(e) => updateActiveStep(step.id, { title: e.target.value })}
                                        onBlur={() => setEditingTarget(null)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') setEditingTarget(null);
                                          if (e.key === 'Escape') setEditingTarget(null);
                                        }}
                                      />
                                    ) : (
                                      <strong
                                        onDoubleClick={() => setEditingTarget(`${step.id}:title`)}
                                        className="navigation-editable-text"
                                      >
                                        {getStepMeaningEmoji(step.title, step.guidance, step.meaningEmoji, preferences.emojiPreferences)} {step.title}
                                      </strong>
                                    )}
                                    {isCurrent && <em className="navigation-plan-current-badge">当前步骤</em>}
                                  </div>

                                  {isGuidanceEditing ? (
                                    <textarea
                                      className="navigation-inline-textarea navigation-inline-textarea-compact"
                                      rows={2}
                                      value={step.guidance}
                                      autoFocus
                                      onChange={(e) => updateActiveStep(step.id, { guidance: e.target.value })}
                                      onBlur={() => setEditingTarget(null)}
                                      onKeyDown={(e) => {
                                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') setEditingTarget(null);
                                        if (e.key === 'Escape') setEditingTarget(null);
                                      }}
                                    />
                                  ) : (
                                    <p
                                      onDoubleClick={() => openStepGuidanceEditor(step.id)}
                                      className="navigation-editable-text navigation-plan-muted"
                                    >
                                      {step.guidance}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </NavigationSwipeActionRow>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </NavigationSwipeActionRow>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavigationSessionView({ session, onReturnToComposer }: { session: NavigationSession; onReturnToComposer: (rawInput: string) => void }) {
  const preferences = useNavigationPreferenceStore((state) => state.preferences);
  const completeCurrentStep = useNavigationStore((state) => state.completeCurrentStep);
  const finalizeSession = useNavigationStore((state) => state.finalizeSession);
  const decayExecutionScore = useNavigationStore((state) => state.decayExecutionScore);
  const pauseSession = useNavigationStore((state) => state.pauseSession);
  const resumeSession = useNavigationStore((state) => state.resumeSession);
  const archiveSession = useNavigationStore((state) => state.archiveSession);
  const abandonSession = useNavigationStore((state) => state.abandonSession);
  const clearSession = useNavigationStore((state) => state.clearSession);
  const createInsertedFlowDraft = useNavigationStore((state) => state.createInsertedFlowDraft);
  const applyStreamingPlan = useNavigationStore((state) => state.applyStreamingPlan);
  const setGenerating = useNavigationStore((state) => state.setGenerating);
  const setError = useNavigationStore((state) => state.setError);
  const setHandsFreeEnabled = useNavigationStore((state) => state.setHandsFreeEnabled);
  const setHandsFreePreferredVoiceMode = useNavigationStore((state) => state.setHandsFreePreferredVoiceMode);
  const markHandsFreeIntroSeen = useNavigationStore((state) => state.markHandsFreeIntroSeen);
  const setHandsFreeWaiting = useNavigationStore((state) => state.setHandsFreeWaiting);
  const setLastVoiceTranscript = useNavigationStore((state) => state.setLastVoiceTranscript);
  const updateActiveStep = useNavigationStore((state) => state.updateActiveStep);
  const insertSessionGroup = useNavigationStore((state) => state.insertSessionGroup);
  const insertSessionStep = useNavigationStore((state) => state.insertSessionStep);
  const removeSessionGroup = useNavigationStore((state) => state.removeSessionGroup);
  const removeSessionStep = useNavigationStore((state) => state.removeSessionStep);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [taskListInitialEditingTarget, setTaskListInitialEditingTarget] = useState<string | null>(null);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isKRSheetOpen, setIsKRSheetOpen] = useState(false);
  const [focusCountdown, setFocusCountdown] = useState<{
    minutes: number;
    endsAt: number;
    stepId: string;
    notified: boolean;
    isPaused: boolean;
    remainingSecondsWhenPaused?: number;
  } | null>(null);
  const [focusFinishedNotice, setFocusFinishedNotice] = useState<{ stepTitle: string; minutes: number } | null>(null);
  const [showHandsFreeIntro, setShowHandsFreeIntro] = useState(false);
  const [showDifficultySheet, setShowDifficultySheet] = useState(false);
  const [emojiEditorOpen, setEmojiEditorOpen] = useState(false);
  const [difficultyInput, setDifficultyInput] = useState('');
  const [difficultyMessage, setDifficultyMessage] = useState('');
  const [isResolvingDifficulty, setIsResolvingDifficulty] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState('语音未开启');
  const [elapsedNow, setElapsedNow] = useState(() => Date.now());
  const [driftOffset, setDriftOffset] = useState({ x: 0, y: 0 });
  const difficultyRequestIdRef = useRef(0);
  const voiceCommandLockRef = useRef(false);
  const lastVoiceCommandRef = useRef('');
  const lastVoiceCommandAtRef = useRef(0);
  const currentStep = session.executionSteps[session.currentStepIndex];
  const isFinalStep = session.currentStepIndex >= session.executionSteps.length - 1;
  const isFinalStepAwaitingCompletion = isFinalStep && !!session.awaitingFinalCompletion;
  const elapsedLabel = formatElapsedCompact(currentStep?.startedAt || session.startedAt, elapsedNow);
  const totalSessionElapsedMinutes = (() => {
    const sessionStart = session.startedAt;
    if (!sessionStart) return 0;
    const sessionStartTime = new Date(sessionStart).getTime();
    if (Number.isNaN(sessionStartTime)) return 0;
    return Math.max(0, Math.floor((elapsedNow - sessionStartTime) / 60000));
  })();
  const sceneElapsedMinutes = (() => {
    const sceneStart = currentStep?.startedAt || session.startedAt;
    if (!sceneStart) return 0;
    const sceneStartTime = new Date(sceneStart).getTime();
    if (Number.isNaN(sceneStartTime)) return 0;
    return Math.max(0, Math.floor((elapsedNow - sceneStartTime) / 60000));
  })();
  const accumulatedSnowProgress = (() => {
    const base = session.accumulatedSnowProgress ?? 0;
    const referenceTime = session.lastProgressAt || session.startedAt || session.createdAt;
    const referenceMs = new Date(referenceTime).getTime();
    if (Number.isNaN(referenceMs)) return base;
    const elapsedMs = Math.max(0, elapsedNow - referenceMs);
    return Math.min(1, base + (elapsedMs / (2 * 60 * 60 * 1000)));
  })();
  const accumulatedIdleMarks = (() => {
    const base = session.accumulatedInefficiencyMarks ?? 0;
    if (isSleepProtectedStep(currentStep?.title)) return base;
    const referenceTime = session.lastProgressAt || session.startedAt || session.createdAt;
    const referenceMs = new Date(referenceTime).getTime();
    if (Number.isNaN(referenceMs)) return base;
    const elapsedMs = Math.max(0, elapsedNow - referenceMs);
    return base + Math.floor(elapsedMs / (30 * 60 * 1000));
  })();
  const remainingFocusSeconds = focusCountdown
    ? (focusCountdown.isPaused
      ? Math.max(0, focusCountdown.remainingSecondsWhenPaused || 0)
      : Math.max(0, Math.ceil((focusCountdown.endsAt - elapsedNow) / 1000)))
    : 0;
  const focusCountdownLabel = formatFocusCountdown(remainingFocusSeconds);
  const isFocusPaused = !!focusCountdown?.isPaused;
  const isInsertedStep = currentStep?.source === 'difficulty_detour' || currentStep?.source === 'inserted_flow';
  const sceneExecutionScore = sessionMoodScore(currentStep, isInsertedStep, session);
  const sceneEnergyLevel = sessionMoodEnergy(currentStep, isInsertedStep, session);
  const collectedEmojis = useMemo(() => buildCollectedStepEmojis(session, preferences.emojiPreferences, elapsedNow), [session, preferences.emojiPreferences, elapsedNow]);
  const handsFreeEnabled = !!session.handsFree?.enabled;
  const preferredVoiceMode = session.handsFree?.preferredVoiceMode || 'system';
  const waitingForCommand = !!session.handsFree?.waitingForCommand;
  const lastTranscript = session.handsFree?.lastTranscript;
  const stepSpeechGuardRef = useRef<string>('');
  const speechTextRef = useRef('');
  const pauseListeningUntilRef = useRef(0);
  const { speak, stop, pause, resume, isSpeaking, isEdgeVoiceConfigured, playbackSource, didFallbackToSystem } = useSpeechSynthesis({ voiceMode: preferredVoiceMode });
  const handleEditCurrentStepEmoji = (nextEmoji: string) => {
    if (!currentStep) return;
    const currentEmoji = getStepMeaningEmoji(currentStep.title, currentStep.guidance, currentStep.meaningEmoji, preferences.emojiPreferences);
    if (!nextEmoji || nextEmoji === currentEmoji) return;

    updateActiveStep(currentStep.id, { meaningEmoji: nextEmoji });
    setEmojiEditorOpen(false);
  };

  const openTaskListWithEditor = (target: string) => {
    setTaskListInitialEditingTarget(target);
    setIsTaskListOpen(true);
  };

  const openCurrentStepGuidanceEditor = () => {
    if (!currentStep) return;
    openTaskListWithEditor(`${currentStep.id}:guidance`);
  };

  const handleInsertTaskAroundCurrent = (position: 'before' | 'after') => {
    if (!currentGroup) return;
    const insertedId = insertSessionGroup(currentGroup.id, position, { title: '新任务', description: '' });
    if (!insertedId) return;
    openTaskListWithEditor(`${insertedId}:title`);
  };

  const handleInsertStepAroundCurrent = (position: 'before' | 'after') => {
    if (!currentStep) return;
    const insertedId = insertSessionStep(currentStep.id, position, { title: '新步骤', guidance: '' });
    if (!insertedId) return;
    openTaskListWithEditor(`${insertedId}:title`);
  };

  const handleEditCurrentTask = () => {
    if (!currentGroup) return;
    openTaskListWithEditor(`${currentGroup.id}:title`);
  };

  const handleEditCurrentStep = () => {
    if (!currentStep) return;
    openTaskListWithEditor(`${currentStep.id}:title`);
  };

  const handleDeleteCurrentTask = () => {
    if (!currentGroup) return;
    removeSessionGroup(currentGroup.id);
  };

  const handleDeleteCurrentStep = () => {
    if (!currentStep) return;
    removeSessionStep(currentStep.id);
  };
  const unlockVoiceCommand = () => {
    window.setTimeout(() => {
      voiceCommandLockRef.current = false;
    }, 900);
  };
  const { isListening, startListening, stopListening, resetTranscript, isSupported: isVoiceRecognitionSupported } = useVoiceRecognition({
    continuous: true,
    interimResults: false,
    restartOnEnd: handsFreeEnabled && waitingForCommand && session.status === 'active',
    onListeningChange: (listening) => {
      if (!handsFreeEnabled) {
        setVoiceStatusText('语音未开启');
        return;
      }
      setVoiceStatusText(listening ? '麦克风已开启，正在听你说话…' : '语音模式已开启，正在连接麦克风…');
    },
    onError: (error) => {
      if (!handsFreeEnabled) return;
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        setVoiceStatusText('麦克风权限未开启，请允许访问麦克风');
        return;
      }
      if (error === 'audio-capture') {
        setVoiceStatusText('没有检测到可用麦克风');
        return;
      }
      if (error === 'network') {
        setVoiceStatusText('语音识别网络异常，请稍后再试');
        return;
      }
      setVoiceStatusText('语音识别暂时不可用');
    },
    onResult: (transcript) => {
      if (!handsFreeEnabled || voiceCommandLockRef.current) return;
      setLastVoiceTranscript(transcript);
      const normalized = normalizeVoiceTranscript(transcript);
      if (!normalized) return;

      const now = Date.now();
      if (lastVoiceCommandRef.current === normalized && now - lastVoiceCommandAtRef.current < 1600) {
        return;
      }
      lastVoiceCommandRef.current = normalized;
      lastVoiceCommandAtRef.current = now;

      if (matchesVoiceCommand(normalized, ['继续', '下一步', '做完了', '完成了', '我好了', '我做完了']) || isWeakConfirmCommand(normalized)) {
        voiceCommandLockRef.current = true;
        pauseListeningUntilRef.current = Date.now() + 1200;
        setHandsFreeWaiting(false);
        stopListening();
        playCoinDrop();
        if (isFinalStepAwaitingCompletion) {
          finalizeSession();
        } else {
          completeCurrentStep();
        }
        unlockVoiceCommand();
        return;
      }

      if (matchesVoiceCommand(normalized, ['跳过', '先跳过', '下一个'])) {
        voiceCommandLockRef.current = true;
        pauseListeningUntilRef.current = Date.now() + 1200;
        setHandsFreeWaiting(false);
        stopListening();
        useNavigationStore.getState().skipCurrentStep();
        unlockVoiceCommand();
        return;
      }

      if (matchesVoiceCommand(normalized, ['重说', '重复', '再说一遍'])) {
        voiceCommandLockRef.current = true;
        if (speechTextRef.current) {
          stopListening();
          setHandsFreeWaiting(false);
          speak(speechTextRef.current, {
            onEnd: () => {
              setHandsFreeWaiting(true);
              resetTranscript();
              startListening();
              unlockVoiceCommand();
            },
            onError: () => {
              unlockVoiceCommand();
            },
          });
        } else {
          unlockVoiceCommand();
        }
        return;
      }

      if (matchesVoiceCommand(normalized, ['暂停', '先停一下'])) {
        voiceCommandLockRef.current = true;
        stopListening();
        setHandsFreeWaiting(false);
        pauseSession();
        pause();
        unlockVoiceCommand();
        return;
      }

      if (matchesVoiceCommand(normalized, ['恢复', '继续播放', '继续导航'])) {
        voiceCommandLockRef.current = true;
        resumeSession();
        resume();
        unlockVoiceCommand();
      }
    },
  });

  useEffect(() => {
    if (session.status !== 'active') return;

    setElapsedNow(Date.now());
    const timer = window.setInterval(() => {
      setElapsedNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session.status, currentStep?.startedAt, session.startedAt]);

  useEffect(() => {
    if (!focusCountdown) return;
    if (focusCountdown.stepId !== currentStep?.id) {
      setFocusCountdown(null);
      return;
    }
    if (focusCountdown.isPaused) return;
    if (focusCountdown.notified || focusCountdown.endsAt > elapsedNow) return;

    playFocusCompleteTone();
    setFocusFinishedNotice({
      stepTitle: currentStep?.title || '这一步',
      minutes: focusCountdown.minutes,
    });
    setFocusCountdown((prev) => prev ? { ...prev, notified: true } : prev);
  }, [focusCountdown, currentStep?.id, currentStep?.title, elapsedNow]);

  const handleResolveDifficulty = async (message: string) => {
    if (!currentStep || !message) return;

    setHandsFreeWaiting(false);
    setIsResolvingDifficulty(true);
    setDifficultyInput(message);
    setError(null);

    const requestId = Date.now();
    difficultyRequestIdRef.current = requestId;
    createInsertedFlowDraft({
      baseSession: session,
      rawInput: message,
      assistantMessage: `好，我们先顺着你现在更想做的这段来。做完这一段后，再回到「${currentStep.title}」。`,
      returnStepTitle: currentStep.title,
    });

    const result = await AIUnifiedService.planNavigationSession(message, preferences, (partial) => {
      const previewSession = useNavigationStore.getState().currentSession;
      if (
        difficultyRequestIdRef.current !== requestId
        || !previewSession
        || previewSession.status !== 'preview'
        || previewSession.previewMode !== 'inserted_flow'
        || previewSession.rawInput !== message
      ) {
        return;
      }

      applyStreamingPlan(message, partial, false);
    });

    const previewSession = useNavigationStore.getState().currentSession;
    if (
      difficultyRequestIdRef.current !== requestId
      || !previewSession
      || previewSession.status !== 'preview'
      || previewSession.previewMode !== 'inserted_flow'
      || previewSession.rawInput !== message
    ) {
      setIsResolvingDifficulty(false);
      return;
    }

    if (result.success && result.data) {
      applyStreamingPlan(message, result.data, true);
      setDifficultyMessage(buildInsertedFlowResponseText(previewSession.previewContext?.assistantMessage, currentStep.title));
      setShowDifficultySheet(false);
      setIsResolvingDifficulty(false);
      setGenerating(false);
      return;
    }

    useNavigationStore.getState().restoreSuspendedSession();
    setDifficultyMessage('我刚刚没能顺利把你想先做的这段事整理出来，你可以换个说法再告诉我一次，比如“我想先做20分钟运动，然后回来继续”。');
    setIsResolvingDifficulty(false);
    setGenerating(false);
    setError(result.error || '暂时没整理出新的绕路方式，再试一次吧');
    console.error('[导航] 处理中途困难失败', result.error);
  };

  const handleStartFocusCountdown = (minutes: number) => {
    if (!currentStep) return;
    setFocusFinishedNotice(null);
    setFocusCountdown({
      minutes,
      endsAt: Date.now() + minutes * 60 * 1000,
      stepId: currentStep.id,
      notified: false,
      isPaused: false,
    });
    setIsFocusOpen(false);
  };

  const handlePauseFocusCountdown = () => {
    setFocusCountdown((prev) => {
      if (!prev || prev.isPaused) return prev;
      const remainingSeconds = Math.max(0, Math.ceil((prev.endsAt - Date.now()) / 1000));
      return {
        ...prev,
        isPaused: true,
        remainingSecondsWhenPaused: remainingSeconds,
      };
    });
  };

  const handleResumeFocusCountdown = () => {
    setFocusCountdown((prev) => {
      if (!prev || !prev.isPaused) return prev;
      const remainingSeconds = Math.max(0, prev.remainingSecondsWhenPaused || 0);
      return {
        ...prev,
        isPaused: false,
        endsAt: Date.now() + remainingSeconds * 1000,
        remainingSecondsWhenPaused: undefined,
      };
    });
  };

  const handleExitFocusCountdown = () => {
    setFocusCountdown(null);
  };

  const handleCloseFocusFinishedNotice = () => {
    setFocusFinishedNotice(null);
    setFocusCountdown(null);
  };

  useEffect(() => {
    const updateDrift = (x: number, y: number) => {
      setDriftOffset({
        x: Math.max(-10, Math.min(10, x)),
        y: Math.max(-8, Math.min(8, y)),
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 12;
      const y = ((event.clientY / window.innerHeight) - 0.5) * 8;
      updateDrift(x, y);
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      updateDrift(gamma * 0.35, (beta - 45) * 0.08);
    };

    const resetDrift = () => setDriftOffset({ x: 0, y: 0 });

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', resetDrift);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', resetDrift);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  useEffect(() => {
    if (!handsFreeEnabled || !currentStep || session.status !== 'active') return;

    const stepSpeechKey = `${currentStep.id}:${currentStep.title}:${currentStep.guidance}`;
    if (stepSpeechGuardRef.current === stepSpeechKey) return;

    stepSpeechGuardRef.current = stepSpeechKey;
    speechTextRef.current = buildHandsFreeSpeech(currentStep);
    pauseListeningUntilRef.current = Date.now() + 1200;
    voiceCommandLockRef.current = true;
    setHandsFreeWaiting(false);
    stopListening();
    resetTranscript();
    speak(speechTextRef.current, {
      onEnd: () => {
        window.setTimeout(() => {
          if (!handsFreeEnabled || session.status !== 'active') return;
          setHandsFreeWaiting(true);
          resetTranscript();
          voiceCommandLockRef.current = false;
          pauseListeningUntilRef.current = 0;
          startListening();
        }, 40);
      },
      onError: () => {
        window.setTimeout(() => {
          if (!handsFreeEnabled || session.status !== 'active') return;
          setHandsFreeWaiting(true);
          voiceCommandLockRef.current = false;
          pauseListeningUntilRef.current = 0;
          startListening();
        }, 40);
      },
    });
    return () => {
      stop();
      if (!handsFreeEnabled || session.status !== 'active') {
        stopListening();
      }
    };
  }, [
    currentStep?.id,
    currentStep?.title,
    currentStep?.guidance,
    handsFreeEnabled,
    session.status,
    resetTranscript,
    setHandsFreeWaiting,
    speak,
    startListening,
    stop,
    stopListening,
  ]);

  useEffect(() => {
    if (!handsFreeEnabled || voiceCommandLockRef.current || session.status !== 'active') return;
    if (pauseListeningUntilRef.current > Date.now()) return;
    if (!waitingForCommand && !isListening && !isSpeaking) {
      setHandsFreeWaiting(true);
      startListening();
    }
  }, [handsFreeEnabled, waitingForCommand, isListening, isSpeaking, session.status, startListening, setHandsFreeWaiting]);

  useEffect(() => {
    if (!handsFreeEnabled) {
      stepSpeechGuardRef.current = '';
      pauseListeningUntilRef.current = 0;
      voiceCommandLockRef.current = false;
      setVoiceStatusText('语音未开启');
      return;
    }

    if (!isVoiceRecognitionSupported) {
      setVoiceStatusText('当前设备不支持语音识别');
      return;
    }

    if (session.status !== 'active') {
      setVoiceStatusText('语音模式已暂停');
      return;
    }

    if (pauseListeningUntilRef.current > Date.now()) {
      setVoiceStatusText('正在切换到下一步…');
      return;
    }

    if (isSpeaking) {
      setVoiceStatusText('正在播报当前步骤…');
      return;
    }

    if (isListening) {
      setVoiceStatusText('正在持续监听，等你说继续或下一步…');
      return;
    }

    setVoiceStatusText('语音模式已开启，正在连接麦克风…');
    startListening();
  }, [handsFreeEnabled, isVoiceRecognitionSupported, isListening, isSpeaking, session.status, startListening]);

  if (!currentStep) {
    return (
      <div className="navigation-shell navigation-state-shell">
        <div className="navigation-section">
          <div className="navigation-group-card">
            <strong>这次导航暂时没有可执行的步骤</strong>
            <p>你可以返回上一页重新生成，或者稍后再试。</p>
          </div>
        </div>
      </div>
    );
  }

  const currentGroup = getCurrentNavigationGroup(session);
  const currentGroupGoal = currentGroup?.linkedGoalId
    ? useGoalStore.getState().getGoalById(currentGroup.linkedGoalId)
    : null;
  const currentGroupKrCount = currentGroup?.krDimensionValues
    ? Object.values(currentGroup.krDimensionValues).filter((value) => Number(value) > 0).length
    : 0;
  const focusStepProgressLabel = `第 ${session.currentStepIndex + 1} 步 / 共 ${session.executionSteps.length} 步`;
  const focusTaskLabel = currentGroup?.title || session.title;
  const nextStep = session.executionSteps[session.currentStepIndex + 1];
  const archivedTimeLabel = formatArchivedTime(session.archivedAt);

  return (
    <div className="navigation-shell navigation-state-shell">
      <div className="navigation-topbar navigation-topbar-task">
        <div className="navigation-topbar-main navigation-topbar-task-main">
          <div>
            <div className="navigation-title-row navigation-title-row-task">
              <h2
                className="navigation-title navigation-title-task"
                onDoubleClick={handleEditCurrentTask}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleEditCurrentTask();
                }}
              >
                {currentGroup?.title || session.title}
              </h2>
              {currentGroup && (
                <button className={`navigation-kr-pill ${currentGroupGoal ? 'is-linked' : ''}`} onClick={() => setIsKRSheetOpen(true)} title="给当前任务补目标和关键结果">
                  <Target className="w-4 h-4" />
                  <span>
                    KR
                    {currentGroupGoal ? ` · ${currentGroupGoal.name}` : ''}
                    {currentGroupKrCount > 0 ? ` · ${currentGroupKrCount} 项` : ''}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="navigation-topbar-actions navigation-topbar-task-actions">
          <button
            className={`navigation-icon-button navigation-plan-toggle ${isTaskListOpen ? 'is-active' : ''}`}
            onClick={() => setIsTaskListOpen((prev) => !prev)}
            aria-label={isTaskListOpen ? '收起任务列表' : '展开任务列表'}
            title={isTaskListOpen ? '收起任务列表' : '展开任务列表'}
          >
            {isTaskListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button className="navigation-icon-button" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4" />
          </button>
          <button
            className="navigation-icon-button"
            onClick={() => {
              if (session.status === 'paused') {
                resumeSession();
                return;
              }
              pauseSession();
            }}
            title={session.status === 'paused' ? '继续' : '暂停'}
          >
            {session.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="navigation-session-toolbar">
        {session.archivedAt && session.status === 'paused' && (
          <div className="navigation-archived-banner">
            <div className="navigation-archived-banner-copy">
              <strong>已存档，计时已暂停</strong>
              <span>{archivedTimeLabel ? `存档时间：${archivedTimeLabel}` : '下次回来可以从这里继续'}</span>
            </div>
            <button
              className="navigation-solid-button navigation-solid-button-primary navigation-archived-resume"
              onClick={() => {
                resumeSession();
              }}
            >
              继续存档任务
            </button>
          </div>
        )}
        <div className="navigation-session-toolbar-actions">
          <button
            className="navigation-solid-button navigation-solid-button-secondary"
            onClick={() => {
              archiveSession();
              stop();
              stopListening();
              setHandsFreeWaiting(false);
            }}
          >
            存档
          </button>
          <button
            className="navigation-solid-button navigation-solid-button-primary"
            onClick={() => {
              stop();
              stopListening();
              setHandsFreeWaiting(false);
              abandonSession();
            }}
          >
            完成
          </button>
          <button
            className="navigation-solid-button navigation-solid-button-danger"
            onClick={() => {
              stop();
              stopListening();
              setHandsFreeWaiting(false);
              onReturnToComposer(session.rawInput);
              clearSession();
            }}
          >
            放弃
          </button>
        </div>
      </div>

      {isTaskListOpen && (
        <NavigationActivePlanEditor
          session={session}
          onClose={() => {
            setIsTaskListOpen(false);
            setTaskListInitialEditingTarget(null);
          }}
          initialEditingTarget={taskListInitialEditingTarget}
        />
      )}

      <div className="navigation-progress-track">
        <div className="navigation-progress-fill" style={{ width: `${((session.currentStepIndex + 1) / session.executionSteps.length) * 100}%` }} />
      </div>

      <NavigationStepCard
        step={currentStep}
        stepIndex={session.currentStepIndex}
        stepCount={session.executionSteps.length}
        nextStepTitle={nextStep?.title}
        elapsedLabel={elapsedLabel}
        sceneElapsedMinutes={sceneElapsedMinutes}
        totalSessionElapsedMinutes={totalSessionElapsedMinutes}
        collectedEmojis={collectedEmojis}
        emojiPreferences={preferences.emojiPreferences}
        driftOffset={driftOffset}
        onContinue={() => {
          stopListening();
          setHandsFreeWaiting(false);
          playCoinDrop();
          completeCurrentStep();
        }}
        onCompleteNavigation={() => {
          stopListening();
          setHandsFreeWaiting(false);
          playCoinDrop();
          finalizeSession();
        }}
        isFinalStepAwaitingCompletion={isFinalStepAwaitingCompletion}
        onOpenDifficulty={() => setShowDifficultySheet(true)}
        onOpenFocus={() => setIsFocusOpen(true)}
        onEditStepEmoji={() => setEmojiEditorOpen((prev) => !prev)}
        isEmojiEditorOpen={emojiEditorOpen}
        emojiEditor={(
          <NavigationEmojiEditor
            currentEmoji={getStepMeaningEmoji(currentStep.title, currentStep.guidance, currentStep.meaningEmoji, preferences.emojiPreferences)}
            onSelect={handleEditCurrentStepEmoji}
            onClose={() => setEmojiEditorOpen(false)}
          />
        )}
        onOpenHandsFree={() => {
          if (handsFreeEnabled) {
            setHandsFreeEnabled(false);
            stop();
            stopListening();
            setHandsFreeWaiting(false);
            return;
          }
          setShowHandsFreeIntro(true);
        }}
        onOpenStepTitleMenu={handleEditCurrentStep}
        onOpenStepGuidanceEditor={openCurrentStepGuidanceEditor}
        isVoiceMode={handsFreeEnabled}
        isListening={isListening}
        voiceStatusText={voiceStatusText}
        lastTranscript={lastTranscript}
        playbackSource={playbackSource}
        didFallbackToSystem={didFallbackToSystem}
        difficultyMessage={difficultyMessage}
        isResolvingDifficulty={isResolvingDifficulty}
        executionScore={sceneExecutionScore}
        energyLevel={sceneEnergyLevel}
        recentExecutionGain={session.recentExecutionGain || 0}
        idleMarkCount={accumulatedIdleMarks}
        snowProgress={accumulatedSnowProgress}
      />


      {showDifficultySheet && (
        <NavigationDifficultySheet
          isLoading={isResolvingDifficulty}
          message={difficultyInput}
          onClose={() => setShowDifficultySheet(false)}
          onSubmit={handleResolveDifficulty}
        />
      )}

      {isKRSheetOpen && currentGroup && (
        <NavigationKRSheet
          session={session}
          group={currentGroup}
          onClose={() => setIsKRSheetOpen(false)}
        />
      )}

      {showHandsFreeIntro && (
        <NavigationHandsFreeIntro
          onClose={() => setShowHandsFreeIntro(false)}
          onEnable={() => {
            setHandsFreeEnabled(true);
            markHandsFreeIntroSeen();
            setShowHandsFreeIntro(false);
          }}
          preferredVoiceMode={preferredVoiceMode}
          onChangeVoiceMode={setHandsFreePreferredVoiceMode}
          isEdgeVoiceConfigured={isEdgeVoiceConfigured}
          playbackSource={playbackSource}
          didFallbackToSystem={didFallbackToSystem}
        />
      )}
      {isFocusOpen && currentStep && (
        <NavigationFocusSheet
          stepTitle={currentStep.title}
          defaultMinutes={currentStep.focusMinutes || 10}
          onStart={handleStartFocusCountdown}
          onClose={() => setIsFocusOpen(false)}
        />
      )}
      {focusCountdown && currentStep ? (
        <div className="navigation-focus-fullscreen" role="dialog" aria-modal="true">
          <div className="navigation-focus-fullscreen-inner">
            <div className="navigation-focus-fullscreen-topbar">
              <span className="navigation-focus-fullscreen-step">{focusStepProgressLabel}</span>
              <span className="navigation-focus-fullscreen-task">{focusTaskLabel}</span>
            </div>
            <span className="navigation-focus-fullscreen-kicker">{isFocusPaused ? '已暂停' : '正在专注'}</span>
            <h2 className="navigation-focus-fullscreen-title">{currentStep.title}</h2>
            <div className="navigation-focus-fullscreen-timer">{focusCountdownLabel}</div>
            <div className="navigation-focus-fullscreen-meta">
              本轮 {focusCountdown.minutes}m{isFocusPaused ? ' · 已暂停' : ''}
            </div>
            <div className="navigation-focus-fullscreen-actions">
              <button className="navigation-secondary-button navigation-focus-fullscreen-secondary" onClick={handleExitFocusCountdown}>
                退出专注
              </button>
              <button
                className="navigation-primary-button navigation-focus-fullscreen-exit"
                onClick={isFocusPaused ? handleResumeFocusCountdown : handlePauseFocusCountdown}
              >
                {isFocusPaused ? '继续' : '暂停'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {focusFinishedNotice ? (
        <div className="navigation-focus-finished-backdrop" role="dialog" aria-modal="true">
          <div className="navigation-focus-finished-card">
            <span className="navigation-focus-finished-kicker">专注结束</span>
            <h3>{focusFinishedNotice.stepTitle}</h3>
            <p>你设定的 {focusFinishedNotice.minutes}m 已经到了。</p>
            <div className="navigation-focus-finished-actions">
              <button className="navigation-secondary-button" onClick={handleCloseFocusFinishedNotice}>
                知道了
              </button>
              <button
                className="navigation-primary-button"
                onClick={() => {
                  const minutes = focusFinishedNotice.minutes;
                  handleCloseFocusFinishedNotice();
                  handleStartFocusCountdown(minutes);
                }}
              >
                再专注一轮
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isSettingsOpen && <NavigationSettingsSheet onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

function NavigationCompletionView({ session, autoOpenTrend = false }: { session: NavigationSession; autoOpenTrend?: boolean }) {
  const syncSessionToTimeline = useNavigationStore((state) => state.syncSessionToTimeline);
  const savePostState = useNavigationStore((state) => state.savePostState);
  const clearSession = useNavigationStore((state) => state.clearSession);
  const bottleEntries = useNavigationStore((state) => state.bottleEntries);
  const isSyncingToTimeline = useNavigationStore((state) => state.isSyncingToTimeline);
  const [showPostState, setShowPostState] = useState(!session.postState);
  const [analysisResult, setAnalysisResult] = useState<{
    analysisTitle: string;
    summary: string;
    insights: string[];
    nextActions: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTrendOpen, setIsTrendOpen] = useState(autoOpenTrend);
  const hasTrendData = !!session.preState && !!session.postState;
  const [selectedTrendStageId, setSelectedTrendStageId] = useState<string>('mid');
  const [hoveredTrendStageId, setHoveredTrendStageId] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpenTrend && hasTrendData) {
      setIsTrendOpen(true);
    }
  }, [autoOpenTrend, hasTrendData]);

  useEffect(() => {
    if (!session.preState || !session.postState || showPostState) return;

    let cancelled = false;
    setIsAnalyzing(true);

    AIUnifiedService.analyzeNavigationCompletion(session).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setAnalysisResult(result.data);
      } else {
        setAnalysisResult(null);
        console.error('[导航] 完成复盘分析失败', result.error);
      }
      setIsAnalyzing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [session, showPostState]);

  const completedCount = session.executionSteps.filter((step) => step.status === 'completed').length;
  const skippedCount = session.executionSteps.filter((step) => step.status === 'skipped').length;
  const completionLabel = session.abandoned ? '本次导航已提前结束' : '导航已收束';
  const actualMinutes = session.startedAt && session.completedAt
    ? Math.max(1, Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
    : undefined;
  const estimatedMinutes = session.preState?.estimatedDurationMinutes;
  const timeDelta = actualMinutes !== undefined && estimatedMinutes !== undefined ? actualMinutes - estimatedMinutes : undefined;
  const brainDelta = (session.postState?.brainState ?? 0) - (session.preState?.brainState ?? 0);
  const emotionDelta = (session.postState?.emotionState ?? 0) - (session.preState?.emotionState ?? 0);
  const difficultyDelta = ((session.postState?.actualDifficulty ?? 0) - (session.preState?.perceivedDifficulty ?? 0));
  const completionRate = session.executionSteps.length > 0
    ? Math.round((completedCount / session.executionSteps.length) * 100)
    : 0;
  const energyTone = getDeltaTone(emotionDelta + brainDelta / 2);
  const trendCards = [
    {
      key: 'brain',
      icon: <Brain className="w-4 h-4" />,
      label: '脑力清晰度',
      value: formatDelta(brainDelta),
      meta: `${session.preState?.brainState ?? '—'} → ${session.postState?.brainState ?? '—'}`,
      tone: getDeltaTone(brainDelta),
    },
    {
      key: 'emotion',
      icon: <Heart className="w-4 h-4" />,
      label: '情绪温度',
      value: formatDelta(emotionDelta),
      meta: `${session.preState?.emotionState ?? '—'} → ${session.postState?.emotionState ?? '—'}`,
      tone: getDeltaTone(emotionDelta),
    },
    {
      key: 'difficulty',
      icon: <Sparkles className="w-4 h-4" />,
      label: '难度偏差',
      value: difficultyDelta === 0 ? '刚刚好' : `${difficultyDelta > 0 ? '+' : ''}${difficultyDelta} 档`,
      meta: `${difficultyLabel(session.preState?.perceivedDifficulty)} → ${difficultyLabel(session.postState?.actualDifficulty)}`,
      tone: getDeltaTone(-difficultyDelta * 8),
    },
    {
      key: 'achievement',
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: '完成感',
      value: `${session.postState?.achievementSense ?? '—'}`,
      meta: `完成 ${completedCount} 步，跳过 ${skippedCount} 步`,
      tone: getDeltaTone((session.postState?.achievementSense ?? 0) - 50),
    },
  ];
  const trendStory = buildTrendStory(session);
  const selectedTrendStage = trendStory.stages.find((stage) => stage.id === selectedTrendStageId) || trendStory.stages[1] || trendStory.stages[0];
  const hoveredTrendStage = trendStory.stages.find((stage) => stage.id === hoveredTrendStageId) || selectedTrendStage;
  const collectedBottleEmojis = useMemo(() => buildCollectedStepEmojis(session), [session]);
  const activeIdleMarks = session.status === 'active'
    ? Math.max(0, Math.floor((Date.now() - new Date(session.lastProgressAt || session.startedAt || session.createdAt).getTime()) / (30 * 60 * 1000)))
    : 0;
  const allBottleEntries = useMemo(() => {
    const merged = [...bottleEntries];
    const currentSessionEntries = session.bottleEntries || [];
    currentSessionEntries.forEach((entry) => {
      if (!merged.some((item) => item.id === entry.id)) {
        merged.push(entry);
      }
    });
    return merged;
  }, [bottleEntries, session.bottleEntries]);
  const dailyBottleGroups = useMemo(() => buildDailyBottleGroups(allBottleEntries), [allBottleEntries]);
  const todayBottleGroup = dailyBottleGroups.find((group) => group.date === toLocalDateKey(session.completedAt || session.startedAt || Date.now()))
    || dailyBottleGroups.find((group) => group.date === toLocalDateKey())
    || null;

  if (showPostState) {
    return (
      <div className="navigation-shell">
        <NavigationStateRecorder
          title="记录完成后状态"
          subtitle="填写后，会看到与开始前相比的变化。"
          confirmLabel="保存完成状态"
          initialValue={session.postState}
          includeAchievementSense
          onSubmit={(value) => {
            savePostState(value);
            setAnalysisResult(null);
            setShowPostState(false);
          }}
          onSkip={() => setShowPostState(false)}
        />
      </div>
    );
  }

  return (
    <div className="navigation-shell navigation-state-shell">
      <div className="navigation-completion-card navigation-completion-reference-card navigation-completion-tight-card">
        <div className="navigation-completion-hero">
          <div className="navigation-completion-hero-copy">
            <span className="navigation-completion-eyebrow">{energyTone.emoji} {completionLabel}</span>
            <h2>{analysisResult?.analysisTitle || (session.abandoned ? '这次虽然提前结束，但已经帮你把进行到一半的状态整理好了' : '这次收尾状态已经整理好了')}</h2>
            <p>{analysisResult?.summary || (isAnalyzing ? '正在根据你的开始前状态、完成后状态和实际执行过程生成复盘分析…' : session.abandoned ? '你这次是中途放弃结束的，但放弃前已经发生的步骤、时长和轨迹还是会保留下来，可以照常写入时间轴。' : '我会根据你的真实记录，分析你这次在时间预估、难度判断和执行状态上的特点。')}</p>
          </div>
          <div className="navigation-completion-orb">
            <div className="navigation-completion-orb-ring" />
            <div className="navigation-completion-orb-core">
              <span>{energyTone.emoji}</span>
              <strong>{completionRate}%</strong>
              <small>完成率</small>
            </div>
          </div>
        </div>

        <div className="navigation-completion-summary-grid">
          <div className="navigation-completion-kpi-card is-primary">
            <span className="navigation-completion-kpi-label">⏱️ 实际耗时</span>
            <strong>{formatMinutesLabel(actualMinutes)}</strong>
            <small>{timeDelta === undefined ? '暂无预估对照' : timeDelta === 0 ? '和预估几乎一致' : timeDelta > 0 ? `比预估多 ${timeDelta} 分钟` : `比预估少 ${Math.abs(timeDelta)} 分钟`}</small>
          </div>
          <div className="navigation-completion-kpi-card">
            <span className="navigation-completion-kpi-label">🪄 执行步数</span>
            <strong>{completedCount}/{session.executionSteps.length}</strong>
            <small>{skippedCount > 0 ? `跳过 ${skippedCount} 步，也算真实推进` : session.abandoned ? '这次是提前结束，但已发生的推进仍然保留' : '这次基本完整走完啦'}</small>
          </div>
          <div className="navigation-completion-kpi-card">
            <span className="navigation-completion-kpi-label">🎖️ 成就感</span>
            <strong>{session.postState?.achievementSense ?? '—'}</strong>
            <small>{session.postState?.reflection ? '你还留下了自己的复盘心情' : '还可以补一句自己的感受'}</small>
          </div>
        </div>

        <div className="navigation-completion-trend-grid">
          {trendCards.map((card) => (
            <div key={card.key} className="navigation-completion-trend-card">
              <div className="navigation-completion-trend-head">
                <span className="navigation-completion-trend-icon">{card.icon}</span>
                <div>
                  <strong>{card.label}</strong>
                  <small>{card.meta}</small>
                </div>
              </div>
              <div className="navigation-completion-trend-value-row">
                <span className="navigation-completion-trend-emoji">{card.tone.emoji}</span>
                <b>{card.value}</b>
              </div>
              <em>{card.tone.label}</em>
            </div>
          ))}
        </div>

        <button className="navigation-completion-chart-trigger" onClick={() => hasTrendData && setIsTrendOpen(true)} disabled={!hasTrendData}>
          <span>{hasTrendData ? '📈 查看今日状态走势' : '🫥 暂时还没有可视化数据'}</span>
          <small>{hasTrendData ? '把脑力 / 情绪 / 难度体感 / 成就感放到一张更清楚的图里' : '先完成一次导航并填写开始前 / 完成后状态，这里才会出现真正的走势分析'}</small>
        </button>

        {!hasTrendData && (
          <div className="navigation-completion-empty-card">
            <div className="navigation-completion-empty-emoji">📭</div>
            <div className="navigation-completion-empty-copy">
              <strong>这里还没有趋势图可以看</strong>
              <p>先去完成一条导航，并记录开始前和完成后的状态。完成后再点右上这颗 `📈`，这里就会出现你这次的情绪、执行力、成就感和综合走势。✨</p>
            </div>
          </div>
        )}

        <div className="navigation-completion-emoji-bottle-card navigation-completion-emoji-bottle-card-today">
          <div className="navigation-completion-emoji-bottle-head">
            <div>
              <strong>🫙 今日收集瓶</strong>
              <small>{todayBottleGroup ? `今天一共收了 ${todayBottleGroup.emojis.length} 个表意 emoji` : '今天的瓶子还没有装满'}</small>
            </div>
            <span>{formatCollectionDateTag(session.completedAt || session.startedAt)}</span>
          </div>
          <div className="navigation-completion-emoji-bottle-wrap navigation-completion-emoji-bottle-wrap-large">
            <div className="navigation-completion-emoji-bottle-cork" />
            <div className="navigation-completion-emoji-bottle-neck" />
            <div className="navigation-completion-emoji-bottle-body navigation-completion-emoji-bottle-body-glow">
              <div className="navigation-completion-emoji-bottle-shine" />
              {todayBottleGroup && todayBottleGroup.emojis.length > 0 ? buildBottleStackLayout(todayBottleGroup.emojis, todayBottleGroup.date, 7).map((item, index) => (
                <span
                  key={`${todayBottleGroup.date}-${index}-${item.emoji}`}
                  className="navigation-completion-bottle-emoji navigation-completion-bottle-emoji-piled"
                  style={{ left: `${item.left}%`, bottom: `${item.bottom}px`, transform: `rotate(${item.rotate}deg)` }}
                >
                  {item.emoji}
                </span>
              )) : <span className="navigation-completion-bottle-empty">今天这一瓶还空着</span>}
              {todayBottleGroup && todayBottleGroup.inefficiencyMarks > 0 ? (
                <div className="navigation-completion-bottle-crosses">
                  {Array.from({ length: todayBottleGroup.inefficiencyMarks }).map((_, index) => (
                    <span key={`cross-${index}`} className="navigation-completion-bottle-cross">❌</span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="navigation-completion-emoji-bottle-tag">{todayBottleGroup ? `${formatBottleHistoryDate(todayBottleGroup.date)} · ${todayBottleGroup.entries.length} 瓶汇总` : formatCollectionDateTag(session.completedAt || session.startedAt)}</div>
          </div>
        </div>

        <div className="navigation-completion-bottle-history-card">
          <div className="navigation-completion-bottle-history-head">
            <div>
              <strong>📚 每天的收集瓶</strong>
              <p>一天的总瓶子 = 这一天里所有收集瓶的总和。</p>
            </div>
          </div>
          <div className="navigation-completion-bottle-history-list">
            {dailyBottleGroups.length > 0 ? dailyBottleGroups.map((group) => (
              <div key={group.date} className="navigation-completion-bottle-history-item">
                <div className="navigation-completion-bottle-history-item-head">
                  <div>
                    <strong>{formatBottleHistoryDate(group.date)}</strong>
                    <small>{group.entries.length} 瓶 · {group.emojis.length} 个收集 emoji</small>
                  </div>
                  {group.inefficiencyMarks > 0 ? <span className="navigation-completion-bottle-history-cross-tag">低效率 {group.inefficiencyMarks} 次 ❌</span> : <span className="navigation-completion-bottle-history-good-tag">今天没挂叉</span>}
                </div>
                <div className="navigation-completion-bottle-history-preview">
                  <div className="navigation-completion-bottle-history-mini-bottle">
                    <div className="navigation-completion-bottle-history-mini-neck" />
                    <div className="navigation-completion-bottle-history-mini-body">
                      {group.emojis.length > 0 ? buildBottleStackLayout(group.emojis, `history-${group.date}`, 6).slice(0, 18).map((item, index) => (
                        <span
                          key={`history-${group.date}-${index}`}
                          className="navigation-completion-bottle-history-mini-emoji"
                          style={{ left: `${item.left}%`, bottom: `${item.bottom}px`, transform: `rotate(${item.rotate}deg)` }}
                        >
                          {item.emoji}
                        </span>
                      )) : <span className="navigation-completion-bottle-empty">暂无收集</span>}
                    </div>
                  </div>
                  <div className="navigation-completion-bottle-history-entries">
                    {group.entries.map((entry) => (
                      <div key={entry.id} className="navigation-completion-bottle-history-entry">
                        <span>{entry.title}</span>
                        <div>
                          {entry.emojis.map((emoji, index) => <em key={`${entry.id}-${index}`}>{emoji}</em>)}
                          {entry.inefficiencyMarks > 0 ? Array.from({ length: entry.inefficiencyMarks }).map((_, index) => <b key={`${entry.id}-cross-${index}`}>❌</b>) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )) : (
              <div className="navigation-completion-empty-card">
                <div className="navigation-completion-empty-emoji">🫙</div>
                <div className="navigation-completion-empty-copy">
                  <strong>还没有历史收集瓶</strong>
                  <p>完成几次导航之后，这里就会按天把你的瓶子都汇总起来。</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="navigation-completion-analysis-shell">
          <div className="navigation-completion-analysis-header">
            <div>
              <strong>📝 这次复盘重点</strong>
              <p>尽量压缩大段文字，让你一眼就先看到重点。</p>
            </div>
          </div>

          <div className="navigation-completion-analysis-list">
            {isAnalyzing ? (
              <div className="navigation-completion-analysis-item">
                <span>…</span>
                <p>正在结合你填写的预估时间、实际完成耗时、开始前后状态和备注，整理这次真正有帮助的复盘分析。</p>
              </div>
            ) : analysisResult ? (
              <>
                {analysisResult.insights.map((line, index) => (
                  <div key={`insight-${index}`} className="navigation-completion-analysis-item">
                    <span>{['💡', '🧠', '📌', '✨'][index % 4]}</span>
                    <p>{line}</p>
                  </div>
                ))}
                {analysisResult.nextActions.map((line, index) => (
                  <div key={`action-${index}`} className="navigation-completion-analysis-item navigation-completion-analysis-item-action">
                    <span>{['🎯', '🚶', '🛟', '🌱'][index % 4]}</span>
                    <p>{line}</p>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>

        {session.postState?.reflection && (
          <div className="navigation-completion-reflection-card">
            <div className="navigation-completion-reflection-title">💬 你给自己的备注</div>
            <p>{session.postState.reflection}</p>
          </div>
        )}

        <div className="navigation-action-row navigation-completion-actions-row">
          <button className="navigation-primary-button" onClick={() => syncSessionToTimeline()} disabled={isSyncingToTimeline || !!session.finishedAndSyncedToTimeline}>
            {session.finishedAndSyncedToTimeline ? '已写入时间轴' : isSyncingToTimeline ? '正在写入...' : '写入时间轴'}
          </button>
          <button className="navigation-secondary-button" onClick={() => setShowPostState(true)}>修改完成状态</button>
          <button className="navigation-secondary-button" onClick={clearSession}>结束并返回</button>
        </div>
      </div>

      {isTrendOpen && (
        <div className="navigation-sheet-backdrop" onClick={() => setIsTrendOpen(false)}>
          <div className="navigation-sheet-card navigation-completion-trend-sheet navigation-completion-trend-sheet-rich" onClick={(e) => e.stopPropagation()}>
            <div className="navigation-sheet-header">
              <div>
                <h3>📊 今日状态走势</h3>
                <p>四条线放在一张图里，点不同节点，下面的分析也会跟着切换 ✨</p>
              </div>
              <button onClick={() => setIsTrendOpen(false)} className="navigation-icon-button">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="navigation-completion-trend-legend">
              {trendStory.lineConfigs.map((line) => (
                <div key={line.key} className={`navigation-completion-trend-legend-item ${line.colorClass}`}>
                  <span className={`navigation-completion-trend-legend-line ${line.strokeClass}`} />
                  <strong>{line.emoji} {line.label}</strong>
                </div>
              ))}
            </div>

            <div className="navigation-completion-trend-unified-card">
              <div className="navigation-completion-trend-unified-head">
                <div>
                  <strong>🌈 一张图看完这次状态变化</strong>
                  <p>横轴是阶段，纵轴是主观强度分值；点一下任意阶段，就能看当时在做什么、哪里在变好、哪里在卡。👀</p>
                </div>
                <div className="navigation-completion-trend-unified-score">
                  <span>{selectedTrendStage.emoji} {selectedTrendStage.label}</span>
                  <strong>{selectedTrendStage.metrics.composite}</strong>
                </div>
              </div>

              <div className="navigation-completion-trend-stage-pills">
                {trendStory.stages.map((stage) => (
                  <button
                    key={stage.id}
                    className={`navigation-completion-trend-stage-pill ${selectedTrendStage.id === stage.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedTrendStageId(stage.id)}
                  >
                    <span>{stage.emoji}</span>
                    <div>
                      <strong>{stage.label}</strong>
                      <small>{stage.timeLabel}</small>
                    </div>
                  </button>
                ))}
              </div>

              <svg viewBox="0 0 320 220" className="navigation-completion-trend-unified-svg" preserveAspectRatio="none">
                {[20, 50, 80].map((y) => (
                  <line key={y} x1="18" y1={190 - y * 1.6} x2="302" y2={190 - y * 1.6} className="navigation-completion-grid-line" />
                ))}
                {trendStory.lineConfigs.map((line) => {
                  const points = trendStory.stages.map((stage, index) => {
                    const x = 40 + index * 120;
                    const value = stage.metrics[line.key as keyof typeof stage.metrics];
                    const y = 190 - value * 1.6;
                    return { x, y, value, stage };
                  });
                  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

                  return (
                    <g key={line.key} className={`navigation-completion-trend-series ${line.colorClass} ${line.strokeClass}`}>
                      <polyline points={polyline} className="navigation-completion-trend-series-line" />
                      {points.map((point) => (
                        <g key={`${line.key}-${point.stage.id}`}>
                          <circle cx={point.x} cy={point.y} r="5.5" className={`navigation-completion-trend-series-dot ${selectedTrendStage.id === point.stage.id ? 'is-active' : ''}`} />
                        </g>
                      ))}
                    </g>
                  );
                })}
                {trendStory.stages.map((stage, index) => {
                  const x = 40 + index * 120;
                  return (
                    <g key={stage.id}>
                      <line x1={x} y1="24" x2={x} y2="194" className={`navigation-completion-trend-stage-guide ${selectedTrendStage.id === stage.id ? 'is-active' : ''}`} />
                      <circle
                        cx={x}
                        cy="204"
                        r="16"
                        className={`navigation-completion-trend-hotspot ${selectedTrendStage.id === stage.id ? 'is-active' : ''}`}
                        onClick={() => setSelectedTrendStageId(stage.id)}
                        onMouseEnter={() => setHoveredTrendStageId(stage.id)}
                        onMouseLeave={() => setHoveredTrendStageId((current) => current === stage.id ? null : current)}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="navigation-completion-trend-tooltip-card">
                <div className="navigation-completion-trend-tooltip-head">
                  <span>{hoveredTrendStage.emoji} {hoveredTrendStage.label}</span>
                  <strong>{hoveredTrendStage.timeLabel}</strong>
                </div>
                <p>{hoveredTrendStage.doing}</p>
                <div className="navigation-completion-trend-tooltip-metrics">
                  <span>💗 {hoveredTrendStage.metrics.mood}</span>
                  <span>⚡ {hoveredTrendStage.metrics.execution}</span>
                  <span>🏆 {hoveredTrendStage.metrics.achievement}</span>
                  <span>🌌 {hoveredTrendStage.metrics.composite}</span>
                </div>
              </div>

              <div className="navigation-completion-trend-axis-rich">
                {trendStory.stages.map((stage) => (
                  <button
                    key={stage.id}
                    className={`navigation-completion-trend-axis-button ${selectedTrendStage.id === stage.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedTrendStageId(stage.id)}
                  >
                    <strong>{stage.label}</strong>
                    <span>{stage.timeLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="navigation-completion-stage-detail-card">
              <div className="navigation-completion-stage-detail-head">
                <div>
                  <span className="navigation-completion-stage-detail-badge">{selectedTrendStage.emoji} {selectedTrendStage.label}</span>
                  <h4>{selectedTrendStage.timeLabel} · {selectedTrendStage.doing}</h4>
                  <p>{selectedTrendStage.summary}</p>
                </div>
              </div>

              <div className="navigation-completion-stage-metrics-grid">
                <div className="navigation-completion-stage-metric-item is-emotion">
                  <span>💗 情绪</span>
                  <strong>{selectedTrendStage.metrics.mood}</strong>
                </div>
                <div className="navigation-completion-stage-metric-item is-brain">
                  <span>⚡ 执行力</span>
                  <strong>{selectedTrendStage.metrics.execution}</strong>
                </div>
                <div className="navigation-completion-stage-metric-item is-achievement">
                  <span>🏆 成就感</span>
                  <strong>{selectedTrendStage.metrics.achievement}</strong>
                </div>
                <div className="navigation-completion-stage-metric-item is-composite">
                  <span>🌌 综合</span>
                  <strong>{selectedTrendStage.metrics.composite}</strong>
                </div>
              </div>

              <div className="navigation-completion-stage-bullets">
                {selectedTrendStage.bullets.map((bullet, index) => (
                  <div key={`${selectedTrendStage.id}-${index}`} className="navigation-completion-stage-bullet">
                    <span>{['🔍', '🧷', '🫀'][index % 3]}</span>
                    <p>{bullet}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="navigation-completion-overall-insights">
              {trendStory.overallInsights.map((insight, index) => (
                <div key={index} className="navigation-completion-overall-insight-card">
                  <div className="navigation-completion-overall-insight-title">
                    <span>{insight.emoji}</span>
                    <strong>{insight.title}</strong>
                  </div>
                  <p>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NavigationModeView({ initialScreen = 'default' }: { initialScreen?: 'default' | 'trend' }) {
  const session = useNavigationStore((state) => state.currentSession);
  const [composerDraft, setComposerDraft] = useState('');

  useEffect(() => {
    document.documentElement.dataset.navigationMode = 'true';

    return () => {
      delete document.documentElement.dataset.navigationMode;
    };
  }, []);

  if (initialScreen === 'trend' && (!session || session.status !== 'completed')) {
    return (
      <div className="navigation-root">
        <div className="navigation-shell navigation-state-shell">
          <div className="navigation-completion-card navigation-completion-reference-card navigation-completion-tight-card">
            <div className="navigation-completion-empty-card">
              <div className="navigation-completion-empty-emoji">🧭</div>
              <div className="navigation-completion-empty-copy">
                <strong>还没有导航可视化数据</strong>
                <p>先完成一次导航，并把开始前 / 完成后的状态填上。完成后再点这个 `📈` 入口，就能直接看到四条线的走势和重点分析啦。✨</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (initialScreen === 'trend' && session?.status === 'completed') {
    return <NavigationCompletionView session={session} autoOpenTrend />;
  }

  return (
    <div className="navigation-root">
      {!session && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
      {session?.status === 'preview' && <NavigationPreview session={session} onReturnToComposer={setComposerDraft} />}
      {session?.status === 'active' && <NavigationSessionView session={session} onReturnToComposer={setComposerDraft} />}
      {session?.status === 'paused' && <NavigationSessionView session={session} onReturnToComposer={setComposerDraft} />}
      {session?.status === 'completed' && <NavigationCompletionView session={session} autoOpenTrend={initialScreen === 'trend'} />}
      {session?.status === 'cancelled' && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
      {session?.status === 'draft' && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
    </div>
  );
}
