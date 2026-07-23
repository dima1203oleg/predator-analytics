const fs = require('fs');

function translateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/"Loading..."/g, '"Завантаження..."');
  content = content.replace(/>Loading...</g, '>Завантаження...<');
  content = content.replace(/'Loading...'/g, "'Завантаження...'");
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/OsintWorkbench.tsx',
  'src/components/MediaForensicsTab.tsx',
  'src/components/AuthStatus.tsx',
  'src/components/DataIngestionTab.tsx'
];

files.forEach(translateFile);
console.log('Translated Loading...');
