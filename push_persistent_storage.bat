@echo off
chcp 65001 >nul
echo ========================================
echo 本地数据持久化功能 - 推送到GitHub
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
git commit -m "feat: 实现本地数据持久化与设备级唯一标识

核心功能：
1. 设备唯一标识自动生成
   - 基于浏览器指纹生成永久设备ID
   - 自动生成默认头像和设备名称
   - 支持自定义头像和名称

2. 增强的本地持久化存储
   - 数据与设备ID绑定
   - 支持数据版本管理和迁移
   - 提供数据完整性校验
   - 支持批量操作

3. 设备身份管理 Store
   - 应用启动时自动初始化
   - 提供设备信息的全局访问
   - 支持更新设备信息
   - 提供安全的数据清除接口

4. 设备设置界面
   - 显示设备信息（头像、名称、ID等）
   - 显示存储使用情况
   - 支持数据导出/导入（备份/恢复）
   - 支持清除所有本地数据

核心解决问题：
✅ 刷新页面数据不丢失
✅ 网站更新数据不丢失
✅ 重启浏览器数据不丢失
✅ 添加到桌面数据不丢失

新增文件：
- src/services/deviceIdentityService.ts
- src/stores/deviceStore.ts
- src/services/persistentStorageService.ts
- src/components/settings/DeviceSettings.tsx
- PERSISTENT_STORAGE_IMPLEMENTATION.md
- PERSISTENT_STORAGE_GUIDE.md"

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
echo 📝 核心功能：
echo   • 设备唯一标识自动生成
echo   • 本地数据永久持久化
echo   • 刷新/更新/重启数据不丢失
echo   • 设备信息管理界面
echo   • 数据导出/导入/清除
echo.
echo 📄 详细文档：
echo   • PERSISTENT_STORAGE_IMPLEMENTATION.md（实现文档）
echo   • PERSISTENT_STORAGE_GUIDE.md（使用指南）
echo.
echo 🧪 测试建议：
echo   1. 刷新页面，检查数据是否保留
echo   2. 进入设置页面，查看设备信息
echo   3. 尝试更换头像和名称
echo   4. 测试数据导出/导入功能
echo.
pause






