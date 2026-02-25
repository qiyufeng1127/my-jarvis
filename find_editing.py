with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到 editingTask 相关的代码
print("=== editingTask state ===")
for i, line in enumerate(lines[100:110], start=100):
    print(f'{i+1}: {line.rstrip()}')

print("\n=== setEditingTask usage ===")
for i, line in enumerate(lines):
    if 'setEditingTask' in line:
        print(f'{i+1}: {line.rstrip()[:150]}')



