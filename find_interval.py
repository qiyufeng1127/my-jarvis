with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到间隔按钮
for i, line in enumerate(lines):
    if '间隔' in line:
        print(f'{i+1}: {line.rstrip()}')
        # 打印前后10行
        if 'button' in line.lower() or 'onClick' in lines[max(0,i-10):i+10].__str__().lower():
            with open('w:/001jiaweis/22222/temp_interval_button.txt', 'w', encoding='utf-8') as out:
                out.write(''.join(lines[max(0,i-15):i+25]))
            print(f'Saved context around line {i+1}')
            break



