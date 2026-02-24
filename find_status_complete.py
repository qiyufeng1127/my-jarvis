with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 搜索任务状态更新为 completed 的代码
for i, line in enumerate(lines):
    if 'completed' in line and ('status' in line or 'Status' in line):
        print(f'{i+1}: {line.rstrip()[:120]}')

