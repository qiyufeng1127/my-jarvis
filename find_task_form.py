with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到任务类型选择的位置
for i, line in enumerate(lines):
    if '任务类型' in line or 'taskType' in line and 'select' in lines[max(0,i-5):i+5].__str__().lower():
        print(f'\nFound at line {i+1}')
        # 保存附近的代码
        with open('w:/001jiaweis/22222/temp_task_form.txt', 'w', encoding='utf-8') as out:
            out.write(''.join(lines[max(0,i-10):i+50]))
        print('Saved to temp_task_form.txt')
        break

