import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== 修改倒计时显示方式：从展开区域移到卡片覆盖层 ===\n');

// 1. 先删除展开区域中的倒计时显示
const oldCountdownInExpanded = `{/* 自动启动倒计时 - 所有任务都显示 */}
                    {(taskVerifications[block.id]?.status === 'waiting_start' || 
                      (!block.isCompleted && block.status !== 'in_progress' && new Date(block.startTime) <= new Date())) && (
                      <div className="mt-2">
                        <StartVerificationCountdown
                          taskId={block.id}
                          onTimeout={handleStartVerificationTimeout}
                          onComplete={() => {}}
                          keywords={taskVerifications[block.id]?.startKeywords || []}
                          isStarted={taskVerifications[block.id]?.status === 'started'}
                        />
                      </div>
                    )}
                    
                    {/* 任务剩余时间倒计时 - 所有进行中的任务都显示 */}
                    {block.status === 'in_progress' && !block.isCompleted && (
                      <div className="mt-2">
                        <FinishVerificationCountdown
                          taskId={block.id}
                          estimatedMinutes={block.duration || block.durationMinutes || 30}
                          onTimeout={handleFinishVerificationTimeout}
                          keywords={taskVerifications[block.id]?.completionKeywords || []}
                          isCompleted={block.isCompleted || false}
                          startTime={taskActualStartTimes[block.id] || taskVerifications[block.id]?.actualStartTime || new Date(block.startTime)}
                        />
                      </div>
                    )}`;

if (content.includes(oldCountdownInExpanded)) {
  content = content.replace(oldCountdownInExpanded, '');
  console.log('✓ 已删除展开区域中的倒计时显示');
}

// 2. 在卡片主体中添加倒计时覆盖层（在验证中遮罩层之后）
// 找到验证中遮罩层的位置
const verifyingMaskMarker = `{/* 验证中遮罩层 */}`;
const insertAfterVerifyingMask = `{/* 验证中遮罩层 */}
                {verifyingTask === block.id && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-3 animate-pulse">🔍</div>
                      <div className="text-lg font-bold mb-2">
                        正在进行{verifyingType === 'start' ? '启动' : '完成'}验证...
                      </div>
                      <div className="text-sm opacity-80">
                        AI正在识别图片内容
                      </div>
                    </div>
                  </div>
                )}

                {/* 启动倒计时覆盖层 - 参考图1设计 */}
                {!block.isCompleted && 
                 block.status !== 'in_progress' && 
                 new Date(block.startTime) <= new Date() && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl p-4"
                       style={{ backgroundColor: block.color }}>
                    {/* 顶部标题 */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">⏰</span>
                      <span className="text-lg font-bold text-white">请开始启动</span>
                    </div>
                    
                    {/* 倒计时大字 */}
                    <div className="text-6xl font-bold text-white mb-6">
                      {(() => {
                        const now = new Date();
                        const startTime = new Date(block.startTime);
                        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                        const remaining = Math.max(0, 120 - elapsed); // 2分钟 = 120秒
                        const minutes = Math.floor(remaining / 60);
                        const seconds = remaining % 60;
                        return \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                      })()}
                    </div>
                    
                    {/* 提示文字 */}
                    {taskVerifications[block.id]?.startKeywords && taskVerifications[block.id].startKeywords.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">📸</span>
                          <span className="text-sm font-medium text-white">请拍摄包含以下内容：</span>
                        </div>
                        
                        {/* 关键词标签 */}
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
                        onClick={() => {
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
                        onClick={() => {
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
                      onClick={() => handleStartTask(block.id)}
                      className="px-8 py-3 rounded-full bg-green-500 text-white font-bold text-base hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <span className="text-lg">✅</span>
                      启动验证
                    </button>
                  </div>
                )}

                {/* 完成倒计时覆盖层 */}
                {block.status === 'in_progress' && !block.isCompleted && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl p-4"
                       style={{ backgroundColor: block.color }}>
                    {/* 顶部标题 */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">⏱️</span>
                      <span className="text-lg font-bold text-white">距离任务完成还有</span>
                    </div>
                    
                    {/* 倒计时大字 */}
                    <div className="text-6xl font-bold text-white mb-6">
                      {(() => {
                        const now = new Date();
                        const startTime = taskActualStartTimes[block.id] || new Date(block.startTime);
                        const estimatedMinutes = block.duration || block.durationMinutes || 30;
                        const endTime = new Date(startTime.getTime() + estimatedMinutes * 60000);
                        const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
                        const hours = Math.floor(remaining / 3600);
                        const minutes = Math.floor((remaining % 3600) / 60);
                        const seconds = remaining % 60;
                        
                        if (hours > 0) {
                          return \`\${hours}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
                        }
                        return \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                      })()}
                    </div>
                    
                    {/* 提示文字 */}
                    {taskVerifications[block.id]?.completionKeywords && taskVerifications[block.id].completionKeywords.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">📸</span>
                          <span className="text-sm font-medium text-white">完成后请拍摄包含：</span>
                        </div>
                        
                        {/* 关键词标签 */}
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
                      onClick={() => handleCompleteTask(block.id)}
                      className="px-8 py-3 rounded-full bg-green-500 text-white font-bold text-base hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <span className="text-lg">✅</span>
                      完成任务
                    </button>
                  </div>
                )}`;

if (content.includes(verifyingMaskMarker)) {
  content = content.replace(verifyingMaskMarker, insertAfterVerifyingMask);
  console.log('✓ 已添加倒计时覆盖层（参考图1设计）');
}

// 保存文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n=== 修改完成 ===\n');
console.log('新的倒计时设计：');
console.log('✅ 覆盖整个卡片，不需要展开');
console.log('✅ 顶部显示"⏰ 请开始启动"');
console.log('✅ 中间大字显示倒计时');
console.log('✅ 显示需要拍摄的关键词');
console.log('✅ 底部有拍照、上传、启动验证按钮');
console.log('✅ 完成倒计时显示"距离任务完成还有..."');
console.log('\n刷新浏览器即可看到新设计！');

