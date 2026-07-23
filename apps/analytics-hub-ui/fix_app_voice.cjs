const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('<VoiceCall />')) {
  content = content.replace('      </div>\n    </AuthStatus>', '      </div>\n      <VoiceCall />\n    </AuthStatus>');
}
fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx voice integration properly');
