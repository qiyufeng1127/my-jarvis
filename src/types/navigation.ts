export interface NavigationExecutionStep {
  id: string;
  groupId: string;
  title: string;
  guidance: string;
  focusMinutes?: number;
  estimatedMinutes?: number;
  location?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  skipped?: boolean;
  sortOrder: number;
  source?: 'planned' | 'difficulty_detour';
}

export interface NavigationTimelineGroup {
  id: string;
  title: string;
  description?: string;
  stepIds: string[];
  actualStart?: string;
  actualEnd?: string;
  source?: 'planned' | 'difficulty_detour';
}

export interface NavigationStateSnapshot {
  estimatedDurationMinutes?: number;
  perceivedDifficulty?: 1 | 2 | 3 | 4;
  brainState?: number;
  emotionState?: number;
  actualDifficulty?: 1 | 2 | 3 | 4;
  achievementSense?: number;
  reflection?: string;
  recordedAt?: string;
}

export interface NavigationHandsFreeState {
  enabled: boolean;
  introSeen: boolean;
  waitingForCommand: boolean;
  preferredVoiceMode?: 'system' | 'edge';
  lastTranscript?: string;
  lastHeardAt?: string;
}

export interface NavigationDifficultyDetourResult {
  assistantMessage: string;
  detourGroup: {
    title: string;
    description?: string;
  };
  detourSteps: Array<{
    title: string;
    guidance: string;
    focusMinutes?: number;
    estimatedMinutes?: number;
    location?: string;
  }>;
}

export interface NavigationSession {
  id: string;
  title: string;
  rawInput: string;
  status: 'draft' | 'preview' | 'active' | 'paused' | 'completed' | 'cancelled';
  executionSteps: NavigationExecutionStep[];
  timelineGroups: NavigationTimelineGroup[];
  currentStepIndex: number;
  executionScore: number;
  energyLevel: number;
  recentExecutionGain?: number;
  lastProgressAt?: string;
  summary?: string;
  generationStage?: 'idle' | 'waiting_ai' | 'building';
  generationProgress?: {
    revealedStepCount: number;
    totalStepCount: number;
    revealedGroupCount: number;
    totalGroupCount: number;
    done: boolean;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  finishedAndSyncedToTimeline?: boolean;
  preState?: NavigationStateSnapshot;
  postState?: NavigationStateSnapshot;
  handsFree?: NavigationHandsFreeState;
}

export interface NavigationParsedRules {
  easyStartRequired?: boolean;
  preferMinSteps?: number;
  addContextualSideTasks?: boolean;
  workspaceResetBeforeWork?: boolean;
  carryLaundryWhenGoingDownstairs?: boolean;
  takeTrashWhenGoingOut?: boolean;
  prepareTomorrowClothesBeforeSleep?: boolean;
  useTemptationWhenWakeupMentioned?: boolean;
  useTemptationWhenGoingOut?: boolean;
  suggestQuickNutritiousMealWhenCooking?: boolean;
}

export interface NavigationPreferences {
  customPrompt: string;
  granularity: 'ultra_fine' | 'balanced' | 'slightly_coarse';
  easyStartMode: 'gentle' | 'normal' | 'direct';
  sideTaskIntensity: 'light' | 'medium' | 'rich';
  tone: 'gentle' | 'calm' | 'encouraging';
  homeLayout: string;
  parsedRules: NavigationParsedRules;
  updatedAt: string;
}

export interface NavigationPlannerStepResult {
  id: string;
  groupId: string;
  title: string;
  guidance: string;
  focusMinutes?: number;
  estimatedMinutes?: number;
  location?: string;
}

export interface NavigationPlannerGroupResult {
  id: string;
  title: string;
  description?: string;
  stepIds: string[];
}

export interface NavigationPlannerResult {
  sessionTitle: string;
  summary: string;
  executionSteps: NavigationPlannerStepResult[];
  timelineGroups: NavigationPlannerGroupResult[];
}
