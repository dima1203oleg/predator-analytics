import asyncio
from datetime import UTC, datetime
import logging
from typing import Any

from sqlalchemy import text

from app.database import SessionLocal
from app.services.security.integrity_checker import IntegritySentinel

logger = logging.getLogger(__name__)

class AuditService:
    """Сервіс для запису незмінних логів аудиту (WORM)."""

    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: asyncio.Task | None = None

    @property
    def queue(self) -> asyncio.Queue:
        """Повертає чергу, автоматично перестворюючи її, якщо асоційований івент-луп закритий."""
        try:
            if self._queue._loop.is_closed():
                self._queue = asyncio.Queue()
        except Exception:
            pass
        return self._queue

    def start_worker(self):
        """Запуск фонового воркера для пакетного запису."""
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._batch_worker())
            logger.info("🛡️ Audit Batch Worker started")

    async def log(
        self,
        action: str,
        tenant_id: str | None = None,
        user_id: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        details: dict[str, Any] | None = None,
        ip_address: str | None = None
    ):
        """Додати подію в чергу для запису."""
        # Підготовка даних та підпис відбувається негайно для забезпечення цілісності
        now_ts = datetime.now(UTC).isoformat()
        log_payload = {
            "action": action,
            "tenant_id": str(tenant_id) if tenant_id else None,
            "user_id": str(user_id) if user_id else None,
            "resource_type": resource_type,
            "resource_id": str(resource_id) if resource_id else None,
            "details": details or {},
            "ip_address": str(ip_address) if ip_address else None,
            "timestamp": now_ts
        }

        # Додавання підпису та timestamp в деталі
        signed_details = {
            **(details or {}),
            "sig": IntegritySentinel.sign_data(log_payload),
            "sig_timestamp": now_ts
        }
        log_payload["details"] = signed_details

        await self.queue.put(log_payload)

        if self._worker_task is None:
            self.start_worker()

    async def _batch_worker(self):
        """Фоновий процес, що збирає логі та записує їх пачками."""
        while True:
            batch: list[dict] = []
            # Чекаємо хоча б одного елемента
            first_item = await self.queue.get()
            batch.append(first_item)

            # Намагаємось зібрати більше елементів протягом 1 секунди або до ліміту 50
            try:
                while len(batch) < 50:
                    item = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                    batch.append(item)
            except TimeoutError:
                pass # Час вийшов, записуємо те, що є

            if batch:
                await self._write_batch(batch)

            for _ in range(len(batch)):
                self.queue.task_done()

    async def _write_batch(self, batch: list[dict]):
        """Запис пачки логів у базу."""
        if SessionLocal is None:
            return

        query = text("""
            INSERT INTO audit_log (
                tenant_id, user_id, action, resource_type, resource_id, details, ip_address
            ) VALUES (
                :tenant_id, :user_id, :action, :resource_type, :resource_id, :details, :ip_address
            )
        """)

        try:
            async with SessionLocal() as session:
                for item in batch:
                    await session.execute(query, {
                        "tenant_id": item["tenant_id"],
                        "user_id": item["user_id"],
                        "action": item["action"],
                        "resource_type": item["resource_type"],
                        "resource_id": item["resource_id"],
                        "details": item["details"],
                        "ip_address": item["ip_address"]
                    })
                await session.commit()
                logger.debug(f"Audit batch written: {len(batch)} items")
        except Exception as e:
            logger.error(f"Failed to write audit batch: {e}")

# Global instance
audit_logger = AuditService()
