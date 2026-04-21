from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.graph_db import graph_db
from predator_common.logging import configure_logging

settings = get_settings()
configure_logging(level="INFO")
logger = logging.getLogger("graph_service.main")

from app.services.graph_sync import GraphSyncWorker

sync_worker = GraphSyncWorker()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Життєвий цикл додатку. Ініціалізація та завершення."""
    logger.info("Initializing Graph Service...")
    await graph_db.connect()
    
    # Запуск фонової синхронізації
    await sync_worker.start()

    yield

    logger.info("Shutting down Graph Service...")
    await sync_worker.stop()
    await graph_db.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware для метрик та трейсингу
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Тут буде логіка OTEL / Prometheus
    return await call_next(request)

@app.get("/health")
async def health_check():
    """Базовий healthcheck K8s."""
    return {"status": "healthy", "service": "graph-service", "version": settings.VERSION}

@app.get("/api/v2/graph/ping")
async def ping_db():
    try:
        results = await graph_db.run_query("RETURN 1 as test")
        return {"status": "ok", "db": results[0]["test"]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

from app.routers import clusters, paths, ubo

app.include_router(paths.router, prefix="/api/v2/graph/paths", tags=["paths"])
app.include_router(clusters.router, prefix="/api/v2/graph/clusters", tags=["clusters"])
app.include_router(ubo.router, prefix="/api/v2/graph/entities", tags=["ubo"])
