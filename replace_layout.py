import sys

# 读取文件
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 读取替换内容
with open('temp_replacement.txt', 'r', encoding='utf-8') as f:
    replacement = f.read()

# 找到要替换的起始和结束行（1844-1867，索引是1843-1866）
start_line = 1844
end_line = 1867

# 构建新内容
new_lines = lines[:start_line] + [replacement + '\n'] + lines[end_line:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("替换完成！")





