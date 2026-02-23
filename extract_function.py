with open(r'w:\001jiaweis\22222\src\components\calendar\NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到handleStartTask函数
start_line = 881  # 第882行，索引是881
brace_count = 0
end_line = start_line

# 找到函数结束位置
for i in range(start_line, min(start_line + 200, len(lines))):
    line = lines[i]
    brace_count += line.count('{') - line.count('}')
    if i > start_line and brace_count == 0:
        end_line = i
        break

# 保存到文件
with open(r'w:\001jiaweis\22222\handleStartTask.txt', 'w', encoding='utf-8') as f:
    for i in range(start_line, end_line + 1):
        f.write(f"{i+1}: {lines[i]}")

print(f"已提取handleStartTask函数（第{start_line+1}行到第{end_line+1}行）到 handleStartTask.txt")

