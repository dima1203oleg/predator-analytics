const fs = require('fs');
let content = fs.readFileSync('src/main.tsx', 'utf8');

if (!content.includes('ToastProvider')) {
  content = content.replace("import { AuthProvider } from './lib/AuthContext';", "import { AuthProvider } from './lib/AuthContext';\nimport { ToastProvider } from './components/ToastProvider';");
  content = content.replace("<AuthProvider>", "<AuthProvider>\n      <ToastProvider>");
  content = content.replace("</AuthProvider>", "</ToastProvider>\n    </AuthProvider>");
}

fs.writeFileSync('src/main.tsx', content);
console.log('Fixed main.tsx');
