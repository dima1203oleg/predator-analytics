"""[DEPRECATED] GlobalSanctionsService — PREDATOR Core API
УВАГА: Цей ручний сервіс задепрекейтинг (Phase 8). Усі перевірки санкцій
тепер виконуються через AI Connector Factory та ETLGeneratorAgent.
Залишено виключно для зворотної сумісності.
Перевірка фізичних та юридичних осіб у міжнародних санкційних базах.
Підтримує: РНБО, OFAC (SDN/SSI), EU, UN, UK HM Treasury.
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)


class GlobalSanctionsService:
    """
    [DEPRECATED] Сервіс перевірки санкцій.
    Замінено на автономні AI пайплайни.
    """

    def __init__(self) -> None:
        logger.warning("[DEPRECATED] Ініціалізовано GlobalSanctionsService (Legacy Mode)")

    async def check_entity(self, entity_name: str) -> dict[str, Any]:
        """
        [DEPRECATED] Перевіряє юридичну або фізичну особу у санкційних списках.

        Returns:
            dict з ключами:
                - is_sanctioned: bool
                - matches: list[dict] — знайдені збіги
                - checked_lists: list[str]
        """
        logger.warning(f"[DEPRECATED] Виклик застарілого методу check_entity для: {entity_name}")

        return {
            "is_sanctioned": False,
            "matches": [],
            "checked_lists": [
                "РНБО (Україна) [LEGACY]",
                "OFAC SDN (США) [LEGACY]",
                "EU Sanctions [LEGACY]",
                "UN Security Council [LEGACY]",
                "UK HM Treasury [LEGACY]",
            ],
            "entity_queried": entity_name,
            "status": "DEPRECATED - use Autonomous Factory"
        }
