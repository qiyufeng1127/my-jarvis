# 🔍 验证数据是否保存

## 在浏览器控制台执行以下代码

```javascript
// 1. 导入 memoryStore
import { useMemoryStore } from '@/stores/memoryStore';

// 2. 获取所有记录
const memories = useMemoryStore.getState().memories;

// 3. 查看记录数量
console.log('记录总数:', memories.length);

// 4. 查看最新的记录
console.log('最新记录:', memories[0]);

// 5. 查看所有记录
console.table(memories.map(m => ({
  内容: m.content.substring(0, 20),
  类型: m.type,
  情绪标签: m.emotionTags.join(','),
  分类标签: m.categoryTags.join(','),
  时间: new Date(m.date).toLocaleString()
})));
```

## 预期结果

如果数据保存成功，你应该看到：

```
记录总数: 1 (或更多)
最新记录: {
  id: "memory-xxx",
  type: "thought",
  content: "来大姨妈了肚子疼，身体不适",
  emotionTags: ["frustrated", "tired", "anxious"],  // 情绪标签
  categoryTags: ["health", "life", "personal"],     // 分类标签
  date: "2025-03-07...",
  rewards: { gold: 5, growth: 2 }
}
```

## 如果看到了数据

说明数据已经保存成功，只是界面没有显示。

**解决方法**：刷新页面，然后打开"记忆"页面，点击"碎碎念"标签，应该能看到记录了。

## 如果没有数据

说明 `addMemory` 没有真正保存数据。

**可能原因**：
1. memoryStore 的 persist 配置有问题
2. 数据保存到了内存但没有持久化
3. 页面刷新后数据丢失

**解决方法**：检查 memoryStore 的配置。

