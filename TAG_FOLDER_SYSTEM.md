# 标签文件夹分类系统

## 更新时间
2026-02-09

## 核心功能

### 1. 标签文件夹（分类）系统

创建了一个完整的标签分类系统，每个文件夹有自己的颜色，文件夹内的标签会继承这个颜色作为任务卡片的背景色。

#### 文件夹结构：

```typescript
interface TagFolder {
  id: string;
  name: string;          // 文件夹名称
  emoji: string;         // 文件夹图标
  color: string;         // 文件夹颜色（会应用到所有子标签的任务卡片）
  tagNames: string[];    // 该文件夹下的标签
  order: number;         // 排序
  createdAt: Date;
}
```

#### 标签数据结构更新：

```typescript
interface TagData {
  // ... 原有字段
  folderId?: string;     // 所属文件夹ID（新增）
}
```

### 2. 12个默认文件夹

系统会自动初始化12个默认文件夹，每个文件夹都有独特的颜色和预设标签：

| 文件夹名称 | Emoji | 颜色代码 | 颜色名称 | 预设标签 |
|-----------|-------|---------|---------|---------|
| 享受生活 | 🌸 | #FF7BAC | BUBBLEGUM 粉色 | 旅行、美食、电影、音乐、阅读、游戏 |
| 最美的自己 | 💄 | #F4BEAE | PEACH FROST 桃色 | 护肤、化妆、穿搭、健身、瑜伽、美容 |
| 文创插画 | 🎨 | #D3B6D3 | LILACS 淡紫色 | 绘画、插画、设计、创作、灵感、作品 |
| 照相馆工作 | 📷 | #52A5CE | BLUEBERRY 蓝色 | 拍摄、修图、客户沟通、预约管理、设备维护、照相馆工作 |
| 学习成长 | 📚 | #6D1F42 | GRAPE JUICE 葡萄紫 | 学习、阅读、课程、笔记、思考、成长 |
| 开发软件 | 💻 | #B8CEE8 | ICED BLUE 冰蓝色 | 编程、开发、调试、学习技术、项目、代码 |
| 家务 | 🧹 | #AACC96 | TEA GREEN 茶绿色 | 打扫、洗衣、整理、收纳、清洁、家务 |
| 日常生活 | 📝 | #EFCE7B | BUTTER YELLOW 黄油黄 | 购物、做饭、洗漱、休息、日常、生活 |
| 副业思考准备 | 💡 | #EF6F3C | BLOOD ORANGE 血橙色 | 副业、思考、计划、准备、调研、尝试 |
| 健康 | 💪 | #25533F | FOREST 森林绿 | 运动、健身、体检、吃药、健康、锻炼 |
| 睡眠 | 😴 | #876029 | DRY EARTH 干土色 | 睡觉、午休、休息、睡眠、放松 |
| AI相关 | 🤖 | #AFAB23 | OLIVE GREEN 橄榄绿 | AI学习、AI工具、ChatGPT、AI项目、AI研究、AI相关 |

### 3. 颜色继承机制

**核心逻辑：**
- 标签属于某个文件夹时，使用文件夹的颜色
- 标签不属于任何文件夹时，使用标签自己的颜色
- 任务卡片的背景色 = 标签所在文件夹的颜色

**实现代码：**

```typescript
getTagColor: (tagName) => {
  const tag = get().tags[tagName];
  if (!tag) return '#6A7334'; // 默认颜色
  
  // 如果标签属于某个文件夹，使用文件夹的颜色
  if (tag.folderId) {
    const folder = get().folders.find(f => f.id === tag.folderId);
    if (folder) {
      return folder.color;
    }
  }
  
  // 否则使用标签自己的颜色
  return tag.color;
}
```

### 4. 用户界面设计

#### 文件夹展示：

```
┌─────────────────────────────────────────────┐
│ 📷 照相馆工作                    #52A5CE    │ ← 可点击展开/收起
│ 6 个标签                                    │
└─────────────────────────────────────────────┘
  ├─ 📷 拍摄 (使用 5 次 · 2h)
  ├─ 🖼️ 修图 (使用 3 次 · 1h)
  ├─ 💬 客户沟通 (使用 8 次 · 3h)
  ├─ 📅 预约管理 (使用 2 次 · 1h)
  ├─ 🔧 设备维护 (使用 1 次 · 0h)
  └─ 📷 照相馆工作 (使用 10 次 · 5h)
```

#### 交互功能：

1. **展开/收起文件夹**
   - 点击文件夹头部展开/收起
   - 显示文件夹内的所有标签

2. **文件夹头部信息**
   - 文件夹emoji和名称
   - 标签数量统计
   - 颜色代码显示
   - 背景色预览（淡色）

3. **标签操作**
   - 重命名标签
   - 删除标签
   - 查看使用统计

4. **未分类标签**
   - 单独显示不属于任何文件夹的标签
   - 可以手动添加到文件夹

### 5. 文件夹操作API

```typescript
// 创建文件夹
createFolder(name: string, emoji: string, color: string, tagNames?: string[]): string

// 更新文件夹
updateFolder(folderId: string, updates: Partial<TagFolder>): void

// 删除文件夹
deleteFolder(folderId: string): void

// 添加标签到文件夹
addTagToFolder(tagName: string, folderId: string): void

// 从文件夹移除标签
removeTagFromFolder(tagName: string, folderId: string): void

// 获取文件夹
getFolderById(folderId: string): TagFolder | undefined
getAllFolders(): TagFolder[]

// 获取文件夹下的标签
getTagsByFolder(folderId: string): TagData[]

// 获取标签颜色（优先使用文件夹颜色）
getTagColor(tagName: string): string

// 初始化默认文件夹
initializeDefaultFolders(): void
```

