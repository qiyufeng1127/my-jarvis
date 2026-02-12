import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. 首先在 useEffect 中添加自动触发倒计时的逻辑
// 找到合适的位置添加监听逻辑

const autoTriggerCode = `
  // 自动触发倒计时 - 监听任务到达设定时间
  useEffect(() => {
    const checkTaskStartTime = () => {
      const now = new Date();
      
      allTasks.forEach(task => {
        // 只处理已启用验证且未开始的任务
        const verification = taskVerifications[task.id];
        if (!verification || !verification.enabled || verification.status !== 'pending') {
          return;
        }
        
        const scheduledStart = new Date(task.scheduledStart!);
        const timeDiff = now.getTime() - scheduledStart.getTime();
        
        // 如果到达或超过开始时间（允许1秒误差），自动启动倒计时
        if (timeDiff >= -1000 && timeDiff < 60000) { // 1分钟内
          console.log(\`⏰ 任务 "\${task.title}" 到达设定时间，自动启动倒计时\`);
          
          // 更新验证状态为等待启动
          setTaskVerifications(prev => ({
            ...prev,
            [task.id]: {
              ...prev[task.id],
              status: 'waiting_start',
            },
          }));
        }
      });
    };
    
    // 每秒检查一次
    const timer = setInterval(checkTaskStartTime, 1000);
    
    // 立即执行一次
    checkTaskStartTime();
    
    return () => clearInterval(timer);
  }, [allTasks, taskVerifications]);
`;

// 2. 在任务卡片中添加倒计时显示
const countdownDisplayCode = `
                    {/* 自动启动验证倒计时 */}
                    {taskVerifications[block.id]?.enabled && 
                     taskVerifications[block.id]?.status === 'waiting_start' && (
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
                    
                    {/* 完成验证倒计时 */}
                    {taskVerifications[block.id]?.enabled && 
                     taskVerifications[block.id]?.status === 'started' && 
                     !block.isCompleted && (
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
                    )}
`;

console.log('准备添加自动触发倒计时功能...');
console.log('1. 添加时间监听逻辑');
console.log('2. 添加倒计时显示组件');
console.log('');
console.log('请手动执行以下步骤：');
console.log('');
console.log('步骤1: 在 NewTimelineView 组件中，找到其他 useEffect 的位置，添加以下代码：');
console.log('---');
console.log(autoTriggerCode);
console.log('---');
console.log('');
console.log('步骤2: 在任务卡片的展开区域中（在子任务列表之前），添加以下代码：');
console.log('---');
console.log(countdownDisplayCode);
console.log('---');
console.log('');
console.log('这样就可以实现：');
console.log('✅ 到达设定时间自动启动倒计时');
console.log('✅ 显示验证信息和关键词');
console.log('✅ 保持编辑按钮可用');
console.log('✅ 保留所有验证逻辑');

