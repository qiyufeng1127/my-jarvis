import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到block的定义
for i, line in enumerate(lines):
    if 'const blocks' in line or 'blocks =' in line:
        print(f"{i+1}: {line.strip()}")
        # 打印后续几行
        for j in range(i+1, min(i+20, len(lines))):
            print(f"{j+1}: {lines[j].rstrip()}")
        print("\n" + "="*80 + "\n")
        break

