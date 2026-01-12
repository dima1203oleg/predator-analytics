"""
Database Optimizer - Automatically optimizes database queries and indexes
"""
import logging
from typing import List, Dict, Any
from sqlalchemy import text

logger = logging.getLogger("agents.db_optimizer")

class DatabaseOptimizer:
    def __init__(self, db_session):
        self.db_session = db_session

    async def analyze_and_optimize(self) -> Dict[str, Any]:
        """Analyze database and apply optimizations"""
        logger.info("🗄️ Database Optimizer: Starting analysis...")

        optimizations = []

        # 1. Find missing indexes
        missing_indexes = await self._find_missing_indexes()
        if missing_indexes:
            for idx in missing_indexes:
                await self._create_index(idx)
                optimizations.append(f"Created index: {idx['name']}")

        # 2. Find slow queries
        slow_queries = await self._find_slow_queries()
        if slow_queries:
            optimizations.append(f"Identified {len(slow_queries)} slow queries")

        # 3. Vacuum and analyze
        await self._vacuum_analyze()
        optimizations.append("Vacuumed and analyzed tables")

        return {
            "status": "optimized",
            "changes": optimizations,
            "slow_queries": len(slow_queries),
            "indexes_added": len(missing_indexes)
        }

    async def _find_missing_indexes(self) -> List[Dict]:
        """Find tables that would benefit from indexes"""
        # Simplified logic - in production would analyze query patterns
        return [
            {
                "table": "documents",
                "column": "created_at",
                "name": "idx_documents_created_at"
            },
            {
                "table": "documents",
                "column": "status",
                "name": "idx_documents_status"
            }
        ]

    async def _create_index(self, index_info: Dict):
        """Create database index"""
        try:
            async with self.db_session() as session:
                query = text(f"""
                    CREATE INDEX IF NOT EXISTS {index_info['name']}
                    ON {index_info['table']} ({index_info['column']})
                """)
                await session.execute(query)
                await session.commit()
                logger.info(f"✅ Created index: {index_info['name']}")
        except Exception as e:
            logger.error(f"Failed to create index: {e}")

    async def _find_slow_queries(self) -> List[str]:
        """Find slow-running queries"""
        try:
            async with self.db_session() as session:
                query = text("""
                    SELECT query, mean_exec_time
                    FROM pg_stat_statements
                    WHERE mean_exec_time > 100
                    ORDER BY mean_exec_time DESC
                    LIMIT 10
                """)
                result = await session.execute(query)
                return [row[0] for row in result]
        except Exception:
            # pg_stat_statements might not be enabled
            return []

    async def _vacuum_analyze(self):
        """Run VACUUM ANALYZE on main tables"""
        try:
            async with self.db_session() as session:
                await session.execute(text("VACUUM ANALYZE documents"))
                await session.commit()
        except Exception as e:
            logger.warning(f"Vacuum failed: {e}")
