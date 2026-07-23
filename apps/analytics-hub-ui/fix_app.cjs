const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/>System Status</g, '>Статус Системи<');
content = content.replace(/>Back Office Консоль</g, '>Консоль управління<');
content = content.replace(/>BASES:/g, '>БАЗИ:');
content = content.replace(/>CLUSTER:/g, '>КЛАСТЕР:');

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx');
