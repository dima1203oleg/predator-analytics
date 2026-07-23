const fs = require('fs');
let content = fs.readFileSync('src/components/MediaForensicsTab.tsx', 'utf8');

content = content.replace(/>\{log\.severity === 'High' \? 'ВИСОКИЙ' : log\.severity === 'Medium' \? 'СЕРЕДНІЙ' : 'НИЗЬКИЙ'\}<\/span>/g, ">{log.severity.toUpperCase()}</span>");

fs.writeFileSync('src/components/MediaForensicsTab.tsx', content);
console.log('Fixed severity comparison');
