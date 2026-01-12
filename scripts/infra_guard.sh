#!/bin/bash
# Predator Infrastructure Guard Script

OS_TYPE=$(uname)
ENV_MODE=${EXECUTION_ENV:-local}

echo "🛡️ Infrastructure Guard: Checking status..."
echo "📍 OS: $OS_TYPE | ENV: $ENV_MODE"

if [[ "$1" == "server" ]]; then
    if [[ "$OS_TYPE" == "Darwin" ]]; then
        echo "❌ CRITICAL ERROR: Attempted to start SERVER profile on macOS (Darwin)."
        echo "   Server mode requires Linux + NVIDIA Runtime."
        echo "   Aborting to prevent heavy image pulls and hardware conflicts."
        exit 1
    fi
    echo "✅ Hardware check passed for Server mode."
fi

if [[ "$1" == "local" ]]; then
    echo "✅ Starting in Safe Local mode."
fi

# 🐍 PYTHON ETERNITY CHECK (v25.0 Policy)
PYTHON_VER=$(python3 --version 2>&1 | awk '{print $2}')
if [[ ! $PYTHON_VER =~ ^3\.12 ]]; then
    echo "❌ ETERNAL DIRECTIVE VIOLATION: Python version is $PYTHON_VER."
    echo "   System is locked to Python 3.12. Update your environment."
    exit 1
fi
echo "🐍 Python $PYTHON_VER compliance verified."

exit 0
