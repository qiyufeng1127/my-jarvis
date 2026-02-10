# 自动修复重复启动验证bug
# PowerShell脚本

$filePath = "w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx"
$backupPath = "$filePath.backup"

Write-Host "开始修复重复启动验证bug..." -ForegroundColor Green

# 备份文件
Copy-Item $filePath $backupPath -Force
Write-Host "已创建备份: $backupPath" -ForegroundColor Yellow

# 读取文件
$content = Get-Content $filePath -Raw -Encoding UTF8

# 第一处修复（约1982行）
$pattern1 = "!block\.isCompleted && block\.status !== 'in_progress' && \("
$replacement1 = "!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && ("

$content = $content -replace $pattern1, $replacement1

Write-Host "已修复启动按钮的显示条件（2处）" -ForegroundColor Green

# 保存文件
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "修复完成！" -ForegroundColor Green
Write-Host "原文件已备份为: NewTimelineView.tsx.backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "接下来需要手动添加'已启动'标识：" -ForegroundColor Cyan
Write-Host "1. 打开 NewTimelineView.tsx" -ForegroundColor White
Write-Host "2. 搜索第1982行和第2304行的启动按钮" -ForegroundColor White
Write-Host "3. 在每个按钮的 )} 后面添加已启动标识代码" -ForegroundColor White
Write-Host ""
Write-Host "详细步骤请查看: docs/快速修复指南.md" -ForegroundColor Yellow

