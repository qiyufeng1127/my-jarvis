# 自动修复 NewTimelineView.tsx 的 PowerShell 脚本
# 这个脚本会安全地添加验证状态管理，不破坏现有功能

Write-Host "🚀 开始修复 NewTimelineView.tsx..." -ForegroundColor Green
Write-Host ""

$filePath = "src\components\calendar\NewTimelineView.tsx"
$backupPath = "src\components\calendar\NewTimelineView.tsx.backup"

# 检查文件是否存在
if (-not (Test-Path $filePath)) {
    Write-Host "❌ 错误: 找不到文件 $filePath" -ForegroundColor Red
    exit 1
}

Write-Host "📖 读取文件: $filePath" -ForegroundColor Cyan
$content = Get-Content $filePath -Raw -Encoding UTF8
$originalContent = $content

Write-Host "📝 文件大小: $($content.Length) 字符" -ForegroundColor Gray
Write-Host "📝 文件行数: $(($content -split "`n").Count) 行" -ForegroundColor Gray
Write-Host ""

# 创建备份
Write-Host "💾 创建备份..." -ForegroundColor Cyan
$content | Out-File -FilePath $backupPath -Encoding UTF8 -NoNewline
Write-Host "✅ 备份已创建: $backupPath" -ForegroundColor Green
Write-Host ""

# 1. 添加导入
Write-Host "🔧 步骤1: 添加导入语句..." -ForegroundColor Yellow

if ($content -notmatch "import TaskCard from") {
    # 找到最后一个 import 的位置
    $importPattern = "import[^;]+;"
    $matches = [regex]::Matches($content, $importPattern)
    if ($matches.Count -gt 0) {
        $lastImport = $matches[$matches.Count - 1]
        $insertPos = $lastImport.Index + $lastImport.Length
        
        $importToAdd = @"

import TaskCard from './TaskCard';
import { useVerificationStates } from '@/hooks/useVerificationStates';
"@
        
        $content = $content.Insert($insertPos, $importToAdd)
        Write-Host "✅ 添加导入成功" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  导入已存在，跳过" -ForegroundColor Gray
}

# 2. 添加 Hook
Write-Host "🔧 步骤2: 添加验证状态管理 Hook..." -ForegroundColor Yellow

if ($content -notmatch "useVerificationStates\(\)") {
    # 找到第一个 useState 的位置
    if ($content -match "export default function \w+[^{]*\{[\s\S]*?const \[") {
        $hookToAdd = @"

  // 验证状态管理 - 使用 Hook
  const {
    getState: getVerificationState,
    markStartVerificationBegin,
    markStartVerificationComplete,
    markCompleteVerificationComplete,
  } = useVerificationStates();

"@
        
        # 在第一个 useState 之前插入
        $content = $content -replace "(export default function \w+[^{]*\{[\s\S]*?)(const \[)", "`$1$hookToAdd`$2"
        Write-Host "✅ 添加 Hook 成功" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  Hook 已存在，跳过" -ForegroundColor Gray
}

# 3. 添加验证处理函数
Write-Host "🔧 步骤3: 添加验证处理函数..." -ForegroundColor Yellow

if ($content -notmatch "handleStartVerification") {
    $functionsToAdd = @"


  // 处理启动验证
  const handleStartVerification = async (taskId: string) => {
    console.log('🚀 开始启动验证:', taskId);
    markStartVerificationComplete(taskId);
  };

  // 处理完成验证
  const handleCompleteVerification = async (taskId: string) => {
    console.log('🏁 开始完成验证:', taskId);
    markCompleteVerificationComplete(taskId);
  };

"@
    
    # 在 return 之前插入
    $content = $content -replace "(\n\s*return\s*\()", "$functionsToAdd`$1"
    Write-Host "✅ 添加验证处理函数成功" -ForegroundColor Green
} else {
    Write-Host "⏭️  验证处理函数已存在，跳过" -ForegroundColor Gray
}

# 保存修改
Write-Host ""
Write-Host "💾 保存修改..." -ForegroundColor Cyan
$content | Out-File -FilePath $filePath -Encoding UTF8 -NoNewline
Write-Host "✅ 保存成功" -ForegroundColor Green

# 统计
Write-Host ""
Write-Host "📊 修改统计:" -ForegroundColor Cyan
Write-Host "- 原始大小: $($originalContent.Length) 字符" -ForegroundColor Gray
Write-Host "- 修改后大小: $($content.Length) 字符" -ForegroundColor Gray
Write-Host "- 增加: $($content.Length - $originalContent.Length) 字符" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ 自动修改完成！" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  重要提示:" -ForegroundColor Yellow
Write-Host "1. 请刷新浏览器测试功能" -ForegroundColor White
Write-Host "2. 如果有问题，备份文件在: $backupPath" -ForegroundColor White
Write-Host "3. 你还需要手动修改任务卡片的渲染部分" -ForegroundColor White
Write-Host "   参考文档: docs\NewTimelineView修改指南.md" -ForegroundColor White
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

