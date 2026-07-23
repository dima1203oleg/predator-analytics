const fs = require('fs');
let content;

content = fs.readFileSync('src/components/CatalogTab.tsx', 'utf8');
content = content.replace(/title="Production Ready"/g, 'title="Готово до виробництва"');
fs.writeFileSync('src/components/CatalogTab.tsx', content);

content = fs.readFileSync('src/components/AuthStatus.tsx', 'utf8');
content = content.replace(/title="Sign out"/g, 'title="Вийти"');
fs.writeFileSync('src/components/AuthStatus.tsx', content);

content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');
content = content.replace(/title="Download CSV"/g, 'title="Завантажити CSV"');
fs.writeFileSync('src/components/DashboardView.tsx', content);

console.log('Translated titles');
