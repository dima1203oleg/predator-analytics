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


@app.get("/api/v1/utos/reports/latest")
async def get_latest_report():
    """Отримання останнього збереженого звіту UTOS."""
    import os
    import json
    from utos.config import UTOS_REPORT_DIR
    
    report_path = os.path.join(UTOS_REPORT_DIR, "latest_report.json")
    if not os.path.exists(report_path):
        return {"status": "no_data", "message": "Звітів ще не знайдено."}
        
    try:
        with open(report_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Помилка читання звіту: {e}")
        raise HTTPException(status_code=500, detail="Помилка читання останнього звіту.")

@app.get("/api/v1/utos/reports/download/{format}")
async def download_report(format: str):
    """Завантаження останнього звіту у вибраному форматі."""
    import os
    from fastapi.responses import FileResponse
    from utos.config import UTOS_REPORT_DIR

    report_path = os.path.join(UTOS_REPORT_DIR, "latest_report.json")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Звіт не знайдено.")

    # На даному етапі підтримуємо лише JSON-завантаження (інші формати можна генерувати тут)
    if format.lower() == "json":
        return FileResponse(
            path=report_path,
            media_type="application/json",
            filename="utos_report.json"
        )
    else:
        # Для pdf/xlsx повертаємо той самий JSON як fallback або генеруємо
        # TODO: Додати повноцінну генерацію pdf/xlsx у UTOS
        return FileResponse(
            path=report_path,
            media_type="application/json",
            filename=f"utos_report_{format}_stub.json"
        )

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Запуск UTOS API на порту {UTOS_PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=UTOS_PORT)
