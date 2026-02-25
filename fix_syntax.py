# 修复第1964行的语法错误
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 修复第1964行（索引1963）
lines[1963] = "                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>\n"

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("语法错误已修复！")
print(f"第1964行已修复")








