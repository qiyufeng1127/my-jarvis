with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到所有 onTaskCreate 的调用
import re
for i, line in enumerate(lines):
    if 'onTaskCreate' in line and 'onClick' in ''.join(lines[max(0,i-10):i+1]):
        print(f'\nFound at line {i+1}:')
        for j in range(-10, 5):
            if 0 <= i+j < len(lines):
                print(f'{i+j+1}: {lines[i+j].rstrip()[:120]}')




