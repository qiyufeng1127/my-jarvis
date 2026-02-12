import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 实现正确的倒计时流程 ===\n');
console.log('流程：正常卡片 → 启动倒计时(2分钟) → 完成倒计时(任务时长) → 结束\n');

// 1. 首先删除之前所有错误的倒计时代码
let lines = content.split('\n');

// 找到并删除所有倒计时相关的覆盖层
let toDelete = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('启动倒计时覆盖层') || 
      lines[i].includes('完成倒计时覆盖层') ||
      lines[i].includes('shouldShowStartCountdown')) {
    // 找到这个块的结束
    let start = i;
    let braceCount = 0;
    for (let j = i; j < Math.min(i + 150, lines.length); j++) {
      const line = lines[j];
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (j > start && braceCount === 0 && line.includes('})()}')) {
        toDelete.push({ start, end: j });
        break;
      }
    }
  }
}

// 从后往前删除
for (let i = toDelete.length - 1; i >= 0; i--) {
  const { start, end } = toDelete[i];
  lines.splice(start, end - start + 1);
  console.log(`✓ 删除了第 ${start}-${end} 行的旧倒计时代码`);
}

content = lines.join('\n');

// 2. 在验证中遮罩层之后添加正确的倒计时覆盖层
const correctCountdownOverlay = `
                {/* 启动倒计时覆盖层 - 到达时间后自动显示2分钟倒计时 */}
                {(() => {
                  // 条件1：任务未完成且未进行中
                  if (block.isCompleted || block.status === 'in_progress') return null;
                  
                  const now = new Date();
                  const startTime = new Date(block.startTime);
                  const timeDiff = now.getTime() - startTime.getTime();
                  
                  // 条件2：已到达开始时间且在2分钟内
                  if (timeDiff < 0 || timeDiff >= 120000) return null;
                  
                  // 计算倒计时
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
                      
                      {/* 关键词提示 */}
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

                {/* 完成倒计时覆盖层 - 启动后显示任务剩余时间 */}
                {(() => {
                  // 条件：任务进行中且未完成
                  if (block.status !== 'in_progress' || block.isCompleted) return null;
                  
                  const now = new Date();
                  const startTime = taskActualStartTimes[block.id] || new Date(block.startTime);
                  const estimatedMinutes = block.duration || block.durationMinutes || 30;
                  const endTime = new Date(startTime.getTime() + estimatedMinutes * 60000);
                  const remainingMs = endTime.getTime() - now.getTime();
                  const remaining = Math.max(0, Math.floor(remainingMs / 1000));
                  
                  const hours = Math.floor(remaining / 3600);
                  const minutes = Math.floor((remaining % 3600) / 60);
                  const seconds = remaining % 60;
                  
                  return (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl p-4"
                         style={{ backgroundColor: block.color }}>
                      {/* 顶部标题 */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-lg font-bold text-white">距离任务完成还有</span>
                      </div>
                      
                      {/* 倒计时大字 */}
                      <div className="text-6xl font-bold text-white mb-6">
                        {hours > 0 
                          ? \`\${hours}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`
                          : \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`
                        }
                      </div>
                      
                      {/* 关键词提示 */}
                      {taskVerifications[block.id]?.completionKeywords && taskVerifications[block.id].completionKeywords.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📸</span>
                            <span className="text-sm font-medium text-white">完成后请拍摄包含：</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 justify-center mb-6">
                            {taskVerifications[block.id].completionKeywords.map((keyword, idx) => (
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
                      
                      {/* 完成按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteTask(block.id);
                        }}
                        className="px-8 py-3 rounded-full bg-green-500 text-white font-bold text-base hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="text-lg">✅</span>
                        完成任务
                      </button>
                    </div>
                  );
                })()}
`;

// 在验证中遮罩层之后插入
const marker = `AI正在识别图片内容
                      </div>
                    </div>
                  </div>
                )}`;

const insertPos = content.indexOf(marker);
if (insertPos > 0) {
  const insertAt = insertPos + marker.length;
  content = content.slice(0, insertAt) + correctCountdownOverlay + content.slice(insertAt);
  console.log('✓ 已添加正确的倒计时覆盖层');
}

// 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n=== 实现完成 ===\n');
console.log('正确的流程：');
console.log('1️⃣ 图1：正常卡片（显示任务信息）');
console.log('2️⃣ 到达4:15 → 图2：启动倒计时（2分钟，1:57...）');
console.log('3️⃣ 完成启动验证 → 完成倒计时（10:00 → 9:59 → 9:58...）');
console.log('4️⃣ 完成验证 → 任务结束');
console.log('\n刷新浏览器查看效果！');

