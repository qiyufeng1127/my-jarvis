with open('w:/001jiaweis/22222/src/pages/Dashboard.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到 createTask 函数
for i, line in enumerate(lines):
    if 'createTask' in line and ('const' in line or 'function' in line or '=' in line):
        print(f'\n=== Found at line {i+1} ===')
        # 打印这一行和后续20行
        for j in range(0, 25):
            if i+j < len(lines):
                print(f'{i+j+1}: {lines[i+j].rstrip()}')



