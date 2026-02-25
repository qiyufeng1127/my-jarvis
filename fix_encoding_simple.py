import codecs

filepath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx'

# 读取文件
with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# 查找并替换乱码行
fixed_lines = []
changes = 0
for i, line in enumerate(lines, 1):
    # 检查是否包含乱码
    if '����' in line or '��' in line:
        # 如果是注释行，替换为空注释或合适的注释
        if line.strip().startswith('//'):
            fixed_line = '  // 任务状态\n' if '����״̬' in line else line.replace('����', '').replace('��', '')
            fixed_lines.append(fixed_line)
            changes += 1
            print(f'Line {i}: Fixed encoding issue')
        else:
            # 非注释行，只删除乱码字符
            fixed_line = line.replace('����', '').replace('��', '')
            fixed_lines.append(fixed_line)
            changes += 1
            print(f'Line {i}: Removed garbled characters')
    else:
        fixed_lines.append(line)

# 写回文件
if changes > 0:
    with codecs.open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    print(f'Total changes: {changes}')
else:
    print('No changes needed')



