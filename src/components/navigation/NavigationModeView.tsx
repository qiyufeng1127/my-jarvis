import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, Sparkles, Volume2, VolumeX, TimerReset, Pause, Play, X, Mic, Brain, Heart, CheckCircle2, Pencil, Trash2, ArrowUp, ArrowDown, ChevronLeft } from 'lucide-react';
import { AIUnifiedService } from '@/services/aiUnifiedService';
import { useNavigationPreferenceStore } from '@/stores/navigationPreferenceStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import type { NavigationExecutionStep, NavigationSession, NavigationStateSnapshot } from '@/types/navigation';
import './navigation.css';

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
  if (score >= 86) return '🥳';
  if (score >= 66) return '😄';
  if (score >= 46) return '🙂';
  if (score >= 31) return '😐';
  if (score >= 16) return '🙁';
  return '😞';
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

function NavigationSettingsSheet({ onClose }: { onClose: () => void }) {
  const { preferences, updatePreferences, setCustomPrompt, resetPreferences } = useNavigationPreferenceStore();

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
        || streamingSession.status !== 'preview'
      ) {
        return;
      }

      applyStreamingPlan(rawInput, partial, false);
      const refreshedSession = useNavigationStore.getState().currentSession;
      if (refreshedSession && refreshedSession.rawInput === rawInput && refreshedSession.status === 'preview') {
        latestPreviewSessionRef.current = refreshedSession;
      }
    });
    const pendingSession = useNavigationStore.getState().currentSession;
    console.log('[导航] planNavigationSession 返回', { result, pendingSession });
    if (
      generationRequestIdRef.current !== requestId
      || !pendingSession
      || pendingSession.rawInput !== rawInput
      || pendingSession.status !== 'preview'
    ) {
      return;
    }

    if (result.success && result.data) {
      applyStreamingPlan(rawInput, result.data, true);
      const finalSession = useNavigationStore.getState().currentSession;
      if (finalSession && finalSession.rawInput === rawInput && finalSession.status === 'preview') {
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

        <textarea
          className="navigation-composer"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="比如：我现在不想起床，但是得起床穿衣服下楼洗衣服洗漱给猫倒猫粮再倒水喝"
          rows={8}
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

function NavigationBuildingPreview({
  session,
  onReturnToComposer,
}: {
  session: NavigationSession;
  onReturnToComposer: (rawInput: string) => void;
}) {
  const startSession = useNavigationStore((state) => state.startSession);
  const cancelSession = useNavigationStore((state) => state.cancelSession);
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
    const timer = window.setInterval(() => {
      revealPreviewProgress();
    }, 320);
    return () => window.clearInterval(timer);
  }, [revealPreviewProgress, session.generationStage, session.generationProgress?.done]);

  const isDone = !!session.generationProgress?.done;
  const isWaitingAI = session.generationStage === 'waiting_ai';
  const visibleGroups = isDone
    ? session.timelineGroups
    : session.timelineGroups.slice(0, session.generationProgress?.revealedGroupCount || 0);
  const visibleSteps = isDone
    ? session.executionSteps
    : session.executionSteps.slice(0, session.generationProgress?.revealedStepCount || 0);

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
                    <strong>正在继续往下写</strong>
                    <p>这次是 AI 真正在按你的提示词整理，不是机械快版。</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="navigation-action-row column-on-mobile">
        <button
          className="navigation-secondary-button"
          onClick={() => {
            if (isInsertedFlowPreview) {
              restoreSuspendedSession();
              return;
            }
            onReturnToComposer(session.rawInput);
            clearSession();
          }}
        >
          {isInsertedFlowPreview ? '返回当前步骤' : isWaitingAI ? '返回修改这段话' : '重新来一条'}
        </button>
        <button className="navigation-secondary-button" onClick={() => {
          if (isInsertedFlowPreview) {
            restoreSuspendedSession();
            return;
          }
          cancelSession();
          clearSession();
        }}>
          {isInsertedFlowPreview ? '先不插入这段事' : isWaitingAI ? '取消这次拆解' : '放弃这次预览'}
        </button>
        <button className="navigation-primary-button" onClick={() => startSession()} disabled={!isDone}>
          {isDone ? (isInsertedFlowPreview ? '开始解决这段事' : '下一步：确认并开始导航') : isWaitingAI ? 'AI 正在思考中...' : '正在整理中...'}
        </button>
      </div>

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
  const isInsertedFlowPreview = session.previewMode === 'inserted_flow';

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
        <div className="navigation-metadata">共 {session.executionSteps.length} 步 · 第一步会尽量无痛启动{isEditMode ? ' · 双击可修改' : ''}</div>
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
                    <strong
                      onClick={() => isEditMode && setEditingTarget(`${step.id}:title`)}
                      onDoubleClick={() => isEditMode && setEditingTarget(`${step.id}:title`)}
                      className={isEditMode ? 'navigation-editable-text' : ''}
                    >
                      {step.title}
                    </strong>
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
                    <p
                      onClick={() => isEditMode && setEditingTarget(`${step.id}:guidance`)}
                      onDoubleClick={() => isEditMode && setEditingTarget(`${step.id}:guidance`)}
                      className={isEditMode ? 'navigation-editable-text' : ''}
                    >
                      {step.guidance}
                    </p>
                  )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {isSettingsOpen && <NavigationSettingsSheet onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

function NavigationScene({
  executionScore,
  energyLevel,
  recentGain,
}: {
  executionScore: number;
  energyLevel: number;
  recentGain: number;
}) {
  const emoji = getEmojiByScore(executionScore);
  const scale = 0.9 + executionScore / 100 * 0.34;
  const sparkleOpacity = 0.34 + energyLevel / 100 * 0.22;
  const snowHeight = 14 + executionScore * 0.24 + energyLevel * 0.1;
  const orbBottom = Math.max(8, snowHeight - 10);
  const starLayout = [
    { left: '14%', top: '12%', duration: '8.2s', delay: '0.2s', size: '7px' },
    { left: '24%', top: '21%', duration: '6.7s', delay: '1.4s', size: '5px' },
    { left: '37%', top: '10%', duration: '7.9s', delay: '0.8s', size: '6px' },
    { left: '49%', top: '16%', duration: '6.3s', delay: '2.1s', size: '5px' },
    { left: '58%', top: '8%', duration: '7.5s', delay: '1.1s', size: '6px' },
    { left: '71%', top: '24%', duration: '8.8s', delay: '0.5s', size: '5px' },
    { left: '83%', top: '17%', duration: '6.9s', delay: '1.7s', size: '6px' },
    { left: '19%', top: '35%', duration: '8.4s', delay: '2.6s', size: '5px' },
    { left: '42%', top: '31%', duration: '7.2s', delay: '3.2s', size: '7px' },
    { left: '63%', top: '38%', duration: '8.1s', delay: '2.2s', size: '5px' },
    { left: '78%', top: '33%', duration: '6.8s', delay: '3.5s', size: '6px' },
  ];

  return (
    <div className="navigation-scene-frame">
      <div className="navigation-scene">
        {recentGain > 0 && <div className="navigation-execution-burst">+{recentGain} 执行力</div>}
        <div className="navigation-sparkles navigation-sparkles-back" style={{ opacity: sparkleOpacity * 0.4 }} />
        <div className="navigation-sparkles navigation-sparkles-mid" style={{ opacity: sparkleOpacity * 0.68 }} />
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
        <div className="navigation-snowbank" style={{ height: `${snowHeight}px` }}>
          <div className="navigation-snowbank-wave" />
        </div>
        <div className="navigation-emoji-orb" style={{ bottom: `${orbBottom}px`, transform: `translateX(-50%) scale(${scale})` }}>
          <span className="navigation-emoji" role="img" aria-label="当前状态">{emoji}</span>
        </div>
      </div>
    </div>
  );
}

function NavigationFocusSheet({
  defaultMinutes,
  onClose,
}: {
  defaultMinutes: number;
  onClose: () => void;
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes || 10);

  return (
    <div className="navigation-sheet-backdrop">
      <div className="navigation-sheet-card navigation-focus-sheet">
        <div className="navigation-sheet-header">
          <h3>给这一步开个专注倒计时</h3>
          <button onClick={onClose} className="navigation-icon-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="navigation-focus-options">
          {[5, 10, 15, 25].map((minutes) => (
            <button
              key={minutes}
              className={`navigation-chip ${selectedMinutes === minutes ? 'is-active' : ''}`}
              onClick={() => setSelectedMinutes(minutes)}
            >
              {minutes} 分钟
            </button>
          ))}
        </div>

        <div className="navigation-sheet-actions">
          <button className="navigation-primary-button" onClick={onClose}>先用 {selectedMinutes} 分钟</button>
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
  onContinue,
  onOpenDifficulty,
  onOpenFocus,
  onOpenHandsFree,
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
}: {
  step: NavigationExecutionStep;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onOpenDifficulty: () => void;
  onOpenFocus: () => void;
  onOpenHandsFree: () => void;
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
}) {
  return (
    <div className="navigation-step-card navigation-step-reference-card">
      <div className="navigation-step-reference-count">第 {stepIndex + 1} 步 / 共 {stepCount} 步</div>

      <div className="navigation-step-reference-visual-wrap">
        <NavigationScene
          key={`${step.id}-${recentExecutionGain}`}
          executionScore={executionScore}
          energyLevel={energyLevel}
          recentGain={recentExecutionGain}
        />
      </div>

      <div className="navigation-step-reference-copy">
        <div className="navigation-step-reference-copy-card">
          <h3>{step.title}</h3>
          <p>{step.guidance}</p>
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

      <button className="navigation-primary-button navigation-reference-continue-button" onClick={onContinue}>继续</button>

      <div className="navigation-step-reference-bottom-row">
        <button className="navigation-reference-side-button" onClick={onOpenDifficulty} disabled={isResolvingDifficulty}>
          {isResolvingDifficulty ? '正在帮你换个走法…' : '想换个走法'}
        </button>
        <button className="navigation-reference-side-button navigation-reference-side-button-wide" onClick={onOpenDifficulty} disabled={isResolvingDifficulty}>
          我想先做别的
        </button>
      </div>

      <div className="navigation-footer-note navigation-step-reference-note">你现在只需要看这一小步。做完了，就继续。</div>
    </div>
  );
}

function NavigationSessionView({ session }: { session: NavigationSession }) {
  const preferences = useNavigationPreferenceStore((state) => state.preferences);
  const completeCurrentStep = useNavigationStore((state) => state.completeCurrentStep);
  const decayExecutionScore = useNavigationStore((state) => state.decayExecutionScore);
  const pauseSession = useNavigationStore((state) => state.pauseSession);
  const resumeSession = useNavigationStore((state) => state.resumeSession);
  const createInsertedFlowDraft = useNavigationStore((state) => state.createInsertedFlowDraft);
  const applyStreamingPlan = useNavigationStore((state) => state.applyStreamingPlan);
  const setGenerating = useNavigationStore((state) => state.setGenerating);
  const setError = useNavigationStore((state) => state.setError);
  const setHandsFreeEnabled = useNavigationStore((state) => state.setHandsFreeEnabled);
  const setHandsFreePreferredVoiceMode = useNavigationStore((state) => state.setHandsFreePreferredVoiceMode);
  const markHandsFreeIntroSeen = useNavigationStore((state) => state.markHandsFreeIntroSeen);
  const setHandsFreeWaiting = useNavigationStore((state) => state.setHandsFreeWaiting);
  const setLastVoiceTranscript = useNavigationStore((state) => state.setLastVoiceTranscript);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [showHandsFreeIntro, setShowHandsFreeIntro] = useState(false);
  const [showDifficultySheet, setShowDifficultySheet] = useState(false);
  const [difficultyInput, setDifficultyInput] = useState('');
  const [difficultyMessage, setDifficultyMessage] = useState('');
  const [isResolvingDifficulty, setIsResolvingDifficulty] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState('语音未开启');
  const difficultyRequestIdRef = useRef(0);
  const voiceCommandLockRef = useRef(false);
  const lastVoiceCommandRef = useRef('');
  const lastVoiceCommandAtRef = useRef(0);
  const currentStep = session.executionSteps[session.currentStepIndex];
  const isInsertedStep = currentStep?.source === 'difficulty_detour' || currentStep?.source === 'inserted_flow';
  const sceneExecutionScore = sessionMoodScore(currentStep, isInsertedStep, session);
  const sceneEnergyLevel = sessionMoodEnergy(currentStep, isInsertedStep, session);
  const handsFreeEnabled = !!session.handsFree?.enabled;
  const preferredVoiceMode = session.handsFree?.preferredVoiceMode || 'system';
  const waitingForCommand = !!session.handsFree?.waitingForCommand;
  const lastTranscript = session.handsFree?.lastTranscript;
  const recentSteps = useMemo(
    () => session.executionSteps.slice(Math.max(0, session.currentStepIndex - 2), session.currentStepIndex + 1),
    [session.executionSteps, session.currentStepIndex]
  );
  const stepSpeechGuardRef = useRef<string>('');
  const pauseListeningUntilRef = useRef(0);
  const { speak, stop, pause, resume, isSpeaking, isEdgeVoiceConfigured, playbackSource, didFallbackToSystem } = useSpeechSynthesis({ voiceMode: preferredVoiceMode });
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
        completeCurrentStep();
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
    if (session.status !== 'active') return;
    const timer = window.setInterval(() => {
      decayExecutionScore();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [session.status, decayExecutionScore]);

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

  return (
    <div className="navigation-shell navigation-state-shell">
      <div className="navigation-topbar">
        <div>
          <h2 className="navigation-title">{session.title}</h2>
          <p className="navigation-subtitle">完成后会汇总成 {session.timelineGroups.length} 个时间轴任务。</p>
        </div>
        <div className="navigation-topbar-actions">
          <button className="navigation-icon-button" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4" />
          </button>
          <button className="navigation-icon-button" onClick={() => session.status === 'paused' ? resumeSession() : pauseSession()}>
            {session.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="navigation-progress-track">
        <div className="navigation-progress-fill" style={{ width: `${((session.currentStepIndex + 1) / session.executionSteps.length) * 100}%` }} />
      </div>

      <NavigationStepCard
        step={currentStep}
        stepIndex={session.currentStepIndex}
        stepCount={session.executionSteps.length}
        onContinue={() => {
          stopListening();
          setHandsFreeWaiting(false);
          playCoinDrop();
          completeCurrentStep();
        }}
        onOpenDifficulty={() => setShowDifficultySheet(true)}
        onOpenFocus={() => setIsFocusOpen(true)}
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
      />

      {showDifficultySheet && (
        <NavigationDifficultySheet
          isLoading={isResolvingDifficulty}
          message={difficultyInput}
          onClose={() => setShowDifficultySheet(false)}
          onSubmit={handleResolveDifficulty}
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
      {isFocusOpen && <NavigationFocusSheet defaultMinutes={currentStep.focusMinutes || 10} onClose={() => setIsFocusOpen(false)} />}
      {isSettingsOpen && <NavigationSettingsSheet onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

function NavigationCompletionView({ session, autoOpenTrend = false }: { session: NavigationSession; autoOpenTrend?: boolean }) {
  const syncSessionToTimeline = useNavigationStore((state) => state.syncSessionToTimeline);
  const savePostState = useNavigationStore((state) => state.savePostState);
  const clearSession = useNavigationStore((state) => state.clearSession);
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
            <span className="navigation-completion-eyebrow">{energyTone.emoji} 导航已收束</span>
            <h2>{analysisResult?.analysisTitle || '这次收尾状态已经整理好了'}</h2>
            <p>{analysisResult?.summary || (isAnalyzing ? '正在根据你的开始前状态、完成后状态和实际执行过程生成复盘分析…' : '我会根据你的真实记录，分析你这次在时间预估、难度判断和执行状态上的特点。')}</p>
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
            <small>{skippedCount > 0 ? `跳过 ${skippedCount} 步，也算真实推进` : '这次基本完整走完啦'}</small>
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
      {session?.status === 'active' && <NavigationSessionView session={session} />}
      {session?.status === 'paused' && <NavigationSessionView session={session} />}
      {session?.status === 'completed' && <NavigationCompletionView session={session} autoOpenTrend={initialScreen === 'trend'} />}
      {session?.status === 'cancelled' && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
      {session?.status === 'draft' && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
    </div>
  );
}
