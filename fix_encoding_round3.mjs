import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 第三轮乱码映射
const replacements = {
  'Ĭ分钟��ʱ��Ϊʣ��ʱ分钟һ�룬分钟分钟60���ӣ分钟���15分钟': '默认任务时长为剩余时长的一半，但不超过60分钟，不少于15分钟',
  '分钟Ψһ分钟分钟分钟��ʶ��': '生成唯一的任务标题用于识别',
  '分钟��_': '新任务_',
  'Ĭ��10分钟/分钟': '默认10金币/分钟',
  '���ô��༭分钟分钟': '设置待编辑的任务标题',
  '���ս分钟�ʣ': '今日结束还剩',
  '��״̬': '空状态',
  '���컹û分钟��': '今天还没有任务',
  '分钟�·���ť���ӵ�һ分钟��': '点击下方按钮添加第一个任务',
  '分钟��': '任务',
  '��': '不',
  '��': '超',
  '��': '少',
  '��': '生',
  '��': '成',
  '��': '唯',
  '��': '一',
  '��': '的',
  '��': '标',
  '��': '题',
  '��': '用',
  '��': '于',
  '��': '识',
  '��': '别',
  '��': '设',
  '��': '置',
  '��': '待',
  '��': '编',
  '��': '辑',
  '��': '今',
  '��': '日',
  '��': '结',
  '��': '束',
  '��': '还',
  '��': '剩',
  '��': '空',
  '��': '态',
  '��': '天',
  '��': '没',
  '��': '有',
  '��': '点',
  '��': '击',
  '��': '下',
  '��': '方',
  '��': '按',
  '��': '钮',
  '��': '添',
  '��': '加',
  '��': '第',
  '��': '个',
};

// 执行替换
let modified = false;
for (const [oldText, newText] of Object.entries(replacements)) {
  if (content.includes(oldText)) {
    const count = content.split(oldText).length - 1;
    content = content.split(oldText).join(newText);
    console.log(`替换 (${count}次): ${oldText.substring(0, 30)}... -> ${newText}`);
    modified = true;
  }
}

if (modified) {
  // 保存文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✓ 文件已修复并保存');
} else {
  console.log('未找到需要替换的乱码');
}

