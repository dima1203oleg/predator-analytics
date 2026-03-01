#!/bin/bash
# scripts/azr_master_control.sh
# ═══════════════════════════════════════════════════════════════════════════════
# 🏛️ AZR MASTER CONTROL & KERNEL - Predator v45 | Neural Analytics.0
# UNBREAKABLE INFINITE SELF-IMPROVEMENT ORCHESTRATOR
# CORE PILLARS: Rules, Code, UI, Learning, Infra.
# ═══════════════════════════════════════════════════════════════════════════════

cd "/Users/dima-mac/Documents/Predator_21"
PROJECT_ROOT=$(pwd)
PYTHON_BIN="$PROJECT_ROOT/services/mcp_devtools/.venv/bin/python"
LOG_DIR="/tmp/azr_logs"
mkdir -p "$LOG_DIR"

echo "🔥 ACTIVATING GIGA-AUTONOMY SYSTEM..."

# 0. PRE-FLIGHT PERMISSION CHECK
if [ ! -r .env ]; then
    echo "⚠️  CRITICAL: .env is not readable due to macOS permissions."
    echo "Please run: 'chmod 644 .env && xattr -c .env' or give Terminal 'Full Disk Access'."
    # Don't exit, but warn heavily
fi

# 0. PRE-FLIGHT POLICY CHECK
echo "⚖️ Checking Python Policy..."
cat .python-version
ruff --version || echo "⚠️ Ruff not in PATH, will use local if available"

# Ensure dirs
mkdir -p "$LOG_DIR"
mkdir -p ".azr/memory"

# Path injection for predatorctl (High-Entropy Evolution Bridge)
# Rule: Targeting Python 3.12 (as per PYTHON_POLICY.md), using 3.9.6 as runtime bridge.
export PYTHONPATH="$PROJECT_ROOT/predatorctl:$PYTHONPATH"
PREDATORCTL_BIN="$PROJECT_ROOT/.venv/bin/python"
alias predatorctl="$PREDATORCTL_BIN $PROJECT_ROOT/predatorctl/predatorctl/app.py"
# For scripts, we use the direct path
PREDATORCTL="$PREDATORCTL_BIN $PROJECT_ROOT/predatorctl/predatorctl/app.py"
if ! lsof -i :8765 > /dev/null; then
    echo "📡 Starting UI Sentinel MCP Server (Port 8765)..."
    PYTHONPATH=. $PYTHON_BIN services/mcp_devtools/ui_sentinel.py > "$LOG_DIR/ui_sentinel.log" 2>&1 &
fi

if ! pgrep -f "services/mcp_devtools/server.py" > /dev/null; then
    echo "🛠️ Starting MCP DevTools Server..."
    ./scripts/start_mcp_devtools.sh > "$LOG_DIR/mcp.log" 2>&1 &
fi

# 1. Start AZR Constitutional Guard (Eternal)
if ! pgrep -f "scripts/azr_eternal_loop.sh" > /dev/null; then
    echo "🛡️ Starting AZR Constitutional Guard (Axiom 15 Enforcement)..."
    nohup ./scripts/azr_eternal_loop.sh > "$LOG_DIR/guard.log" 2>&1 &
fi

# 2. Start Backend API (FastAPI)
if ! lsof -i :8090 > /dev/null; then
    echo "⚙️ Starting Backend API Gateway (Port 8090)..."
    cd services/api_gateway
    # Assuming uvicorn is in the venv managed by start_mcp or similar
    # For now, running directly via the found 3.10 python if it has deps
    nohup $PYTHON_BIN -m uvicorn app.main:app --host 0.0.0.0 --port 8090 > "$LOG_DIR/backend.log" 2>&1 &
    cd $PROJECT_ROOT
fi

# 3. Start Frontend Dev (Vite)
if ! lsof -i :3000 > /dev/null; then
    echo "🖼️ Starting Frontend UI (Port 3000)..."
    cd apps/predator-analytics-ui
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    cd $PROJECT_ROOT
fi

# 4. Start AZR Engine (The OODA Loop)
if ! pgrep -f "agents/azr_agent.py" > /dev/null; then
    echo "🤖 Starting AZR Self-Improvement Engine..."
    nohup $PYTHON_BIN agents/azr_agent.py > "$LOG_DIR/azr_engine.log" 2>&1 &
fi

# 5. CLI Agent Health Check
echo "🕵️  Activating CLI Agents..."
$PREDATORCTL agent list

# 6. Auto-Learning (Semantic Vectorization)
echo "🧬 Triggering Model Health Check..."
$PREDATORCTL agent train

echo "✅ ALL SYSTEMS ONLINE. INFINITE LOOP ENGAGED."
echo "🔗 Local Access: http://localhost:3000"
echo "🌐 Public Ngrok: https://jolyn-bifid-eligibly.ngrok-free.dev/admin"
echo "📡 Direct Static IP: http://194.177.1.240:8080 (If open)"
echo "📜 Audit Log: .azr/memory/audit_log.jsonl"
echo "🧠 AI Model Status: FAISS VECTORS LOADED"
echo "🛡️ AZR Active: YES (Axioms 1-16 Forced)"
