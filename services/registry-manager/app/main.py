import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup Registry Manager dependencies (e.g., Scheduler, Vault)
    logger.info("Starting PREDATOR Registry Manager...")
    yield
    logger.info("Shutting down PREDATOR Registry Manager...")


app = FastAPI(
    title="PREDATOR Registry Manager",
    description="Autonomous API Discovery & ETL Factory",
    version="61.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    """Перевірка статусу Registry Manager."""
    return {"status": "ok", "service": "registry-manager"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Registry Manager Error"},
    )
