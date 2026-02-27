# 实时物品识别验证系统

## 📋 功能概述

本系统提供两种任务验证方式：

### 1. 百度AI图像识别（原有方式）
- 拍照后上传到百度AI进行识别
- 支持智能语义匹配
- 需要配置百度API密钥
- 需要网络连接

### 2. 实时物品识别（新增）⭐
- 使用TensorFlow.js + COCO-SSD模型
- 浏览器端实时识别，无需上传
- 支持80+种常见物品
- 首次使用需下载模型（约10MB）
- 之后可离线使用

## 🎯 支持识别的物品类别

### 房间类
椅子、沙发、床、餐桌、马桶、水槽、盆栽

### 日常物品类
背包、雨伞、手提包、领带、行李箱、书、时钟、花瓶、剪刀

### 厨房用品类
瓶子、酒杯、杯子、叉子、刀、勺子、碗、冰箱、烤箱、微波炉

### 电子设备类
电视、笔记本电脑、鼠标、遥控器、键盘、手机

### 交通工具类
自行车、汽车、摩托车、公共汽车、火车、卡车

### 洗漱用品类
牙刷、吹风机、水槽、马桶

## 🚀 使用方法

### 1. 在设置中选择验证模式

```tsx
import VerificationModeSettings from '@/components/settings/VerificationModeSettings';

// 在设置页面中使用
<VerificationModeSettings />
```

### 2. 在任务验证中使用

```tsx
import { getVerificationModeSettings } from '@/components/settings/VerificationModeSettings';
import RealtimeVerificationFlow from '@/components/verification/RealtimeVerificationFlow';
import TaskVerification from '@/components/calendar/TaskVerification'; // 原有的百度AI验证

// 获取当前设置
const settings = getVerificationModeSettings();

// 根据设置选择验证方式
if (settings.mode === 'realtime') {
  // 使用实时识别
  return (
    <RealtimeVerificationFlow
      onSuccess={() => console.log('验证成功')}
      onFail={() => console.log('验证失败')}
      onClose={() => console.log('关闭')}
      requireAll={settings.realtimeConfig.requireAll}
      minConfidence={settings.realtimeConfig.minConfidence}
      maxSelection={settings.realtimeConfig.maxSelection}
    />
  );
} else {
  // 使用百度AI识别
  return (
    <TaskVerification
      task={task}
      verificationType="start"
      keywords={keywords}
      onSuccess={() => console.log('验证成功')}
      onFail={() => console.log('验证失败')}
      onSkip={() => console.log('跳过')}
    />
  );
}
```

### 3. 直接使用物品选择器

```tsx
import ObjectSelector from '@/components/verification/ObjectSelector';

<ObjectSelector
  onConfirm={(selectedObjects) => {
    console.log('选择的物品:', selectedObjects);
  }}
  onCancel={() => console.log('取消')}
  maxSelection={10}
  preSelected={['cup', 'book']}
/>
```

### 4. 直接使用实时识别

```tsx
import RealtimeObjectVerification from '@/components/verification/RealtimeObjectVerification';

<RealtimeObjectVerification
  targetObjects={['cup', 'book', 'laptop']}
  onSuccess={() => console.log('识别成功')}
  onFail={() => console.log('识别失败')}
  onClose={() => console.log('关闭')}
  minConfidence={0.5}
  requireAll={false}
/>
```

## 📦 文件结构

```
src/
├── services/
│   ├── realtimeObjectDetection.ts          # 实时物品识别服务
│   └── baiduImageRecognition.ts            # 百度AI识别服务（保留）
├── components/
│   ├── verification/
│   │   ├── ObjectSelector.tsx              # 物品选择器
│   │   ├── RealtimeObjectVerification.tsx  # 实时识别组件
│   │   └── RealtimeVerificationFlow.tsx    # 完整流程组件
│   ├── settings/
│   │   └── VerificationModeSettings.tsx    # 验证模式设置
│   └── calendar/
│       └── TaskVerification.tsx            # 原有的百度AI验证（保留）
```

## ⚙️ 配置选项

### 实时识别配置

```typescript
interface RealtimeConfig {
  requireAll: boolean;      // 是否需要识别到所有物品
  minConfidence: number;    // 最小置信度（0.3-0.9）
  maxSelection: number;     // 最大选择物品数量（1-20）
}
```

### 验证规则

- **识别到任意一个物品即可通过**（推荐）：更容易通过验证
- **必须识别到所有物品才能通过**：更严格的验证方式

### 识别置信度

- **30%**：非常宽松，可能会有误识别
- **50%**：推荐设置，平衡准确性和宽松度
- **70%**：较严格，识别更准确
- **90%**：非常严格，只有非常确定的识别才会通过

## 🎨 UI特性

### 物品选择器
- 分类浏览（房间类、日常物品类、厨房用品类等）
- 支持单选/多选
- 显示已选物品数量
- 全选/清空功能
- Emoji图标展示

### 实时识别界面
- 实时相机画面
- 自动绘制识别框
- 绿色对勾标识识别成功
- 实时显示识别进度
- 支持重新选择物品

## 🔧 技术栈

- **TensorFlow.js**：浏览器端机器学习框架
- **COCO-SSD**：预训练的物体检测模型
- **React**：UI框架
- **TypeScript**：类型安全

## 📝 注意事项

1. **首次使用**：需要下载模型文件（约10MB），请确保网络连接良好
2. **浏览器兼容性**：需要支持WebGL的现代浏览器
3. **相机权限**：需要授予相机访问权限
4. **性能**：实时识别会占用一定的CPU/GPU资源
5. **识别范围**：仅支持COCO数据集中的80种物品类别

## 🆚 两种方式对比

| 特性 | 百度AI识别 | 实时物品识别 |
|------|-----------|-------------|
| 识别准确度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 识别速度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 网络要求 | 需要 | 首次需要 |
| 配置难度 | 需要API密钥 | 无需配置 |
| 支持物品 | 无限制 | 80种 |
| 智能匹配 | 支持 | 精确匹配 |
| 离线使用 | 不支持 | 支持 |
| 隐私保护 | 上传到服务器 | 本地处理 |

## 🎯 使用建议

- **日常任务验证**：推荐使用实时识别，快速方便
- **复杂场景验证**：推荐使用百度AI，识别更准确
- **离线环境**：只能使用实时识别
- **隐私敏感场景**：推荐使用实时识别，数据不上传

## 📚 扩展开发

### 添加自定义物品类别

编辑 `src/services/realtimeObjectDetection.ts`：

```typescript
export const OBJECT_LABELS: Record<string, string> = {
  // 添加新的物品
  'custom_object': '自定义物品',
  // ...
};

export const OBJECT_CATEGORIES = {
  // 添加新的分类
  '自定义分类': ['custom_object'],
  // ...
};
```

### 调整识别参数

```typescript
// 调整检测频率（默认500ms）
detectionIntervalRef.current = window.setInterval(async () => {
  // 检测逻辑
}, 300); // 改为300ms，更快的检测

// 调整最小置信度
const verification = realtimeObjectDetection.verifyObjects(
  results,
  targetObjects,
  0.7 // 提高到0.7，更严格的识别
);
```

## 🐛 故障排除

### 模型加载失败
- 检查网络连接
- 清除浏览器缓存
- 尝试使用其他浏览器

### 相机无法访问
- 检查浏览器权限设置
- 确保使用HTTPS协议
- 检查是否有其他应用占用相机

### 识别不准确
- 提高识别置信度
- 确保光线充足
- 物品尽量靠近相机
- 避免遮挡和模糊

## 📄 许可证

MIT License

