with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 查看 onTaskCreate 被调用后的处理
print("=== Looking for task creation and editing flow ===")
for i, line in enumerate(lines):
    if 'onTaskCreate' in line and 'await' in line:
        print(f'\nFound at line {i+1}:')
        for j in range(-5, 15):
            if 0 <= i+j < len(lines):
                print(f'{i+j+1}: {lines[i+j].rstrip()[:150]}')




