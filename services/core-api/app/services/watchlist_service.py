"""Watchlist Service — Безперервний моніторинг сутностей.

Функції:
- CRUD для watchlist items
- Автоматичне перескановування через Kafka scheduling
- Diff-аналіз: порівняння попереднього та нового досьє
- Генерація WatchlistAlert при виявленні змін

Відповідає вимогам:
- Перевершення Palantir: continuous monitoring замість one-shot scan
- HR-18: PostgreSQL як SSOT для метаданих watchlist
- HR-06: Секрети тільки через env vars
"""
from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class WatchlistFrequency(StrEnum):
    """Частота перевірки."""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class AlertSeverity(StrEnum):
    """Рівень критичності алерту."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertCategory(StrEnum):
    """Категорія алерту."""
    RISK_CHANGE = "risk_change"
    SANCTIONS_HIT = "sanctions_hit"
    NEW_COURT_CASE = "new_court_case"
    TAX_DEBT_CHANGE = "tax_debt_change"
    OWNERSHIP_CHANGE = "ownership_change"
    BLOCKCHAIN_ACTIVITY = "blockchain_activity"
    MEDIA_MENTION = "media_mention"
    DARKNET_MENTION = "darknet_mention"
    NEW_CONNECTION = "new_connection"
    STATUS_CHANGE = "status_change"


# SQL для створення таблиць watchlist (виконується при першому запуску)
WATCHLIST_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_id VARCHAR(128) NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'company',
    entity_name VARCHAR(500) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_scan_at TIMESTAMPTZ,
    last_risk_score REAL,
    last_dossier_hash VARCHAR(64),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_tenant ON watchlist_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_entity ON watchlist_items(entity_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_frequency ON watchlist_items(frequency) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS watchlist_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_item_id UUID NOT NULL REFERENCES watchlist_items(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    category VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_item ON watchlist_alerts(watchlist_item_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_tenant ON watchlist_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_severity ON watchlist_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_watchlist_alerts_unread ON watchlist_alerts(tenant_id, is_read) WHERE is_read = false;
"""


