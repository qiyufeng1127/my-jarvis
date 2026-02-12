# 修复 NewTimelineView.tsx 文件中的中文乱码
$filePath = "src/components/calendar/NewTimelineView.tsx"

# 读取文件内容（使用 UTF-8 编码）
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# 定义替换映射
$replacements = @{
    '����Ƿ�Ϊ�ƶ��豸' = '检测是否为移动设备'
    '����״̬' = '任务状态'
    '������֤������' = '当前验证的任务'
    '��֤����' = '验证类型'
    '������֤��ʱ���' = '开始验证超时标记'
    '�����֤��ʱ���' = '完成验证超时标记'
    '����ʵ������ʱ��' = '任务实际开始时间'
    '�༭�����״̬' = '编辑任务状态'
    'ʹ�� AI Store ��ȡ API ����' = '使用 AI Store 获取 API 配置'
    'ʹ�ý��ϵͳ' = '使用金币系统'
    'ʹ�ñ�ǩϵͳ' = '使用标签系统'
    '��ףЧ��״̬' = '庆祝效果状态'
    '�ж���ɫ�Ƿ�Ϊ��ɫ' = '判断颜色是否为深色'
    '���ݱ���ɫ��ȡ������ɫ' = '根据背景色获取文字颜色'
    'ʹ����ʵ���񣨲�����Ҫʾ������' = '使用真实任务（不需要示例任务）'
    '����ʶ���������ͣ��Ƿ�Ϊ��Ƭ����' = '智能识别任务类型：是否为拍片任务'
    'ƥ��ģʽ������ + ���ʣ��š������Ρ������ݵȣ�' = '匹配模式：数字 + 量词（张、个、次、组、套等）'
    '��ȡ����' = '获取单位'
    '��ȡ�������Ƭ����' = '获取拍片任务进度'
    '���༭���������' = '待编辑的任务标题'
}

# 执行替换
$modified = $false
foreach ($key in $replacements.Keys) {
    if ($content -match [regex]::Escape($key)) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
        Write-Host "替换: $key -> $($replacements[$key])"
        $modified = $true
    }
}

if ($modified) {
    # 保存文件（使用 UTF-8 编码，不带 BOM）
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
    Write-Host "`n✓ 文件已修复并保存: $filePath"
} else {
    Write-Host "未找到需要替换的乱码"
}

