import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 重新添加倒计时覆盖层（确保正确插入）===\n');

// 找到验证中遮罩层的结束位置
const searchMarker = `AI正在识别图片内容`;

const lines = content.split('\n');
let insertLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(searchMarker)) {
    // 找到这个遮罩层的结束 </div>
    for (let j = i; j < i + 10; j++) {
      if (lines[j].includes('</div>') && lines[j+1].includes('</div>') && lines[j+2].includes('</div>') && lines[j+3].includes(')}')) {
        insertLine = j + 4; // 在 )}) 之后插入
        break;
      }
    }
    break;
  }
}

if (insertLine === -1) {
  console.log('❌ 未找到插入位置');
  process.exit(1);
}

console.log(`✓ 找到插入位置：第 ${insertLine} 行`);

// 倒计时覆盖层代码
const countdownCode = `
                {/* 启动倒计时覆盖层 */}
                {(() => {
                  if (block.isCompleted || block.status === 'in_progress') return null;
                  
                  const now = new Date();
                  const startTime = new Date(block.startTime);
                  const timeDiff = now.getTime() - startTime.getTime();
                  
                  if (timeDiff < -1000 || timeDiff >= 120000) return null;
                  
                  const elapsed = Math.floor(timeDiff / 1000);
                  const remaining = Math.max(0, 120 - elapsed);
                  const minutes = Math.floor(remaining / 60);
                  const seconds = remaining % 60;
                  
                  return (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl p-4"
                         style={{ backgroundColor: block.color }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">⏰</span>
                        <span className="text-lg font-bold text-white">请开始启动</span>
                      </div>
                      
                      <div className="text-6xl font-bold text-white mb-6">
                        {\`\${minutes}:\${seconds.toString().padStart(2, '0')}\`}
                      </div>
                      
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

                {/* 完成倒计时覆盖层 */}
                {(() => {
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
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-lg font-bold text-white">距离任务完成还有</span>
                      </div>
                      
                      <div className="text-6xl font-bold text-white mb-6">
                        {hours > 0 
                          ? \`\${hours}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`
                          : \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`
                        }
                      </div>
                      
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

// 插入代码
lines.splice(insertLine, 0, countdownCode);

// 保存文件
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log(`✓ 已在第 ${insertLine} 行插入倒计时覆盖层代码`);
console.log('\n=== 完成 ===');
console.log('倒计时覆盖层已成功添加！');
console.log('刷新浏览器即可看到效果');

