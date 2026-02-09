# 简单的逐步集成脚本
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 步骤1：在第22行后添加导入语句
insert_pos = 22  # 在 baiduImageRecognition 导入之后
new_imports = [
    "import StartVerificationCountdown from '@/components/countdown/StartVerificationCountdown';\n",
    "import FinishVerificationCountdown from '@/components/countdown/FinishVerificationCountdown';\n",
    "import { \n",
    "  adjustTaskStartTime, \n",
    "  adjustTaskEndTime, \n",
    "  calculateActualDuration \n",
    "} from '@/utils/timelineAdjuster';\n",
    "import { \n",
    "  calculateActualGoldReward, \n",
    "  smartDetectTaskPosture \n",
    "} from '@/utils/goldCalculator';\n",
]

lines = lines[:insert_pos] + new_imports + lines[insert_pos:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Step 1 completed: Added imports")

