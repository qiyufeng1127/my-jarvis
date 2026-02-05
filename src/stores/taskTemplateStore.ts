// ============================================
// 任务模板 Store - 高频任务快捷模板
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cloudSyncService } from '@/services/cloudSyncService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface TaskTemplate {
  id: string;
  userId?: string;
  name: string; // 模板名称（如"文创设计"、"照片处理"）
  description: string; // 模板描述
  category: string; // 分类
  icon: string; // 图标
  isBuiltIn: boolean; // 是否内置模板
  tasks: TaskTemplateItem[]; // 子任务列表
  createdAt: Date;
  updatedAt?: Date;
  usageCount: number; // 使用次数
}

export interface TaskTemplateItem {
  title: string;
  description?: string;
  estimatedDuration: number;
  taskType: string;
  location: string;
  tags: string[];
  priority: number;
}

interface TaskTemplateState {
  templates: TaskTemplate[];
  
  // Actions
  addTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount' | 'userId' | 'updatedAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplateById: (id: string) => TaskTemplate | undefined;
  getTemplatesByCategory: (category: string) => TaskTemplate[];
  incrementUsage: (id: string) => Promise<void>;
  getPopularTemplates: (limit?: number) => TaskTemplate[];
  searchTemplates: (keyword: string) => TaskTemplate[];
  loadFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;
}

// 内置模板
const BUILT_IN_TEMPLATES: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: '文创设计流程',
    description: '完整的文创设计工作流程',
    category: '工作',
    icon: '🎨',
    isBuiltIn: true,
    tasks: [
      {
        title: '写需求文档',
        description: '整理客户需求，明确设计方向',
        estimatedDuration: 30,
        taskType: 'work',
        location: '工作区',
        tags: ['工作', '文档'],
        priority: 3,
      },
      {
        title: '找3张案例图',
        description: '搜集参考案例，确定设计风格',
        estimatedDuration: 20,
        taskType: 'work',
        location: '工作区',
        tags: ['工作', '设计'],
        priority: 2,
      },
      {
        title: '生成15张AI提示词',
        description: '编写AI绘图提示词',
        estimatedDuration: 20,
        taskType: 'creative',
        location: '工作区',
        tags: ['创作', 'AI'],
        priority: 2,
      },
      {
        title: '生成插画',
        description: '使用AI工具生成插画素材',
        estimatedDuration: 40,
        taskType: 'creative',
        location: '工作区',
        tags: ['创作', '设计'],
        priority: 2,
      },
    ],
  },
  {
    name: '照片处理流程',
    description: '客户照片处理完整流程',
    category: '工作',
    icon: '📸',
    isBuiltIn: true,
    tasks: [
      {
        title: '打开iPad微信，导出未处理照片',
        description: '从微信导出客户照片',
        estimatedDuration: 10,
        taskType: 'work',
        location: '工作区',
        tags: ['工作', '照片'],
        priority: 3,
      },
      {
        title: '批量处理照片（修复/调色）',
        description: '使用PS或Lightroom处理照片',
        estimatedDuration: 30,
        taskType: 'work',
        location: '工作区',
        tags: ['工作', '照片', '修图'],
        priority: 3,
      },
      {
        title: '打包照片并安排寄出',
        description: '整理照片，准备寄件',
        estimatedDuration: 15,
        taskType: 'work',
        location: '工作区',
        tags: ['工作', '寄件'],
        priority: 3,
      },
      {
        title: '向客户发送说明文案',
        description: '通知客户照片已处理完成',
        estimatedDuration: 5,
        taskType: 'work',
        location: '工作区',
        tags: ['工作', '沟通'],
        priority: 2,
      },
    ],
  },
  {
    name: '小红书运营',
    description: '小红书内容发布流程',
    category: '副业',
    icon: '📱',
    isBuiltIn: true,
    tasks: [
      {
        title: '选题策划',
        description: '确定本期内容主题',
        estimatedDuration: 15,
        taskType: 'creative',
        location: '工作区',
        tags: ['副业', '策划'],
        priority: 2,
      },
      {
        title: '拍摄素材',
        description: '拍摄照片或视频素材',
        estimatedDuration: 30,
        taskType: 'creative',
        location: '拍摄间',
        tags: ['副业', '拍摄'],
        priority: 2,
      },
      {
        title: '编辑内容',
        description: '修图、剪辑、写文案',
        estimatedDuration: 40,
        taskType: 'creative',
        location: '工作区',
        tags: ['副业', '编辑'],
        priority: 2,
      },
      {
        title: '发布并互动',
        description: '发布内容，回复评论',
        estimatedDuration: 15,
        taskType: 'creative',
        location: '全屋',
        tags: ['副业', '运营'],
        priority: 1,
      },
    ],
  },
  {
    name: '早晨例行',
    description: '每天早上的固定流程',
    category: '生活',
    icon: '🌅',
    isBuiltIn: true,
    tasks: [
      {
        title: '洗漱',
        estimatedDuration: 10,
        taskType: 'life',
        location: '厕所',
        tags: ['日常', '个人护理'],
        priority: 2,
      },
      {
        title: '吃早餐',
        estimatedDuration: 20,
        taskType: 'life',
        location: '厨房',
        tags: ['饮食', '早餐'],
        priority: 2,
      },
      {
        title: '整理工作区',
        estimatedDuration: 10,
        taskType: 'life',
        location: '工作区',
        tags: ['家务', '整理'],
        priority: 1,
      },
    ],
  },
  {
    name: '晚间例行',
    description: '每天晚上的固定流程',
    category: '生活',
    icon: '🌙',
    isBuiltIn: true,
    tasks: [
      {
        title: '收拾厨房',
        estimatedDuration: 15,
        taskType: 'life',
        location: '厨房',
        tags: ['家务', '清洁'],
        priority: 2,
      },
      {
        title: '铲猫砂',
        estimatedDuration: 5,
        taskType: 'life',
        location: '全屋',
        tags: ['家务', '猫咪'],
        priority: 2,
      },
      {
        title: '洗漱准备睡觉',
        estimatedDuration: 15,
        taskType: 'life',
        location: '厕所',
        tags: ['日常', '个人护理'],
        priority: 2,
      },
    ],
  },
];