### 6. 使用场景

#### 场景1：任务卡片自动着色

用户创建任务："明天去照相馆拍证件照"

1. AI分析任务，分配标签：["照相馆工作", "拍摄"]
2. 系统检测到"照相馆工作"属于"照相馆工作"文件夹
3. 文件夹颜色：#52A5CE (BLUEBERRY 蓝色)
4. ✅ 任务卡片背景色自动设置为 #52A5CE

#### 场景2：文件夹管理标签

用户想查看所有与"照相馆工作"相关的标签：

1. 打开标签统计页面
2. 滚动到"标签管理"区域
3. 点击"📷 照相馆工作"文件夹
4. ✅ 展开显示：拍摄、修图、客户沟通、预约管理、设备维护、照相馆工作

#### 场景3：修改文件夹颜色

用户想把"照相馆工作"的颜色改为粉色：

1. 打开标签管理
2. 找到"照相馆工作"文件夹
3. 修改颜色为 #FF7BAC
4. ✅ 所有"照相馆工作"相关标签的任务卡片自动变为粉色

### 7. 数据持久化

所有文件夹数据通过 `zustand` + `localStorage` 持久化：

```typescript
{
  folders: [
    {
      id: "uuid-1",
      name: "照相馆工作",
      emoji: "📷",
      color: "#52A5CE",
      tagNames: ["拍摄", "修图", "客户沟通", ...],
      order: 3,
      createdAt: "2026-02-09T..."
    },
    // ... 其他文件夹
  ],
  tags: {
    "拍摄": {
      name: "拍摄",
      emoji: "📷",
      color: "#52A5CE",
      folderId: "uuid-1",  // ← 关联到文件夹
      // ... 其他字段
    },
    // ... 其他标签
  }
}
```

### 8. 初始化逻辑

系统首次启动时会自动初始化12个默认文件夹：

```typescript
useEffect(() => {
  initializeDefaultFolders();
}, [initializeDefaultFolders]);
```

**初始化流程：**

1. 检查是否已有文件夹
2. 如果没有，创建12个默认文件夹
3. 为每个文件夹创建预设标签
4. 标签自动关联到对应文件夹
5. 标签颜色继承文件夹颜色

### 9. 颜色方案

所有颜色都来自用户提供的色卡，确保视觉统一：

- **BUBBLEGUM** (#FF7BAC) - 粉色系，用于享受生活
- **PEACH FROST** (#F4BEAE) - 桃色系，用于最美的自己
- **LILACS** (#D3B6D3) - 淡紫色系，用于文创插画
- **BLUEBERRY** (#52A5CE) - 蓝色系，用于照相馆工作
- **GRAPE JUICE** (#6D1F42) - 葡萄紫，用于学习成长
- **ICED BLUE** (#B8CEE8) - 冰蓝色，用于开发软件
- **TEA GREEN** (#AACC96) - 茶绿色，用于家务
- **BUTTER YELLOW** (#EFCE7B) - 黄油黄，用于日常生活
- **BLOOD ORANGE** (#EF6F3C) - 血橙色，用于副业思考准备
- **FOREST** (#25533F) - 森林绿，用于健康
- **DRY EARTH** (#876029) - 干土色，用于睡眠
- **OLIVE GREEN** (#AFAB23) - 橄榄绿，用于AI相关

### 10. 未来优化方向

1. **自定义文件夹**
   - 用户可以创建新文件夹
   - 自定义文件夹名称、emoji、颜色

2. **拖拽排序**
   - 拖拽调整文件夹顺序
   - 拖拽标签到不同文件夹

3. **文件夹统计**
   - 显示文件夹总时长
   - 显示文件夹总使用次数
   - 显示文件夹效率分析

4. **批量操作**
   - 批量移动标签到文件夹
   - 批量修改文件夹颜色

5. **文件夹导入导出**
   - 导出文件夹配置
   - 导入其他用户的文件夹配置

## 修改的文件

1. **src/stores/tagStore.ts**
   - 新增 `TagFolder` 接口
   - 新增 `folderId` 字段到 `TagData`
   - 新增文件夹操作方法
   - 新增 `initializeDefaultFolders` 方法
   - 新增 `getTagColor` 方法

2. **src/components/tags/TagStatisticsView.tsx**
   - 新增文件夹展示UI
   - 新增展开/收起功能
   - 新增未分类标签区域
   - 调用 `initializeDefaultFolders` 初始化

## 使用说明

1. **首次使用**
   - 打开标签统计页面
   - 系统自动创建12个默认文件夹
   - 每个文件夹包含预设标签

2. **查看文件夹**
   - 滚动到"标签管理"区域
   - 点击文件夹展开查看标签
   - 再次点击收起

3. **管理标签**
   - 点击标签的编辑按钮重命名
   - 点击删除按钮删除标签
   - 标签会自动关联到文件夹

4. **任务卡片着色**
   - 创建任务时，AI会分配标签
   - 任务卡片自动使用标签所在文件夹的颜色
   - 视觉上更加统一和美观

## 总结

✅ 创建了完整的标签文件夹分类系统
✅ 12个默认文件夹，每个都有独特的颜色
✅ 标签自动继承文件夹颜色
✅ 任务卡片背景色自动应用文件夹颜色
✅ 可展开/收起的文件夹UI
✅ 支持未分类标签管理
✅ 数据持久化存储

现在您的标签系统更加有组织，任务卡片的颜色也会根据标签分类自动变化，视觉效果更加统一和美观！🎨

