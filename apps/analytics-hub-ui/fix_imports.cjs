const fs = require('fs');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace("import React, { useContext } from 'react';\nimport { useToast } from './ToastProvider';\n {", "import React, { useContext, ");
  // Also DataIngestionTab.tsx
  content = content.replace("import { useToast } from './ToastProvider';\nimport React, { useContext } from 'react';\nimport { useToast } from './ToastProvider';\n", "import React, { useContext, useState } from 'react';\nimport { useToast } from './ToastProvider';\n");

  fs.writeFileSync(filePath, content);
}

fix('src/components/AdminBackOffice.tsx');
fix('src/components/PersonProfiler.tsx');
fix('src/components/InvestigationSandbox.tsx');
fix('src/components/DataIngestionTab.tsx');
console.log("Fixed imports");
