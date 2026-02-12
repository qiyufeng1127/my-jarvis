import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 第一步：修复剩余乱码 ===\n');

// 修复所有剩余的乱码
const replacements = {
  '?? 金币奖励': '💰 金币奖励',
  '??金币奖励': '💰 金币奖励',
  '?�金币奖励': '💰 金币奖励',
  '�� 金币奖励': '💰 金币奖励',
  '?? �金币奖励': '💰 金币奖励',
  '?? 分钟个': '📋 任务',
  '??分钟个': '📋 任务',
  '分钟个': '任务',
  '个�请分钟分钟个�个�': '例如：月入5w、坚持100天',
};

let modified = false;
for (const [oldText, newText] of Object.entries(replacements)) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    console.log(`✓ 替换: ${oldText.substring(0, 20)}... -> ${newText}`);
    modified = true;
  }
}

if (modified) {
  console.log('\n✓ 乱码修复完成\n');
} else {
  console.log('\n未找到需要替换的乱码\n');
}

console.log('=== 第二步：检查自动触发逻辑 ===\n');

// 检查是否有自动触发的代码
if (content.includes('自动触发倒计时')) {
  console.log('✓ 找到自动触发倒计时代码');
  
  // 检查是否正确监听时间
  if (content.includes('checkTaskStartTime')) {
    console.log('✓ 找到时间检查函数');
  } else {
    console.log('✗ 缺少时间检查函数');
  }
  
  // 检查是否更新验证状态
  if (content.includes("status: 'waiting_start'")) {
    console.log('✓ 找到状态更新逻辑');
  } else {
    console.log('✗ 缺少状态更新逻辑');
  }
} else {
  console.log('✗ 未找到自动触发倒计时代码');
}

console.log('\n=== 第三步：检查倒计时显示组件 ===\n');

// 检查是否有倒计时显示组件
if (content.includes('StartVerificationCountdown')) {
  console.log('✓ 找到启动验证倒计时组件');
} else {
  console.log('✗ 缺少启动验证倒计时组件');
}

if (content.includes('FinishVerificationCountdown')) {
  console.log('✓ 找到完成验证倒计时组件');
} else {
  console.log('✗ 缺少完成验证倒计时组件');
}

// 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n=== 修复完成 ===');
console.log('\n如果自动触发倒计时仍然不工作，请检查：');
console.log('1. 任务是否已启用验证（taskVerifications[taskId].enabled === true）');
console.log('2. 任务验证状态是否为 pending');
console.log('3. 任务的 scheduledStart 时间是否正确');
console.log('4. 浏览器控制台是否有相关日志输出');

