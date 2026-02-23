import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 第一个按钮在2099行附近，往前找onClick
print("=== 第一个start按钮（折叠状态）===")
for i in range(2098, max(2098-30, 0), -1):
    print(f"{i+1}: {lines[i]}", end='')
    if 'onClick' in lines[i]:
        break

print("\n" + "="*80 + "\n")

# 第二个按钮在2424行附近，往前找onClick
print("=== 第二个start按钮（展开状态）===")
for i in range(2423, max(2423-30, 0), -1):
    print(f"{i+1}: {lines[i]}", end='')
    if 'onClick' in lines[i]:
        break

