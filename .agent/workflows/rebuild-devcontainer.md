---
description: Rebuild the Dev Container environment using @devcontainers/cli
---
This workflow performs a complete rebuild of the Dev Container to ensure all dependencies and configurations are up to date.

// turbo
1. Run the rebuild script:
```bash
./scripts/rebuild_devcontainer.sh
```

2. After the build completes, you can reopen the project in VS Code (manually or via remote attachment) to use the updated container.
