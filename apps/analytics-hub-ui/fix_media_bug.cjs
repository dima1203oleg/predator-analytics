const fs = require('fs');
let content = fs.readFileSync('src/components/MediaForensicsTab.tsx', 'utf8');

// Fix the typo variable name
content = content.replace(/const \[isОновлення...etIsОновлення... useState\(false\);/g, "const [isRefetching, setIsRefetching] = useState(false);");
// Let's check for any other corrupted instances.
content = content.replace(/isОновлення.../g, "isRefetching");
content = content.replace(/setIsОновлення.../g, "setIsRefetching");

fs.writeFileSync('src/components/MediaForensicsTab.tsx', content);
console.log('Fixed variable names');
