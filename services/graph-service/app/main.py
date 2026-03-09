from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
import logging

from predator_common.logging import configure_logging
from app.config import get_settings
from app.graph_db import graph_db

settings = get_settings()
configure_logging(level="INFO")
logger = logging.getLogger("graph_service.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Життєвий цикл додатку. Ініціалізація та завершення."""
    logger.info("Initializing Graph Service...")
    await graph_db.connect()
    
    yield
    
    logger.info("Shutting down Graph Service...")
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

# Роутери для графів (будуть додані нижче)
# from app.routers import paths, clusters
# app.include_router(paths.router, prefix="/api/v2/graph/paths", tags=["paths"])
