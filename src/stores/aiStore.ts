import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIConfig {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

interface AIStore {
  config: AIConfig;
  setApiKey: (apiKey: string) => void;
  setApiEndpoint: (endpoint: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  isConfigured: () => boolean;
  chat: (messages: AIMessage[]) => Promise<AIResponse>;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      config: {
        apiKey: 'sk-feff761a4a744e789711f2d88801d80b',
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

      chat: async (messages) => {
        const { config, isConfigured } = get();

        if (!isConfigured()) {
          return {
            success: false,
            error: '请先在设置中配置 API Key',
          };
        }

        try {
          const response = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              messages: messages,
              temperature: config.temperature,
              max_tokens: config.maxTokens,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = '调用AI服务失败';
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
            } catch (e) {
              errorMessage = errorText || errorMessage;
            }
            
            return {
              success: false,
              error: `API错误 (${response.status}): ${errorMessage}`,
            };
          }

          const data = await response.json();
          const content = data.choices[0]?.message?.content || '';
          
          return {
            success: true,
            content: content,
          };
        } catch (error) {
          console.error('AI调用失败:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : '网络请求失败',
          };
        }
      },
    }),
    {
      name: 'manifestos-ai-config-storage', // 使用唯一的存储 key
      version: 1, // 添加版本号
      partialize: (state) => ({ 
        config: state.config, // 只持久化 config
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          } catch (error) {
            console.warn('⚠️ 读取 AI 配置存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('💾 AI 配置已保存到本地存储');
          } catch (error) {
            console.error('❌ 保存 AI 配置存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除 AI 配置存储失败:', error);
          }
        },
      },
      // 合并策略：保留本地配置
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并 AI 配置数据...');
        return {
          ...currentState,
          config: {
            ...currentState.config,
            ...persistedState?.config,
          },
        };
      },
    }
  )
);

