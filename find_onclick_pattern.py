with open('w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 找到"今日结束"按钮的 onClick 代码
import re
pattern = r'(onClick=\{\(\) => \{[^}]*const newTask = \{[^}]*title: \'新任务\'[^}]*durationMinutes: timeUntilEnd\.durationMinutes[^}]*\};[^}]*onTaskCreate\(newTask\);[^}]*\}\})'

matches = list(re.finditer(pattern, content, re.DOTALL))
print(f'Found {len(matches)} matches')

if matches:
    match = matches[0]
    print(f'\nMatch position: {match.start()} - {match.end()}')
    print(f'\nOld code:\n{match.group(0)[:500]}')




