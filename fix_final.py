#!/usr/bin/env python3
# -*- coding: utf-8 -*-

filepath = 'w:/001jiaweis/22222/src/components/calendar/NewTimelineView.tsx'

# 读取文件（二进制模式）
with open(filepath, 'rb') as f:
    content = f.read()

# 转换为字符串
text = content.decode('utf-8', errors='ignore')

# 修复已知问题
# 1. 删除 `r`n
text = text.replace('`r`n', '')

# 2. 替换乱码注释
text = text.replace('// ����״̬', '// 任务状态')
text = text.replace('// ������֤������', '// 正在验证的任务')
text = text.replace('// ��֤����', '// 验证类型')
text = text.replace('// ������֤��ʱ���', '// 任务验证超时状态')
text = text.replace('// �����֤��ʱ���', '// 任务验证超时状态')
text = text.replace('// ����ʵ������ʱ��', '// 任务实际开始时间')

# 删除所有其他乱码字符（保留ASCII和中文）
import re
# 只保留ASCII、中文、常见标点和空白字符
# text = re.sub(r'[^\x00-\x7F\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s]', '', text)

# 写回文件
with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print('Fixed NewTimelineView.tsx')

