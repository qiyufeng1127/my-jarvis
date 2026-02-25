
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 区域定义
export interface LocationArea {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number; // 动线顺序
}

// AI 学习记录
export interface LocationLearningRecord {
  taskKeyword: string; // 任务关键词（如"吃药"、"洗漱"）
  aiSuggestedLocation: string; // AI 建议的位置
  userCorrectedLocation: string; // 用户修正的位置
  count: number; // 修正次数
  lastCorrectedAt: Date;
}

interface WorkflowState {
  // 区域列表
  locations: LocationArea[];
  
  // AI 学习记录
  learningRecords: Record<string, LocationLearningRecord>; // key: taskKeyword
  
  // 获取所有区域（按动线顺序）
  getLocations: () => LocationArea[];
  
  // 更新区域顺序
  updateLocationOrder: (locationIds: string[]) => void;
  
  // 添加自定义区域
  addLocation: (name: string, icon: string, color: string) => void;
  
  // 删除区域
  deleteLocation: (locationId: string) => void;
  
  // 记录用户修正
  recordCorrection: (taskKeyword: string, aiLocation: string, userLocation: string) => void;
  
  // 获取 AI 建议位置（基于学习记录）
  getAISuggestedLocation: (taskKeyword: string, defaultLocation: string) => string;
  
  // 根据动线顺序排序任务
  sortTasksByWorkflow: <T extends { location?: string }>(tasks: T[]) => T[];
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      // 默认区域
      locations: [
        { id: '1', name: '厨房', icon: '🍳', color: '#FF6B6B', order: 0 },
        { id: '2', name: '厕所', icon: '🚿', color: '#4ECDC4', order: 1 },
        { id: '3', name: '工作区', icon: '💼', color: '#45B7D1', order: 2 },
        { id: '4', name: '客厅', icon: '🛋️', color: '#96CEB4', order: 3 },
        { id: '5', name: '卧室', icon: '🛏️', color: '#FFEAA7', order: 4 },
      ],
      
      learningRecords: {},
      
      getLocations: () => {
        const { locations } = get();
        return [...locations].sort((a, b) => a.order - b.order);
      },
      
      updateLocationOrder: (locationIds: string[]) => {
        set((state) => {
          const newLocations = state.locations.map((loc) => {
            const newOrder = locationIds.indexOf(loc.id);
            return newOrder >= 0 ? { ...loc, order: newOrder } : loc;
          });
          return { locations: newLocations };
        });
      },
      
      addLocation: (name: string, icon: string, color: string) => {
        set((state) => {
          const maxOrder = Math.max(...state.locations.map(l => l.order), -1);
          const newLocation: LocationArea = {
            id: crypto.randomUUID(),
            name,
            icon,
            color,
            order: maxOrder + 1,
          };
          return { locations: [...state.locations, newLocation] };
        });
      },
      
      deleteLocation: (locationId: string) => {
        set((state) => ({
          locations: state.locations.filter(l => l.id !== locationId),
        }));
      },
      
      recordCorrection: (taskKeyword: string, aiLocation: string, userLocation: string) => {
        set((state) => {
          const key = taskKeyword.toLowerCase().trim();
          const existing = state.learningRecords[key];
          
          const newRecord: LocationLearningRecord = {
            taskKeyword: key,
            aiSuggestedLocation: aiLocation,
            userCorrectedLocation: userLocation,
            count: existing ? existing.count + 1 : 1,
            lastCorrectedAt: new Date(),
          };
          
          return {
            learningRecords: {
              ...state.learningRecords,
              [key]: newRecord,
            },
          };
        });
      },
      
      getAISuggestedLocation: (taskKeyword: string, defaultLocation: string) => {
        const { learningRecords } = get();
        const key = taskKeyword.toLowerCase().trim();
        
        // 检查是否有学习记录
        const record = learningRecords[key];
        if (record && record.count >= 2) {
          // 如果用户修正过2次以上，使用用户的偏好
          return record.userCorrectedLocation;
        }
        
        // 否则使用默认位置
        return defaultLocation;
      },
      
      sortTasksByWorkflow: <T extends { location?: string }>(tasks: T[]): T[] => {
        const { locations } = get();
        const locationOrderMap = new Map(
          locations.map(loc => [loc.name, loc.order])
        );
        
        return [...tasks].sort((a, b) => {
          const orderA = a.location ? (locationOrderMap.get(a.location) ?? 999) : 999;
          const orderB = b.location ? (locationOrderMap.get(b.location) ?? 999) : 999;
          return orderA - orderB;
        });
      },
    }),
    {
      name: 'workflow-storage',
    }
  )
);



