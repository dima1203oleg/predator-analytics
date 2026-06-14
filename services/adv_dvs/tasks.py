"""ADV DVS: Background Tasks."""
import asyncio
from predator_common.logging import get_logger
from services.adv_dvs.orchestrator import ADVOrchestrator

logger = get_logger("adv_dvs.tasks")

async def background_validation_task():
    """Фонове завдання для періодичної перевірки статусу системи."""
    logger.info("Запуск фонового завдання ADV DVS...")
    orchestrator = ADVOrchestrator()
    
    while True:
        try:
            report = await orchestrator.run_full_validation()
            if report.get("status") != "GO":
                logger.warning("🚨 Фонова перевірка ADV DVS виявила проблеми в інфраструктурі!")
                # В майбутньому тут можна викликати DeepSeek-R1 через /trigger/refactor
            else:
                logger.info("✅ Фонова перевірка підтверджує стабільність інфраструктури.")
        except Exception as e:
            logger.error(f"Помилка під час виконання фонового завдання ADV DVS: {e}")
            
        # Пауза між перевірками (наприклад, кожні 5 хвилин)
        await asyncio.sleep(300)

if __name__ == "__main__":
    logger.info("Старт ADV DVS Worker...")
    asyncio.run(background_validation_task())
