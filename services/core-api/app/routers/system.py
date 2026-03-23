from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List
import random
from datetime import datetime, UTC

from app.models.factory import SystemImprovement, ImprovementPhase
from app.services.factory_repository import FactoryRepository
from app.routers.factory import get_factory_repo

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/cluster")
async def get_cluster_status():
    """Отримати статус K8s кластера для UI"""
    # Симолюємо реальні дані з K8s (в реальності тут був би клієнт kubernetes)
    services = [
        {"name": "predator-core-api", "status": "Running", "cpu": "142m", "mem": "512Mi", "restarts": 0, "age": "5d 12h"},
        {"name": "predator-graph-worker", "status": "Running", "cpu": "850m", "mem": "2.4Gi", "restarts": 1, "age": "2d 4h"},
        {"name": "predator-ingestion", "status": "Running", "cpu": "340m", "mem": "1.2Gi", "restarts": 0, "age": "5d 12h"},
        {"name": "predator-ui-frontend", "status": "Running", "cpu": "12m", "mem": "85Mi", "restarts": 0, "age": "18h"},
        {"name": "neo4j-cluster-0", "status": "Running", "cpu": "1.2", "mem": "8Gi", "restarts": 0, "age": "12d"},
        {"name": "kafka-controller-0", "status": "Running", "cpu": "450m", "mem": "2Gi", "restarts": 0, "age": "12d"},
    ]
    
    return {
        "status": "healthy",
        "nodes": 3,
        "pods": services,
        "metrics": {
            "cluster_cpu": 42.5,
            "cluster_mem": 68.2,
            "network_in": "1.2GB/s",
            "network_out": "450MB/s"
        }
    }

@router.get("/logs/stream")
async def stream_system_logs(limit: int = 50):
    """Стрім системних логів"""
    # Симолюємо логі
    services = ["core-api", "graph-worker", "ingestion", "auth-service", "gateway"]
    levels = ["INFO", "WARN", "ERROR", "DEBUG"]
    messages = [
        "Inbound request processed in 142ms",
        "Neo4j connection pool saturated, scaling core-api",
        "Kafka consumer group rebalancing",
        "Access denied for user guest. IP logged.",
        "Ingestion pipeline high throughput detected",
        "Memory usage at 85% for predator-graph-worker",
        "Successfully connected to PostgreSQL cluster",
        "Backup job completed in 12s",
        "Circuit breaker OPEN for graphite-exporter",
        "New tenant 'T-982' provisioned successfully"
    ]
    
    logs = []
    for i in range(limit):
        logs.append({
            "id": f"log-{i}",
            "timestamp": datetime.now(UTC).isoformat(),
            "service": random.choice(services),
            "level": random.choice(levels),
            "message": random.choice(messages)
        })
    
    return logs
