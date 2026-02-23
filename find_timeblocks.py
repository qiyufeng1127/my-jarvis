import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到timeBlocks的定义
for i, line in enumerate(lines):
    if 'timeBlocks' in line and ('useMemo' in line or 'const' in line or '=' in line):
        print(f"找到timeBlocks定义在第 {i+1} 行")
        # 打印后续30行
        for j in range(i, min(i+30, len(lines))):
            print(f"{j+1}: {lines[j].rstrip()}")
        print("\n" + "="*80 + "\n")
        if i > 1700:  # 只看后面的定义
            break

