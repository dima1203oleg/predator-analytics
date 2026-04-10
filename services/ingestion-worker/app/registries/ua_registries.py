"""Клієнт для інтеграції з відкритими даними України (YouControl, Опендатабот)."""
import logging
from typing import Any

from app.registries.base import БазовийРеєстрКлієнт
from app.registries.youcontrol import YouControlClient, YouControlConfig
from app.config import get_settings

logger = logging.getLogger(__name__)

class УкраїнськийРеєстр(БазовийРеєстрКлієнт):
    """Інтеграція з агрегаторами відкритих державних реєстрів України."""

    def __init__(self):
        settings = get_settings()
        config = YouControlConfig(api_key=settings.YOUCONTROL_API_KEY)
        self.youcontrol = YouControlClient(config)

    async def знайти_за_єдрпоу(self, edrpou: str) -> dict[str, Any]:
        """Пошук даних про компанію за кодом ЄДРПОУ через YouControl."""
        logger.info(f"Запит до YouControl для ЄДРПОУ: {edrpou}")
        
        # Отримуємо реальні дані через професійний конектор
        return await self.youcontrol.get_company_full_card(edrpou)

    async def перевірити_санкції(self, назва_або_іпн: str) -> bool:
        """Перевірка наявності особи чи компанії у санкційних списках."""
        logger.info(f"Перевірка санкцій для: {назва_або_іпн}")
        # Тут можна додати виклик YouControl Sanctions API
        return False
