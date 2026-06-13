#!/bin/bash
export PYTHONPATH=services
export CORE_API_URL=http://localhost:9090
export FRONTEND_URL=http://localhost:9080
export REDIS_URL=redis://localhost:9379/0
export POSTGRES_DSN=postgresql://dima:predator_password@localhost:9432/predator_db
export CLICKHOUSE_URL=http://localhost:8123
export NEO4J_URI=bolt://localhost:7687
export OPENSEARCH_URL=http://localhost:9200
export QDRANT_URL=http://localhost:6333
export MINIO_URL=http://localhost:9000
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export OLLAMA_URL=http://localhost:11434
export LITELLM_URL=http://localhost:4000

echo "=========================================================="
echo "🤖 PREDATOR ANALYTICS: AUTONOMOUS DEEPSEEK-R1 PIPELINE"
echo "=========================================================="

INPUT_FILE=${1:-/Users/dima1203/Desktop/Березень_2024.xlsx}

echo "1. Checking preconditions..."
if ! command -v .venv/bin/python &> /dev/null; then
    echo "❌ Python virtual environment not found!"
    exit 1
fi

echo "2. Starting Autonomous Pipeline..."
.venv/bin/python services/training_controller/deepseek_pipeline.py "$INPUT_FILE"
PIPELINE_STATUS=$?

if [ $PIPELINE_STATUS -eq 0 ]; then
    echo "=========================================================="
    echo "✅ PIPELINE FINISHED SUCCESSFULLY"
    echo "DeepSeek-R1 Fine-Tuned Model is now in Production."
    echo "=========================================================="
else
    echo "=========================================================="
    echo "❌ PIPELINE FAILED"
    echo "Review logs for details."
    echo "=========================================================="
    exit 1
fi
