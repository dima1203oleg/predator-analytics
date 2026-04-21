"""Модуль агрегації (Data Fusion Engine).
Відповідає за злиття даних з реєстрів та OSINT інструментів у єдиний профіль суб'єкта.
"""
from datetime import datetime
import logging

from app.models import Організація
from app.osint.tools import ІнструментФантом, ІнструментШерлок
from app.registries.ua_registries import УкраїнськийРеєстр

logger = logging.getLogger(__name__)

class ДвигунЗлиттяДаних:
    """Data Fusion Engine: Оркестратор збору інформації.
    Бере вхідний ідентифікатор, опитує реєстри, запускає OSINT скрипти і формує єдиний профіль.
    """

    def __init__(self, ua_registry: УкраїнськийРеєстр):
        self.ua_registry = ua_registry
        # T2.1 - Інтеграція YouControl з Circuit Breaker
        from app.osint.youcontrol_client import YouControlClient
        self.youcontrol = YouControlClient()

    async def збагатити_компанію(self, edrpou: str, ueid: str) -> Організація:
        """Повний цикл збагачення даних компанії."""
        logger.info(f"Початок Data Fusion для компанії (ЄДРПОУ {edrpou})")

        # 1. Отримання базових даних (з фолбеком на YouControl)
        try:
            youcontrol_data = await self.youcontrol.get_company_data(edrpou)
            базові_дані = {
                "назва": youcontrol_data.get("name", "Невідомо"),
                "статус": youcontrol_data.get("status", "registered"),
                "дата_реєстрації": youcontrol_data.get("registration_date", "2000-01-01T00:00:00"),
                "податковий_борг": youcontrol_data.get("taxes", {}).get("debt", False),
                "судові_справи_кількість": youcontrol_data.get("court_cases", 0)
            }
        except Exception as e:
            logger.warning(f"YouControl API failed: {e}. Fallback to UA Registry.")
            базові_дані = await self.ua_registry.знайти_за_єдрпоу(edrpou)
        санкції = await self.ua_registry.перевірити_санкції(базові_дані["назва"])

        # 2. OSINT Аналіз
        # 2.1 Перевірка зв'язків та транзакцій (Фантомні ланцюги)
        phantom_analysis = await ІнструментФантом.перевірити_ланцюг(edrpou)

        # 2.2 Соціальні мережі та медіа-слід (Sherlock)
        # У реальності тут буде пошук згадок компанії, її сайтів або керівників
        await ІнструментШерлок.знайти_профілі(базові_дані["назва"].lower().replace(" ", ""))

        # 3. Скоринг ризику та тегування
        ризик = 10.0
        теги = ["перевірено_оспінтом"]

        if базові_дані.get("податковий_борг"):
            ризик += 15.0
            теги.append("боржник")

        if базові_дані.get("судові_справи_кількість", 0) > 0:
            ризик += базові_дані["судові_справи_кількість"] * 2
            теги.append("судові_справи")

        if санкції:
            ризик += 50.0
            теги.append("санкції_рнбо")

        if phantom_analysis.get("is_phantom"):
            ризик += phantom_analysis.get("risk_score_increase", 0)
            теги.append("фантомний_ланцюг")

        # 4. Формування єдиної моделі
        org = Організація(
            ueid=ueid,
            edrpou=edrpou,
            назва=базові_дані["назва"],
            статус=базові_дані["статус"],
            дата_реєстрації=datetime.fromisoformat(базові_дані.get("дата_реєстрації", "2000-01-01T00:00:00")),
            ризик_скор=min(100.0, ризик),
            теги=теги
        )

        logger.info(f"Завершено Data Fusion для {edrpou}. Ризик: {org.ризик_скор}")
        return org
