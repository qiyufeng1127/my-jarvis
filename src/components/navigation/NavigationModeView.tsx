import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, Sparkles, Volume2, VolumeX, TimerReset, Pause, Play, X, Mic, Brain, Heart, CheckCircle2, Wand2, Trash2, ArrowUp, ArrowDown, ChevronLeft } from 'lucide-react';
import { AIUnifiedService } from '@/services/aiUnifiedService';
import { useNavigationPreferenceStore } from '@/stores/navigationPreferenceStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import type { NavigationDifficultyDetourResult, NavigationExecutionStep, NavigationSession, NavigationStateSnapshot } from '@/types/navigation';
import './navigation.css';

function getEmojiByScore(score: number) {
  if (score >= 86) return '🥳';
  if (score >= 66) return '😄';
  if (score >= 46) return '🙂';
  if (score >= 31) return '😐';
  if (score >= 16) return '🙁';
  return '😞';
}

function softenTimelineTitle(title: string) {
  return title
    .replace(/卧室唤醒与准备/g, '起床穿好衣服下楼啦')
    .replace(/下楼与生活准备/g, '下楼把生活这摊事顺一顺')
    .replace(/工作区启动与设置/g, '收拾一下工作区准备开工啦')
    .replace(/(.+)与(.+)准备/g, '$1把$2也顺手弄好')
    .replace(/(.+)与(.+)设置/g, '$1顺手把$2调一调')
    .replace(/(.+)与(.+)处理/g, '$1顺手把$2也做掉')
    .replace(/启动/g, '开始')
    .replace(/设置/g, '弄好')
    .replace(/准备/g, '准备好')
    .trim();
}

function softenTimelineDescription(description?: string) {
  if (!description) return description;

  return description
    .replace(/完成/g, '慢慢做完')
    .replace(/处理/g, '顺手做掉')
    .replace(/并明确第一个工作目标/g, '然后轻轻开始第一件事')
    .replace(/并收集需要带下楼的物品/g, '顺手把要带下楼的东西拿好')
    .replace(/创造舒适氛围/g, '把感觉调整得舒服一点')
    .trim();
}

function difficultyLabel(value?: number) {
  return ['简单', '一般', '有点挑战', '很难'][Math.max(0, (value || 1) - 1)] || '一般';
}

