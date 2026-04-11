import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const resolveApiEndpoint = (endpoint: string) => {
  if (import.meta.env.DEV && endpoint.includes('api.deepseek.com')) {
    return '/ai-api';
  }

  return endpoint;
};

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
  chatStream: (messages: AIMessage[], onChunk: (chunk: string) => void, options?: { maxTokens?: number; temperature?: number }) => Promise<AIResponse>;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      config: {
        apiKey: 'sk-feff761a4a744e789711f2d88801d80b',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat', // DeepSeek Chat 模型（适合结构化输出）
        temperature: 0.7,
        maxTokens: 8000, // 增加到 8000 以支持长文本生成（日记等）
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
          console.log('🌐 [AI请求] 开始请求:', {
            endpoint: resolveApiEndpoint(config.apiEndpoint),
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            messagesCount: messages.length,
          });

          // 添加超时控制（60秒）
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.error('⏱️ [AI请求] 请求超时（60秒）');
          }, 60000);

          const requestEndpoint = resolveApiEndpoint(config.apiEndpoint);
          console.log('[AIStore.chatStream] 即将发起 fetch', { requestEndpoint });

          const response = await fetch(requestEndpoint, {
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
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log('🌐 [AI请求] 收到响应:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: {
              contentType: response.headers.get('content-type'),
              contentLength: response.headers.get('content-length'),
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [AI请求] 错误响应:', errorText);
            
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

          console.log('📥 [AI请求] 开始解析响应体...');
          const data = await response.json();
          console.log('✅ [AI请求] 解析成功:', {
            hasChoices: !!data.choices,
            choicesLength: data.choices?.length,
            hasContent: !!data.choices?.[0]?.message?.content,
            contentLength: data.choices?.[0]?.message?.content?.length || 0,
          });
          
          const content = data.choices[0]?.message?.content || '';
          
          return {
            success: true,
            content: content,
          };
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.error('⏱️ [AI请求] 请求超时');
            return {
              success: false,
              error: '请求超时（60秒），请稍后重试或缩短提示词长度',
            };
          }
          
          console.error('❌ [AI请求] 异常:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : '网络请求失败',
          };
        }
      },

      chatStream: async (messages, onChunk, options) => {
        const { config, isConfigured } = get();
        console.log('[AIStore.chatStream] 被调用', {
          configured: isConfigured(),
          endpoint: config.apiEndpoint,
          model: config.model,
          messageCount: messages.length,
          options,
        });

        if (!isConfigured()) {
          return {
            success: false,
            error: '请先在设置中配置 API Key',
          };
        }

        try {
          console.log('🌊 [AI流式请求] 开始请求:', {
            endpoint: resolveApiEndpoint(config.apiEndpoint),
            model: config.model,
            stream: true,
            maxTokens: options?.maxTokens ?? config.maxTokens,
            temperature: options?.temperature ?? config.temperature,
          });

          // 添加超时控制（120秒，流式响应可能更慢）
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.error('⏱️ [AI流式请求] 请求超时（120秒）');
          }, 120000);

          const requestEndpoint = resolveApiEndpoint(config.apiEndpoint);

          const response = await fetch(requestEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              messages: messages,
              temperature: options?.temperature ?? config.temperature,
              max_tokens: options?.maxTokens ?? config.maxTokens,
              stream: true, // 启用流式响应
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log('🌊 [AI流式请求] 收到响应:', {
            status: response.status,
            ok: response.ok,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [AI流式请求] 错误响应:', errorText);
            
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

          // 处理流式响应
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';

          if (!reader) {
            return {
              success: false,
              error: '无法读取响应流',
            };
          }

          console.log('📖 [AI流式请求] 开始读取流...');
          let chunkCount = 0;

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ [AI流式请求] 流读取完成，总长度:', fullContent.length);
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            chunkCount += 1;
            console.log('[AIStore.chatStream] 原始 chunk', { chunkCount, chunk });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    fullContent += content;
                    onChunk(content); // 实时回调
                  }
                } catch (e) {
                  console.warn('⚠️ [AI流式请求] 解析chunk失败:', data);
                }
              }
            }
          }

          return {
            success: true,
            content: fullContent,
          };
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.error('⏱️ [AI流式请求] 请求超时');
            return {
              success: false,
              error: '请求超时（120秒），请稍后重试',
            };
          }
          
          console.error('❌ [AI流式请求] 异常:', error);
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
      // 合并策略：保留本地配置，但强制更新 maxTokens
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并 AI 配置数据...');
        const merged = {
          ...currentState,
          config: {
            ...currentState.config,
            ...persistedState?.config,
            // 强制更新 maxTokens 到 8000（支持长文本生成）
            maxTokens: Math.max(persistedState?.config?.maxTokens || 0, 8000),
          },
        };
        console.log('✅ 合并后的配置:', merged.config);
        return merged;
      },
    }
  )
);

