#!/bin/bash
# Switch PREDATOR to use remote NVIDIA server (194.177.1.240)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔧 Switching PREDATOR Analytics to REMOTE SERVER (194.177.1.240)..."
echo ""

# Backup current .env
if [ -f "$PROJECT_ROOT/services/core-api/.env" ]; then
    cp "$PROJECT_ROOT/services/core-api/.env" "$PROJECT_ROOT/services/core-api/.env.backup.local"
    echo "✅ Backed up local .env to .env.backup.local"
fi

# Copy remote config
cp "$PROJECT_ROOT/services/core-api/.env.remote" "$PROJECT_ROOT/services/core-api/.env"
echo "✅ Loaded remote configuration (.env.remote)"

echo ""
echo "🌐 Remote Server Configuration:"
echo "   Host:      194.177.1.240"
echo "   PostgreSQL: 5432"
echo "   Redis:     6379"
echo "   Neo4j:     7687"
echo "   Kafka:     9092"
echo "   OpenSearch: 9200"
echo "   Qdrant:    6333"
echo "   Ollama:    11434"
echo ""

echo "📝 Quick commands to test connectivity:"
echo ""
echo "  # Test PostgreSQL"
echo "  psql -h 194.177.1.240 -U predator -d predator"
echo ""
echo "  # Test Redis"
echo "  redis-cli -h 194.177.1.240 ping"
echo ""
echo "  # Test Kafka"
echo "  curl http://194.177.1.240:9092"
echo ""
echo "  # Test OpenSearch"
echo "  curl -u admin:nvidia-prod-password http://194.177.1.240:9200"
echo ""
echo "  # Test Qdrant"
echo "  curl http://194.177.1.240:6333/health"
echo ""

echo "⚡ To test backend connection:"
echo "  cd /Users/dima-mac/Documents/Predator_21/services/core-api"
echo "  python -m pytest tests/ -v"
echo ""

echo "🔙 To switch back to LOCAL:"
echo "  cp services/core-api/.env.backup.local services/core-api/.env"
echo ""

echo "✅ Setup complete!"
