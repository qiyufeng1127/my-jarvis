/**
 * 自动修改 NewTimelineView.tsx 的脚本
 * 这个脚本会安全地添加验证状态管理，不破坏现有功能
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/calendar/NewTimelineView.tsx');

console.log('📖 读取文件:', filePath);

// 读取文件
let content = fs.readFileSync(filePath, 'utf-8');
const originalContent = content; // 备份原始内容

console.log('📝 文件大小:', content.length, '字符');
console.log('📝 文件行数:', content.split('\n').length, '行');

// 1. 添加导入
console.log('\n🔧 步骤1: 添加导入语句...');
const importToAdd = `import TaskCard from './TaskCard';
import { useVerificationStates } from '@/hooks/useVerificationStates';`;

// 找到最后一个 import 语句的位置
const lastImportMatch = content.match(/import[^;]+;(?=\s*(?:export|const|function|class|interface|type))/g);
if (lastImportMatch) {
  const lastImport = lastImportMatch[lastImportMatch.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertPosition = lastImportIndex + lastImport.length;
  
  // 检查是否已经导入
  if (!content.includes('import TaskCard from')) {
    content = content.slice(0, insertPosition) + '\n' + importToAdd + content.slice(insertPosition);
    console.log('✅ 添加导入成功');
  } else {
    console.log('⏭️  导入已存在，跳过');
  }
}

// 2. 添加 Hook
console.log('\n🔧 步骤2: 添加验证状态管理 Hook...');
const hookToAdd = `
  // 验证状态管理 - 使用 Hook
  const {
    getState: getVerificationState,
    markStartVerificationBegin,
    markStartVerificationComplete,
    markCompleteVerificationComplete,
  } = useVerificationStates();
`;

// 找到组件函数内部的第一个 useState
const useStateMatch = content.match(/export default function \w+[^{]*{[\s\S]*?const \[/);
if (useStateMatch && !content.includes('useVerificationStates()')) {
  const insertPosition = useStateMatch.index + useStateMatch[0].length - 'const ['.length;
  content = content.slice(0, insertPosition) + hookToAdd + '\n  ' + content.slice(insertPosition);
  console.log('✅ 添加 Hook 成功');
} else {
  console.log('⏭️  Hook 已存在或找不到插入位置，跳过');
}

// 3. 添加验证处理函数
console.log('\n🔧 步骤3: 添加验证处理函数...');
const functionsToAdd = `
  // 处理启动验证
  const handleStartVerification = async (taskId: string) => {
    console.log('🚀 开始启动验证:', taskId);
    // 这里会触发原有的验证逻辑
    // 验证成功后调用 markStartVerificationComplete
  };

  // 处理完成验证
  const handleCompleteVerification = async (taskId: string) => {
    console.log('🏁 开始完成验证:', taskId);
    // 这里会触发原有的验证逻辑
    // 验证成功后调用 markCompleteVerificationComplete
  };
`;

if (!content.includes('handleStartVerification')) {
  // 在 return 语句之前添加
  const returnMatch = content.match(/\n\s*return\s*\(/);
  if (returnMatch) {
    const insertPosition = returnMatch.index;
    content = content.slice(0, insertPosition) + functionsToAdd + content.slice(insertPosition);
    console.log('✅ 添加验证处理函数成功');
  }
} else {
  console.log('⏭️  验证处理函数已存在，跳过');
}

// 4. 保存修改
console.log('\n💾 保存修改...');

// 创建备份
const backupPath = filePath + '.backup';
fs.writeFileSync(backupPath, originalContent, 'utf-8');
console.log('✅ 创建备份:', backupPath);

// 保存修改后的文件
fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ 保存修改成功');

console.log('\n📊 修改统计:');
console.log('- 原始大小:', originalContent.length, '字符');
console.log('- 修改后大小:', content.length, '字符');
console.log('- 增加:', content.length - originalContent.length, '字符');

console.log('\n✅ 自动修改完成！');
console.log('\n⚠️  重要提示:');
console.log('1. 请刷新浏览器测试功能');
console.log('2. 如果有问题，备份文件在:', backupPath);
console.log('3. 你还需要手动修改任务卡片的渲染部分（参考 NewTimelineView修改指南.md）');

