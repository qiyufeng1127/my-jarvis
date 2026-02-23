import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到*start按钮
found_count = 0
for i, line in enumerate(lines):
    if '*start' in line:
        print(f"找到*start在第 {i+1} 行")
        # 打印前后15行
        start = max(0, i-15)
        end = min(i+5, len(lines))
        for j in range(start, end):
            marker = ">>> " if j == i else "    "
            print(f"{marker}{j+1}: {lines[j]}", end='')
        print("\n" + "="*80 + "\n")
        found_count += 1
        if found_count >= 3:  # 只显示前3个
            break

print(f"总共找到 {found_count} 个*start")
