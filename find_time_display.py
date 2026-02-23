import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到显示21:39这样的时间的代码
for i, line in enumerate(lines):
    if 'scheduledEnd' in line or 'endTime' in line:
        if 'format' in line.lower() or 'tolocale' in line.lower() or ':' in line:
            print(f"{i+1}: {line.strip()}")

