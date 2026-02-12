import fs from 'fs';

const filePath = 'src/components/calendar/NewTimelineView.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// 1. 先删除之前错误位置的 useEffect（大约在第78行附近）
let deleteStart = -1;
let deleteEnd = -1;

for (let i = 70; i < 120; i++) {
  if (lines[i].includes('// 自动触发倒计时 - 监听任务到达设定时间')) {
    deleteStart = i;
    // 找到这个 useEffect 的结束位置
    for (let j = i; j < i + 50; j++) {
      if (lines[j].includes('}, [allTasks, taskVerifications]);')) {
        deleteEnd = j;
        break;
      }
    }
    break;
  }
}

if (deleteStart >= 0 && deleteEnd >= 0) {
  lines.splice(deleteStart, deleteEnd - deleteStart + 1);
  console.log(`✓ 删除了第 ${deleteStart}-${deleteEnd} 行的错误代码`);
}

// 2. 在 allTasks 定义之后（第213行之后）重新插入
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

// 找到 allTasks 定义的位置
let insertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const allTasks = tasks;') || lines[i].includes('const allTasks =')) {
    // 在下一个空行插入
    for (let j = i + 1; j < i + 10; j++) {
      if (lines[j].trim() === '' || lines[j].includes('//')) {
        insertLine = j;
        break;
      }
    }
    break;
  }
}

if (insertLine > 0) {
  lines.splice(insertLine, 0, autoTriggerCode);
  console.log(`✓ 在第 ${insertLine} 行（allTasks 定义之后）重新插入自动触发逻辑`);
}

// 保存文件
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ 修复完成！自动触发倒计时已移到正确位置');

