"""PREDATOR WORM Integrity Sentinel (v56.5).
HR-16: Гарантування цілісність аудит-логів через HMAC-підписи.
"""
import hashlib
import hmac
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
    async def audit_trail_scan(cls) -> dict[str, int]:
        """Фонова задача для сканування audit_log на предмет маніпуляцій."""
        from sqlalchemy import select

        from app.database import async_session_maker
        from app.models.orm import AuditLog

        logger.info("🛡️ WORM Integrity Scan started...")
        stats = {"total": 0, "verified": 0, "failed": 0, "missing_sig": 0}

        try:
            async with async_session_maker() as session:
                # В реальній системі це має бути батч-обробка або сканування за певний період
                # Для цього MVP скануємо останні 1000 записів
                result = await session.execute(
                    select(AuditLog).order_by(AuditLog.id.desc()).limit(1000)
                )
                records = result.scalars().all()

                for record in records:
                    stats["total"] += 1
                    details = record.details or {}

                    sig = details.get("sig")
                    sig_timestamp = details.get("sig_timestamp")

                    if not sig or not sig_timestamp:
                        stats["missing_sig"] += 1
                        logger.warning(f"AuditLog {record.id} missing signature or timestamp.")
                        continue

                    # Відновлюємо оригінальні деталі (без sig та sig_timestamp)
                    original_details = {k: v for k, v in details.items() if k not in ["sig", "sig_timestamp"]}

                    # Відновлюємо payload, який був підписаний
                    log_payload = {
                        "action": record.action,
                        "tenant_id": str(record.tenant_id) if record.tenant_id else None,
                        "user_id": str(record.user_id) if record.user_id else None,
                        "resource_type": record.resource_type,
                        "resource_id": str(record.resource_id) if record.resource_id else None,
                        "details": original_details,
                        "ip_address": str(record.ip_address) if record.ip_address else None,
                        "timestamp": sig_timestamp
                    }

                    is_valid = cls.verify_integrity(log_payload, sig)
                    if is_valid:
                        stats["verified"] += 1
                    else:
                        stats["failed"] += 1
                        logger.error(f"🚨 WORM COMPROMISE DETECTED: AuditLog {record.id} signature mismatch!")

        except Exception as e:
            logger.error(f"Error during audit trail scan: {e}")

        logger.info(f"🛡️ WORM Integrity Scan finished: {stats}")
        return stats
