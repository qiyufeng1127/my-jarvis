import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到handleCompleteTask函数
for i, line in enumerate(lines):
    if 'const handleCompleteTask' in line:
        print(f"找到handleCompleteTask在第 {i+1} 行")
        break

# 找到验证成功后的处理
for i, line in enumerate(lines):
    if '验证成功' in line or 'verification success' in line.lower():
        print(f"找到验证成功处理在第 {i+1} 行: {line.strip()}")

