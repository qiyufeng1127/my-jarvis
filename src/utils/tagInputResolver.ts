import { aiService } from '@/services/aiService';

interface ResolveTagInputResult {
  tagName: string | null;
  shouldCreate: boolean;
}

const findExactTagMatch = (inputTag: string, existingTagNames: string[]) => {
  const exactMatch = existingTagNames.find(tag => tag === inputTag);
  if (exactMatch) return exactMatch;

  return existingTagNames.find(tag => tag.toLowerCase() === inputTag.toLowerCase()) || null;
};

const findLocalSimilarTag = (inputTag: string, existingTagNames: string[]) => {
  const normalizedInput = inputTag.toLowerCase();

  return existingTagNames.find(tag => {
    const normalizedTag = tag.toLowerCase();
    return normalizedTag.includes(normalizedInput) || normalizedInput.includes(normalizedTag);
  }) || null;
};

const findAISimilarTag = async (inputTag: string, existingTagNames: string[]) => {
  if (existingTagNames.length === 0) return null;

  try {
    const prompt = `你是一个标签相似度分析助手。请判断新标签"${inputTag}"是否与现有标签相似。

现有标签：
${existingTagNames.join('、')}

如果新标签与某个现有标签意思相近、可以合并，请返回JSON格式：
{
  "isSimilar": true,
  "similarTag": "最相似的现有标签名称",
  "reason": "相似原因"
}

如果新标签是独特的、不需要合并，请返回：
{
  "isSimilar": false
}

只返回JSON，不要有其他说明文字。`;

    const response = await aiService.chat([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    if (!response.success || !response.content) {
      return null;
    }

    let jsonStr = response.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr) as { isSimilar?: boolean; similarTag?: string };
    if (result.isSimilar && result.similarTag && existingTagNames.includes(result.similarTag)) {
      return result.similarTag;
    }
  } catch (error) {
    console.warn('标签相似度分析失败，降级到本地匹配:', error);
  }

  return null;
};

export async function resolveTagInput(
  rawInputTag: string,
  existingTagNames: string[],
): Promise<ResolveTagInputResult> {
  const inputTag = rawInputTag.trim();
  if (!inputTag) {
    return { tagName: null, shouldCreate: false };
  }

  const exactMatch = findExactTagMatch(inputTag, existingTagNames);
  if (exactMatch) {
    return { tagName: exactMatch, shouldCreate: false };
  }

  const aiSimilarTag = await findAISimilarTag(inputTag, existingTagNames);
  const localSimilarTag = findLocalSimilarTag(inputTag, existingTagNames);
  const similarTag = aiSimilarTag || localSimilarTag;

  if (similarTag) {
    const useExistingTag = window.confirm(
      `发现相似标签“${similarTag}”。\n\n点击“确定”：使用已有标签“${similarTag}”\n点击“取消”：保留你输入的新标签“${inputTag}”`,
    );

    if (useExistingTag) {
      return { tagName: similarTag, shouldCreate: false };
    }
  }

  return { tagName: inputTag, shouldCreate: true };
}


