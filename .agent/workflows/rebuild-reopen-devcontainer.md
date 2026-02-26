---
description: Rebuild and Reopen the Dev Container environment
---
This workflow performs a complete rebuild of the Dev Container and ensures it is running (UP) so it can be immediately attached to in VS Code.

// turbo
1. Run the combined rebuild and reopen script:
```bash
./scripts/rebuild_devcontainer.sh
```

2. Once the script finishes, the container is running. If you are in VS Code, it might prompt you to reopen, or you can manually attach to the running container.