function buildHandsFreeSpeech(step: NavigationExecutionStep) {
  const guidance = step.guidance?.trim();
  if (!guidance) {
    return `现在这一小步是：${step.title}。做完以后你可以直接说，继续。`;
  }

  return `现在这一小步是：${step.title}。具体提醒是：${guidance}。做完以后你可以直接说，继续，或者说，做完了。想跳过的话你也可以说，跳过。`;
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
            <input className="navigation-reference-range is-blue" type="range" min={5} max={360} step={5} value={estimatedDurationMinutes} onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))} />
            <div className="navigation-range-labels navigation-reference-range-labels"><span>5分钟</span><span>3小时</span><span>6小时以上</span></div>
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
          <input className={`navigation-reference-range ${includeAchievementSense ? 'is-blue' : 'is-gray'}`} type="range" min={0} max={100} step={1} value={brainState} onChange={(e) => setBrainState(Number(e.target.value))} />
          <div className="navigation-range-labels navigation-reference-range-labels"><span>非常昏沉</span><span>一般</span><span>非常清醒</span></div>
        </div>

        <div className="navigation-state-block navigation-state-reference-block">
          <div className="navigation-state-label-row">
            <span>此刻情绪感受如何？</span>
          </div>
          <input className={`navigation-reference-range ${includeAchievementSense ? 'is-blue' : 'is-gray'}`} type="range" min={0} max={100} step={1} value={emotionState} onChange={(e) => setEmotionState(Number(e.target.value))} />
          <div className="navigation-range-labels navigation-reference-range-labels"><span>非常不愉快</span><span>一般</span><span>非常愉快</span></div>
        </div>

        {includeAchievementSense && (
          <div className="navigation-state-block navigation-state-reference-block">
            <div className="navigation-state-label-row">
              <span>完成后成就感如何？</span>
            </div>
            <input className="navigation-reference-range is-blue" type="range" min={0} max={100} step={1} value={achievementSense} onChange={(e) => setAchievementSense(Number(e.target.value))} />
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

        <div className="navigation-state-footer-actions">
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
          开启后，我会自动读出当前步骤标题和备注。你说 <strong>继续</strong>、<strong>做完了</strong>、<strong>下一步</strong>，我就会自动进入下一项并继续播报。
        </p>
        <p className="navigation-handsfree-text secondary">也支持说：跳过、重说、暂停、恢复。</p>

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
  const setGenerating = useNavigationStore((state) => state.setGenerating);
  const applyStreamingPlan = useNavigationStore((state) => state.applyStreamingPlan);
  const setError = useNavigationStore((state) => state.setError);
  const clearSession = useNavigationStore((state) => state.clearSession);
  const [input, setInput] = useState(initialInput);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const generationRequestIdRef = useRef(0);

  const handleGenerate = async () => {
    const rawInput = input.trim();
    console.log('[导航] 点击生成导航', { rawInputLength: rawInput.length, rawInput });
    if (!rawInput) {
      setError('先输入你想让导航模式帮你整理的一串任务吧');
      return;
    }

    const requestId = Date.now();
    generationRequestIdRef.current = requestId;
    console.log('[导航] 创建草稿会话并准备请求', { requestId });
    createDraftSession(rawInput);
    setGenerating(true);
    setError(null);

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
      return;
    }

    clearSession();
    setGenerating(false);
    setError(result.error || '生成导航失败，请稍后重试');
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (session.generationStage === 'waiting_ai' || session.generationProgress?.done) return;
    const timer = window.setInterval(() => {
      revealPreviewProgress();
    }, 140);
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
              onReturnToComposer(session.rawInput);
              clearSession();
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            返回修改
          </button>
          <div>
            <h2 className="navigation-title">{isDone ? '路线已整理好' : isWaitingAI ? 'AI 正在认真整理你的路线...' : '正在把路线写出来...'}</h2>
            <p className="navigation-subtitle">
              {isDone
                ? '你可以先改一改这些步骤，确认后再开始导航。'
                : isWaitingAI
                ? '这次会优先使用你的长期提示词、动线偏好和启动规则。'
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
          <h3>这次正在调用你的导航脑子</h3>
          <div className="navigation-card-list">
            <div className="navigation-preview-placeholder">正在读取你的长期提示词、起步偏好、顺手任务规则和家里动线...</div>
            <div className="navigation-preview-placeholder">这次仍然走原来的智能拆解，不是简化快版。你可以随时取消，或者返回重写这段话。</div>
          </div>
        </div>
      ) : (
        <>
          <div className="navigation-section">
            <h3>这次完成后，时间轴会记录这些任务</h3>
            <div className="navigation-card-list">
              {visibleGroups.map((group) => (
                <div key={group.id} className="navigation-group-card">
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
                <div key={step.id} className="navigation-preview-item navigation-preview-item-editable">
                  <span>{index + 1}</span>
                  <div>
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
            onReturnToComposer(session.rawInput);
            clearSession();
          }}
        >
          {isWaitingAI ? '返回修改这段话' : '重新来一条'}
        </button>
        <button className="navigation-secondary-button" onClick={() => { cancelSession(); clearSession(); }}>
          {isWaitingAI ? '取消这次拆解' : '放弃这次预览'}
        </button>
        <button className="navigation-primary-button" onClick={() => startSession()} disabled={!isDone}>
          {isDone ? '下一步：确认并开始导航' : isWaitingAI ? 'AI 正在思考中...' : '正在整理中...'}
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPreState, setShowPreState] = useState(false);

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

  return (
    <div className="navigation-shell navigation-state-shell">
      <div className="navigation-topbar">
        <div>
          <h2 className="navigation-title">导航已生成</h2>
          <p className="navigation-subtitle">你可以先检查步骤，确认后再开始导航。</p>
        </div>
        <button className="navigation-icon-button" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="navigation-section">
        <h3>这次完成后，时间轴会记录这些任务</h3>
        <div className="navigation-card-list">
          {session.timelineGroups.map((group) => (
            <div key={group.id} className="navigation-group-card">
              <strong>{softenTimelineTitle(group.title)}</strong>
              {group.description && <p>{softenTimelineDescription(group.description)}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="navigation-section">
        <h3>执行时会拆成更容易做的小步骤</h3>
        <div className="navigation-metadata">共 {session.executionSteps.length} 步 · 第一步会尽量无痛启动</div>
        <div className="navigation-step-preview-list">
          {session.executionSteps.slice(0, 16).map((step, index) => (
            <div key={step.id} className="navigation-preview-item">
              <span>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.guidance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation-action-row">
        <button className="navigation-secondary-button" onClick={clearSession}>重新来一条</button>
        <button className="navigation-primary-button" onClick={() => setShowPreState(true)}>开始导航</button>
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
        <div className="navigation-snowbank" style={{ height: `${snowHeight}px` }} />
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
            <h3>遇到困难了也没关系</h3>
            <p>你可以说说现在卡在哪，或者你其实更想先做什么。</p>
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
          placeholder="比如：我现在只想先坐一下 / 我突然很想先喝水 / 我不知道下一步怎么开始"
        />

        <div className="navigation-difficulty-hints">
          <span>可以告诉我你现在最想做什么</span>
          <span>也可以直接说你卡住的原因</span>
          <span>我会尽量顺着你，再带你慢慢回来</span>
        </div>

        <div className="navigation-sheet-actions column-on-mobile">
          <button className="navigation-secondary-button" onClick={onClose}>先自己缓一下</button>
          <button className="navigation-primary-button" onClick={() => onSubmit(input.trim())} disabled={isLoading || !input.trim()}>
            {isLoading ? '正在陪你想办法…' : '帮我理一理'}
          </button>
        </div>
      </div>
    </div>
  );
}

function sessionMoodScore(step: NavigationExecutionStep, isDetourStep: boolean, session: NavigationSession) {
  const title = step.title || '';
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

function sessionMoodEnergy(step: NavigationExecutionStep, isDetourStep: boolean, session: NavigationSession) {
  const title = step.title || '';
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
          <span>{isListening ? '正在听你说话…' : '正在等待语音播放结束…'}</span>
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
          {isResolvingDifficulty ? '正在帮你找回状态…' : '步骤不太对'}
        </button>
        <button className="navigation-reference-side-button navigation-reference-side-button-wide" onClick={onOpenDifficulty} disabled={isResolvingDifficulty}>
          遇到困难
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
  const resolveDifficulty = useNavigationStore((state) => state.resolveDifficulty);
  const setHandsFreeEnabled = useNavigationStore((state) => state.setHandsFreeEnabled);
  const setHandsFreePreferredVoiceMode = useNavigationStore((state) => state.setHandsFreePreferredVoiceMode);
  const markHandsFreeIntroSeen = useNavigationStore((state) => state.markHandsFreeIntroSeen);
  const setHandsFreeWaiting = useNavigationStore((state) => state.setHandsFreeWaiting);
  const setLastVoiceTranscript = useNavigationStore((state) => state.setLastVoiceTranscript);
  const setError = useNavigationStore((state) => state.setError);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [showHandsFreeIntro, setShowHandsFreeIntro] = useState(false);
  const [showDifficultySheet, setShowDifficultySheet] = useState(false);
  const [difficultyInput, setDifficultyInput] = useState('');
  const [difficultyMessage, setDifficultyMessage] = useState('');
  const [isResolvingDifficulty, setIsResolvingDifficulty] = useState(false);
  const voiceCommandLockRef = useRef(false);
  const lastVoiceCommandRef = useRef('');
  const lastVoiceCommandAtRef = useRef(0);
  const currentStep = session.executionSteps[session.currentStepIndex];
  const sceneExecutionScore = sessionMoodScore(currentStep, currentStep?.source === 'difficulty_detour', session);
  const sceneEnergyLevel = sessionMoodEnergy(currentStep, currentStep?.source === 'difficulty_detour', session);
  const handsFreeEnabled = !!session.handsFree?.enabled;
  const preferredVoiceMode = session.handsFree?.preferredVoiceMode || 'system';
  const waitingForCommand = !!session.handsFree?.waitingForCommand;
  const lastTranscript = session.handsFree?.lastTranscript;
  const recentSteps = useMemo(
    () => session.executionSteps.slice(Math.max(0, session.currentStepIndex - 2), session.currentStepIndex + 1),
    [session.executionSteps, session.currentStepIndex]
  );
  const speechText = currentStep ? buildHandsFreeSpeech(currentStep) : '';
  const speechTextRef = useRef('');
  const { speak, stop, pause, resume, isSpeaking, isEdgeVoiceConfigured, playbackSource, didFallbackToSystem } = useSpeechSynthesis({ voiceMode: preferredVoiceMode });
  const unlockVoiceCommand = () => {
    window.setTimeout(() => {
      voiceCommandLockRef.current = false;
    }, 900);
  };
  const { isListening, startListening, stopListening, resetTranscript } = useVoiceRecognition({
    continuous: true,
    interimResults: false,
    restartOnEnd: handsFreeEnabled && waitingForCommand && session.status === 'active',
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
        stopListening();
        setHandsFreeWaiting(false);
        playCoinDrop();
        completeCurrentStep();
        unlockVoiceCommand();
        return;
      }

      if (matchesVoiceCommand(normalized, ['跳过', '先跳过', '下一个'])) {
        voiceCommandLockRef.current = true;
        stopListening();
        setHandsFreeWaiting(false);
        useNavigationStore.getState().skipCurrentStep();
        unlockVoiceCommand();
        return;
      }

      if (matchesVoiceCommand(normalized, ['重说', '重复', '再说一遍'])) {
        voiceCommandLockRef.current = true;
        stopListening();
        setHandsFreeWaiting(false);
        if (speechTextRef.current) {
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

    stopListening();
    setHandsFreeWaiting(false);
    setIsResolvingDifficulty(true);
    setDifficultyInput(message);
    setError(null);

    const result = await AIUnifiedService.resolveNavigationDifficulty(
      {
        rawInput: session.rawInput,
        sessionTitle: session.title,
        currentStepTitle: currentStep.title,
        currentStepGuidance: currentStep.guidance,
        recentSteps: recentSteps.map((step) => ({ title: step.title, guidance: step.guidance })),
        userDifficulty: message,
      },
      preferences
    );

    if (result.success && result.data) {
      resolveDifficulty(result.data as NavigationDifficultyDetourResult);
      setDifficultyMessage(result.data.assistantMessage);
      setShowDifficultySheet(false);
      setIsResolvingDifficulty(false);
      return;
    }

    setIsResolvingDifficulty(false);
    setError(result.error || '暂时没整理出新的绕路方式，再试一次吧');
  };

  useEffect(() => {
    if (!handsFreeEnabled || !currentStep || session.status !== 'active') return;

    const nextSpeechText = buildHandsFreeSpeech(currentStep);
    if (speechTextRef.current === nextSpeechText && (isSpeaking || waitingForCommand)) return;

    speechTextRef.current = nextSpeechText;
    voiceCommandLockRef.current = true;
    stopListening();
    setHandsFreeWaiting(false);
    speak(nextSpeechText, {
      onEnd: () => {
        window.setTimeout(() => {
          setHandsFreeWaiting(true);
          resetTranscript();
          voiceCommandLockRef.current = false;
          startListening();
        }, 450);
      },
      onError: () => {
        window.setTimeout(() => {
          setHandsFreeWaiting(true);
          voiceCommandLockRef.current = false;
          startListening();
        }, 450);
      },
    });
    return () => {
      stop();
      stopListening();
    };
  }, [currentStep?.id, currentStep?.guidance, handsFreeEnabled, session.status, waitingForCommand, isSpeaking, resetTranscript, setHandsFreeWaiting, speak, startListening, stop, stopListening]);

  useEffect(() => {
    if (session.status !== 'active') return;
    const timer = window.setInterval(() => {
      decayExecutionScore();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [session.status, decayExecutionScore]);

  useEffect(() => {
    if (!handsFreeEnabled || isSpeaking || voiceCommandLockRef.current) return;
    if (!waitingForCommand && !isListening) {
      setHandsFreeWaiting(true);
      startListening();
    }
  }, [handsFreeEnabled, isSpeaking, waitingForCommand, isListening, startListening, setHandsFreeWaiting]);

  if (!currentStep) return null;

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

function NavigationCompletionView({ session }: { session: NavigationSession }) {
  const syncSessionToTimeline = useNavigationStore((state) => state.syncSessionToTimeline);
  const savePostState = useNavigationStore((state) => state.savePostState);
  const clearSession = useNavigationStore((state) => state.clearSession);
  const isSyncingToTimeline = useNavigationStore((state) => state.isSyncingToTimeline);
  const completedCount = session.executionSteps.filter((step) => step.status === 'completed').length;
  const skippedCount = session.executionSteps.filter((step) => step.status === 'skipped').length;
  const [showPostState, setShowPostState] = useState(!session.postState);

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
            setShowPostState(false);
          }}
          onSkip={() => setShowPostState(false)}
        />
      </div>
    );
  }

  return (
    <div className="navigation-shell navigation-state-shell">
      <div className="navigation-completion-card navigation-completion-reference-card">
        <h2>记录完成后状态</h2>
        <p>{session.summary || '填写后，会看到与开始前相比的变化。'}</p>

        {session.preState && session.postState && (
          <div className="navigation-compare-grid">
            <div>
              <span>开始前情绪</span>
              <strong>{session.preState.emotionState ?? '-'} / 100</strong>
            </div>
            <div>
              <span>完成后情绪</span>
              <strong>{session.postState.emotionState ?? '-'} / 100</strong>
            </div>
            <div>
              <span>开始前脑力</span>
              <strong>{session.preState.brainState ?? '-'} / 100</strong>
            </div>
            <div>
              <span>完成后脑力</span>
              <strong>{session.postState.brainState ?? '-'} / 100</strong>
            </div>
          </div>
        )}

        <div className="navigation-summary-grid">
          <div>
            <strong>{completedCount}</strong>
            <span>完成微步骤</span>
          </div>
          <div>
            <strong>{session.timelineGroups.length}</strong>
            <span>时间轴任务块</span>
          </div>
          <div>
            <strong>{skippedCount}</strong>
            <span>跳过步骤</span>
          </div>
        </div>

        <div className="navigation-action-row column-on-mobile">
          <button className="navigation-primary-button" onClick={() => syncSessionToTimeline()} disabled={isSyncingToTimeline || !!session.finishedAndSyncedToTimeline}>
            {session.finishedAndSyncedToTimeline ? '已写入时间轴' : isSyncingToTimeline ? '正在写入...' : '写入时间轴'}
          </button>
          <button className="navigation-secondary-button" onClick={() => setShowPostState(true)}>修改完成状态</button>
          <button className="navigation-secondary-button" onClick={clearSession}>结束并返回</button>
        </div>
      </div>
    </div>
  );
}

export default function NavigationModeView() {
  const session = useNavigationStore((state) => state.currentSession);
  const error = useNavigationStore((state) => state.error);
  const [composerDraft, setComposerDraft] = useState('');

  return (
    <div className="navigation-root">
      {error && <div className="navigation-error">{error}</div>}
      {!session && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
      {session?.status === 'preview' && <NavigationPreview session={session} onReturnToComposer={setComposerDraft} />}
      {session?.status === 'active' && <NavigationSessionView session={session} />}
      {session?.status === 'paused' && <NavigationSessionView session={session} />}
      {session?.status === 'completed' && <NavigationCompletionView session={session} />}
      {session?.status === 'cancelled' && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
      {session?.status === 'draft' && <NavigationComposer key={`composer-${composerDraft}`} initialInput={composerDraft} />}
    </div>
  );
}
