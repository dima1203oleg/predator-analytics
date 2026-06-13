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
export PROMETHEUS_URL=http://localhost:9090
export GRAFANA_URL=http://localhost:9001
export LOKI_URL=http://localhost:3100

.venv/bin/python -c '
import asyncio
import json
from utos.orchestrator import UtosOrchestrator

async def main():
    orchestrator = UtosOrchestrator()
    report = await orchestrator.execute_all()
    print(json.dumps(report, indent=2))

asyncio.run(main())
'
