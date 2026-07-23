const fs = require('fs');
let content = fs.readFileSync('src/components/MediaForensicsTab.tsx', 'utf8');

content = content.replace(/setIsRefetchingue\);/g, "setIsRefetching(true);");
content = content.replace(/setIsRefetchinglse\);/g, "setIsRefetching(false);");

fs.writeFileSync('src/components/MediaForensicsTab.tsx', content);
console.log('Fixed boolean arguments');
