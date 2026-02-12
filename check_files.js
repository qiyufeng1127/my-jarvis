const fs = require('fs');

// 检查calendar目录下的所有倒计时文件
const files = fs.readdirSync('src/components/calendar');
console.log('倒计时相关文件:');
files.filter(f => f.toLowerCase().includes('countdown')).forEach(f => console.log('  -', f));

