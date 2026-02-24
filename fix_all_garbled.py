#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re
import sys
import io

# 设置标准输出为UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

filepath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx'

# 读取文件
with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 统计修复次数
fixes = 0

# 1. 删除对象属性中的乱码键（如 ԭʼ����: task）
# 查找并删除包含乱码的对象属性
pattern = r'\s*[^\x00-\x7F\u4e00-\u9fff\s]+[^:]*:\s*[^,}]+,?\s*\n'
matches = re.findall(pattern, content)
if matches:
    print(f"Found {len(matches)} garbled object properties")
    content = re.sub(pattern, '', content)
    fixes += len(matches)

# 2. 删除所有乱码注释
pattern = r'//\s*[^\x00-\x7F\u4e00-\u9fff\s]+.*?\n'
matches = re.findall(pattern, content)
if matches:
    print(f"Found {len(matches)} garbled comments")
    content = re.sub(pattern, '// \n', content)
    fixes += len(matches)

# 写回文件
with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print(f"Total fixes: {fixes}")
print("Fixed NewTimelineView.tsx")
