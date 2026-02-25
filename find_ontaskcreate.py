import os
import re

# 搜索所有使用 NewTimelineView 的文件
for root, dirs, files in os.walk('w:/001jiaweis/22222/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'NewTimelineView' in content and 'onTaskCreate' in content:
                        print(f'\n=== Found in: {filepath} ===')
                        # 找到 onTaskCreate 的定义
                        matches = re.findall(r'onTaskCreate=\{[^}]+\}', content)
                        for match in matches[:3]:
                            print(match[:200])
            except:
                pass



