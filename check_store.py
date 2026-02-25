with open('w:/001jiaweis/22222/src/stores/taskStore.ts', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到 createTask 实现
for i, line in enumerate(lines):
    if 'createTask:' in line and 'async' in line:
        with open('w:/001jiaweis/22222/temp_createtask.txt', 'w', encoding='utf-8') as out:
            out.write(''.join(lines[i:i+30]))
        print(f'Found at line {i+1}, saved to temp_createtask.txt')
        break



