#!/bin/bash
# We will use simple node script to apply a global fix
node -e "
const fs = require('fs');
const files = [
  '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/hooks/useRealtimeMetrics.ts',
  '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/hooks/useSystemEvents.ts',
  '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/hooks/useAIStream.ts',
];

const fixWsUrl = \`
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = API_BASE_URL.startsWith('http')
      ? API_BASE_URL.replace(/^http/, 'ws')
      : \\\`\\\${protocol}//\\\${window.location.host}\\\${API_BASE_URL}\\\`;
\`;

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const baseUrl = API_BASE_URL.replace\(\/\^http\/, 'ws'\);/, fixWsUrl.trim());
  fs.writeFileSync(file, content);
}
"
