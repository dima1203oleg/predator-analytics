const fs = require('fs');
let content = fs.readFileSync('src/components/MediaForensicsTab.tsx', 'utf8');

// Replace standard English terms in MediaForensicsTab
content = content.replace(/'SUCCESS'/g, "'УСПІХ'");
content = content.replace(/'ERROR'/g, "'ПОМИЛКА'");
content = content.replace(/High/g, "Високий");
content = content.replace(/Medium/g, "Середній");
content = content.replace(/Low/g, "Низький");
// Wait, 'High', 'Medium', 'Low' might break internal logic if they are used as actual variable types, 
// e.g. `severity === 'High'`. Let's be careful.
// Let's only replace the display of severity, not the internal variables.

// For severity display:
content = content.replace(/log\.status === 'success' \? 'SUCCESS' : 'ERROR'/g, "log.status === 'success' ? 'УСПІШНО' : 'ПОМИЛКА'");
content = content.replace(/log\.severity === 'High' \? 'bg-rose/g, "log.severity === 'High' ? 'bg-rose");
// Let's check how severity is displayed: {log.severity} 
// I'll replace `{log.severity}` with `{log.severity === 'High' ? 'Високий' : log.severity === 'Medium' ? 'Середній' : 'Низький'}`
content = content.replace(/>\s*\{log.severity\}\s*<\/span>/g, ">{log.severity === 'High' ? 'ВИСОКИЙ' : log.severity === 'Medium' ? 'СЕРЕДНІЙ' : 'НИЗЬКИЙ'}</span>");

// "Media Forensics & AI Synthesis"
content = content.replace(/Media Forensics & AI Synthesis/g, "Аналіз Медіа та ШІ Синтез");

// Anomalous log spikes detected at:
content = content.replace(/Anomalous log spikes detected at:/g, "Виявлено аномальні сплески логів:");
content = content.replace(/Potential orchestrated deepfake campaign or systemic analysis anomaly./g, "Можлива скоординована deepfake-кампанія або системна аномалія аналізу.");

// "View Details"
content = content.replace(/View Details/g, "Переглянути деталі");

// "Simulate Refetch"
content = content.replace(/Simulate Refetch/g, "Оновити дані");
content = content.replace(/Refetching.../g, "Оновлення...");

// "SUCCESS" and "ERROR" inside JSX texts (if any plain text exists)
// Actually we only have {log.status === 'success' ? 'SUCCESS' : 'ERROR'}.
// The previous replace already handled that.

fs.writeFileSync('src/components/MediaForensicsTab.tsx', content);
console.log('Fixed media language');
