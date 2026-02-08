@echo off
chcp 65001 >nul
echo ========================================
echo 完整功能推送到 GitHub
echo ========================================
echo.
echo 本次推送包含：
echo 1. 标签管理组件 V2
echo 2. AI 助手与收集箱功能优化
echo 3. 本地数据持久化与设备级唯一标识
echo.
pause

echo.
echo [1/3] 添加所有修改的文件...
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)
echo ✅ 文件已添加

echo.
echo [2/3] 提交更改...
git commit -m "feat: 完整功能更新 - 标签管理V2 + AI优化 + 数据持久化

## 1. 标签管理组件 V2
- 新增财务分析模块（收入/支出追踪）
- 新增效率分析模块（单位时间收益计算）
- 优化标签列表展示（iOS 风格）
- 添加详细分析弹窗
- 集成到桌面和移动端导航

## 2. AI 助手与收集箱功能优化
核心改进：
- 创建统一的智能分配服务 (smartScheduleService.ts)
  * 智能查找空闲时间段
  * 时间冲突检测
  * 自然语言时间解析
  * 智能插空算法

- AI 助手功能增强
  * 强化时间轴精准控制（删除、移动、批量调整）
  * 新增智能分配能力（读取时间轴、智能插空）
  * 支持明确时间精准放置 + 无明确时间智能插空

- 收集箱功能优化
  * 保留逐条记录特色
  * 优化智能分配核心能力
  * 使用统一的智能分配服务
  * 显示详细的分配结果预览

- 统一智能逻辑
  * 统一标签/时间/金币/目标分配
  * 打通时间轴数据
  * 确保任务安排无冲突

## 3. 本地数据持久化与设备级唯一标识
核心功能：
- 设备唯一标识自动生成
  * 基于浏览器指纹生成永久设备ID
  * 自动生成默认头像和设备名称
  * 支持自定义头像和名称

- 增强的本地持久化存储
  * 数据与设备ID绑定
  * 支持数据版本管理和迁移
  * 提供数据完整性校验
  * 支持批量操作

- 设备身份管理 Store
  * 应用启动时自动初始化
  * 提供设备信息的全局访问
  * 支持更新设备信息
  * 提供安全的数据清除接口

- 设备设置界面
  * 显示设备信息（头像、名称、ID等）
  * 显示存储使用情况
  * 支持数据导出/导入（备份/恢复）
  * 支持清除所有本地数据

核心解决问题：
✅ 刷新页面数据不丢失
✅ 网站更新数据不丢失
✅ 重启浏览器数据不丢失
✅ 添加到桌面数据不丢失

新增文件：
- src/components/tags/* (标签管理V2)
- src/stores/tagStore.ts
- src/services/smartScheduleService.ts
- src/services/deviceIdentityService.ts
- src/stores/deviceStore.ts
- src/services/persistentStorageService.ts
- src/components/settings/DeviceSettings.tsx

修改文件：
- src/components/ai/hooks/useChatLogic.ts
- src/components/inbox/InboxPanel.tsx
- src/components/dashboard/CustomizableDashboard.tsx
- src/components/layout/MobileLayout.tsx
- src/services/aiSmartService.ts
- src/hooks/index.ts

文档：
- TAG_V2_UPDATE_SUMMARY.md
- AI_INBOX_OPTIMIZATION_SUMMARY.md
- PERSISTENT_STORAGE_IMPLEMENTATION.md
- PERSISTENT_STORAGE_GUIDE.md"

if %errorlevel% neq 0 (
    echo ❌ 提交失败
    pause
    exit /b 1
)
echo ✅ 更改已提交

echo.
echo [3/3] 推送到 GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ 推送失败
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. 需要先拉取远程更改：git pull origin main --rebase
    echo 3. 认证失败
    echo.
    echo 尝试解决方案：
    echo 1. 检查网络连接
    echo 2. 运行：git pull origin main --rebase
    echo 3. 然后重新运行此脚本
    pause
    exit /b 1
)
echo ✅ 已推送到 GitHub

echo.
echo ========================================
echo ✅ 所有操作完成！
echo ========================================
echo.
echo 📝 本次更新内容：
echo.
echo 1️⃣ 标签管理组件 V2
echo    • 财务分析（收入/支出追踪）
echo    • 效率分析（单位时间收益）
echo    • iOS 风格界面
echo.
echo 2️⃣ AI 助手与收集箱优化
echo    • 统一智能分配服务
echo    • 时间轴精准控制
echo    • 智能插空算法
echo    • 自然语言时间解析
echo.
echo 3️⃣ 本地数据持久化
echo    • 设备唯一标识
echo    • 数据永久保留
echo    • 刷新/更新不丢失
echo    • 数据导出/导入
echo.
echo 📄 详细文档：
echo    • TAG_V2_UPDATE_SUMMARY.md
echo    • AI_INBOX_OPTIMIZATION_SUMMARY.md
echo    • PERSISTENT_STORAGE_IMPLEMENTATION.md
echo    • PERSISTENT_STORAGE_GUIDE.md
echo.
echo 🧪 测试建议：
echo    1. 刷新页面，检查数据是否保留
echo    2. 测试 AI 助手的智能分配功能
echo    3. 测试收集箱的智能分配功能
echo    4. 查看标签管理的财务和效率分析
echo    5. 进入设置页面，查看设备信息
echo.
pause






