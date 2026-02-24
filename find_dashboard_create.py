with open('w:/001jiaweis/22222/src/pages/Dashboard.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到 onTaskCreate 或 handleTaskCreate
for i, line in enumerate(lines):
    if 'TaskCreate' in line or 'taskCreate' in line:
        print(f'{i+1}: {line.rstrip()[:150]}')

