/**
 * 碎碎念功能 - 自动集成脚本
 * 
 * 使用方法：
 * 1. 打开 FloatingAIChat.tsx
 * 2. 按 Ctrl+F 搜索：} else if (analysis.type) {
 * 3. 找到后，在这一行的下一行（大括号后面）粘贴以下代码
 */

// ==================== 复制以下代码 ====================

      // 🎯 特殊处理碎碎念和心情记录（新增）
      if (analysis.type === 'mood' || analysis.type === 'thought') {
        try {
          addThinkingStep('💭 识别为碎碎念/心情记录...');
          
          // 使用碎碎念处理服务
          const mutterResult = await processMutter(message);
          
          addThinkingStep(`${mutterResult.moodEmoji} 心情: ${mutterResult.mood}`);
          addThinkingStep(`📂 分类: ${mutterResult.category}`);
          
          // 保存到记忆库
          addMemory({
            type: analysis.type,
            content: message,
            emotionTags: analysis.emotions,
            categoryTags: analysis.categories,
            rewards: analysis.rewards,
          });
          
          addThinkingStep('💾 已保存到记忆库');
          
          // 在时间轴创建醒目的碎碎念卡片
          const now = new Date();
          await createTask({
            title: mutterResult.cardTitle,
            description: mutterResult.cardDescription,
            taskType: 'life' as TaskType,
            priority: 2,
            durationMinutes: 1,
            scheduledStart: now,
            scheduledEnd: new Date(now.getTime() + 60000),
            tags: mutterResult.tags,
            color: mutterResult.cardColor,
            status: 'completed',
            isRecord: true,
          });
          
          addThinkingStep('📅 已在时间轴标记');
          
          // 显示AI的个性化回复
          const responseContent = `✅ **已记录你的碎碎念**\n\n${mutterResult.moodEmoji} **心情**: ${mutterResult.mood}\n📂 **分类**: ${mutterResult.category}\n🏷️ **标签**: ${mutterResult.tags.join('、')}\n\n---\n\n${mutterResult.aiReply}`;
          
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: responseContent,
            timestamp: new Date(),
            thinkingProcess: [...thinkingSteps],
            isThinkingExpanded: false,
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // 保存到聊天记录
          addChatMessage({
            role: 'assistant',
            content: responseContent,
            actions: [{
              type: 'add_memory',
              description: '记录碎碎念',
              data: { mood: mutterResult.mood, category: mutterResult.category },
            }],
          });
          
          // 清除超时定时器
          if (sendTimeoutRef.current) {
            clearTimeout(sendTimeoutRef.current);
            sendTimeoutRef.current = null;
          }
          
          setIsProcessing(false);
          clearThinkingSteps();
          return;
        } catch (error) {
          console.error('💭 [碎碎念处理] 处理失败:', error);
        }
      }

// ==================== 复制结束 ====================

/**
 * 完整示例（添加后的代码应该看起来像这样）：
 */

/*
      } else if (analysis.type) {
        
        // 🎯 特殊处理碎碎念和心情记录（新增）
        if (analysis.type === 'mood' || analysis.type === 'thought') {
          // ... 上面复制的代码 ...
        }
        
        // 保存到全景记忆（原有代码）
        addMemory({
          type: analysis.type,
          content: message,
          emotionTags: analysis.emotions,
          categoryTags: analysis.categories,
          rewards: analysis.rewards,
        });
        
        // ... 其他原有代码 ...
      }
*/

/**
 * 测试步骤：
 * 1. 保存文件
 * 2. 刷新浏览器
 * 3. 在AI助手输入："我刚才去大姨妈了糟死了都啊啊啊啊"
 * 4. 应该看到AI识别为碎碎念，并在时间轴创建彩色卡片
 * 5. AI会像真人一样回复你
 */


