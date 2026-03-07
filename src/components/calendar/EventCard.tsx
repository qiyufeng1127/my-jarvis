import React from 'react';
import { Heart, Sparkles, MessageCircle, Award, Gift } from 'lucide-react';
import { EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';

interface EventCardProps {
  type: 'mood' | 'thought' | 'success' | 'gratitude';
  content: string;
  emotionTags: string[];
  categoryTags: string[];
  date: Date;
  rewards?: {
    gold: number;
    growth: number;
  };
  onDelete?: () => void;
}

/**
 * 事件卡片 - 显示在时间轴上的心情/想法/事件记录
 */
export default function EventCard({
  type,
  content,
  emotionTags,
  categoryTags,
  date,
  rewards,
  onDelete,
}: EventCardProps) {
  // 获取类型配置
  const typeConfig = {
    mood: {
      icon: Heart,
      label: '心情',
      color: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
    thought: {
      icon: MessageCircle,
      label: '碎碎念',
      color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    success: {
      icon: Award,
      label: '成功',
      color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    gratitude: {
      icon: Gift,
      label: '感恩',
      color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  }[type];

  const Icon = typeConfig.icon;

  // 获取情绪标签
  const emotions = emotionTags
    .map(id => EMOTION_TAGS.find(t => t.id === id))
    .filter(Boolean);

  // 获取分类标签
  const categories = categoryTags
    .map(id => CATEGORY_TAGS.find(t => t.id === id))
    .filter(Boolean);

  return (
    <div
      className={`relative rounded-lg border-2 p-4 ${typeConfig.color} transition-all hover:shadow-md`}
    >
      {/* 类型标签 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${typeConfig.iconColor}`} />
          <span className={`text-sm font-medium ${typeConfig.iconColor}`}>
            {typeConfig.label}
          </span>
        </div>

        {/* 时间 */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* 内容 */}
      <p className="text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">
        {content}
      </p>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* 情绪标签 */}
        {emotions.map((emotion: any) => (
          <span
            key={emotion.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: `${emotion.color}20`,
              color: emotion.color,
            }}
          >
            <span>{emotion.emoji}</span>
            <span>{emotion.label}</span>
          </span>
        ))}

        {/* 分类标签 */}
        {categories.map((category: any) => (
          <span
            key={category.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: `${category.color}20`,
              color: category.color,
            }}
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </span>
        ))}
      </div>

      {/* 奖励 */}
      {rewards && (rewards.gold > 0 || rewards.growth > 0) && (
        <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {rewards.gold > 0 && (
            <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
              <Sparkles className="w-4 h-4" />
              <span>+{rewards.gold} 金币</span>
            </div>
          )}
          {rewards.growth > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <Award className="w-4 h-4" />
              <span>+{rewards.growth} 成长值</span>
            </div>
          )}
        </div>
      )}

      {/* AI 生成标记 */}
      <div className="absolute top-2 right-2">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 rounded-full">
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span className="text-xs text-purple-600 dark:text-purple-400">AI</span>
        </div>
      </div>
    </div>
  );
}

