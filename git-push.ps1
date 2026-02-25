# Git 自动提交推送脚本
# 使用方法：在项目根目录执行 .\git-push.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git 自动提交推送脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查是否有修改
Write-Host "📋 检查本地修改..." -ForegroundColor Yellow
git status

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host ""
    Write-Host "✅ 没有需要提交的修改" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "📝 发现以下修改：" -ForegroundColor Yellow
git status --short
Write-Host ""

# 2. 添加所有修改
Write-Host "➕ 添加所有修改到暂存区..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 添加文件失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 文件已添加到暂存区" -ForegroundColor Green
Write-Host ""

# 3. 输入提交信息（可选）
Write-Host "💬 请输入提交信息（直接回车使用默认信息）：" -ForegroundColor Yellow
$commitMessage = Read-Host "提交信息"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "update: auto commit at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "使用默认提交信息: $commitMessage" -ForegroundColor Gray
}

Write-Host ""

# 4. 提交修改
Write-Host "💾 提交修改..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 提交失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 提交成功" -ForegroundColor Green
Write-Host ""

# 5. 推送到远程仓库
Write-Host "🚀 推送到 GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 推送失败，请检查网络连接或权限" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ 所有修改已成功推送到 GitHub！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 6. 显示最新提交信息
Write-Host "📊 最新提交信息：" -ForegroundColor Cyan
git log -1 --oneline
Write-Host ""

