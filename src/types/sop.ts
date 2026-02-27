// SOP 任务库类型定义

export interface SOPFolder {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SOPTask {
  id: string;
  folderId: string;
  title: string;
  description?: string;
  
  // 复用现有任务字段
  durationMinutes: number;
  tags?: string[];
  location?: string;
  goldReward?: number;
  
  // 关联目标
  longTermGoals?: Record<string, number>; // goalId -> contribution percentage
  
  // 子任务
  subtasks?: Array<{
    id: string;
    title: string;
    order: number;
  }>;
  
  // 验证配置
  verificationStart?: {
    type: 'photo' | 'upload';
    requirement: string;
  };
  verificationComplete?: {
    type: 'photo' | 'upload';
    requirement: string;
  };
  
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SOPState {
  folders: SOPFolder[];
  tasks: SOPTask[];
  
  // 文件夹操作
  createFolder: (name: string, emoji?: string, color?: string) => string;
  updateFolder: (id: string, updates: Partial<SOPFolder>) => void;
  deleteFolder: (id: string) => void;
  reorderFolders: (folderIds: string[]) => void;
  
  // 任务操作
  createTask: (folderId: string, task: Omit<SOPTask, 'id' | 'folderId' | 'order' | 'createdAt' | 'updatedAt'>) => string;
  updateTask: (id: string, updates: Partial<SOPTask>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (folderId: string, taskIds: string[]) => void;
  
  // 查询
  getFolderById: (id: string) => SOPFolder | undefined;
  getTaskById: (id: string) => SOPTask | undefined;
  getTasksByFolder: (folderId: string) => SOPTask[];
  
  // 推送到时间轴
  pushToTimeline: (taskId: string) => void;
}

