# 删除有问题的注释行
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# 删除或替换有问题的行
lines[1960] = "                    {/* 完成按钮区域 */}\n"
lines[1962] = "                      {/* 任务图标 */}\n"
lines[1964] = "                        {/* AI生成子任务 */}\n"

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed!")







