import json
import subprocess
import time

def run(cmd):
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return {"code": res.returncode, "out": res.stdout.strip(), "err": res.stderr.strip()}
    except Exception as e:
        return {"code": -1, "out": "", "err": str(e)}

results = {}

# 1. Docker
results["docker_ps"] = run("docker ps --format '{{.Names}} ({{.Status}})'")
results["docker_stats"] = run("docker stats --no-stream --format '{{.Name}}: CPU {{.CPUPerc}}, RAM {{.MemUsage}}'")

# 2. Kubernetes
results["k8s_pods"] = run("kubectl get pods -A --field-selector=status.phase!=Running")
results["k8s_nodes"] = run("kubectl get nodes")

# 3. Databases (Ping / Status)
# Postgres
results["pg"] = run("docker exec predator_postgres pg_isready -U predator")
# Redis
results["redis"] = run("docker exec predator_redis redis-cli ping")
# Neo4j
results["neo4j"] = run("docker exec predator_neo4j cypher-shell -u neo4j -p password 'RETURN 1'")
# MinIO
results["minio"] = run("curl -sI http://localhost:9000/minio/health/live")
# Qdrant
results["qdrant"] = run("curl -s http://localhost:6333/")
# OpenSearch
results["opensearch"] = run("curl -s -k -u admin:admin https://localhost:9200/_cluster/health")

# 4. Frontend / API
results["frontend"] = run("curl -sI http://localhost:3030")
results["api"] = run("curl -sI http://localhost:8000/api/v1/health")

print(json.dumps(results, indent=2))
