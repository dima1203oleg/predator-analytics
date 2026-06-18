#!/bin/bash

###############################################################################
# 🔗 Integration Auditor - Launcher
# PREDATOR Analytics v61.0-ELITE
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔗 Starting Integration Auditor..."
python3 integration_auditor.py
