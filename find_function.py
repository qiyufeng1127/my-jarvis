with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到handleStartTask函数
start_line = -1
for i, line in enumerate(lines):
    if 'const handleStartTask' in line:
        start_line = i
        break

if start_line >= 0:
    print(f"handleStartTask函数在第 {start_line + 1} 行")
    # 打印函数内容（假设函数在100行内）
    for i in range(start_line, min(start_line + 100, len(lines))):
        print(f"{i+1}: {lines[i]}", end='')
else:
    print("未找到handleStartTask函数")

