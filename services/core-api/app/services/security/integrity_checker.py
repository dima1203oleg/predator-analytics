"""PREDATOR WORM Integrity Sentinel (v56.5).
HR-16: Гарантування цілісність аудит-логів через HMAC-підписи.
"""
import hmac
import hashlib
import json
import logging
from typing import Any
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class IntegritySentinel:
    """Сервіс для підпису та верифікації цілісності даних."""

    SECRET_KEY = settings.SECRET_KEY.encode() # Використовуємо системний ключ для HMAC

    @classmethod
    def sign_data(cls, data: dict[str, Any]) -> str:
        """Створити HMAC-підпис для словника даних."""
        # Сортуємо ключі для детермінованості
        serialized = json.dumps(data, sort_keys=True)
        return hmac.new(
            cls.SECRET_KEY,
            serialized.encode(),
            hashlib.sha256
        ).hexdigest()

    @classmethod
    def verify_integrity(cls, data: dict[str, Any], signature: str) -> bool:
        """Перевірити чи дані відповідають підпису."""
        expected = cls.sign_data(data)
        return hmac.compare_digest(expected, signature)

    @classmethod
    async def audit_trail_scan(cls):
        """Фонова задача для сканування audit_log на предмет маніпуляцій."""
        # TODO: Реалізувати вибірку з БД та перевірку кожного запису
        logger.info("🛡️ WORM Integrity Scan started...")
        pass
