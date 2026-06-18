#!/bin/bash

###############################################################################
# 🖥️ DOM & Frontend Auditor - Launcher
# PREDATOR Analytics v61.0-ELITE
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🖥️ Starting DOM & Frontend Auditor..."
python3 dom_frontend_auditor.py
