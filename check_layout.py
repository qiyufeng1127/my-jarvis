import sys
import re

# 读取文件
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找图片组件的位置
pattern = r"className=\{`\$\{isMobile \? 'w-16 h-16' : 'w-20 h-20'\} rounded-2xl"
if pattern in content:
    print("Found image component")
else:
    print("Pattern not found, searching for similar...")
    if 'w-16 h-16' in content:
        print("Found w-16 h-16")
        # 找到这个位置前后的内容
        idx = content.find('w-16 h-16')
        print("Context:", content[idx-200:idx+200])








