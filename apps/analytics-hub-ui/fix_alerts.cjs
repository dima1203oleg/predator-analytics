const fs = require('fs');

function fixFile(filePath, componentName) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import
  if (!content.includes('useToast')) {
    content = content.replace("import React,", "import React, { useContext } from 'react';\nimport { useToast } from './ToastProvider';\n");
    if (content.indexOf("import React") === -1) {
       content = "import { useToast } from './ToastProvider';\n" + content;
    }
  }

  // Inject hook
  const hookInject = `\n  const { showToast } = useToast();`;
  const funcMatch = new RegExp(`export default function ${componentName}\\s*\\([^)]*\\)\\s*{`);
  if (content.match(funcMatch) && !content.includes('const { showToast } = useToast();')) {
    content = content.replace(funcMatch, `$&${hookInject}`);
  } else {
    const funcMatch2 = new RegExp(`export function ${componentName}\\s*\\([^)]*\\)\\s*{`);
    if (content.match(funcMatch2) && !content.includes('const { showToast } = useToast();')) {
      content = content.replace(funcMatch2, `$&${hookInject}`);
    } else {
      // maybe const Component = () => {
      const funcMatch3 = new RegExp(`const ${componentName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{`);
      if (content.match(funcMatch3) && !content.includes('const { showToast } = useToast();')) {
        content = content.replace(funcMatch3, `$&${hookInject}`);
      }
    }
  }

  // Replace alert( with showToast(
  content = content.replace(/alert\(/g, "showToast(");
  
  fs.writeFileSync(filePath, content);
}

fixFile('src/components/AdminBackOffice.tsx', 'AdminBackOffice');
fixFile('src/components/PersonProfiler.tsx', 'PersonProfiler');
fixFile('src/components/InvestigationSandbox.tsx', 'InvestigationSandbox');
fixFile('src/components/DataIngestionTab.tsx', 'DataIngestionTab');

console.log("Fixed alerts");
