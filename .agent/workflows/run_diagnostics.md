---
description: Run System Diagnostics and Health Checks
---

1. Execute the diagnostics API test script
   ```bash
   ./scripts/test_diagnostics_api.sh
   ```

2. (Optional) Check Docker logs for detailed output if diagnostics fail
   ```bash
   ssh -o StrictHostKeyChecking=no -p 6666 dima@194.177.1.240 "docker compose logs --tail=100 backend"
   ```
