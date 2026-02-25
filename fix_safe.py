#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

filepath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx'

# 读取文件
with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# 修复每一行
fixed_lines = []
fixes = 0

for i, line in enumerate(lines, 1):
    original_line = line
    
    # 只修复注释行中的乱码
    if line.strip().startswith('//'):
        # 替换常见的乱码注释
        if '����' in line or '��' in line:
            # 删除乱码，保留注释符号
            line = '  // \n'
            fixes += 1
            print(f"Line {i}: Fixed comment")
    
    # 修复特定的已知问题
    if '`r`n' in line:
        line = line.replace('`r`n', '\n')
        fixes += 1
        print(f"Line {i}: Fixed line break")
    
    # 修复注释和代码在同一行的问题
    if '// 编辑任务时隐藏顶部日历  useEffect' in line:
        line = line.replace('// 编辑任务时隐藏顶部日历  useEffect', '// 编辑任务时隐藏顶部日历\n  useEffect')
        fixes += 1
        print(f"Line {i}: Fixed inline comment")
    
    fixed_lines.append(line)

# 写回文件
with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(fixed_lines)

print(f"\nTotal fixes: {fixes}")
print("Fixed NewTimelineView.tsx")



