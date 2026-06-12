"""
Основна точка запуску UTOS API v61.0-ELITE.
Надає REST-ендпоінти для запуску тестів та отримання звітів.
Сумісний з Headless Command Center.
"""
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from utos.orchestrator import UtosOrchestrator
from utos.config import UTOS_PORT

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("utos")

app = FastAPI(
    title="PREDATOR UTOS API",
    description="Unified Testing Operating System API v61.0-ELITE",
    version="61.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = UtosOrchestrator()


@app.get("/api/v1/health")
async def health_check():
    """Статус самого сервісу UTOS."""
    return {"status": "ok", "service": "utos", "version": "61.0-ELITE"}


@app.post("/api/v1/utos/run")
async def run_utos_diagnostics():
    """Запуск повного циклу діагностики системи за всіма 8 шарами."""
    try:
        report = await orchestrator.execute_all()
        return report
    except Exception as e:
        logger.error(f"Помилка виконання діагностики UTOS: {e}")
        raise HTTPException(status_code=500, detail=f"Внутрішня помилка діагностики: {e}")


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Запуск UTOS API на порту {UTOS_PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=UTOS_PORT)
