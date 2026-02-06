import { useTagStore } from '@/stores/tagStore';

interface SmartTagRecommenderProps {
  taskTitle: string;
  onSelectTag: (tagName: string) => void;
  selectedTags: string[];
  isDark?: boolean;
}

export default function SmartTagRecommender({
  taskTitle,
  onSelectTag,
  selectedTags,
  isDark = false,
}: SmartTagRecommenderProps) {
  const { getRecommendedTags, getTagByName } = useTagStore();
  
  const recommendedTags = getRecommendedTags(taskTitle, 5)
    .filter(tagName => !selectedTags.includes(tagName));
  
  if (recommendedTags.length === 0) {
    return null;
  }
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  
  return (
    <div className="mt-2">
      <p className="text-xs mb-2" style={{ color: secondaryColor }}>
        💡 推荐标签：
      </p>
      <div className="flex flex-wrap gap-2">
        {recommendedTags.map(tagName => {
          const tag = getTagByName(tagName);
          if (!tag) return null;
          
          return (
            <button
              key={tagName}
              onClick={() => onSelectTag(tagName)}
              className="px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: `${tag.color}20`,
                color: textColor,
                border: `1px solid ${tag.color}`,
              }}
            >
              {tag.emoji} {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

