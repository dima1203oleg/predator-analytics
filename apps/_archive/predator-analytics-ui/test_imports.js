const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('/Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages/admin/AdminHub.tsx', 'utf8');
const imports = [...content.matchAll(/import\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);

let allGood = true;
imports.forEach(imp => {
  let p = imp;
  if (p.startsWith('@/')) {
    p = p.replace('@/', '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/');
  } else if (p.startsWith('./')) {
    p = path.join('/Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages/admin', p);
  } else if (p.startsWith('../')) {
    p = path.join('/Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages', p);
  }
  
  if (!fs.existsSync(p + '.tsx') && !fs.existsSync(p + '.ts') && !fs.existsSync(path.join(p, 'index.tsx'))) {
    console.error('MISSING:', imp, '->', p);
    allGood = false;
  }
});
if (allGood) console.log('ALL LAZY IMPORTS EXIST');
