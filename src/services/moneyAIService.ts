// ============================================
// 副业追踪器 AI 智能服务
// ============================================

import { useSideHustleStore } from '@/stores/sideHustleStore';

export interface MoneyAIRequest {
  user_input: string;
  context: {
    user_id: string;
    current_time: string;
    current_date: string;
    existing_side_hustles?: any[];
  };
}

export interface MoneyAIResponse {
  message: string;
  data?: any;
  actions?: MoneyAIAction[];
  autoExecute?: boolean;
  needsConfirmation?: boolean;
}

export interface MoneyAIAction {
  type: 'add_income' | 'add_expense' | 'create_side_hustle' | 'add_debt' | 'analyze_idea';
  data: any;
  label: string;
}

export class MoneyAIProcessor {
  // 分析输入类型
  static analyzeMoneyInputType(input: string): string {
    const lowerInput = input.toLowerCase();

    // 收入记录
    if (
      lowerInput.includes('赚了') ||
      lowerInput.includes('收入') ||
      lowerInput.includes('进账') ||
      lowerInput.includes('到账') ||
      lowerInput.includes('收到')
    ) {
      return 'income';
    }

    // 支出记录
    if (
      lowerInput.includes('花了') ||
      lowerInput.includes('支出') ||
      lowerInput.includes('买了') ||
      lowerInput.includes('花费') ||
      lowerInput.includes('付了') ||
      lowerInput.includes('支付')
    ) {
      return 'expense';
    }

    // 新建副业
    if (
      lowerInput.includes('新建副业') ||
      lowerInput.includes('创建副业') ||
      lowerInput.includes('开始做') ||
      lowerInput.includes('启动')
    ) {
      return 'create_side_hustle';
    }

    // 副业想法
    if (
      lowerInput.includes('想法') ||
      lowerInput.includes('打算') ||
      lowerInput.includes('考虑做')
    ) {
      return 'idea';
    }

    // 欠债记录
    if (
      lowerInput.includes('欠') ||
      lowerInput.includes('借') ||
      lowerInput.includes('负债')
    ) {
      return 'debt';
    }

    return 'unknown';
  }

