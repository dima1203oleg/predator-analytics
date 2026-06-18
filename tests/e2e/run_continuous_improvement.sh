#!/bin/bash

###############################################################################
# 📈 Continuous Improvement Module - Launcher
# PREDATOR Analytics v61.0-ELITE
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📈 Starting Continuous Improvement Module..."
python3 continuous_improvement.py
