with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到 Props 接口定义
for i, line in enumerate(lines[0:100]):
    if 'interface' in line or 'Props' in line or 'onTaskCreate' in line:
        print(f'{i+1}: {line.rstrip()[:120]}')




