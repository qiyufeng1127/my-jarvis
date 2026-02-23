import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到endTime的赋值
for i, line in enumerate(lines):
    if 'endTime:' in line and ('block' in line or 'task' in line or 'scheduledEnd' in line):
        print(f"{i+1}: {line.strip()}")

