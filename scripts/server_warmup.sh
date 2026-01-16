#!/bin/bash
# Predator Analytics v29.1 - Production Warmup Script
# To be executed on the NVIDIA Server at 17:00

echo "🚀 [PREDATOR] Starting Production Warmup Sequence..."

# 1. Load Environment
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# 2. Start Optimized Stack
echo "📦 Starting Docker Stack (Optimized)..."
docker-compose -f docker-compose.optimized.yml up -d

# 3. Wait for Infrastructure
echo "⏳ Waiting for Postgres (5432) & Redis (6379)..."
for i in {1..30}; do
    if nc -z localhost 5432 && nc -z localhost 6379; then
        echo "✅ Services are UP"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# 4. Pull AI Models (Ollama)
echo "🧠 Pulling Llama-3.1 for Ollama..."
docker exec predator_ollama_opt ollama pull llama3.1:8b

# 5. Bootstrap Knowledge Base
echo "📚 Ingesting Seed Scenarios..."
python3 scripts/verify_learning_stack.py

# 6. Verify SOM Ring Level 2
echo "🛡️ Verifying SOM Status..."
curl -s http://localhost:8095/api/v1/som/status | grep "active"

# 7. Start Autonomous Processor Log Tail
echo "📡 Activation Complete. System is now in HYPER-AUTONOMOUS MODE."
echo "Monitoring logs..."
tail -f logs/autonomous_processor.log
