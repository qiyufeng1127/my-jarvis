# 精确集成倒计时系统到 NewTimelineView.tsx
import re

with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 步骤1：添加导入语句
import_pattern = r"(import \{ baiduImageRecognition \} from '@/services/baiduImageRecognition';)"
import_addition = r"""\1
import StartVerificationCountdown from '@/components/countdown/StartVerificationCountdown';
import FinishVerificationCountdown from '@/components/countdown/FinishVerificationCountdown';
import { 
  adjustTaskStartTime, 
  adjustTaskEndTime, 
  calculateActualDuration 
} from '@/utils/timelineAdjuster';
import { 
  calculateActualGoldReward, 
  smartDetectTaskPosture 
} from '@/utils/goldCalculator';"""

content = re.sub(import_pattern, import_addition, content)

# 步骤2：添加状态管理
state_pattern = r"(const \[verifyingType, setVerifyingType\] = useState<'start' \| 'complete' \| null>\(null\);.*?)"
state_addition = r"""\1
  const [taskStartTimeouts, setTaskStartTimeouts] = useState<Record<string, boolean>>({});
  const [taskFinishTimeouts, setTaskFinishTimeouts] = useState<Record<string, boolean>>({});
  const [taskActualStartTimes, setTaskActualStartTimes] = useState<Record<string, Date>>({});"""

content = re.sub(state_pattern, state_addition, content, flags=re.DOTALL)

# 步骤3：添加超时处理函数
handler_pattern = r"(const handleStartTask = async \(taskId: string\) => \{)"
handler_addition = r"""// 启动验证超时处理
  const handleStartVerificationTimeout = (taskId: string) => {
    setTaskStartTimeouts(prev => ({ ...prev, [taskId]: true }));
    console.log(`任务 ${taskId} 启动验证超时，完成时将扣除30%金币`);
  };

  // 完成验证超时处理
  const handleFinishVerificationTimeout = (taskId: string) => {
    setTaskFinishTimeouts(prev => ({ ...prev, [taskId]: true }));
    console.log(`任务 ${taskId} 完成超时，将无金币奖励`);
  };

  \1"""

content = re.sub(handler_pattern, handler_addition, content)

# 步骤4：在启动验证通过后添加时间轴调整
start_pattern = r"(startPenaltyGold: totalPenalty,.*?\n\s+\},\n\s+\}\)\);)\n(\s+// )"
start_addition = r"""\1
          
          // 记录实际启动时间并调整时间轴位置
          setTaskActualStartTimes(prev => ({ ...prev, [taskId]: now }));
          adjustTaskStartTime(taskId, now, allTasks, onTaskUpdate);
          
\2"""

content = re.sub(start_pattern, start_addition, content, flags=re.DOTALL)

# 步骤5：在完成验证通过后添加时间轴调整
complete_pattern = r"(completionGoldEarned: finalGold,\n\s+\},\n\s+\}\)\);)\n(\s+// )"
complete_addition = r"""\1
          
          // 调整任务结束时间
          adjustTaskEndTime(taskId, now, allTasks, onTaskUpdate);
          
\2"""

content = re.sub(complete_pattern, complete_addition, content, flags=re.DOTALL)

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Integration completed!")
print("Added:")
print("1. Import statements")
print("2. State management")
print("3. Timeout handlers")
print("4. Start time adjustment")
print("5. Complete time adjustment")

