import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIConfig {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface AIStore {
  config: AIConfig;
  setApiKey: (apiKey: string) => void;
  setApiEndpoint: (endpoint: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  isConfigured: () => boolean;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      config: {
        apiKey: '',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat', // DeepSeek Chat 模型（适合结构化输出）
        temperature: 0.7,
        maxTokens: 2000,
      },

      setApiKey: (apiKey) => {
        set((state) => ({
          config: { ...state.config, apiKey },
        }));
      },

      setApiEndpoint: (apiEndpoint) => {
        set((state) => ({
          config: { ...state.config, apiEndpoint },
        }));
      },

      setModel: (model) => {
        set((state) => ({
          config: { ...state.config, model },
        }));
      },

      setTemperature: (temperature) => {
        set((state) => ({
          config: { ...state.config, temperature },
        }));
      },

      setMaxTokens: (maxTokens) => {
        set((state) => ({
          config: { ...state.config, maxTokens },
        }));
      },

      isConfigured: () => {
        const { config } = get();
        return !!config.apiKey && !!config.apiEndpoint;
      },
    }),
    {
      name: 'ai-config-storage',
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (error) {
            console.warn('读取存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('保存存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('删除存储失败:', error);
          }
        },
      },
    }
  )
);

