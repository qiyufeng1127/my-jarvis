import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/components/calendar/NewTimelineView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. 添加新的导入
const importPattern = /import TaskVerificationCountdown from '\.\/TaskVerificationCountdown';/;
const newImport = `import TaskVerificationCountdown from './TaskVerificationCountdown';
import TaskVerificationCountdownContent from './TaskVerificationCountdownContent';`;

content = content.replace(importPattern, newImport);
console.log('✅ 添加了 TaskVerificationCountdownContent 导入');

// 2. 删除卡片内部的 TaskVerificationCountdown 覆盖层
const overlayPattern = /\{\/\* 🔥 验证倒计时覆盖层 - 在卡片内部 \*\/\}[\s\S]*?<TaskVerificationCountdown[\s\S]*?\/>\s*\)\}/;

if (content.match(overlayPattern)) {
  content = content.replace(overlayPattern, '');
  console.log('✅ 删除了卡片内部的覆盖层');
} else {
  console.log('⚠️ 未找到覆盖层，可能已被删除');
}

// 3. 在卡片内容区域添加条件渲染
// 查找卡片内容的开始位置（在标签和图标之后）
const cardContentPattern = /(data-task-id=\{block\.id\}[\s\S]*?{\/\* 卡片内容区域 \*\/})/;

const cardContentMatch = content.match(cardContentPattern);
if (!cardContentMatch) {
  console.log('❌ 未找到卡片内容区域标记');
  console.log('尝试查找其他标记...');
  
  // 尝试查找卡片标题区域
  const titlePattern = /(data-task-id=\{block\.id\}[\s\S]*?<div className=\{`\$\{isMobile \? 'text-sm' : 'text-base'\} font-bold`\})/;
  const titleMatch = content.match(titlePattern);
  
  if (titleMatch) {
    console.log('✅ 找到卡片标题区域');
    
    // 在标题之前插入条件渲染
    const insertCode = `
                {/* 🔥 条件渲染：倒计时内容 vs 正常内容 */}
                {(() => {
                  const now = new Date();
                  const hasScheduledStart = !!block.startTime;
                  const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;
                  const isTimeReached = scheduledStartTime ? now >= scheduledStartTime : false;
                  const showCountdown = hasScheduledStart && isTimeReached;
                  
                  if (showCountdown) {
                    return (
                      <TaskVerificationCountdownContent
                        taskId={block.id}
                        taskTitle={block.title}
                        scheduledStart={block.startTime}
                        scheduledEnd={block.endTime}
                        hasVerification={!!taskVerifications[block.id]?.enabled}
                        startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
                        completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
                      />
                    );
                  }
                  
                  // 正常内容继续渲染
                  return null;
                })()}
                
                {/* 正常卡片内容 - 仅在非倒计时状态显示 */}
                {!(() => {
                  const now = new Date();
                  const hasScheduledStart = !!block.startTime;
                  const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;
                  const isTimeReached = scheduledStartTime ? now >= scheduledStartTime : false;
                  return hasScheduledStart && isTimeReached;
                })() && (
                  <>
`;
    
    content = content.replace(titlePattern, `$1\n${insertCode}`);
    
    // 在卡片内容结束处添加闭合标签
    // 查找卡片容器的结束位置（在 </div> 之前，data-task-id 容器的结束）
    const cardEndPattern = /([\s\S]*?data-task-id=\{block\.id\}[\s\S]*?)(\s*<\/div>\s*{\/\* 间隙卡片 \*\/})/;
    const cardEndMatch = content.match(cardEndPattern);
    
    if (cardEndMatch) {
      // 在倒数第二个 </div> 之前添加闭合标签
      const beforeLastDiv = content.lastIndexOf('</div>', content.indexOf('{/* 间隙卡片 */}'));
      if (beforeLastDiv > 0) {
        content = content.slice(0, beforeLastDiv) + '\n                  </>\n                )}' + content.slice(beforeLastDiv);
        console.log('✅ 添加了条件渲染闭合标签');
      }
    }
    
    console.log('✅ 添加了条件渲染逻辑');
  } else {
    console.log('❌ 未找到合适的插入位置');
    process.exit(1);
  }
}

// 4. 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ 成功修改 NewTimelineView，使用条件渲染替换内容区域！');

