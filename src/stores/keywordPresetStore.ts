import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeywordPreset {
  id: string;
  title: string; // 预设组标题，如"起床验证"
  keywords: string[]; // 关键词列表
  createdAt: Date;
  updatedAt: Date;
}

interface KeywordPresetStore {
  presets: KeywordPreset[];
  
  // 创建预设组
  createPreset: (title: string, keywords: string[]) => KeywordPreset;
  
  // 更新预设组
  updatePreset: (id: string, updates: Partial<Omit<KeywordPreset, 'id' | 'createdAt'>>) => void;
  
  // 删除预设组
  deletePreset: (id: string) => void;
  
  // 获取所有预设组
  getAllPresets: () => KeywordPreset[];
  
  // 搜索预设组（按标题或关键词）
  searchPresets: (query: string) => KeywordPreset[];
}

export const useKeywordPresetStore = create<KeywordPresetStore>()(
  persist(
    (set, get) => ({
      presets: [],
      
      createPreset: (title: string, keywords: string[]) => {
        const newPreset: KeywordPreset = {
          id: `preset_${Date.now()}`,
          title,
          keywords,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          presets: [...state.presets, newPreset],
        }));
        
        console.log('✅ 创建关键词预设组:', newPreset);
        return newPreset;
      },
      
      updatePreset: (id: string, updates: Partial<Omit<KeywordPreset, 'id' | 'createdAt'>>) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? { ...preset, ...updates, updatedAt: new Date() }
              : preset
          ),
        }));
        
        console.log('✅ 更新关键词预设组:', id, updates);
      },
      
      deletePreset: (id: string) => {
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== id),
        }));
        
        console.log('✅ 删除关键词预设组:', id);
      },
      
      getAllPresets: () => {
        return get().presets;
      },
      
      searchPresets: (query: string) => {
        const lowerQuery = query.toLowerCase().trim();
        
        if (!lowerQuery) {
          return get().presets;
        }
        
        return get().presets.filter((preset) => {
          // 搜索标题
          if (preset.title.toLowerCase().includes(lowerQuery)) {
            return true;
          }
          
          // 搜索关键词
          return preset.keywords.some((keyword) =>
            keyword.toLowerCase().includes(lowerQuery)
          );
        });
      },
    }),
    {
      name: 'keyword-preset-storage',
    }
  )
);

