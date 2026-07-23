const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('ToastProvider')) {
  content = content.replace('import { VoiceCall } from "./components/VoiceCall";', 'import { VoiceCall } from "./components/VoiceCall";\nimport { ToastProvider } from "./components/ToastProvider";');
  
  content = content.replace('return (\n    <AuthStatus', 'return (\n    <ToastProvider>\n      <AuthStatus');
  content = content.replace('</AuthStatus>\n  );\n}', '</AuthStatus>\n    </ToastProvider>\n  );\n}');
}

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed App provider");
