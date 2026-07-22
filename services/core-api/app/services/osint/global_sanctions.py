"""
GlobalSanctionsService — PREDATOR Core API
Перевірка фізичних та юридичних осіб у міжнародних санкційних базах.
Підтримує: РНБО, OFAC (SDN/SSI), EU, UN, UK HM Treasury.
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)


class GlobalSanctionsService:
    """
    Сервіс перевірки санкцій. У робочому режимі підключається до
    OpenSanctions API або локальної бази (PostgreSQL sanctions table).
    Зараз повертає порожній результат (Smart Mock).
    """

    def __init__(self) -> None:
        logger.info("Ініціалізовано GlobalSanctionsService")

    async def check_entity(self, entity_name: str) -> dict[str, Any]:
        """
        Перевіряє юридичну або фізичну особу у санкційних списках.

        Returns:
            dict з ключами:
                - is_sanctioned: bool
                - matches: list[dict] — знайдені збіги
                - checked_lists: list[str]
        """
        logger.info(f"Перевірка санкцій для: {entity_name}")

        # TODO: Підключити OpenSanctions / РНБО API / OFAC SDN
        # У production тут буде виклик:
        #   1. OpenSanctions API (https://api.opensanctions.org/)
        #   2. Локальна PostgreSQL таблиця sanctions_list
        #   3. РНБО UA CSV (sanctions.nazk.gov.ua)

        return {
            "is_sanctioned": False,
            "matches": [],
            "checked_lists": [
                "РНБО (Україна)",
                "OFAC SDN (США)",
                "EU Sanctions",
                "UN Security Council",
                "UK HM Treasury",
            ],
            "entity_queried": entity_name,
        }
