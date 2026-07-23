const fs = require('fs');
let content = fs.readFileSync('src/components/MediaForensicsTab.tsx', 'utf8');
content = content.replace(/>Refetching...</g, ">Оновлення...<");
fs.writeFileSync('src/components/MediaForensicsTab.tsx', content);
