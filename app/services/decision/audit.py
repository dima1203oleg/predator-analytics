"""
🧾 Decision Intelligence Audit

Аудит дій, подій та доступу до Decision Intelligence Engine.
Підтримує:
- Аудит запуску аналітики
- Аудит batch-операцій
- Аудит ML-передбачень
- Аудит доступу до конфігурації
- Аудит змін версій та міграцій
- Аудит відмов у доступі

Компоненти:
- DecisionAuditService — основний сервіс аудиту
- AuditEventType — типи подій
- AuditSeverity — рівень важливості
- AuditContext — контекст аудиту
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import UTC, datetime
from enum import StrEnum
import logging
from typing import Any

from app.libs.core.security.rbac import Permission, Role
from app.libs.core.security.dependencies import get_current_user_roles

logger = logging.getLogger("predator.decision.audit")


class AuditEventType(StrEnum):
    """Типи подій аудиту."""

    QUICK_SCORE = "quick_score"
    RECOMMENDATION = "recommendation"
    COUNTERPARTY = "counterparty"
    PROCUREMENT = "procurement"
    MARKET_ENTRY = "market_entry"
    NICHES = "niches"
    BATCH = "batch"
    ML_PREDICTION = "ml_prediction"
    CONFIG_READ = "config_read"
    CONFIG_WRITE = "config_write"
    VERSION_MIGRATION = "version_migration"
    ACCESS_DENIED = "access_denied"
    SYSTEM_ERROR = "system_error"


class AuditSeverity(StrEnum):
    """Рівні важливості аудиту."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(slots=True)
class AuditContext:
    """Контекст події аудиту."""

    user_id: str | None
    username: str | None
    roles: list[str]
    event_type: AuditEventType
    severity: AuditSeverity
    action: str
    resource_type: str
    resource_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


class DecisionAuditService:
    """Сервіс аудиту для Decision Intelligence Engine."""

    def __init__(self) -> None:
        self._events: list[AuditContext] = []

    def record(self, context: AuditContext) -> None:
        """Записати подію аудиту в локальний журнал."""
        self._events.append(context)
        if len(self._events) > 1000:
            self._events = self._events[-1000:]
        logger.info(
            "Audit recorded: %s %s resource=%s id=%s roles=%s",
            context.event_type.value,
            context.action,
            context.resource_type,
            context.resource_id,
            ",".join(context.roles),
        )

    def record_access_denied(
        self,
        *,
        user_id: str | None,
        username: str | None,
        roles: list[str],
        required_permission: Permission | None,
        path: str,
        ip_address: str | None = None,
    ) -> None:
        """Записати відмову в доступі."""
        self.record(
            AuditContext(
                user_id=user_id,
                username=username,
                roles=roles,
                event_type=AuditEventType.ACCESS_DENIED,
                severity=AuditSeverity.MEDIUM,
                action="deny",
                resource_type="api_route",
                resource_id=path,
                ip_address=ip_address,
                metadata={
                    "required_permission": required_permission.value if required_permission else None,
                    "path": path,
                },
            )
        )

    def record_analysis(
        self,
        *,
        user_id: str | None,
        username: str | None,
        roles: list[str],
        event_type: AuditEventType,
        resource_type: str,
        resource_id: str | None,
        metadata: dict[str, Any] | None = None,
        severity: AuditSeverity = AuditSeverity.LOW,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Записати аналітичну подію."""
        self.record(
            AuditContext(
                user_id=user_id,
                username=username,
                roles=roles,
                event_type=event_type,
                severity=severity,
                action="analyze",
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata=metadata or {},
            )
        )

    def record_config_change(
        self,
        *,
        user_id: str | None,
        username: str | None,
        roles: list[str],
        action: str,
        changes: dict[str, Any],
        ip_address: str | None = None,
    ) -> None:
        """Записати зміну конфігурації."""
        self.record(
            AuditContext(
                user_id=user_id,
                username=username,
                roles=roles,
                event_type=AuditEventType.CONFIG_WRITE if action != "read" else AuditEventType.CONFIG_READ,
                severity=AuditSeverity.MEDIUM,
                action=action,
                resource_type="config",
                metadata={"changes": changes},
                ip_address=ip_address,
            )
        )

    def record_version_migration(
        self,
        *,
        user_id: str | None,
        username: str | None,
        roles: list[str],
        from_version: str,
        to_version: str,
        success: bool,
        metadata: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> None:
        """Записати подію міграції версій."""
        self.record(
            AuditContext(
                user_id=user_id,
                username=username,
                roles=roles,
                event_type=AuditEventType.VERSION_MIGRATION,
                severity=AuditSeverity.HIGH if not success else AuditSeverity.LOW,
                action="migrate",
                resource_type="version",
                resource_id=to_version,
                ip_address=ip_address,
                metadata={
                    "from_version": from_version,
                    "to_version": to_version,
                    "success": success,
                    **(metadata or {}),
                },
            )
        )

    def record_batch(
        self,
        *,
        user_id: str | None,
        username: str | None,
        roles: list[str],
        batch_size: int,
        analysis_type: str,
        successful: int,
        failed: int,
        ip_address: str | None = None,
    ) -> None:
        """Записати batch-аналітику."""
        self.record(
            AuditContext(
                user_id=user_id,
                username=username,
                roles=roles,
                event_type=AuditEventType.BATCH,
                severity=AuditSeverity.MEDIUM if failed == 0 else AuditSeverity.HIGH,
                action="batch_analyze",
                resource_type="batch",
                resource_id=str(batch_size),
                ip_address=ip_address,
                metadata={
                    "analysis_type": analysis_type,
                    "batch_size": batch_size,
                    "successful": successful,
                    "failed": failed,
                },
            )
        )

    def to_dict(self) -> list[dict[str, Any]]:
        """Отримати список подій у вигляді словників."""
        return [asdict(event) | {"event_type": event.event_type.value, "severity": event.severity.value} for event in self._events]

    def clear(self) -> None:
        """Очистити локальний журнал."""
        self._events.clear()


_audit_service: DecisionAuditService | None = None


def get_decision_audit_service() -> DecisionAuditService:
    """Отримати singleton-інстанс сервісу аудиту."""
    global _audit_service
    if _audit_service is None:
        _audit_service = DecisionAuditService()
    return _audit_service


async def collect_user_roles_for_audit() -> list[str]:
    """Отримати ролі користувача для аудиту."""
    # Паралель з RBAC залежностями; тут не викликаємо FastAPI напряму,
    # а залишаємо готовий хелпер для сервісів і endpoint'ів.
    return [Role.VIEWER.value]


def can_access_decision_feature(roles: list[str], permission: Permission) -> bool:
    """Перевірити, чи можна доступитися до функції Decision Intelligence."""
    from app.libs.core.security.rbac import verify_permission

    return verify_permission(roles, permission)


__all__ = [
    "AuditEventType",
    "AuditSeverity",
    "AuditContext",
    "DecisionAuditService",
    "get_decision_audit_service",
    "collect_user_roles_for_audit",
    "can_access_decision_feature",
]
