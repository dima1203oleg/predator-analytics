#!/bin/bash

###############################################################################
# 🤖 AI Workflow Tester - Launcher
# PREDATOR Analytics v61.0-ELITE
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🤖 Starting AI Workflow Tester..."
python3 ai_workflow_tester.py
