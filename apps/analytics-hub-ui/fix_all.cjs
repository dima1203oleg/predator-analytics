const fs = require('fs');

function inject(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { useToast } from './ToastProvider';")) {
    content = "import { useToast } from './ToastProvider';\n" + content;
  }
  fs.writeFileSync(file, content);
}

inject('src/components/AdminBackOffice.tsx');
inject('src/components/PersonProfiler.tsx');
inject('src/components/InvestigationSandbox.tsx');
inject('src/components/DataIngestionTab.tsx');

console.log("Injected imports");
