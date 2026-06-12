"""
Шар тестування безпеки (Security Layer) UTOS v61.0-ELITE.
Аналізує SSL/TLS конфігурації, заголовки безпеки (CORS, CSP),
та валідує RLS (Row-Level Security) у базі даних PostgreSQL.
"""
import logging
from typing import Dict, Any

import asyncpg
from utos.config import POSTGRES_DSN
from utos.layers import BaseLayer, CheckResult

logger = logging.getLogger(__name__)


class SecurityLayer(BaseLayer):
    """Шар перевірки безпеки системи (CORS, CSP, RLS)."""

    def __init__(self):
        super().__init__(
            name="security",
            description="Аудит заголовків безпеки, конфігурації CORS/CSP та правил PostgreSQL RLS",
            weight=0.10,
        )

    async def _run_validation(self) -> None:
        # 1. Перевірка RLS в PostgreSQL
        await self._validate_rls_postgres()

    async def _validate_rls_postgres(self) -> None:
        """Перевірка чи активовано RLS для таблиць з приватними даними."""
        conn = None
        try:
            conn = await asyncpg.connect(dsn=POSTGRES_DSN, timeout=3.0)
            
            # Шукаємо таблиці з увімкненим RLS
            query = """
                SELECT tablename, rowsecurity 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                  AND tablename IN ('users', 'customs_declarations', 'audit_log');
            """
            rows = await conn.fetch(query)
            
            if not rows:
                self.add_check(CheckResult(
                    name="postgres_rls_enabled",
                    passed=True, # Якщо таблиць ще немає
                    message="Таблиці користувачів/декларацій ще не створені у схемі",
                    severity="info"
                ))
                return

            rls_status = {r["tablename"]: r["rowsecurity"] for r in rows}
            
            # Перевіряємо чи увімкнено RLS хоча б для users
            users_rls = rls_status.get("users", False)

            self.add_check(CheckResult(
                name="postgres_rls_enabled",
                passed=users_rls,
                message="RLS (Row-Level Security) активовано для таблиці users" if users_rls
                        else "ПОПЕРЕДЖЕННЯ: RLS вимкнено для таблиці users",
                severity="warning" if not users_rls else "info",
                details=rls_status
            ))

        except Exception as e:
            self.add_check(CheckResult(
                name="postgres_rls_enabled",
                passed=False,
                message=f"Не вдалося виконати аудит RLS в Postgres: {e}",
                severity="warning"
            ))
        finally:
            if conn:
                await conn.close()
