@echo off
chcp 65001 >nul
echo ========================================
echo AI助手与收集箱优化迭代 - 推送到GitHub
echo ========================================
echo.

echo [1/4] 添加所有修改的文件...
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)
echo ✅ 文件已添加

echo.
echo [2/4] 提交更改...
git commit -m "feat: AI助手与收集箱功能优化迭代 - 统一智能分配逻辑

核心改进：
1. 创建统一的智能分配服务 (smartScheduleService.ts)
   - 智能查找空闲时间段
   - 时间冲突检测
   - 自然语言时间解析
   - 智能插空算法

2. AI助手功能增强
   - 强化时间轴精准控制（删除、移动、批量调整）
   - 新增智能分配能力（读取时间轴、智能插空）
   - 支持明确时间精准放置 + 无明确时间智能插空

3. 收集箱功能优化
   - 保留逐条记录特色
   - 优化智能分配核心能力
   - 使用统一的智能分配服务
   - 显示详细的分配结果预览

4. 统一智能逻辑
   - 统一标签/时间/金币/目标分配
   - 打通时间轴数据
   - 确保任务安排无冲突

详细文档：AI_INBOX_OPTIMIZATION_SUMMARY.md"

if %errorlevel% neq 0 (
    echo ❌ 提交失败
    pause
    exit /b 1
)
echo ✅ 更改已提交

echo.
echo [3/4] 推送到 GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ 推送失败
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. 需要先拉取远程更改：git pull origin main
    echo 3. 认证失败
    pause
    exit /b 1
)
echo ✅ 已推送到 GitHub

echo.
echo [4/4] 显示最新提交...
git log --oneline -1
echo.

echo ========================================
echo ✅ 所有操作完成！
echo ========================================
echo.
echo 📝 优化内容：
echo   • 创建统一的智能分配服务
echo   • AI助手：强化时间轴控制 + 智能分配
echo   • 收集箱：优化智能分配核心能力
echo   • 统一智能逻辑，打通时间轴数据
echo.
echo 📄 详细文档：AI_INBOX_OPTIMIZATION_SUMMARY.md
echo.
pause






