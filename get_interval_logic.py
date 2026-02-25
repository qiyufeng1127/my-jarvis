with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到间隔按钮（第2995行附近）
with open('w:/001jiaweis/22222/temp_interval_full.txt', 'w', encoding='utf-8') as out:
    out.write(''.join(lines[2994:3025]))
    
print('Saved interval button code')




