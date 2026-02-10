import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/components/calendar/NewTimelineView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. 找到并删除当前位置的 TaskVerificationCountdown（在事件卡片外部）
// 匹配从 })() && ( 到 </TaskVerificationCountdown> 的整个块
const countdownPattern = /\}\)\(\) && \(\s*<TaskVerificationCountdown[\s\S]*?<\/TaskVerificationCountdown>\s*\)\}/;

const countdownMatch = content.match(countdownPattern);
if (!countdownMatch) {
  console.log('❌ 未找到 TaskVerificationCountdown 代码块');
  console.log('尝试查找简化模式...');
  
  // 尝试更简单的模式
  const simplePattern = /<TaskVerificationCountdown[\s\S]*?\/>/;
  const simpleMatch = content.match(simplePattern);
  if (!simpleMatch) {
    console.log('❌ 也未找到简化模式');
    process.exit(1);
  }
  
  console.log('✅ 找到 TaskVerificationCountdown（简化模式）');
  // 找到包含它的完整块（包括条件判断）
  const fullPattern = /\{\(\(\) => \{[\s\S]*?\}\)\(\) && \(\s*<TaskVerificationCountdown[\s\S]*?\/>\s*\)\}/;
  const fullMatch = content.match(fullPattern);
  if (fullMatch) {
    content = content.replace(fullPattern, '');
    console.log('✅ 删除了完整的条件块');
  } else {
    // 只删除组件本身
    content = content.replace(simplePattern, '');
    console.log('✅ 删除了组件（无条件块）');
  }
} else {
  console.log('✅ 找到 TaskVerificationCountdown 代码块');
  // 删除原位置的代码
  content = content.replace(countdownPattern, '');
}

// 2. 找到事件卡片容器的开始位置（包含 data-task-id 的 div）
const cardContainerPattern = /(<div\s+data-task-id=\{block\.id\}\s+className=\{`flex-1[^>]*>\s*)/;

const cardMatch = content.match(cardContainerPattern);
if (!cardMatch) {
  console.log('❌ 未找到事件卡片容器');
  process.exit(1);
}

console.log('✅ 找到事件卡片容器');

// 3. 在卡片容器内部插入 TaskVerificationCountdown
const insertCode = `
                {/* 🔥 验证倒计时覆盖层 - 在卡片内部 */}
                {(() => {
                  const now = new Date();
                  const hasScheduledStart = !!block.startTime;
                  const scheduledStartTime = block.startTime ? new Date(block.startTime) : null;
                  const isTimeReached = scheduledStartTime ? now >= scheduledStartTime : false;
                  
                  return hasScheduledStart && isTimeReached;
                })() && (
                  <TaskVerificationCountdown
                    taskId={block.id}
                    taskTitle={block.title}
                    scheduledStart={block.startTime}
                    scheduledEnd={block.endTime}
                    startPhotoHint={\`请拍摄 \${block.title} 开始的照片\`}
                    endPhotoHint={\`请拍摄 \${block.title} 完成的照片\`}
                    cardColor={block.color}
                    hasVerification={!!taskVerifications[block.id]?.enabled}
                    startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
                    completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
                  />
                )}
`;

content = content.replace(cardContainerPattern, `$1${insertCode}`);

// 4. 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ 成功将 TaskVerificationCountdown 移动到事件卡片内部！');

