#!/bin/bash
# Switch frontend to use remote NVIDIA server (194.177.1.240)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
UI_DIR="$PROJECT_ROOT/apps/predator-analytics-ui"

echo "🔧 Switching Frontend to REMOTE SERVER (194.177.1.240)..."
echo ""

# Backup current .env.local
if [ -f "$UI_DIR/.env.local" ]; then
    cp "$UI_DIR/.env.local" "$UI_DIR/.env.local.backup"
    echo "✅ Backed up local .env.local to .env.local.backup"
fi

# Copy remote config
cp "$UI_DIR/.env.remote" "$UI_DIR/.env.local"
echo "✅ Loaded remote configuration (.env.remote → .env.local)"

echo ""
echo "🌐 Remote API Endpoints:"
echo "   API v1:      http://194.177.1.240:8090/api/v1"
echo "   API v45:     http://194.177.1.240:8090/api/v45"
echo "   WebSocket:   ws://194.177.1.240:8090/ws"
echo "   LiteLLM:     http://194.177.1.240:4000"
echo "   OpenSearch:  http://194.177.1.240:9200"
echo "   Ollama:      http://194.177.1.240:11434"
echo ""

echo "📝 Frontend is now configured for remote server."
echo ""

echo "⚡ To test:"
echo "  cd $UI_DIR"
echo "  npm run dev"
echo ""

echo "🔙 To switch back to LOCAL/MOCK:"
echo "  cp $UI_DIR/.env.local.backup $UI_DIR/.env.local"
echo ""

echo "✅ Setup complete!"
