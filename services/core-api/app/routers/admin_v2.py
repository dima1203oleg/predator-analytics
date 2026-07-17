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
from app.services.valkey_service import get_valkey_service
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from predator_common.models import User, Tenant

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

from app.routers.system import _collect_system_stats
from fastapi import Request

@router.get("/telemetry", response_model=InfraTelemetryResponse)
async def get_infra_telemetry(
    request: Request,
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    """Отримання повної телеметрії інфраструктури з реального заліза."""
    stats = _collect_system_stats(request)
    
    nodes = [
        NodeMetric(
            id="node-primary",
            node=stats.get("gpu_name", "Primary Node"),
            role="CORE / AI",
            cpu=stats.get("cpu_percent", 0.0),
            ram=stats.get("memory_percent", 0.0),
            vram=stats.get("gpu_utilization") if stats.get("gpu_available") else None,
            vramGb=round(stats.get("gpu_mem_used", 0) / (1024**3), 1) if stats.get("gpu_available") else None,
            temp=stats.get("gpu_temp") if stats.get("gpu_available") else None,
            net=f"{round(stats.get('network_bytes_sent', 0)/(1024**2), 1)} MB/s",
            status="ok",
            uptime=stats.get("uptime", "0хв"),
            ip="127.0.0.1"
        )
    ]

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
        valkey_service = get_valkey_service()
        start = time.time()
        if not valkey_service._connected:
            await valkey_service.connect()
        await valkey_service._client.ping()
        services.append(ServiceStatus(
            name="Redis (Cache)",
            status="ok",
            latencyMs=round((time.time() - start) * 1000, 2),
            version="7+",
            lastCheck=datetime.now(UTC).strftime("%H:%M:%S")
        ))
    except:
        services.append(ServiceStatus(name="Redis (Cache)", status="down", latencyMs=0, version="7+", lastCheck="-"))

    # Neo4j
    try:
        start = time.time()
        services.append(ServiceStatus(
            name="Neo4j (Graph)",
            status="ok" if graph_db.driver else "down",
            latencyMs=round((time.time() - start) * 1000, 2),
            version="5+",
            lastCheck=datetime.now(UTC).strftime("%H:%M:%S")
        ))
    except:
        services.append(ServiceStatus(name="Neo4j (Graph)", status="down", latencyMs=0, version="5+", lastCheck="-"))

    import httpx
    
    # OpenSearch
    try:
        start = time.time()
        async with httpx.AsyncClient() as client:
            await client.get("http://opensearch:9200", timeout=1.0)
        services.append(ServiceStatus(name="OpenSearch (Index)", status="ok", latencyMs=round((time.time() - start) * 1000, 2), version="2.x", lastCheck=datetime.now(UTC).strftime("%H:%M:%S")))
    except:
        services.append(ServiceStatus(name="OpenSearch (Index)", status="down", latencyMs=0, version="2.x", lastCheck="-"))
    
    # Qdrant
    try:
        start = time.time()
        async with httpx.AsyncClient() as client:
            await client.get("http://qdrant:6333", timeout=1.0)
        services.append(ServiceStatus(name="Qdrant (Vectors)", status="ok", latencyMs=round((time.time() - start) * 1000, 2), version="1.8", lastCheck=datetime.now(UTC).strftime("%H:%M:%S")))
    except:
        services.append(ServiceStatus(name="Qdrant (Vectors)", status="down", latencyMs=0, version="1.8", lastCheck="-"))

    # ClickHouse
    try:
        start = time.time()
        async with httpx.AsyncClient() as client:
            await client.get("http://clickhouse:8123/ping", timeout=1.0)
        services.append(ServiceStatus(name="ClickHouse (Analytics)", status="ok", latencyMs=round((time.time() - start) * 1000, 2), version="23+", lastCheck=datetime.now(UTC).strftime("%H:%M:%S")))
    except:
        services.append(ServiceStatus(name="ClickHouse (Analytics)", status="down", latencyMs=0, version="23+", lastCheck="-"))

    # MinIO
    try:
        start = time.time()
        async with httpx.AsyncClient() as client:
            await client.get("http://minio:9000/minio/health/live", timeout=1.0)
        services.append(ServiceStatus(name="MinIO (Object Storage)", status="ok", latencyMs=round((time.time() - start) * 1000, 2), version="RELEASE", lastCheck=datetime.now(UTC).strftime("%H:%M:%S")))
    except:
        services.append(ServiceStatus(name="MinIO (Object Storage)", status="down", latencyMs=0, version="RELEASE", lastCheck="-"))

    # Kafka
    kafka_service = get_kafka_service()
    services.append(ServiceStatus(
        name="Kafka/Redpanda",
        status="ok" if kafka_service._connected else "warn",
        latencyMs=0,
        version="latest",
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
async def get_failover_status(request: Request):
    stats = _collect_system_stats(request)
    return FailoverStatus(
        activeMode="STANDALONE",
        activeNode="node-primary",
        nodes={
            "node-primary": {"label": stats.get("gpu_name", "Primary"), "ip": "127.0.0.1", "status": "online", "load": stats.get("cpu_percent", 0)}
        },
        history=[]
    )

@router.get("/gitops")
async def get_gitops_status():
    return {"argoApps": [], "ciRuns": [], "etlPipelines": []}

@router.get("/dataops")
async def get_data_ops_status():
    """Динамічне отримання топіків Kafka."""
    from app.config import get_settings
    settings = get_settings()
    kafka_service = get_kafka_service()
    topics = []
    
    if kafka_service._connected:
        try:
            from aiokafka.admin import AIOKafkaAdminClient
            admin = AIOKafkaAdminClient(bootstrap_servers=settings.KAFKA_BROKERS)
            await admin.start()
            topics_metadata = await admin.list_topics()
            
            for topic_name in topics_metadata:
                if topic_name.startswith("__"): continue
                topics.append({
                    "name": topic_name,
                    "partitions": 1,
                    "lag": 0,
                    "throughput": "Active",
                    "consumers": 1,
                    "status": "ok"
                })
            await admin.close()
        except Exception:
            pass
            
    # Fallback to configured topics
    from app.services.kafka_service import KafkaTopics
    if not topics:
        topics = [
            {"name": KafkaTopics.INGESTION_RAW, "partitions": 1, "lag": 0, "throughput": "Idle", "consumers": 0, "status": "ok" if kafka_service._connected else "offline"},
            {"name": KafkaTopics.INGESTION_CLEANED, "partitions": 1, "lag": 0, "throughput": "Idle", "consumers": 0, "status": "ok" if kafka_service._connected else "offline"}
        ]
        
    return {
        "kafkaTopics": topics,
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
    try:
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT id, action, resource_type, ip_address, created_at, details FROM audit_log ORDER BY created_at DESC LIMIT 50"))
            rows = result.mappings().all()
            return [{
                "id": str(r["id"]),
                "action": r["action"],
                "resource_type": r["resource_type"],
                "ip": r["ip_address"],
                "timestamp": r["created_at"].isoformat() if r["created_at"] else "",
                "details": r["details"]
            } for r in rows]
    except Exception:
        return []

# ─── OSINT Control Plane ───────────────────────────────────────────────────────

@router.get("/osint/sources")
async def get_osint_sources():
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://osint-service:9201/osint-2/status", timeout=2.0)
            data = resp.json()
            white = []
            dark = []
            for category, tools in data.items():
                if isinstance(tools, dict):
                    for tool_name, info in tools.items():
                        src = {"id": tool_name, "name": tool_name.capitalize(), "status": info.get("status", "offline"), "health": "100%", "quota": "Unlimited"}
                        if category in ["digital_forensics", "international"]:
                            dark.append({**src, "risk_score": 75, "quarantined_items": 0})
                        else:
                            white.append(src)
            return {"white": white, "dark": dark}
    except Exception:
        pass

    return {
        "white": [],
        "dark": []
    }

@router.get("/osint/quarantine")
async def get_osint_quarantine():
    return []

@router.get("/osint/policies")
async def get_osint_policies():
    return []

# ─── RBAC & Users ──────────────────────────────────────────────────────────────

@router.get("/users")
async def get_admin_users(
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    query = select(User).options(selectinload(User.tenant))
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "role": u.role.capitalize(),
            "org": u.tenant.name if hasattr(u, "tenant") and u.tenant else "N/A",
            "status": "ACTIVE" if u.is_active else "BLOCKED",
            "mfa": u.mfa_enabled,
            "quota": "Standard",
            "activity": "Останній вхід: " + (u.last_login_at.strftime("%Y-%m-%d %H:%M") if u.last_login_at else "Ніколи")
        } for u in users
    ]

@router.get("/organizations")
async def get_admin_organizations(
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.MANAGE_USERS]))
):
    query = select(Tenant)
    result = await db.execute(query)
    tenants = result.scalars().all()
    
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "license": t.plan.capitalize(),
            "users": t.max_users,
            "tariff": "Custom",
            "endDate": "2028-12-31",
            "apiUsage": "Unknown",
            "aiUsage": "Unknown",
            "storageUsage": f"{t.max_storage_gb} GB"
        } for t in tenants
    ]
