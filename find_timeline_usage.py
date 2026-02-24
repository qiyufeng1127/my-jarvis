import os
import re

# 搜索所有使用 TimelineCalendar 的文件
for root, dirs, files in os.walk('w:/001jiaweis/22222/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'TimelineCalendar' in content and ('import' in content or 'from' in content):
                        # 检查是否真的导入了 TimelineCalendar
                        if re.search(r'import.*TimelineCalendar.*from', content):
                            print(f'\n=== Found in: {filepath} ===')
                            # 找到 onTaskCreate 的实现
                            lines = content.split('\n')
                            for i, line in enumerate(lines):
                                if 'onTaskCreate' in line and ('const' in line or 'function' in line or '=>' in line):
                                    print(f'Line {i+1}: {line.strip()[:150]}')
                                    # 打印后续几行
                                    for j in range(1, 10):
                                        if i+j < len(lines):
                                            print(f'  {lines[i+j].strip()[:150]}')
                                    break
            except:
                pass

