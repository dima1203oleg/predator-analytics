const fs = require('fs');
let content = fs.readFileSync('src/components/MediaForensicsTab.tsx', 'utf8');

content = content.replace(/if \(isRefetchingeturn;/g, "if (isRefetching) return;");
content = content.replace(/\$\{isRefetching'opacity-30' : 'opacity-100'\}/g, "${isRefetching ? 'opacity-30' : 'opacity-100'}");
content = content.replace(/\$\{isRefetching'animate-spin text-sky-400' : ''\}/g, "${isRefetching ? 'animate-spin text-sky-400' : ''}");
content = content.replace(/\$\{isRefetching'opacity-50/g, "${isRefetching ? 'opacity-50");

fs.writeFileSync('src/components/MediaForensicsTab.tsx', content);
console.log('Fixed variable names completely');
