with open('w:/001jiaweis/22222/src/components/calendar/TimelineCalendar.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到 onTaskCreate 的定义
for i, line in enumerate(lines):
    if 'onTaskCreate' in line and ('const' in line or '=' in line or 'function' in line):
        print(f'{i+1}: {line.rstrip()}')
        
# 保存前200行看看结构
with open('w:/001jiaweis/22222/temp_timeline_calendar.txt', 'w', encoding='utf-8') as out:
    out.write(''.join(lines[0:200]))
    
print('\nSaved first 200 lines')

