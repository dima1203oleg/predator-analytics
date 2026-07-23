const fs = require('fs');
let content = fs.readFileSync('src/components/AdminBackOffice.tsx', 'utf8');

const replacements = {
  "MinIO S3 queue synchronization": "MinIO S3 синхронізація черг",
  "OCR / Graph Node computations": "Обчислення OCR / Графових вузлів",
  "Transient memory broker pipeline": "Конвеєр транзитних брокерів пам'яті",
  "Failed messages to analyze": "Помилкові повідомлення для аналізу"
};

for (const [eng, ukr] of Object.entries(replacements)) {
  content = content.replace(eng, ukr);
}

fs.writeFileSync('src/components/AdminBackOffice.tsx', content);
console.log('Translated AdminBackOffice logs');
