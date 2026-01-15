#!/bin/bash
set -e

echo "🔍 [CHECK] Verifying Predator v29-S Software Requirements..."

# Helper function to check command
check_version() {
    COMMAND=$1
    REQUIRED=$2
    if command -v $COMMAND &> /dev/null; then
        VERSION=$($COMMAND --version 2>/dev/null | head -n 1 || echo "version unknown")
        echo "✅ $COMMAND found: $VERSION"
        return 0
    else
        echo "❌ $COMMAND NOT FOUND (Required)"
        return 1
    fi
}

echo "--- Core Tools ---"
check_version "docker"
check_version "docker-compose" || docker compose version 2>/dev/null && echo "✅ docker compose (plugin) found"
check_version "git"

# Try multiple python locations
echo ""
echo "--- Python Environment ---"
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
fi

if [ -n "$PYTHON_CMD" ]; then
    echo "✅ Python found: $($PYTHON_CMD --version 2>&1)"

    # Check critical Python libs for v29-S Constitutional Core
    echo ""
    echo "--- Python Libraries (v29-S Core) ---"
    $PYTHON_CMD -c "import z3; print('✅ Z3 (Constitutional Formal Verifier) found')" 2>/dev/null || echo "⚠️ Z3 not found (Required for Constitutional Core - install with: pip install z3-solver)"
    $PYTHON_CMD -c "import pydantic; print('✅ Pydantic found:', pydantic.__version__)" 2>/dev/null || echo "⚠️ Pydantic NOT FOUND"
    $PYTHON_CMD -c "import sqlalchemy; print('✅ SQLAlchemy found:', sqlalchemy.__version__)" 2>/dev/null || echo "⚠️ SQLAlchemy NOT FOUND"
    $PYTHON_CMD -c "import celery; print('✅ Celery found:', celery.__version__)" 2>/dev/null || echo "⚠️ Celery NOT FOUND"
    $PYTHON_CMD -c "import fastapi; print('✅ FastAPI found:', fastapi.__version__)" 2>/dev/null || echo "⚠️ FastAPI NOT FOUND"
    $PYTHON_CMD -c "import torch; print('✅ PyTorch found:', torch.__version__)" 2>/dev/null || echo "⚠️ PyTorch NOT FOUND"

    echo ""
    echo "--- SOM Dependencies ---"
    $PYTHON_CMD -c "import networkx; print('✅ NetworkX found (Agent Graph)')" 2>/dev/null || echo "⚠️ NetworkX NOT FOUND"
    $PYTHON_CMD -c "import langgraph; print('✅ LangGraph found (Multi-Agent)')" 2>/dev/null || echo "⚠️ LangGraph NOT FOUND"
else
    echo "❌ Python NOT FOUND"
fi

# Node.js check (try multiple locations)
echo ""
echo "--- Node.js Environment ---"
NODE_CMD=""
NPM_CMD=""

# Check standard locations
if command -v node &> /dev/null; then
    NODE_CMD="node"
elif [ -f "$HOME/node/bin/node" ]; then
    NODE_CMD="$HOME/node/bin/node"
elif [ -f "/Users/dima-mac/node/bin/node" ]; then
    NODE_CMD="/Users/dima-mac/node/bin/node"
fi

if [ -n "$NODE_CMD" ]; then
    echo "✅ Node.js found: $($NODE_CMD --version 2>&1)"
else
    echo "⚠️ Node.js not in PATH (may need to add to ~/.zshrc)"
fi

# npm check
if command -v npm &> /dev/null; then
    NPM_CMD="npm"
elif [ -f "$HOME/node/bin/npm" ]; then
    NPM_CMD="$HOME/node/bin/npm"
fi

if [ -n "$NPM_CMD" ]; then
    echo "✅ npm found: $($NPM_CMD --version 2>&1)"
fi

# Check Node project files
echo ""
echo "--- Frontend Structure ---"
if [ -f "apps/predator-analytics-ui/package.json" ]; then
    echo "✅ Frontend package.json exists"
else
    echo "⚠️ Frontend package.json not found"
fi

# v29-S Specific Checks
echo ""
echo "--- v29-S Constitutional Files ---"
if [ -f "services/som/app/axioms.py" ]; then
    echo "✅ Constitutional Axioms file found"
else
    echo "⚠️ Constitutional Axioms file not found"
fi

if [ -f "services/som/app/truth_ledger.py" ]; then
    echo "✅ Truth Ledger service found"
else
    echo "⚠️ Truth Ledger service not found"
fi

echo ""
echo "✅ Requirements Check Complete."
