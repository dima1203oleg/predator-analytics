#!/bin/bash

###############################################################################
# 🔧 Self-Healing Engine - Launcher
# PREDATOR Analytics v61.0-ELITE
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔧 Starting Self-Healing Engine..."
python3 self_healing_engine.py
