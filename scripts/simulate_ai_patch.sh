#!/usr/bin/env bash
set -euo pipefail
# simulate_ai_patch.sh: write a simulated AI patch to /tmp/ai_patch.diff
# Usage: simulate_ai_patch.sh [--delete-chart <env>]

ENV_TO_DELETE=${1:-macbook}

cat > /tmp/ai_patch.diff <<PATCH
*** deleted file mode 100644
--- a/environments/${ENV_TO_DELETE}/Chart.yaml
+++ /dev/null
apiVersion: v2
name: ${ENV_TO_DELETE}
version: 0.1.0
PATCH

echo "Wrote simulated AI patch to /tmp/ai_patch.diff"
