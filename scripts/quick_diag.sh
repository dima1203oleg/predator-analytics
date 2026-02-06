
#!/bin/bash

echo "🔍 SYSTEM DIAGNOSTICS (BASH) - $(date)"
echo "----------------------------------------"

check_service() {
    name=$1
    url=$2
    code=$3

    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status" -eq "$code" ]; then
        echo "✅ $name: OK"
    else
        echo "❌ $name: FAIL (Expected $code, got $status)"
    fi
}

check_service "Frontend" "http://localhost:80" 200
check_service "Backend" "http://localhost:8090/health" 200
check_service "Qdrant" "http://localhost:6333/collections" 200
check_service "OpenSearch" "http://localhost:9200" 200
check_service "MinIO" "http://localhost:9001/minio/health/live" 200
check_service "Prometheus" "http://localhost:9092/-/healthy" 200
check_service "Grafana" "http://localhost:3001/api/health" 200

echo "----------------------------------------"
