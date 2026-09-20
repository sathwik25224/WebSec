const fs = require('fs'); const { execFileSync } = require('child_process');
['data','uploads','demo-data'].forEach(x=>fs.mkdirSync(x,{recursive:true}));
if(!fs.existsSync('.env')) fs.copyFileSync('.env.example','.env');
execFileSync(process.execPath,['scripts/seed.js','--reset'],{stdio:'inherit'});
console.log('Ready: http://127.0.0.1:3000\nAdmin: admin@cyberlearn.local / DemoAdmin123!\nLearner: alice@cyberlearn.local / alice123');
