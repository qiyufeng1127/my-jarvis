with open('w:/001jiaweis/22222/src/stores/taskStore.ts', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到 createTask 函数
for i, line in enumerate(lines):
    if 'createTask' in line and (':' in line or '=' in line or 'async' in line):
        print(f'\nFound at line {i+1}:')
        for j in range(0, 30):
            if i+j < len(lines):
                print(f'{i+j+1}: {lines[i+j].rstrip()[:150]}')
        break

