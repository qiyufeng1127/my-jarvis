with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到任务描述输入框
for i, line in enumerate(lines):
    if '任务描述' in line and 'textarea' in lines[max(0,i-5):i+10].__str__().lower():
        print(f'\nFound task description at line {i+1}')
        # 保存附近的代码
        with open('w:/001jiaweis/22222/temp_task_inputs.txt', 'w', encoding='utf-8') as out:
            out.write(''.join(lines[i:i+100]))
        print('Saved to temp_task_inputs.txt')
        break