class WatchlistService:
    """Сервіс управління списками спостереження."""

    @staticmethod
    async def ensure_schema(db: AsyncSession) -> None:
        """Створює таблиці watchlist, якщо вони не існують."""
        try:
            await db.execute(text(WATCHLIST_SCHEMA_SQL))
            await db.commit()
            logger.info("Watchlist schema ensured")
        except Exception as e:
            await db.rollback()
            logger.warning(f"Watchlist schema creation skipped: {e}")

    @staticmethod
    async def add_to_watchlist(
        db: AsyncSession,
        tenant_id: str,
        user_id: str,
        entity_id: str,
        entity_type: str,
        entity_name: str,
        frequency: str = "daily",
        notes: str | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """Додати сутність на моніторинг."""
        item_id = str(uuid4())
        now = datetime.now(UTC)

        # Перевірка дублікатів
        existing = await db.execute(
            text("""
                SELECT id FROM watchlist_items
                WHERE tenant_id = :tenant_id
                  AND entity_id = :entity_id
                  AND is_active = true
            """),
            {"tenant_id": tenant_id, "entity_id": entity_id}
        )
        if existing.first():
            return {"status": "already_watching", "entity_id": entity_id}

        await db.execute(
            text("""
                INSERT INTO watchlist_items
                    (id, tenant_id, user_id, entity_id, entity_type,
                     entity_name, frequency, notes, tags, created_at, updated_at)
                VALUES
                    (:id, :tenant_id, :user_id, :entity_id, :entity_type,
                     :entity_name, :frequency, :notes, :tags, :now, :now)
            """),
            {
                "id": item_id,
                "tenant_id": tenant_id,
                "user_id": user_id,
                "entity_id": entity_id,
                "entity_type": entity_type,
                "entity_name": entity_name,
                "frequency": frequency,
                "notes": notes or "",
                "tags": tags or [],
                "now": now,
            }
        )
        await db.commit()

        logger.info(
            "watchlist.item_added",
            extra={"entity_id": entity_id, "entity_name": entity_name, "frequency": frequency}
        )

        return {
            "status": "added",
            "id": item_id,
            "entity_id": entity_id,
            "entity_name": entity_name,
            "frequency": frequency,
        }

    @staticmethod
    async def get_watchlist(
        db: AsyncSession,
        tenant_id: str,
        user_id: str | None = None,
        include_inactive: bool = False,
    ) -> list[dict[str, Any]]:
        """Отримати список всіх об'єктів моніторингу."""
        conditions = ["w.tenant_id = :tenant_id"]
        params: dict[str, Any] = {"tenant_id": tenant_id}

        if user_id:
            conditions.append("w.user_id = :user_id")
            params["user_id"] = user_id

        if not include_inactive:
            conditions.append("w.is_active = true")

        where_clause = " AND ".join(conditions)

        result = await db.execute(
            text(f"""
                SELECT
                    w.id, w.entity_id, w.entity_type, w.entity_name,
                    w.frequency, w.is_active, w.last_scan_at,
                    w.last_risk_score, w.notes, w.tags,
                    w.created_at, w.updated_at,
                    COUNT(a.id) FILTER (WHERE a.is_read = false) as unread_alerts
                FROM watchlist_items w
                LEFT JOIN watchlist_alerts a ON a.watchlist_item_id = w.id
                WHERE {where_clause}
                GROUP BY w.id
                ORDER BY w.created_at DESC
            """),
            params
        )

        items = []
        for row in result.fetchall():
            items.append({
                "id": str(row[0]),
                "entity_id": row[1],
                "entity_type": row[2],
                "entity_name": row[3],
                "frequency": row[4],
                "is_active": row[5],
                "last_scan_at": row[6].isoformat() if row[6] else None,
                "last_risk_score": row[7],
                "notes": row[8],
                "tags": row[9] or [],
                "created_at": row[10].isoformat() if row[10] else None,
                "updated_at": row[11].isoformat() if row[11] else None,
                "unread_alerts": row[12],
            })

        return items

    @staticmethod
    async def remove_from_watchlist(
        db: AsyncSession,
        tenant_id: str,
        item_id: str,
    ) -> dict[str, Any]:
        """Деактивувати об'єкт моніторингу (soft delete)."""
        await db.execute(
            text("""
                UPDATE watchlist_items
                SET is_active = false, updated_at = NOW()
                WHERE id = :item_id AND tenant_id = :tenant_id
            """),
            {"item_id": item_id, "tenant_id": tenant_id}
        )
        await db.commit()
        return {"status": "removed", "id": item_id}

    @staticmethod
    async def get_alerts(
        db: AsyncSession,
        tenant_id: str,
        unread_only: bool = False,
        severity: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Отримати алерти для тенанта."""
        conditions = ["a.tenant_id = :tenant_id"]
        params: dict[str, Any] = {
            "tenant_id": tenant_id,
            "limit": limit,
            "offset": offset,
        }

        if unread_only:
            conditions.append("a.is_read = false")
        if severity:
            conditions.append("a.severity = :severity")
            params["severity"] = severity

        where_clause = " AND ".join(conditions)

        # Загальна кількість
        count_result = await db.execute(
            text(f"SELECT COUNT(*) FROM watchlist_alerts a WHERE {where_clause}"),
            params
        )
        total = count_result.scalar() or 0

        # Дані
        result = await db.execute(
            text(f"""
                SELECT
                    a.id, a.watchlist_item_id, a.severity, a.category,
                    a.title, a.description, a.details, a.is_read,
                    a.is_dismissed, a.created_at,
                    w.entity_id, w.entity_name, w.entity_type
                FROM watchlist_alerts a
                JOIN watchlist_items w ON w.id = a.watchlist_item_id
                WHERE {where_clause}
                ORDER BY a.created_at DESC
                LIMIT :limit OFFSET :offset
            """),
            params
        )

        alerts = []
        for row in result.fetchall():
            alerts.append({
                "id": str(row[0]),
                "watchlist_item_id": str(row[1]),
                "severity": row[2],
                "category": row[3],
                "title": row[4],
                "description": row[5],
                "details": row[6] or {},
                "is_read": row[7],
                "is_dismissed": row[8],
                "created_at": row[9].isoformat() if row[9] else None,
                "entity_id": row[10],
                "entity_name": row[11],
                "entity_type": row[12],
            })

        return {"total": total, "alerts": alerts}

    @staticmethod
    async def mark_alert_read(
        db: AsyncSession,
        tenant_id: str,
        alert_id: str,
    ) -> dict[str, Any]:
        """Позначити алерт як прочитаний."""
        await db.execute(
            text("""
                UPDATE watchlist_alerts
                SET is_read = true
                WHERE id = :alert_id AND tenant_id = :tenant_id
            """),
            {"alert_id": alert_id, "tenant_id": tenant_id}
        )
        await db.commit()
        return {"status": "read", "id": alert_id}

    @staticmethod
    async def mark_all_read(
        db: AsyncSession,
        tenant_id: str,
    ) -> dict[str, Any]:
        """Позначити всі алерти як прочитані."""
        result = await db.execute(
            text("""
                UPDATE watchlist_alerts
                SET is_read = true
                WHERE tenant_id = :tenant_id AND is_read = false
            """),
            {"tenant_id": tenant_id}
        )
        await db.commit()
        return {"status": "all_read", "count": result.rowcount}

    @staticmethod
    async def create_alert(
        db: AsyncSession,
        watchlist_item_id: str,
        tenant_id: str,
        severity: str,
        category: str,
        title: str,
        description: str,
        details: dict[str, Any] | None = None,
    ) -> str:
        """Створити новий алерт (викликається з watchlist_pipeline)."""
        alert_id = str(uuid4())
        await db.execute(
            text("""
                INSERT INTO watchlist_alerts
                    (id, watchlist_item_id, tenant_id, severity, category,
                     title, description, details, created_at)
                VALUES
                    (:id, :watchlist_item_id, :tenant_id, :severity, :category,
                     :title, :description, :details, NOW())
            """),
            {
                "id": alert_id,
                "watchlist_item_id": watchlist_item_id,
                "tenant_id": tenant_id,
                "severity": severity,
                "category": category,
                "title": title,
                "description": description,
                "details": json.dumps(details or {}, ensure_ascii=False),
            }
        )
        await db.commit()

        logger.info(
            "watchlist.alert_created",
            extra={
                "alert_id": alert_id,
                "severity": severity,
                "category": category,
                "title": title,
            }
        )
        return alert_id

    @staticmethod
    async def get_items_due_for_scan(
        db: AsyncSession,
        frequency: str,
    ) -> list[dict[str, Any]]:
        """Отримати елементи, що потребують перескановування."""
        # Визначаємо інтервал на основі частоти
        interval_map = {
            "hourly": "1 hour",
            "daily": "1 day",
            "weekly": "7 days",
            "monthly": "30 days",
        }
        interval = interval_map.get(frequency, "1 day")

        result = await db.execute(
            text(f"""
                SELECT id, entity_id, entity_type, entity_name,
                       tenant_id, last_risk_score, last_dossier_hash
                FROM watchlist_items
                WHERE is_active = true
                  AND frequency = :frequency
                  AND (last_scan_at IS NULL
                       OR last_scan_at < NOW() - INTERVAL '{interval}')
                ORDER BY last_scan_at ASC NULLS FIRST
                LIMIT 100
            """),
            {"frequency": frequency}
        )

        items = []
        for row in result.fetchall():
            items.append({
                "id": str(row[0]),
                "entity_id": row[1],
                "entity_type": row[2],
                "entity_name": row[3],
                "tenant_id": str(row[4]),
                "last_risk_score": row[5],
                "last_dossier_hash": row[6],
            })

        return items

    @staticmethod
    async def update_scan_result(
        db: AsyncSession,
        item_id: str,
        risk_score: float,
        dossier_hash: str,
    ) -> None:
        """Оновити результат останнього скану."""
        await db.execute(
            text("""
                UPDATE watchlist_items
                SET last_scan_at = NOW(),
                    last_risk_score = :risk_score,
                    last_dossier_hash = :dossier_hash,
                    updated_at = NOW()
                WHERE id = :item_id
            """),
            {
                "item_id": item_id,
                "risk_score": risk_score,
                "dossier_hash": dossier_hash,
            }
        )
        await db.commit()

    @staticmethod
    async def get_alert_stats(
        db: AsyncSession,
        tenant_id: str,
    ) -> dict[str, Any]:
        """Статистика алертів для дашборду."""
        result = await db.execute(
            text("""
                SELECT
                    COUNT(*) FILTER (WHERE is_read = false) as unread_total,
                    COUNT(*) FILTER (WHERE severity = 'critical' AND is_read = false) as critical_unread,
                    COUNT(*) FILTER (WHERE severity = 'high' AND is_read = false) as high_unread,
                    COUNT(*) FILTER (WHERE severity = 'medium' AND is_read = false) as medium_unread,
                    COUNT(*) as total
                FROM watchlist_alerts
                WHERE tenant_id = :tenant_id
            """),
            {"tenant_id": tenant_id}
        )
        row = result.first()
        if not row:
            return {"unread_total": 0, "critical_unread": 0, "high_unread": 0, "medium_unread": 0, "total": 0}

        return {
            "unread_total": row[0],
            "critical_unread": row[1],
            "high_unread": row[2],
            "medium_unread": row[3],
            "total": row[4],
        }
""",
"Description": "Watchlist service with full CRUD, alert management, and scheduling support",
"Overwrite": false,
"TargetFile": "/Users/Shared/Predator_60/services/core-api/app/services/watchlist_service.py",
"toolAction": "Creating watchlist service",
"toolSummary": "Create watchlist_service.py"
}
