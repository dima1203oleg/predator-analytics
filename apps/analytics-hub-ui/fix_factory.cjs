const fs = require('fs');
let content = fs.readFileSync('src/components/AutonomousFactory.tsx', 'utf8');

content = content.replace(/>LOW</g, '>НИЗЬКИЙ<');
content = content.replace(/>MEDIUM</g, '>СЕРЕДНІЙ<');
content = content.replace(/>HIGH</g, '>ВИСОКИЙ<');
content = content.replace(/>CRITICAL</g, '>КРИТИЧНИЙ<');

fs.writeFileSync('src/components/AutonomousFactory.tsx', content);
console.log('Fixed autonomous factory severities');
