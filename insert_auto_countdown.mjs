import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 1. 找到第一个 useEffect 结束的位置（大约在第80行左右），在其后添加自动触发逻辑
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

// 找到第一个 useEffect 的结束位置
let insertLine = -1;
for (let i = 67; i < 100; i++) {
  if (lines[i].includes('}, []);') || lines[i].includes('return () =>')) {
    // 找到下一个空行或新的代码块
    for (let j = i + 1; j < i + 10; j++) {
      if (lines[j].trim() === '' || lines[j].includes('const [')) {
        insertLine = j;
        break;
      }
    }
    break;
  }
}

if (insertLine > 0) {
  lines.splice(insertLine, 0, autoTriggerCode);
  console.log(`✓ 在第 ${insertLine} 行插入自动触发倒计时逻辑`);
} else {
  console.log('✗ 未找到合适的插入位置');
}

// 2. 在任务卡片展开区域添加倒计时显示
// 搜索 "展开区域：子任务和文件" 这个注释
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

let countdownInsertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('展开区域：子任务和文件')) {
    // 在这个注释后面找到 <div className="mt-3 pt-3
    for (let j = i + 1; j < i + 5; j++) {
      if (lines[j].includes('<div className="mt-3 pt-3')) {
        countdownInsertLine = j + 1;
        break;
      }
    }
    break;
  }
}

if (countdownInsertLine > 0) {
  lines.splice(countdownInsertLine, 0, countdownDisplayCode);
  console.log(`✓ 在第 ${countdownInsertLine} 行插入倒计时显示组件`);
} else {
  console.log('✗ 未找到倒计时显示的插入位置');
}

// 保存文件
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ 自动触发倒计时功能已添加！');
console.log('\n功能说明：');
console.log('1. 到达任务设定时间后，自动启动2分钟倒计时');
console.log('2. 倒计时期间显示验证信息和关键词');
console.log('3. 编辑按钮保持可用');
console.log('4. 所有验证逻辑保持不变');

