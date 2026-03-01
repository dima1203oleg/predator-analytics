#!/bin/bash
# scripts/start_mcp_devtools.sh

# Ensure we are in the project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "🚀 Starting Predator DevTools MCP Server..."
echo "📂 Project Root: $PROJECT_ROOT"

# Use pyenv Python 3.10 if available
PYENV_PYTHON="$HOME/.pyenv/versions/3.10.14/bin/python3"
if [ -x "$PYENV_PYTHON" ]; then
    PYTHON_BIN="$PYENV_PYTHON"
    echo "📦 Using pyenv Python 3.10.14"
else
    PYTHON_BIN="python3"
    echo "⚠️ Using system python3"
fi

MCP_DIR="services/mcp_devtools"
VENV_DIR="$MCP_DIR/.venv"

# Remove old venv if using wrong Python version
if [ -d "$VENV_DIR" ]; then
    VENV_PYTHON_VERSION=$("$VENV_DIR/bin/python3" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+')
    if [[ "$VENV_PYTHON_VERSION" != "3.10" && "$VENV_PYTHON_VERSION" != "3.11" && "$VENV_PYTHON_VERSION" != "3.12" ]]; then
        echo "🗑️ Removing old venv with Python $VENV_PYTHON_VERSION..."
        rm -rf "$VENV_DIR"
    fi
fi

# Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment in $VENV_DIR..."
    "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

# Activate venv
source "$VENV_DIR/bin/activate"

# Upgrade pip and install dependencies
echo "📦 Installing/Updating dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install -r "$MCP_DIR/requirements.txt"

# Set PYTHONPATH to project root so imports work
export PYTHONPATH=$PROJECT_ROOT

echo "✅ Server listening on Stdio..."
python3 "$MCP_DIR/server.py"
