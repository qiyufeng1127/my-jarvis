@echo off
chcp 65001 >nul
echo ========================================
echo 强制推送到 GitHub
echo ========================================
echo.
echo ⚠️  警告：强制推送会覆盖远程仓库的历史记录！
echo.
echo 本次推送包含：
echo 1. 标签管理组件 V2
echo 2. AI 助手与收集箱功能优化
echo 3. 本地数据持久化与设备级唯一标识
echo.
set /p confirm="确认要强制推送吗？(输入 YES 继续): "
if not "%confirm%"=="YES" (
    echo 已取消推送
    pause
    exit /b 0
)

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
- 创建统一的智能分配服务 (smartScheduleService.ts)
- AI 助手功能增强（时间轴精准控制 + 智能分配）
- 收集箱功能优化（智能分配核心能力）
- 统一智能逻辑，打通时间轴数据

## 3. 本地数据持久化与设备级唯一标识
- 设备唯一标识自动生成（基于浏览器指纹）
- 增强的本地持久化存储（数据版本管理）
- 设备身份管理 Store（自动初始化）
- 设备设置界面（数据导出/导入/清除）

核心解决问题：
✅ 刷新页面数据不丢失
✅ 网站更新数据不丢失
✅ 重启浏览器数据不丢失
✅ 添加到桌面数据不丢失"

if %errorlevel% neq 0 (
    echo.
    echo ℹ️  没有新的更改需要提交，直接推送...
)

echo.
echo [3/3] 强制推送到 GitHub...
echo ⚠️  正在执行强制推送...
git push origin main --force
if %errorlevel% neq 0 (
    echo ❌ 强制推送失败
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. 认证失败
    echo 3. 仓库权限不足
    echo.
    echo 尝试解决方案：
    echo 1. 检查网络连接
    echo 2. 确认 Git 凭据正确
    echo 3. 确认有仓库写入权限
    pause
    exit /b 1
)
echo ✅ 已强制推送到 GitHub

echo.
echo ========================================
echo ✅ 强制推送完成！
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
echo.
echo 3️⃣ 本地数据持久化
echo    • 设备唯一标识
echo    • 数据永久保留
echo    • 数据导出/导入
echo.
echo 🎉 所有功能已成功推送到 GitHub！
echo.
echo 📄 查看详细文档：
echo    • TAG_V2_UPDATE_SUMMARY.md
echo    • AI_INBOX_OPTIMIZATION_SUMMARY.md
echo    • PERSISTENT_STORAGE_IMPLEMENTATION.md
echo    • PERSISTENT_STORAGE_GUIDE.md
echo.
pause






