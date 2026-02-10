# 彻底修复所有乱码注释和文本
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# 替换所有有问题的行
replacements = {
    1960: "                    {/* 完成按钮区域 */}\n",
    1962: "                      {/* 任务图标 */}\n",
    1964: "                        {/* AI生成子任务 */}\n",
    1970: "                          title=\"AI生成子任务\"\n",
    1975: "                        {/* 验证按钮 */}\n",
    1991: "                          title={taskVerifications[block.id]?.enabled ? '编辑验证关键词' : '启用任务验证'}\n",
    1996: "                        {/* 展开按钮 */}\n",
}

for line_num, new_content in replacements.items():
    if line_num - 1 < len(lines):
        lines[line_num - 1] = new_content

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("All lines fixed successfully!")
print(f"Total: {len(replacements)} lines")



