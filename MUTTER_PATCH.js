/**
 * 碎碎念功能补丁
 * 
 * 使用说明：
 * 1. 在 FloatingAIChat.tsx 的 handleSend 函数中
 * 2. 找到 "// 智能分析任务并匹配目标" 这一行
 * 3. 在这一行之后，找到处理 analysis.type 的代码块
 * 4. 在 "if (analysis.type && !isTaskCreation)" 代码块的开头添加以下代码
 */

// ==================== 添加到 handleSend 函数中 ====================

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
    return; // 重要：直接返回，不继续执行后面的逻辑
  } catch (error) {
    console.error('💭 [碎碎念处理] 处理失败:', error);
    // 如果处理失败，继续执行原有逻辑
  }
}

// ==================== 以上代码添加完毕 ====================

/**
 * 添加位置示例：
 * 
 * // 智能分析任务并匹配目标
 * const goals = useGoalStore.getState().goals;
 * 
 * // ... 其他代码 ...
 * 
 * // 如果检测到记录类型，先显示标签分析并保存到store
 * if (analysis.type && !isTaskCreation) {
 *   
 *   // 👇👇👇 在这里添加上面的代码 👇👇👇
 *   
 *   // 保存到全景记忆
 *   addMemory({
 *     type: analysis.type,
 *     content: message,
 *     emotionTags: analysis.emotions,
 *     categoryTags: analysis.categories,
 *     rewards: analysis.rewards,
 *   });
 *   
 *   // ... 原有的其他代码 ...
 * }
 */


