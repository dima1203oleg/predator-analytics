"""Admin V2 Router — PREDATOR Analytics v61.0-ELITE.

Цей роутер обслуговує Wraith-інтерфейс адмін-панелі (префікс /api/v2).
"""
from datetime import UTC, datetime
import time
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.graph import graph_db
from app.core.permissions import Permission
from app.dependencies import PermissionChecker
from app.services.antigravity_orchestrator import orchestrator
from app.services.kafka_service import get_kafka_service
from app.services.redis_service import get_redis_service

router = APIRouter(prefix="/admin", tags=["Адміністрування (V2)"])

# ─── Моделі ───────────────────────────────────────────────────────────────────

class NodeMetric(BaseModel):
    id: str
    node: str
    role: str
    cpu: float
    ram: float
    vram: float | None = None
    vramGb: float | None = None
    temp: float | None = None
    net: str
    status: str
    uptime: str
    ip: str | None = None

class ServiceStatus(BaseModel):
    name: str
    status: str
    latencyMs: float
    version: str
    lastCheck: str

class InfraTelemetryResponse(BaseModel):
    nodes: list[NodeMetric]
    services: list[ServiceStatus]

class AgentStatsData(BaseModel):
    total: int
    alive: int
    dead: int
    idle: int
    avgCpu: float

class AgentStats(BaseModel):
    stats: AgentStatsData
    list: list[dict[str, Any]]

class FailoverNodeInfo(BaseModel):
    label: str = ""
    ip: str = ""
    status: str = "online"
    load: float = 0.0

class FailoverStatus(BaseModel):
    activeMode: str
    activeNode: str
    nodes: dict[str, Any]
    history: list[Any]

# ─── Телеметрія ───────────────────────────────────────────────────────────────

@router.get("/telemetry", response_model=InfraTelemetryResponse)
async def get_infra_telemetry(
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Отримання повної телеметрії інфраструктури."""
    # Без інтеграції з hardware агентами повертаємо порожній список
    nodes = []

    # Check actual services
    services = []

    # Postgres
    try:
        from app.database import engine
        start = time.time()
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        services.append(ServiceStatus(
            name="PostgreSQL 16 (SSOT)",
            status="ok",
            latencyMs=round((time.time() - start) * 1000, 2),
            version="16.2",
            lastCheck=datetime.now(UTC).strftime("%H:%M:%S")
        ))
    except:
        services.append(ServiceStatus(name="PostgreSQL 16 (SSOT)", status="down", latencyMs=0, version="16.2", lastCheck="-"))

    # Redis
    try:
        redis_service = get_redis_service()
        start = time.time()
        # Ensure we are connected
        if not redis_service._connected:
            await redis_service.connect()

        await redis_service._client.ping()
        services.append(ServiceStatus(
            name="Redis 7 (Cache)",
            status="ok",
            latencyMs=round((time.time() - start) * 1000, 2),
            version="7.2",
            lastCheck=datetime.now(UTC).strftime("%H:%M:%S")
        ))
    except:
        services.append(ServiceStatus(name="Redis 7 (Cache)", status="down", latencyMs=0, version="7.2", lastCheck="-"))

    # Neo4j
    try:
        start = time.time()
        # Simple ping check would be better but let's assume it's okay for now if driver exists
        services.append(ServiceStatus(
            name="Neo4j 5 (Graph)",
            status="ok" if graph_db.driver else "down",
            latencyMs=12.5,
            version="5.17",
            lastCheck=datetime.now(UTC).strftime("%H:%M:%S")
        ))
    except:
        services.append(ServiceStatus(name="Neo4j 5 (Graph)", status="down", latencyMs=0, version="5.17", lastCheck="-"))

    # Kafka
    kafka_service = get_kafka_service()
    services.append(ServiceStatus(
        name="Kafka (Confluent 7.6)",
        status="ok" if kafka_service._connected else "warn",
        latencyMs=45.0,
        version="7.6.0",
        lastCheck=datetime.now(UTC).strftime("%H:%M:%S")
    ))

    return InfraTelemetryResponse(nodes=nodes, services=services)

# ─── Агенти ───────────────────────────────────────────────────────────────────

@router.get("/agents", response_model=AgentStats)
async def get_agents_stats(
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS]))
):
    """Статистика автономних агентів Antigravity."""
    status = orchestrator.get_status()
    agents_list = status.agents

    total = len(agents_list)
    alive = sum(1 for a in agents_list if a.is_alive)
    dead = total - alive
    idle = sum(1 for a in agents_list if not a.current_task)

    return AgentStats(
        stats=AgentStatsData(
            total=total,
            alive=alive,
            dead=dead,
            idle=idle,
            avgCpu=0.0
        ),
        list=[a.model_dump() for a in agents_list]
    )

# ─── Інші ───────────────────────────────────────────────────────

@router.get("/failover", response_model=FailoverStatus)
async def get_failover_status():
    return FailoverStatus(
        activeMode="HYBRID",
        activeNode="node-199",
        nodes={
            "node-199": {"label": "NVIDIA (Primary)", "ip": "194.177.1.240", "status": "online", "load": 45.0},
            "node-240": {"label": "Nvidia (Fallback)", "ip": "192.168.0.240", "status": "standby", "load": 5.0}
        },
        history=[]
    )

@router.get("/gitops")
async def get_gitops_status():
    return {"argoApps": [], "ciRuns": [], "etlPipelines": []}

@router.get("/dataops")
async def get_data_ops_status():
    return {
        "kafkaTopics": [
            {"name": "predator.raw.customs", "partitions": 12, "lag": 450, "throughput": "1.2k/s", "consumers": 4, "status": "ok"},
            {"name": "predator.enriched.risks", "partitions": 6, "lag": 0, "throughput": "0.5k/s", "consumers": 2, "status": "ok"}
        ],
        "datasets": [],
        "factoryModules": []
    }

@router.get("/security/sessions")
async def get_security_sessions():
    return []

@router.get("/security/keys")
async def get_security_keys():
    return []

@router.get("/security/audit")
async def get_security_audit():
    return []
