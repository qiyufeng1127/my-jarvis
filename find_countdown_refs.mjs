import fs from 'fs';

const content = fs.readFileSync('src/components/calendar/NewTimelineView.tsx', 'utf8');
const lines = content.split('\n');

console.log('查找 StartVerificationCountdown 和 FinishVerificationCountdown 的所有引用:\n');

lines.forEach((line, i) => {
  if (line.includes('StartVerificationCountdown') || line.includes('FinishVerificationCountdown')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});

