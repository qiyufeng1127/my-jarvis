#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动修复重复启动验证bug
"""

import re

# 读取文件
file_path = r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 备份原文件
with open(file_path + '.backup', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已创建备份文件: NewTimelineView.tsx.backup")

# 修复第一处（约1982行）
# 查找模式
pattern1 = r"(\s+)\{!block\.isCompleted && block\.status !== 'in_progress' && \(\s+<button\s+onClick=\{\(\) => handleStartTask\(block\.id\)\}\s+disabled=\{startingTask === block\.id\}\s+className=\{`\$\{isMobile \? 'px-2 py-0\.5 text-xs' : 'px-3 py-1 text-sm'\} rounded-full font-bold transition-all hover:scale-105 disabled:opacity-50`\}\s+style=\{\{\s+backgroundColor: taskVerifications\[block\.id\]\?\.status === 'started'\s+\? 'rgba\(34,197,94,0\.3\)'\s+: 'rgba\(255,255,255,0\.95\)',\s+color: taskVerifications\[block\.id\]\?\.status === 'started'\s+\? 'rgba\(255,255,255,0\.95\)'\s+: block\.color,\s+\}\}\s+title=\{\s+taskVerifications\[block\.id\]\?\.status === 'started'\s+\? '已完成启动验证'\s+: taskVerifications\[block\.id\]\?\.enabled\s+\? '点击启动验证'\s+: '开始任务'\s+\}\s+>\s+\{startingTask === block\.id\s+\? '⏳'\s+: taskVerifications\[block\.id\]\?\.status === 'started'\s+\? '✅已启动'\s+: '\*start'\}\s+</button>\s+\)\}"

# 替换内容
replacement1 = r"""\1{!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
\1  <button
\1    onClick={() => handleStartTask(block.id)}
\1    disabled={startingTask === block.id}
\1    className={`${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-bold transition-all hover:scale-105 disabled:opacity-50`}
\1    style={{ 
\1      backgroundColor: 'rgba(255,255,255,0.95)',
\1      color: block.color,
\1    }}
\1    title={
\1      taskVerifications[block.id]?.enabled 
\1        ? '点击启动验证' 
\1        : '开始任务'
\1    }
\1  >
\1    {startingTask === block.id ? '⏳' : '*start'}
\1  </button>
\1)}
\1
\1{/* 已启动标识 */}
\1{taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (
\1  <div 
\1    className={`${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-bold`}
\1    style={{ 
\1      backgroundColor: 'rgba(34,197,94,0.3)',
\1      color: 'rgba(255,255,255,0.95)',
\1    }}
\1  >
\1    ✅已启动
\1  </div>
\1)}"""

# 由于正则表达式太复杂，我们使用简单的行替换方法
lines = content.split('\n')

# 第一处修复（约1982行）
for i in range(len(lines)):
    if i >= 1981 and i <= 1982:
        if "!block.isCompleted && block.status !== 'in_progress' && (" in lines[i]:
            # 修改这一行
            lines[i] = lines[i].replace(
                "!block.isCompleted && block.status !== 'in_progress' && (",
                "!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && ("
            )
            print(f"✅ 已修复第一处（第{i+1}行）")
            
            # 找到按钮结束的位置并添加已启动标识
            for j in range(i, min(i+30, len(lines))):
                if ")}" in lines[j] and "button" in lines[j-1]:
                    # 在这里插入已启动标识
                    indent = " " * 24
                    new_lines = [
                        "",
                        indent + "{/* 已启动标识 */}",
                        indent + "{taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (",
                        indent + "  <div ",
                        indent + "    className={`${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full font-bold`}",
                        indent + "    style={{ ",
                        indent + "      backgroundColor: 'rgba(34,197,94,0.3)',",
                        indent + "      color: 'rgba(255,255,255,0.95)',",
                        indent + "    }}",
                        indent + "  >",
                        indent + "    ✅已启动",
                        indent + "  </div>",
                        indent + ")}",
                    ]
                    lines[j:j] = new_lines
                    print(f"✅ 已添加第一处的已启动标识（第{j+1}行后）")
                    break
            break

# 第二处修复（约2304行）
for i in range(len(lines)):
    if i >= 2303 and i <= 2305:
        if "!block.isCompleted && block.status !== 'in_progress' && (" in lines[i]:
            # 修改这一行
            lines[i] = lines[i].replace(
                "!block.isCompleted && block.status !== 'in_progress' && (",
                "!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && ("
            )
            print(f"✅ 已修复第二处（第{i+1}行）")
            
            # 找到按钮结束的位置并添加已启动标识
            for j in range(i, min(i+20, len(lines))):
                if ")}" in lines[j] and "button" in lines[j-1]:
                    # 在这里插入已启动标识
                    indent = " " * 22
                    new_lines = [
                        "",
                        indent + "{/* 已启动标识 */}",
                        indent + "{taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (",
                        indent + "  <div ",
                        indent + "    className=\"px-4 py-1.5 rounded-full font-bold text-sm\"",
                        indent + "    style={{ ",
                        indent + "      backgroundColor: 'rgba(34,197,94,0.3)',",
                        indent + "      color: 'rgba(255,255,255,0.95)',",
                        indent + "    }}",
                        indent + "  >",
                        indent + "    ✅ 已启动",
                        indent + "  </div>",
                        indent + ")}",
                    ]
                    lines[j:j] = new_lines
                    print(f"✅ 已添加第二处的已启动标识（第{j+1}行后）")
                    break
            break

# 写回文件
new_content = '\n'.join(lines)
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("\n🎉 修复完成！")
print("📝 原文件已备份为: NewTimelineView.tsx.backup")
print("✅ 已修复两处重复启动验证bug")
print("\n请刷新浏览器测试功能！")







