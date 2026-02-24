with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
    
# 找到空状态按钮
for i, line in enumerate(lines[3080:3119], start=3080):
    if 'button' in line.lower() or 'onclick' in line.lower():
        print(f'{i+1}: {line.rstrip()}')

