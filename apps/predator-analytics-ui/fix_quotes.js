const fs = require('fs');
const path = '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/locales/uk/premium.ts';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // Find all strings bounded by single quotes and replace them to double quotes if they contain an escaped single quote
  // E.g. 'Зв\'язки' -> "Зв'язки"
  
  let newContent = content.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, inner) => {
    if (inner.includes("\\'")) {
       return '"' + inner.replace(/\\'/g, "'").replace(/"/g, '\\"') + '"';
    }
    return match;
  });

  fs.writeFileSync(path, newContent, 'utf8');
  console.log("Successfully fixed escaped quotes in premium.ts");
} catch (e) {
  console.error("Error modifying premium.ts:", e);
}
