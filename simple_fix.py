#!/usr/bin/env python3
# -*- coding: utf-8 -*-

file_path = r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx'

print("正在读取文件...")
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"文件共 {len(lines)} 行")

# 查找包含 setEfficiencyModalOpen(true) 的行
for i, line in enumerate(lines):
    if 'setEfficiencyModalOpen(true)' in line:
        print(f"\n找到目标代码在第 {i+1} 行")
        print(f"上下文 (第 {max(0, i-20)} 到 {i+5} 行):")
        for j in range(max(0, i-20), min(len(lines), i+5)):
            print(f"{j+1:4d}: {lines[j]}", end='')
        
        # 找到 onComplete 的开始位置
        start_line = i
        for k in range(i, max(0, i-30), -1):
            if 'onComplete={(actualEndTime) => {' in lines[k]:
                start_line = k
                break
        
        print(f"\n\nonComplete 开始于第 {start_line+1} 行")
        print("\n需要在以下位置插入代码:")
        
        # 找到第三个 console.log 之后的位置
        console_count = 0
        insert_line = start_line
        for k in range(start_line, min(len(lines), start_line + 20)):
            if 'console.log' in lines[k]:
                console_count += 1
                if console_count == 3:
                    insert_line = k + 1
                    break
        
        print(f"在第 {insert_line+1} 行之后插入新代码")
        break
else:
    print("❌ 未找到 setEfficiencyModalOpen(true)")

