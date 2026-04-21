import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Request
import psutil

from app.config import get_settings
from app.core.health import health_service

router = APIRouter(prefix="/system", tags=["system"])
stats_router = APIRouter(prefix="/stats", tags=["system"])

settings = get_settings()


def _status_to_health_label(status: str) -> str:
    mapping = {
        "ok": "В НОРМІ",
        "degraded": "ДЕГРАДОВАНО",
        "offline": "ПОЗА КОНТУРОМ",
        "error": "КРИТИЧНО",
    }
    return mapping.get(status, "НЕВІДОМО")


def _status_to_infra_label(status: str) -> str:
    mapping = {
        "ok": "UP",
        "degraded": "DEGRADED",
        "offline": "DEGRADED",
        "error": "DOWN",
    }
    return mapping.get(status, "DEGRADED")


def _status_to_pod_state(status: str) -> str:
    mapping = {
        "ok": "Running",
        "degraded": "Degraded",
        "offline": "Offline",
        "error": "CrashLoopBackOff",
    }
    return mapping.get(status, "Unknown")


def _format_uptime(delta: timedelta) -> str:
    total_seconds = max(int(delta.total_seconds()), 0)
    days, rem = divmod(total_seconds, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, _seconds = divmod(rem, 60)
    if days > 0:
        return f"{days}д {hours}г"
    if hours > 0:
        return f"{hours}г {minutes}хв"
    return f"{minutes}хв"


def _started_at(request: Request) -> datetime:
    started_at = getattr(request.app.state, "started_at", None)
    if isinstance(started_at, datetime):
        return started_at
    return datetime.now(UTC)


def _collect_gpu_stats() -> dict[str, Any]:
    """Спроба отримати метрики NVIDIA GPU через nvidia-smi."""
    try:
        # Формат: index, name, temperature.gpu, utilization.gpu [%], memory.total [MiB], memory.used [MiB]
        cmd = ["nvidia-smi", "--query-gpu=index,name,temperature.gpu,utilization.gpu,memory.total,memory.used", "--format=csv,noheader,nounits"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            lines = result.stdout.strip().split("\n")
            if lines:
                parts = [p.strip() for p in lines[0].split(",")]
                return {
                    "gpu_name": parts[1],
                    "gpu_temp": int(parts[2]),
                    "gpu_utilization": int(parts[3]),
                    "gpu_mem_total": int(parts[4]),
                    "gpu_mem_used": int(parts[5]),
                    "gpu_available": True
                }
    except Exception:
        pass
    return {"gpu_available": False, "gpu_name": "N/A", "gpu_temp": 0, "gpu_utilization": 0}


def _collect_system_stats(request: Request) -> dict[str, Any]:
    started_at = _started_at(request)
    uptime_delta = datetime.now(UTC) - started_at

    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    network = psutil.net_io_counters()
    
    gpu = _collect_gpu_stats()

    try:
        active_tasks = len(asyncio.all_tasks()) - 1
    except RuntimeError:
        active_tasks = 0

    return {
        "cpu_usage": cpu_percent,
        "cpu_percent": cpu_percent,
        "cpu_count": psutil.cpu_count() or 1,
        "memory_usage": memory.used,
        "memory_percent": memory.percent,
        "memory_total": memory.total,
        "memory_used": memory.used,
        "memory_available": memory.available,
        "disk_usage": disk.used,
        "disk_percent": disk.percent,
        "disk_total": disk.total,
        "disk_used": disk.used,
        "disk_free": disk.free,
        "gpu_available": gpu["gpu_available"],
        "gpu_name": gpu["gpu_name"],
        "gpu_temp": gpu["gpu_temp"],
        "gpu_utilization": gpu["gpu_utilization"],
        "gpu_mem_total": gpu.get("gpu_mem_total", 0) * 1024 * 1024, # Convert MiB to Bytes
        "gpu_mem_used": gpu.get("gpu_mem_used", 0) * 1024 * 1024,
        "network_bytes_sent": network.bytes_sent,
        "network_bytes_recv": network.bytes_recv,
        "active_connections": len(psutil.net_connections()) if hasattr(psutil, "net_connections") else 0,
        "active_tasks": active_tasks,
        "uptime": _format_uptime(uptime_delta),
        "uptime_seconds": int(uptime_delta.total_seconds()),
        "documents_total": 0,
        "search_rate": 0,
        "avg_latency": 0,
        "indexing_rate": 0,
        "total_indices": 0,
        "storage_gb": round(disk.used / (1024 ** 3), 2),
        "antigravity": _collect_antigravity_stats(),
        "timestamp": datetime.now(UTC).isoformat(),
    }

def _collect_antigravity_stats() -> dict[str, Any]:
    """Збір метрик автономних агентів Antigravity."""
    from app.services.antigravity_orchestrator import orchestrator
    status = orchestrator.get_status()
    tasks = orchestrator.get_tasks()
    
    return {
        "is_running": status.is_running,
        "active_agents": len([a for a in status.agents if a.is_busy]),
        "total_agents": len(status.agents),
        "tasks_pending": len([t for t in tasks if t.status == "pending"]),
        "tasks_running": len([t for t in tasks if t.status == "running"]),
        "tasks_completed": status.completed_tasks,
        "total_spent_usd": round(status.total_spent_usd, 2),
        "llm_gateway": status.llm_gateway_status,
        "sandbox": status.sandbox_status
    }


async def _health_snapshot() -> dict[str, Any]:
    return await health_service.comprehensive_health_check()


def _service_duration_ms(service: dict[str, Any]) -> int:
    duration = service.get("duration_seconds")
    if duration is None:
        return 0
    return int(float(duration) * 1000)


def _build_services_list(health: dict[str, Any]) -> list[dict[str, Any]]:
    services = []
    for name, service in health.get("services", {}).items():
        services.append(
            {
                "name": name,
                "status": service.get("status", "unknown"),
                "label": _status_to_health_label(service.get("status", "unknown")),
                "latency_ms": _service_duration_ms(service),
                "details": service.get("details", {}),
                "error": service.get("error"),
            }
        )
    return services


def _build_markdown_report(health: dict[str, Any], stats: dict[str, Any]) -> str:
    lines = [
        "# Звіт системної діагностики",
        "",
        f"- Загальний стан: **{_status_to_health_label(health['status'])}**",
        f"- Версія: **{health['version']}**",
        f"- Середовище: **{health['environment']}**",
        f"- Uptime API: **{stats['uptime']}**",
        f"- CPU: **{stats['cpu_percent']:.1f}%**",
        f"- Пам'ять: **{stats['memory_percent']:.1f}%**",
        f"- Диск: **{stats['disk_percent']:.1f}%**",
        "",
        "## Сервіси",
    ]

    for name, service in health.get("services", {}).items():
        status_label = _status_to_health_label(service.get("status", "unknown"))
        duration_ms = _service_duration_ms(service)
        error = service.get("error")
        detail_suffix = f" | помилка: {error}" if error else ""
        lines.append(f"- `{name}`: {status_label} | {duration_ms} мс{detail_suffix}")

    return "\n".join(lines)


def _group_diagnostics(health: dict[str, Any]) -> dict[str, dict[str, Any]]:
    services = health.get("services", {})
    return {
        "infrastructure": {
            "postgres": services.get("postgresql", {"status": "unknown"}),
            "redis": services.get("redis", {"status": "unknown"}),
            "neo4j": services.get("neo4j", {"status": "unknown"}),
        },
        "data_ingestion": {
            "kafka": services.get("kafka", {"status": "unknown"}),
            "minio": services.get("minio", {"status": "unknown"}),
            "opensearch": services.get("opensearch", {"status": "unknown"}),
            "qdrant": services.get("qdrant", {"status": "unknown"}),
        },
        "ai_brain": {
            "litellm": services.get("ollama", {"status": "unknown"}),
            "mlflow": services.get("mlflow", {"status": "unknown"}),
        },
        "observability": {
            "api": {
                "status": health.get("status", "unknown"),
                "version": health.get("version"),
                "environment": health.get("environment"),
            }
        },
    }


@router.get("/status")
async def get_system_status(request: Request) -> dict[str, Any]:
    """Повертає консолідований статус системи."""
    health = await _health_snapshot()
    stats = _collect_system_stats(request)
    services = _build_services_list(health)

    latency_samples = [service["latency_ms"] for service in services if service["latency_ms"] > 0]
    stats["avg_latency"] = round(sum(latency_samples) / len(latency_samples), 2) if latency_samples else 0

    from app.services.redis_service import get_redis_service
    redis = get_redis_service()
    last_sync = await redis.get("system:last_sync")

    return {
        "status": health["status"],
        "healthy": health["status"] == "ok",
        "overall_status": _status_to_health_label(health["status"]),
        "version": health["version"],
        "environment": health["environment"],
        "uptime": stats["uptime"],
        "last_sync": last_sync,
        "services": services,
        "summary": health["summary"],
        "metrics": stats,
        "timestamp": health["timestamp"],
    }


@router.get("/metrics/history")
async def get_metrics_history() -> list[dict[str, Any]]:
    """Повертає історію метрик за останні 24 години з Redis."""
    from app.services.redis_service import get_redis_service
    import json
    
    redis = get_redis_service()
    if not redis._connected:
        return []
        
    try:
        key = "system:metrics:history"
        raw_data = await redis._client.lrange(key, 0, -1)
        return [json.loads(d) for d in raw_data][::-1]  # Повертаємо у хронологічному порядку
    except Exception:
        return []


@router.get("/stats")
async def get_system_stats(request: Request) -> dict[str, Any]:
    """Легковажні системні метрики для UI-панелей."""
    return _collect_system_stats(request)


@stats_router.get("/system")
async def get_system_stats_alias(request: Request) -> dict[str, Any]:
    """Зворотно сумісний alias для старих UI-модулів."""
    return await get_system_stats(request)

@stats_router.get("/antigravity")
async def get_antigravity_stats() -> dict[str, Any]:
    """Детальні метрики автономних агентів для HUD."""
    return _collect_antigravity_stats()


@router.post("/diagnostics/run")
async def run_system_diagnostics(request: Request) -> dict[str, Any]:
    """Запускає поглиблену діагностику системи для UI."""
    health = await _health_snapshot()
    stats = _collect_system_stats(request)
    
    from app.main import sovereign_guardian
    predictions = await sovereign_guardian.get_predictions()

    return {
        "status": "success",
        "generated_at": datetime.now(UTC).isoformat(),
        "results": {
            "health_status": health["status"],
            "overall_status": _status_to_health_label(health["status"]),
            **_group_diagnostics(health),
            "summary": health["summary"],
            "metrics": stats,
            "predictions": predictions
        },
        "report_markdown": _build_markdown_report(health, stats),
    }


@router.get("/cluster")
async def get_cluster_status(request: Request) -> dict[str, Any]:
    """Отримати фактичний зведений стан сервісів для UI моніторингу."""
    health = await _health_snapshot()
    stats = _collect_system_stats(request)
    age = stats["uptime"]

    pods = [
        {
            "name": f"predator-{name}",
            "status": _status_to_pod_state(service.get("status", "unknown")),
            "cpu": f"{stats['cpu_percent'] / max(len(health['services']), 1):.0f}%",
            "mem": f"{stats['memory_percent'] / max(len(health['services']), 1):.0f}%",
            "restarts": 0,
            "age": age,
        }
        for name, service in health.get("services", {}).items()
    ]

    return {
        "status": health["status"],
        "nodes": 1,
        "pods": pods,
        "metrics": {
            "cluster_cpu": stats["cpu_percent"],
            "cluster_mem": stats["memory_percent"],
            "network_in": stats["network_bytes_recv"],
            "network_out": stats["network_bytes_sent"],
        },
        "timestamp": health["timestamp"],
    }


@router.get("/logs/stream")
async def stream_system_logs(limit: int = 50) -> list[dict[str, Any]]:
    """Повертає компактний стрім системних логів на основі health snapshot."""
    health = await _health_snapshot()
    now = datetime.now(UTC)
    logs: list[dict[str, Any]] = []

    for index, (name, service) in enumerate(health.get("services", {}).items()):
        status = service.get("status", "unknown")
        level = "INFO" if status == "ok" else "WARN" if status in {"degraded", "offline"} else "ERROR"
        message = (
            f"Сервіс {name} у стані {_status_to_health_label(status).lower()} "
            f"({ _service_duration_ms(service) } мс)"
        )
        if service.get("error"):
            message = f"{message}. Причина: {service['error']}"

        logs.append(
            {
                "id": f"log-{index}",
                "timestamp": now.isoformat(),
                "service": name,
                "level": level,
                "message": message,
            }
        )

    return logs[:max(limit, 0)]


@router.get("/infrastructure")
async def get_infrastructure(request: Request) -> dict[str, Any]:
    """Повертає нормалізований стан ключових компонентів інфраструктури."""
    health = await _health_snapshot()
    stats = _collect_system_stats(request)
    services = health.get("services", {})

    def component_payload(name: str, **extras: Any) -> dict[str, Any]:
        service = services.get(name, {"status": "unknown"})
        return {
            "status": _status_to_infra_label(service.get("status", "unknown")),
            "version": health["version"],
            "latency_ms": _service_duration_ms(service),
            **extras,
        }

    return {
        "status": health["status"],
        "components": {
            "postgresql": component_payload("postgresql", records=0),
            "opensearch": component_payload("opensearch", documents=stats["documents_total"]),
            "qdrant": component_payload("qdrant", vectors=0),
            "graphdb": component_payload("neo4j", nodes=0, edges=0),
            "minio": component_payload("minio", files=0),
            "redis": component_payload("redis", keys=0),
        },
        "timestamp": health["timestamp"],
    }


@router.get("/engines")
async def get_engines(request: Request) -> dict[str, Any]:
    """Повертає стан AI/аналітичних рушіїв для головної панелі."""
    health = await _health_snapshot()
    stats = _collect_system_stats(request)
    services = health.get("services", {})

    def engine_state(service_name: str, model: str, endpoint: str) -> dict[str, Any]:
        service = services.get(service_name, {"status": "unknown"})
        return {
            "status": service.get("status", "unknown"),
            "label": _status_to_health_label(service.get("status", "unknown")),
            "model": model,
            "endpoint": endpoint,
            "latency_ms": _service_duration_ms(service),
            "throughput": stats["active_tasks"],
        }

    return {
        "copilot": engine_state("ollama", settings.LITELLM_MODEL, settings.LITELLM_API_BASE),
        "embeddings": engine_state("ollama", settings.OLLAMA_EMBEDDING_MODEL, settings.LITELLM_API_BASE),
        "graph": engine_state("neo4j", "neo4j-gds", settings.NEO4J_URI),
    }


@router.get("/nexus/scenarios")
async def get_nexus_scenarios() -> list[dict[str, Any]]:
    """Повертає активні OSINT-сценарії з Redis."""
    from app.services.redis_service import get_redis_service
    import json
    
    redis = get_redis_service()
    if not redis._connected:
        return []
        
    try:
        data = await redis.get("system:nexus:scenarios")
        if data:
            return json.loads(data)
    except Exception:
        pass
        
    # Default fallbacks if redis is empty
    return [
        {
            "id": "S1",
            "name": "Картельна змова на пальному",
            "probability": 82,
            "impact": "High",
            "description": "Аномальна синхронізація цін у мережах АЗС.",
            "eta": "24-48 годин"
        }
    ]

# ======================== DLQ HANDLER API (T1.2) ========================

dlq_router = APIRouter(prefix="/dlq", tags=["system", "dlq"])

@dlq_router.get("/{tenant_id}")
async def view_dlq_messages(tenant_id: str, limit: int = 50) -> list[dict[str, Any]]:
    """Перелік повідомлень з Dead Letter Queue для конкретного tenant (TZ v5.0 §5)."""
    from aiokafka import AIOKafkaConsumer
    import json
    
    # Визначаємо DLQ топік для tenant
    topic = f"tenant.{tenant_id}.dlq"
    
    messages = []
    consumer = AIOKafkaConsumer(
        topic,
        bootstrap_servers=settings.KAFKA_BROKERS,
        group_id=f"dlq-viewer-{tenant_id}",
        enable_auto_commit=False,
        auto_offset_reset="earliest",
        consumer_timeout_ms=1000  # Читаємо протягом 1с і виходимо
    )
    
    try:
        await consumer.start()
        # Отримуємо частину повідомлень
        async for msg in consumer:
            try:
                payload = json.loads(msg.value.decode("utf-8")) if msg.value else {}
                messages.append({
                    "topic": msg.topic,
                    "partition": msg.partition,
                    "offset": msg.offset,
                    "timestamp": msg.timestamp,
                    "payload": payload
                })
                if len(messages) >= limit:
                    break
            except Exception:
                continue
    except Exception as e:
        logger.error(f"DLQ Viewer error: {e}")
    finally:
        await consumer.stop()

    return messages

@dlq_router.post("/{tenant_id}/retry")
async def retry_dlq_messages(tenant_id: str, target_topic: str) -> dict[str, Any]:
    """Повторна обробка (retry) всіх повідомлень з DLQ до target_topic."""
    # Імпортуємо існуючу логіку з kafka_dlq
    from app.kafka_dlq import replay_dlq
    import asyncio
    
    dlq_topic = f"tenant.{tenant_id}.dlq"
    
    # Запускаємо процес у фоні щоб не блокувати API
    asyncio.create_task(replay_dlq(dlq_topic, target_topic))
    
    return {
        "status": "processing",
        "message": f"Почато retry повідомлень з {dlq_topic} до {target_topic}",
        "dlq_topic": dlq_topic,
        "target_topic": target_topic
    }

router.include_router(dlq_router)
