"""Health Check Server — PREDATOR Analytics v55.1 Ironclad.

Простий HTTP сервер для Kubernetes health checks.
"""
from aiohttp import web

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.health")

# Глобальний стан здоров'я
_health_status = {
    "kafka_connected": False,
    "postgres_connected": False,
    "ready": False,
}


def set_health_status(key: str, value: bool) -> None:
    """Оновлює статус здоров'я."""
    _health_status[key] = value
    _health_status["ready"] = (
        _health_status["kafka_connected"] and _health_status["postgres_connected"]
    )


async def health_handler(request: web.Request) -> web.Response:
    """Liveness probe — сервіс живий."""
    return web.json_response({"status": "ok"})


async def ready_handler(request: web.Request) -> web.Response:
    """Readiness probe — сервіс готовий приймати трафік."""
    if _health_status["ready"]:
        return web.json_response({"status": "ready", **_health_status})
    return web.json_response(
        {"status": "not_ready", **_health_status},
        status=503,
    )


async def start_health_server(port: int = 8080) -> web.AppRunner:
    """Запускає HTTP сервер для health checks."""
    app = web.Application()
    app.router.add_get("/health", health_handler)
    app.router.add_get("/healthz", health_handler)
    app.router.add_get("/ready", ready_handler)
    app.router.add_get("/readyz", ready_handler)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)  # noqa: S104
    await site.start()
    logger.info(f"Health server started on port {port}")
    return runner


async def stop_health_server(runner: web.AppRunner) -> None:
    """Зупиняє HTTP сервер."""
    await runner.cleanup()
    logger.info("Health server stopped")
