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


def _collect_system_stats(request: Request) -> dict[str, Any]:
    started_at = _started_at(request)
    uptime_delta = datetime.now(UTC) - started_at

    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    network = psutil.net_io_counters()

    try:
        active_tasks = max(len(asyncio.all_tasks()) - 1, 0)
    except RuntimeError:
        active_tasks = 0

    try:
        active_connections = len(psutil.net_connections())
    except Exception:
        active_connections = 0

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
        "network_bytes_sent": network.bytes_sent,
        "network_bytes_recv": network.bytes_recv,
        "active_connections": active_connections,
        "active_tasks": active_tasks,
        "uptime": _format_uptime(uptime_delta),
        "uptime_seconds": max(int(uptime_delta.total_seconds()), 0),
        "documents_total": 0,
        "search_rate": 0,
        "avg_latency": 0,
        "indexing_rate": 0,
        "total_indices": 0,
        "storage_gb": round(disk.used / (1024 ** 3), 2),
        "timestamp": datetime.now(UTC).isoformat(),
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
