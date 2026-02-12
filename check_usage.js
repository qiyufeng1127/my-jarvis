const fs = require('fs');
const content = fs.readFileSync('src/components/calendar/NewTimelineView.tsx', 'utf8');

console.log('StartVerificationCountdown:', content.includes('StartVerificationCountdown') ? 'YES' : 'NO');
console.log('FinishVerificationCountdown:', content.includes('FinishVerificationCountdown') ? 'YES' : 'NO');

