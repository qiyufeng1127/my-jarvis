with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到第2200行附近的代码（任务卡片点击）
with open('w:/001jiaweis/22222/temp_card_click.txt', 'w', encoding='utf-8') as out:
    out.write(''.join(lines[2190:2210]))
    
print('Saved lines 2190-2210')