  // 使用 AI 解析副业相关指令
  static async parseMoneyCommandWithAI(
    input: string,
    apiKey: string,
    apiEndpoint: string,
    existingSideHustles: any[]
  ): Promise<{
    type: 'income' | 'expense' | 'create_side_hustle' | 'debt' | 'idea';
    sideHustleName?: string;
    sideHustleId?: string;
    amount?: number;
    description?: string;
    confidence: number;
  }> {
    const hustlesInfo = existingSideHustles.map(h => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
    }));

    const prompt = `你是一个副业追踪助手。请分析用户的输入并返回JSON格式的结果。

用户输入：${input}

现有副业列表：
${hustlesInfo.map((h, i) => `${i + 1}. ${h.icon} ${h.name}`).join('\n')}

请返回以下格式的JSON（必须是有效的JSON）：
{
  "type": "income",  // 类型：income(收入) | expense(支出) | create_side_hustle(新建副业) | debt(欠债) | idea(想法)
  "sideHustleName": "ins穿搭账号",  // 副业名称（从现有列表中匹配，或提取新名称）
  "sideHustleId": "xxx-xxx",  // 副业ID（如果匹配到现有副业）
  "amount": 1000,  // 金额（数字）
  "description": "接了一个广告",  // 描述/备注
  "confidence": 0.95  // 置信度 0-1
}

识别规则：
1. 优先从现有副业列表中匹配（模糊匹配，如"ins"可以匹配"ins穿搭账号"）
2. 提取金额数字（支持：1000、1000元、1k、1千等）
3. 提取描述信息
4. 判断是收入还是支出（赚了/收入=income，花了/买了=expense）

示例：
1. "今天ins赚了1000块" → {"type": "income", "sideHustleName": "ins穿搭账号", "amount": 1000, "description": "今天ins赚了1000块"}
2. "照相馆买设备花了5000" → {"type": "expense", "sideHustleName": "照相馆小红书", "amount": 5000, "description": "买设备"}
3. "新建副业：抖音美妆账号" → {"type": "create_side_hustle", "sideHustleName": "抖音美妆账号"}
4. "欠了供应商3000块" → {"type": "debt", "amount": 3000, "description": "欠供应商"}

只返回JSON，不要其他文字。`;

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个副业追踪助手，专门解析用户的收入支出记录。只返回JSON格式，不要其他内容。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('AI解析失败');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // 提取JSON
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      const result = JSON.parse(jsonStr);

      console.log('🤖 AI解析副业指令:', result);

      return result;
    } catch (error) {
      console.error('AI解析失败:', error);
      throw new Error('无法理解你的指令，请重新描述');
    }
  }

  // 处理收入记录
  static async handleIncome(
    input: string,
    apiKey: string,
    apiEndpoint: string,
    existingSideHustles: any[]
  ): Promise<MoneyAIResponse> {
    try {
      const parsed = await this.parseMoneyCommandWithAI(input, apiKey, apiEndpoint, existingSideHustles);

      if (!parsed.sideHustleId && !parsed.sideHustleName) {
        return {
          message: '❌ 无法识别副业名称，请明确指出是哪个副业的收入',
          autoExecute: false,
        };
      }

      if (!parsed.amount || parsed.amount <= 0) {
        return {
          message: '❌ 无法识别金额，请明确说明收入金额',
          autoExecute: false,
        };
      }

      // 查找或创建副业
      let sideHustleId = parsed.sideHustleId;
      let sideHustleName = parsed.sideHustleName;

      if (!sideHustleId) {
        // 模糊匹配现有副业
        const matched = existingSideHustles.find(h =>
          h.name.toLowerCase().includes(parsed.sideHustleName?.toLowerCase() || '') ||
          (parsed.sideHustleName?.toLowerCase() || '').includes(h.name.toLowerCase())
        );

        if (matched) {
          sideHustleId = matched.id;
          sideHustleName = matched.name;
        } else {
          // 需要创建新副业
          return {
            message: `⚠️ 未找到副业"${parsed.sideHustleName}"，是否要创建新副业？`,
            actions: [
              {
                type: 'create_side_hustle',
                data: {
                  name: parsed.sideHustleName,
                  thenAddIncome: {
                    amount: parsed.amount,
                    description: parsed.description,
                  },
                },
                label: '创建副业并记录收入',
              },
            ],
            needsConfirmation: true,
            autoExecute: false,
          };
        }
      }

      return {
        message: `✅ 已记录收入：\n\n💰 副业：${sideHustleName}\n💵 金额：¥${parsed.amount.toLocaleString()}\n📝 备注：${parsed.description || '无'}`,
        actions: [
          {
            type: 'add_income',
            data: {
              sideHustleId,
              amount: parsed.amount,
              description: parsed.description || input,
              date: new Date(),
            },
            label: '确认记录',
          },
        ],
        autoExecute: true,
      };
    } catch (error: any) {
      return {
        message: `❌ ${error.message || '解析失败，请重新描述'}`,
        autoExecute: false,
      };
    }
  }

  // 处理支出记录
  static async handleExpense(
    input: string,
    apiKey: string,
    apiEndpoint: string,
    existingSideHustles: any[]
  ): Promise<MoneyAIResponse> {
    try {
      const parsed = await this.parseMoneyCommandWithAI(input, apiKey, apiEndpoint, existingSideHustles);

      if (!parsed.sideHustleId && !parsed.sideHustleName) {
        return {
          message: '❌ 无法识别副业名称，请明确指出是哪个副业的支出',
          autoExecute: false,
        };
      }

      if (!parsed.amount || parsed.amount <= 0) {
        return {
          message: '❌ 无法识别金额，请明确说明支出金额',
          autoExecute: false,
        };
      }

      // 查找或创建副业
      let sideHustleId = parsed.sideHustleId;
      let sideHustleName = parsed.sideHustleName;

      if (!sideHustleId) {
        // 模糊匹配现有副业
        const matched = existingSideHustles.find(h =>
          h.name.toLowerCase().includes(parsed.sideHustleName?.toLowerCase() || '') ||
          (parsed.sideHustleName?.toLowerCase() || '').includes(h.name.toLowerCase())
        );

        if (matched) {
          sideHustleId = matched.id;
          sideHustleName = matched.name;
        } else {
          // 需要创建新副业
          return {
            message: `⚠️ 未找到副业"${parsed.sideHustleName}"，是否要创建新副业？`,
            actions: [
              {
                type: 'create_side_hustle',
                data: {
                  name: parsed.sideHustleName,
                  thenAddExpense: {
                    amount: parsed.amount,
                    description: parsed.description,
                  },
                },
                label: '创建副业并记录支出',
              },
            ],
            needsConfirmation: true,
            autoExecute: false,
          };
        }
      }

      return {
        message: `✅ 已记录支出：\n\n💰 副业：${sideHustleName}\n💸 金额：¥${parsed.amount.toLocaleString()}\n📝 备注：${parsed.description || '无'}`,
        actions: [
          {
            type: 'add_expense',
            data: {
              sideHustleId,
              amount: parsed.amount,
              description: parsed.description || input,
              date: new Date(),
            },
            label: '确认记录',
          },
        ],
        autoExecute: true,
      };
    } catch (error: any) {
      return {
        message: `❌ ${error.message || '解析失败，请重新描述'}`,
        autoExecute: false,
      };
    }
  }

  // 处理创建副业
  static async handleCreateSideHustle(
    input: string,
    apiKey: string,
    apiEndpoint: string
  ): Promise<MoneyAIResponse> {
    try {
      const parsed = await this.parseMoneyCommandWithAI(input, apiKey, apiEndpoint, []);

      if (!parsed.sideHustleName) {
        return {
          message: '❌ 无法识别副业名称，请明确说明要创建的副业名称',
          autoExecute: false,
        };
      }

      return {
        message: `✅ 准备创建新副业：\n\n💼 名称：${parsed.sideHustleName}\n🎨 图标：💰\n🎨 颜色：#10b981`,
        actions: [
          {
            type: 'create_side_hustle',
            data: {
              name: parsed.sideHustleName,
              icon: '💰',
              color: '#10b981',
              status: 'active',
            },
            label: '确认创建',
          },
        ],
        autoExecute: true,
      };
    } catch (error: any) {
      return {
        message: `❌ ${error.message || '解析失败，请重新描述'}`,
        autoExecute: false,
      };
    }
  }

  // 处理欠债记录
  static async handleDebt(
    input: string,
    apiKey: string,
    apiEndpoint: string
  ): Promise<MoneyAIResponse> {
    try {
      const parsed = await this.parseMoneyCommandWithAI(input, apiKey, apiEndpoint, []);

      if (!parsed.amount || parsed.amount <= 0) {
        return {
          message: '❌ 无法识别金额，请明确说明欠债金额',
          autoExecute: false,
        };
      }

      return {
        message: `✅ 已记录欠债：\n\n💸 金额：¥${parsed.amount.toLocaleString()}\n📝 描述：${parsed.description || '无'}`,
        actions: [
          {
            type: 'add_debt',
            data: {
              amount: parsed.amount,
              description: parsed.description || input,
              isPaid: false,
            },
            label: '确认记录',
          },
        ],
        autoExecute: true,
      };
    } catch (error: any) {
      return {
        message: `❌ ${error.message || '解析失败，请重新描述'}`,
        autoExecute: false,
      };
    }
  }

  // 处理副业想法
  static async handleIdea(
    input: string,
    apiKey: string,
    apiEndpoint: string
  ): Promise<MoneyAIResponse> {
    try {
      const parsed = await this.parseMoneyCommandWithAI(input, apiKey, apiEndpoint, []);

      if (!parsed.sideHustleName) {
        return {
          message: '❌ 无法识别副业想法，请明确说明想法内容',
          autoExecute: false,
        };
      }

      return {
        message: `💡 已记录副业想法：\n\n📝 名称：${parsed.sideHustleName}\n\n点击"AI 分析"可以获取可行性评估和收益预测`,
        actions: [
          {
            type: 'create_side_hustle',
            data: {
              name: parsed.sideHustleName,
              icon: '💡',
              color: '#f59e0b',
              status: 'idea',
            },
            label: '添加到想法池',
          },
        ],
        autoExecute: true,
      };
    } catch (error: any) {
      return {
        message: `❌ ${error.message || '解析失败，请重新描述'}`,
        autoExecute: false,
      };
    }
  }

  // 主处理函数
  static async process(request: MoneyAIRequest): Promise<MoneyAIResponse> {
    const apiKey = localStorage.getItem('ai_api_key') || '';
    const apiEndpoint = localStorage.getItem('ai_api_endpoint') || 'https://api.deepseek.com/v1/chat/completions';

    if (!apiKey) {
      return {
        message: '⚠️ 请先配置 API Key 才能使用 AI 智能功能',
        autoExecute: false,
      };
    }

    const inputType = this.analyzeMoneyInputType(request.user_input);
    const existingSideHustles = request.context.existing_side_hustles || [];

    switch (inputType) {
      case 'income':
        return await this.handleIncome(request.user_input, apiKey, apiEndpoint, existingSideHustles);
      case 'expense':
        return await this.handleExpense(request.user_input, apiKey, apiEndpoint, existingSideHustles);
      case 'create_side_hustle':
        return await this.handleCreateSideHustle(request.user_input, apiKey, apiEndpoint);
      case 'debt':
        return await this.handleDebt(request.user_input, apiKey, apiEndpoint);
      case 'idea':
        return await this.handleIdea(request.user_input, apiKey, apiEndpoint);
      default:
        return {
          message: '💡 我可以帮你记录副业相关的信息：\n\n• 💰 收入记录（如"今天ins赚了1000块"）\n• 💸 支出记录（如"照相馆买设备花了5000"）\n• 💼 新建副业（如"新建副业：抖音美妆账号"）\n• 💡 副业想法（如"我想做一个小红书美食账号"）\n• 💳 欠债记录（如"欠了供应商3000块"）',
          autoExecute: false,
        };
    }
  }
}

