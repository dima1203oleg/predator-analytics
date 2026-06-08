import asyncio
import logging

from celery import shared_task

from app.services.forecast_service import ForecastService

logger = logging.getLogger(__name__)

async def precalculate_forecasts_async():
    """Фонове обчислення прогнозів для топ-кодів."""
    # У реальній системі цей список можна брати з ClickHouse (топ за об'ємом)
    top_product_codes = ["8517", "8703", "8471", "3004"]

    for code in top_product_codes:
        logger.info(f"🔄 Background training for product code: {code}")
        try:
            # Викликаємо сервіс, який тепер автоматично кешує результат
            await ForecastService.get_demand_forecast(
                product_code=code,
                months_ahead=6,
                model="prophet"
            )
        except Exception as e:
            logger.error(f"Failed background forecast for {code}: {e}")

@shared_task(name="app.tasks.forecasting.precalculate_top_forecasts")
def precalculate_top_forecasts():
    """Celery task для регулярного оновлення кешу прогнозів."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    loop.run_until_complete(precalculate_forecasts_async())
