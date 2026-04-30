"""PREDATOR Sovereign Audit Service.
HR-16: WORM-аудит дій системи та агентів.
"""
import logging
from typing import Any

from sqlalchemy import text

from app.database import SessionLocal
from app.services.security.integrity_checker import IntegritySentinel

logger = logging.getLogger(__name__)

class AuditService:
    """Сервіс для запису незмінних логів аудиту (WORM)."""

    @staticmethod
    async def log(
        action: str,
        tenant_id: str | None = None,
        user_id: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        details: dict[str, Any] | None = None,
        ip_address: str | None = None
    ):
        """Записати подію в audit_log."""
        if SessionLocal is None:
            logger.error("Database not initialized for AuditService")
            return

        query = text("""
            INSERT INTO audit_log (
                tenant_id, user_id, action, resource_type, resource_id, details, ip_address
            ) VALUES (
                :tenant_id, :user_id, :action, :resource_type, :resource_id, :details, :ip_address
            )
        """)

        try:
            # Створення копії деталей для підпису
            log_payload = {
                "action": action,
                "tenant_id": tenant_id,
                "user_id": user_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": details or {},
                "ip_address": ip_address
            }

            # Додавання підпису в деталі
            signed_details = {**(details or {}), "sig": IntegritySentinel.sign_data(log_payload)}

            async with SessionLocal() as session:
                await session.execute(query, {
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "action": action,
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "details": signed_details,
                    "ip_address": ip_address
                })
                await session.commit()
                logger.info(f"Audit log created: {action} on {resource_type}:{resource_id}")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")

# Global instance
audit_logger = AuditService()
