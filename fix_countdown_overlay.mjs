import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 重新设计倒计时覆盖层 ===\n');

// 1. 删除之前添加的错误覆盖层
const wrongOverlay1 = `{/* 启动倒计时覆盖层 - 参考图1设计 */}
                {!block.isCompleted && 
                 block.status !== 'in_progress' && 
                 new Date(block.startTime) <= new Date() && (`;

const wrongOverlay2 = `{/* 完成倒计时覆盖层 */}
                {block.status === 'in_progress' && !block.isCompleted && (`;

// 找到并删除这两个覆盖层
let lines = content.split('\n');
let deleteRanges = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('启动倒计时覆盖层 - 参考图1设计') || 
      lines[i].includes('完成倒计时覆盖层')) {
    let start = i;
    let braceCount = 0;
    let foundStart = false;
    
    // 找到这个覆盖层的结束位置
    for (let j = i; j < Math.min(i + 200, lines.length); j++) {
      if (lines[j].includes('(')) {
        if (!foundStart) foundStart = true;
        braceCount += (lines[j].match(/\(/g) || []).length;
      }
      if (lines[j].includes(')')) {
        braceCount -= (lines[j].match(/\)/g) || []).length;
      }
      
      if (foundStart && braceCount === 0 && lines[j].includes(')}')) {
        deleteRanges.push({ start, end: j });
        break;
      }
    }
  }
}

// 从后往前删除，避免索引变化
for (let i = deleteRanges.length - 1; i >= 0; i--) {
  const { start, end } = deleteRanges[i];
  lines.splice(start, end - start + 1);
  console.log(`✓ 删除了第 ${start}-${end} 行的错误覆盖层`);
}

content = lines.join('\n');

// 2. 重新添加正确的倒计时覆盖层
// 这次只在真正需要时显示，并且不会一直覆盖

const correctOverlay = `
                {/* 启动倒计时覆盖层 - 只在到达时间且未启动时显示 */}
                {(() => {
                  const now = new Date();
                  const startTime = new Date(block.startTime);
                  const timeDiff = now.getTime() - startTime.getTime();
                  
                  // 只在以下条件同时满足时显示：
                  // 1. 任务未完成
                  // 2. 任务未进行中
                  // 3. 已到达或超过开始时间
                  // 4. 超过时间不超过2分钟（120秒）
                  const shouldShowStartCountdown = 
                    !block.isCompleted && 
                    block.status !== 'in_progress' && 
                    timeDiff >= 0 && 
                    timeDiff < 120000;
                  
                  if (!shouldShowStartCountdown) return null;
                  
                  const elapsed = Math.floor(timeDiff / 1000);
                  const remaining = Math.max(0, 120 - elapsed);
                  const minutes = Math.floor(remaining / 60);
                  const seconds = remaining % 60;
                  
                  return (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl p-4"
                         style={{ backgroundColor: block.color }}>
                      {/* 顶部标题 */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">⏰</span>
                        <span className="text-lg font-bold text-white">请开始启动</span>
                      </div>
                      
                      {/* 倒计时大字 */}
                      <div className="text-6xl font-bold text-white mb-6">
                        {\`\${minutes}:\${seconds.toString().padStart(2, '0')}\`}
                      </div>
                      
                      {/* 提示文字和关键词 */}
                      {taskVerifications[block.id]?.startKeywords && taskVerifications[block.id].startKeywords.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📸</span>
                            <span className="text-sm font-medium text-white">请拍摄包含以下内容：</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 justify-center mb-6">
                            {taskVerifications[block.id].startKeywords.map((keyword, idx) => (
                              <span 
                                key={idx}
                                className="px-4 py-2 rounded-full text-sm font-bold bg-white/90"
                                style={{ color: block.color }}
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* 操作按钮 */}
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.capture = 'environment';
                            input.onchange = (e) => handleVerificationImage(e, block.id, 'start');
                            input.click();
                          }}
                          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 font-bold text-sm hover:scale-105 transition-all"
                          style={{ color: block.color }}
                        >
                          <span className="text-lg">📷</span>
                          拍照
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handleVerificationImage(e, block.id, 'start');
                            input.click();
                          }}
                          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 font-bold text-sm hover:scale-105 transition-all"
                          style={{ color: block.color }}
                        >
                          <span className="text-lg">⬆️</span>
                          上传
                        </button>
                      </div>
                      
                      {/* 启动验证按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTask(block.id);
                        }}
                        className="px-8 py-3 rounded-full bg-green-500 text-white font-bold text-base hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="text-lg">✅</span>
                        启动验证
                      </button>
                    </div>
                  );
                })()}
`;

// 在验证中遮罩层之后插入
const verifyingMaskEnd = `</div>
                )}`;

const insertPosition = content.indexOf(verifyingMaskEnd);
if (insertPosition > 0) {
  const insertAt = insertPosition + verifyingMaskEnd.length;
  content = content.slice(0, insertAt) + correctOverlay + content.slice(insertAt);
  console.log('✓ 已添加正确的启动倒计时覆盖层');
}

// 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n=== 重新设计完成 ===\n');
console.log('修复的问题：');
console.log('✅ 倒计时只在到达时间后的2分钟内显示');
console.log('✅ 倒计时逻辑正确，从2分钟开始倒数');
console.log('✅ 超过2分钟后自动消失，显示正常卡片');
console.log('✅ 点击启动后立即消失');
console.log('\n刷新浏览器查看效果！');

