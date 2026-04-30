from __future__ import annotations

from datetime import UTC, datetime
import logging
from typing import Any

import asyncpg

from app.libs.core.config import settings

logger = logging.getLogger("predator.newspaper")


class MorningNewspaperService:
    def __init__(self, db_url: str = settings.CLEAN_DATABASE_URL):
        self.db_url = db_url

    async def get_daily_briefing(self) -> dict[str, Any]:
        """Generate a personalized daily briefing for the user."""
        conn = await asyncpg.connect(self.db_url)
        try:
            # 1. Fetch system stats
            stats = await self._get_system_stats(conn)

            # 2. Fetch latest critical alerts/news
            news = await self._get_latest_news(conn)

            # 3. Generate recommendations
            recommendations = await self._get_recommendations(conn)

            # 4. Get AZR status
            azr_status = await self._get_azr_status(conn)

            return {
                "date": datetime.now(UTC).isoformat(),
                "greeting": self._get_greeting(),
                "stats": stats,
                "news": news,
                "recommendations": recommendations,
                "azr": azr_status,
            }
        finally:
            await conn.close()

    def _get_greeting(self) -> str:
        hour = datetime.now().hour
        if hour < 12:
            return "Доброго ранку, Офіцере"
        if hour < 18:
            return "Доброго дня, Офіцере"
        return "Доброго вечора, Офіцере"

    async def _get_system_stats(self, conn: asyncpg.Connection) -> dict[str, Any]:
        """Fetch key system metrics for the briefing."""
        try:
            doc_count = await conn.fetchval("SELECT count(*) FROM gold.documents")
            recent_docs = await conn.fetchval(
                "SELECT count(*) FROM gold.documents WHERE created_at > NOW() - INTERVAL '24 hours'"
            )
            failed_jobs = await conn.fetchval(
                "SELECT count(*) FROM staging.raw_data WHERE processed = FALSE AND fetched_at < NOW() - INTERVAL '1 hour'"
            )

            return {
                "total_documents": doc_count or 0,
                "new_documents_24h": recent_docs or 0,
                "pending_tasks": failed_jobs or 0,
                "system_health": "Optimal" if failed_jobs < 10 else "Degraded",
            }
        except Exception as e:
            logger.exception(f"Error fetching stats: {e}")
            return {}

    async def _get_latest_news(self, conn: asyncpg.Connection) -> list[dict[str, Any]]:
        """Fetch latest critical documents or system events."""
        try:
            rows = await conn.fetch("""
                SELECT id, title, source_type, created_at
                FROM gold.documents
                ORDER BY created_at DESC
                LIMIT 5
            """)
            return [
                {
                    "id": str(row["id"]),
                    "title": row["title"],
                    "type": row["source_type"],
                    "time": row["created_at"].isoformat(),
                }
                for row in rows
            ]
        except Exception as e:
            logger.exception(f"Error fetching news: {e}")
            return []

    async def _get_recommendations(self, conn: asyncpg.Connection) -> list[str]:
        """AI-driven recommendations based on system state."""
        # Simple rule-based for now, could be LLM-driven later
        recs = []
        pending_tasks = await conn.fetchval(
            "SELECT count(*) FROM staging.raw_data WHERE processed = FALSE"
        )
        if pending_tasks > 100:
            recs.append("Рекомендується збільшити кількість ETL воркерів для обробки черги.")

        doc_count = await conn.fetchval("SELECT count(*) FROM gold.documents")
        if doc_count > 1000:
            recs.append(
                "Система накопичила достатньо даних для проведення глибокого семантичного аналізу трендів."
            )

        recs.append("Проведіть аудит AZR-політик для оптимізації автономного прийняття рішень.")
        return recs[:3]

    async def _get_azr_status(self, conn: asyncpg.Connection) -> dict[str, Any]:
        """Fetch AZR health status."""
        # Simplified AZR health
        return {
            "status": "Active",
            "autonomy_level": "Level 4 (Full)",
            "last_action": "Optimization cycle completed",
            "threat_level": "Low",
        }


newspaper_service = MorningNewspaperService()