export const useTaskTemplateStore = create<TaskTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      
      // 添加模板
      addTemplate: async (template) => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'local-user';
        
        const newTemplate: TaskTemplate = {
          ...template,
          id: crypto.randomUUID(),
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        };
        
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
        
        console.log('📋 模板已添加:', newTemplate.name);
        
        // 同步到云端
        if (isSupabaseConfigured() && session) {
          cloudSyncService.addToQueue('taskTemplateStore', 'upsert', {
            id: newTemplate.id,
            user_id: userId,
            name: newTemplate.name,
            description: newTemplate.description,
            category: newTemplate.category,
            icon: newTemplate.icon,
            is_built_in: newTemplate.isBuiltIn,
            tasks: newTemplate.tasks,
            usage_count: newTemplate.usageCount,
            created_at: newTemplate.createdAt.toISOString(),
          });
        }
      },
      
      // 更新模板
      updateTemplate: async (id, updates) => {
        set((state) => ({
          templates: state.templates.map(t => 
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        }));
        
        // 同步到云端
        const { data: { session } } = await supabase.auth.getSession();
        if (isSupabaseConfigured() && session) {
          const template = get().templates.find(t => t.id === id);
          if (template) {
            cloudSyncService.addToQueue('taskTemplateStore', 'upsert', {
              id: template.id,
              user_id: session.user.id,
              name: template.name,
              description: template.description,
              category: template.category,
              icon: template.icon,
              is_built_in: template.isBuiltIn,
              tasks: template.tasks,
              usage_count: template.usageCount,
              updated_at: new Date().toISOString(),
            });
          }
        }
      },
      
      // 删除模板
      deleteTemplate: async (id) => {
        const template = get().templates.find(t => t.id === id);
        if (template?.isBuiltIn) {
          console.warn('⚠️ 不能删除内置模板');
          return;
        }
        
        set((state) => ({
          templates: state.templates.filter(t => t.id !== id),
        }));
        
        // 同步到云端
        const { data: { session } } = await supabase.auth.getSession();
        if (isSupabaseConfigured() && session) {
          cloudSyncService.addToQueue('taskTemplateStore', 'delete', { id });
        }
      },
      
      // 根据ID获取模板
      getTemplateById: (id) => {
        return get().templates.find(t => t.id === id);
      },
      
      // 根据分类获取模板
      getTemplatesByCategory: (category) => {
        return get().templates.filter(t => t.category === category);
      },
      
      // 增加使用次数
      incrementUsage: async (id) => {
        set((state) => ({
          templates: state.templates.map(t => 
            t.id === id ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date() } : t
          ),
        }));
        
        // 同步到云端
        const { data: { session } } = await supabase.auth.getSession();
        if (isSupabaseConfigured() && session) {
          const template = get().templates.find(t => t.id === id);
          if (template) {
            cloudSyncService.addToQueue('taskTemplateStore', 'upsert', {
              id: template.id,
              user_id: session.user.id,
              usage_count: template.usageCount,
              updated_at: new Date().toISOString(),
            });
          }
        }
      },
      
      // 获取热门模板
      getPopularTemplates: (limit = 5) => {
        return [...get().templates]
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      },
      
      // 搜索模板
      searchTemplates: (keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        return get().templates.filter(t => 
          t.name.toLowerCase().includes(lowerKeyword) ||
          t.description.toLowerCase().includes(lowerKeyword) ||
          t.category.toLowerCase().includes(lowerKeyword)
        );
      },
      
      // 从云端加载
      loadFromCloud: async () => {
        if (!isSupabaseConfigured()) {
          console.log('⚠️ Supabase 未配置，使用本地数据');
          return;
        }
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log('⚠️ 未登录，使用本地数据');
            return;
          }
          
          const cloudData = await cloudSyncService.loadFromCloud<TaskTemplate>(
            'taskTemplateStore',
            (row: any) => ({
              id: row.id,
              userId: row.user_id,
              name: row.name,
              description: row.description,
              category: row.category,
              icon: row.icon,
              isBuiltIn: row.is_built_in,
              tasks: row.tasks || [],
              usageCount: row.usage_count || 0,
              createdAt: new Date(row.created_at),
              updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
            })
          );
          
          if (cloudData.length > 0) {
            const localTemplates = get().templates;
            const merged = cloudSyncService.mergeData(localTemplates, cloudData);
            set({ templates: merged });
            console.log(`✅ 任务模板已从云端加载: ${merged.length}个`);
          }
        } catch (error) {
          console.error('❌ 加载任务模板失败:', error);
        }
      },
      
      // 同步到云端
      syncToCloud: async () => {
        if (!isSupabaseConfigured()) {
          return;
        }
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            return;
          }
          
          const templates = get().templates;
          for (const template of templates) {
            cloudSyncService.addToQueue('taskTemplateStore', 'upsert', {
              id: template.id,
              user_id: session.user.id,
              name: template.name,
              description: template.description,
              category: template.category,
              icon: template.icon,
              is_built_in: template.isBuiltIn,
              tasks: template.tasks,
              usage_count: template.usageCount,
              created_at: template.createdAt.toISOString(),
              updated_at: template.updatedAt?.toISOString(),
            });
          }
        } catch (error) {
          console.error('❌ 同步任务模板失败:', error);
        }
      },
    }),
    {
      name: 'manifestos-task-templates-storage',
      version: 1,
      partialize: (state) => ({
        templates: state.templates,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) {
              // 首次加载，初始化内置模板
              const builtInTemplates = BUILT_IN_TEMPLATES.map(t => ({
                ...t,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                usageCount: 0,
              }));
              
              return {
                state: { templates: builtInTemplates },
                version: 1,
              };
            }
            
            const parsed = JSON.parse(str);
            // 恢复日期对象
            if (parsed?.state?.templates) {
              parsed.state.templates = parsed.state.templates.map((t: any) => ({
                ...t,
                createdAt: new Date(t.createdAt),
              }));
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取模板存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('💾 模板已保存，共', value?.state?.templates?.length || 0, '个模板');
          } catch (error) {
            console.error('❌ 保存模板失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除模板失败:', error);
          }
        },
      },
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并模板数据...');
        return {
          ...currentState,
          templates: persistedState?.templates || currentState.templates,
        };
      },
    }
  )
);

