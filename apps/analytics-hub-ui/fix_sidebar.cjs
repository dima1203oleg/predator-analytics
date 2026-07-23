const fs = require('fs');
let content = fs.readFileSync('src/components/SidebarGroups.ts', 'utf8');

content = content.replace(/'LIVE'/g, "'НАЖИВО'");
content = content.replace(/'RISK'/g, "'РИЗИК'");
content = content.replace(/'MAP'/g, "'КАРТА'");
content = content.replace(/'AI'/g, "'ШІ'");
content = content.replace(/'SANDBOX'/g, "'ПІСОЧНИЦЯ'");
content = content.replace(/'Back Office Консоль'/g, "'Консоль управління'");
content = content.replace(/'Каталог \(Legacy\)'/g, "'Каталог (Архів)'");
content = content.replace(/'Media Forensics'/g, "'Аналіз Медіа'");

fs.writeFileSync('src/components/SidebarGroups.ts', content);
console.log('Fixed SidebarGroups.ts');
