---
description: Launch the PREDATOR Analytics Web Interface and Mock API Server
---

// turbo-all
1. Start the Mock API Server (if not already running):
   `node /Users/dima-mac/Documents/Predator_21/mock-api-server.mjs`

2. Check if port 3030 is occupied and clear it if necessary:
   `lsof -ti :3030 | xargs kill -9 || true`

3. Navigate to the UI directory and start the Vite development server:
   `cd /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui && npx vite --port 3030 --host`

4. Verify the interface is accessible:
   `curl -s http://localhost:3030 | head -n 10`
