# 标签管理组件 V2 - Git 推送脚本（Mac/Linux）

echo "========================================"
echo "标签管理组件 V2 - Git 推送脚本"
echo "========================================"
echo ""

cd /w/001jiaweis/22222

echo "[1/4] 添加所有更改..."
git add .

echo ""
echo "[2/4] 提交更改..."
git commit -m "feat: 标签管理组件 V2 - 完整功能实现

✨ 新增功能：
- 财务分析模块（收支统计、趋势图、明细）
- 效率分析模块（单位时间收益、效率分级、警示）
- 标签类型标记（业务类/生活必需类）
- 无效时长标记和排除
- 多维度排序（收入、支出、净收支、时薪、负效时长）
- iOS 风格设计（扁平化、留白、Emoji 标识）
- 负效警示弹窗
- 效率-时长散点图
- 收支占比饼图和柱状图

🎨 设计优化：
- 全面采用 iOS 系统原生 Emoji
- 优化卡片样式（圆角、阴影、毛玻璃）
- 优化交互体验（右键菜单、长按震动）
- 优化数据展示（进度条、趋势图）
- 优化色彩规范（iOS 系统配色）

📱 入口优化：
- 电脑端：左侧导航栏添加 🏷️ 标签管理入口
- 手机端：底部导航栏/更多功能中添加标签入口

📦 新增文件：
- src/stores/tagStore.ts（已更新）
- src/components/tags/TagManagerV2.tsx
- src/components/tags/TagListV2.tsx
- src/components/tags/TagFinanceAnalysis.tsx
- src/components/tags/TagEfficiencyAnalysis.tsx
- src/components/tags/TagAnalysisModalV2.tsx
- TAG_MANAGER_V2_README.md
- TAG_V2_UPDATE_SUMMARY.md

🔧 兼容性：
- 保留 V1 组件，向后兼容
- 数据结构扩展，自动迁移
- API 向后兼容"

echo ""
echo "[3/4] 推送到 GitHub..."
git push origin main

echo ""
echo "[4/4] 完成！"
echo ""
echo "========================================"
echo "✅ 标签管理组件 V2 已成功推送到 GitHub"
echo "========================================"
echo ""
echo "📱 手机端入口：底部导航栏 \"更多\" → \"🏷️ 标签\""
echo "💻 电脑端入口：左侧导航栏 \"🏷️ 标签管理\" 图标"
echo ""






