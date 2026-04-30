"""🗄️ SQL Query Optimizer для PREDATOR Analytics v56.1.4

Query plan analysis, performance monitoring, та automatic optimization suggestions.
"""

import time
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from predator_common.logging import get_logger

logger = get_logger("query_optimizer")


class QueryOptimizer:
    """Optimizer для аналізу та оптимізації SQL queries."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.slow_query_threshold = 100  # ms
        self.query_history: list[dict[str, Any]] = []

    async def analyze_query(self, query_sql: str, params: dict | None = None) -> dict[str, Any]:
        """Проаналізувати SQL query з EXPLAIN ANALYZE.

        Args:
            query_sql: SQL query для аналізу
            params: Query parameters

        Returns:
            Analysis result з execution plan та recommendations

        """
        start_time = time.time()

        try:
            # Execute EXPLAIN ANALYZE
            explain_sql = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query_sql}"

            result = await self.db.execute(text(explain_sql), params or {})
            plan = result.scalar()

            execution_time = (time.time() - start_time) * 1000  # ms

            # Parse and analyze the plan
            analysis = {
                "query": query_sql,
                "execution_time_ms": round(execution_time, 2),
                "plan": plan,
                "is_slow": execution_time > self.slow_query_threshold,
                "recommendations": [],
            }

            # Generate recommendations based on plan
            if plan:
                recommendations = self._generate_recommendations(plan)
                analysis["recommendations"] = recommendations

            # Log slow queries
            if analysis["is_slow"]:
                logger.warning(
                    f"Slow query detected: {execution_time:.2f}ms",
                    extra={
                        "query": query_sql[:200],
                        "execution_time_ms": round(execution_time, 2),
                        "recommendations": len(analysis["recommendations"]),
                    }
                )

            # Store in history
            self.query_history.append({
                "timestamp": time.time(),
                "query": query_sql,
                "execution_time_ms": round(execution_time, 2),
                "is_slow": analysis["is_slow"],
            })

            # Keep only last 100 queries
            if len(self.query_history) > 100:
                self.query_history = self.query_history[-100:]

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing query: {e}", exc_info=True)
            return {
                "query": query_sql,
                "error": str(e),
                "execution_time_ms": round((time.time() - start_time) * 1000, 2),
            }

    def _generate_recommendations(self, plan: Any) -> list[str]:
        """Generate optimization recommendations based on query plan."""
        recommendations = []

        try:
            # Convert plan to string for analysis
            plan_str = str(plan).lower()

            # Check for sequential scans
            if "seq scan" in plan_str:
                recommendations.append(
                    "⚠️ Sequential scan detected. Consider adding an index."
                )

            # Check for nested loop joins (can be slow for large datasets)
            if "nested loop" in plan_str and "rows=" in plan_str:
                recommendations.append(
                    "💡 Nested loop join detected. Verify if hash join would be more efficient."
                )

            # Check for high row estimates vs actual
            if "rows=" in plan_str and "actual rows=" in plan_str:
                recommendations.append(
                    "📊 Row estimate mismatch. Consider running ANALYZE on tables."
                )

            # Check for sort operations
            if "sort" in plan_str and "disk" in plan_str:
                recommendations.append(
                    "💾 Sort operation using disk. Increase work_mem or add index."
                )

            # Check for missing indexes
            if "bitmap heap scan" not in plan_str and "index scan" not in plan_str:
                if "where" in plan_str.lower():
                    recommendations.append(
                        "🔍 No index used for WHERE clause. Consider creating appropriate index."
                    )

            # Check for aggregate operations
            if "aggregate" in plan_str and execution_time_from_plan(plan) > 50:
                recommendations.append(
                    "⏱️ Slow aggregation. Consider materialized views or pre-computed aggregates."
                )

        except Exception as e:
            logger.debug(f"Error generating recommendations: {e}")

        return recommendations

    async def get_table_stats(self, table_name: str) -> dict[str, Any]:
        """Отримати статистику по таблиці.

        Args:
            table_name: Name of the table

        Returns:
            Table statistics including row count, size, indexes

        """
        try:
            # Get basic stats
            stats_query = """
                SELECT
                    relname as table_name,
                    n_live_tup as row_count,
                    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
                    pg_size_pretty(pg_relation_size(relid)) as table_size,
                    pg_size_pretty(pg_indexes_size(relid)) as indexes_size,
                    last_vacuum,
                    last_autovacuum,
                    last_analyze,
                    last_autoanalyze
                FROM pg_stat_user_tables
                WHERE relname = :table_name
            """

            result = await self.db.execute(text(stats_query), {"table_name": table_name})
            row = result.fetchone()

            if not row:
                return {"error": f"Table '{table_name}' not found"}

            # Get indexes info
            indexes_query = """
                SELECT
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename = :table_name
            """

            indexes_result = await self.db.execute(text(indexes_query), {"table_name": table_name})
            indexes = [
                {"name": row[0], "definition": row[1]}
                for row in indexes_result.fetchall()
            ]

            return {
                "table_name": row[0],
                "row_count": row[1],
                "total_size": row[2],
                "table_size": row[3],
                "indexes_size": row[4],
                "last_vacuum": str(row[5]),
                "last_autovacuum": str(row[6]),
                "last_analyze": str(row[7]),
                "last_autoanalyze": str(row[8]),
                "indexes": indexes,
                "index_count": len(indexes),
            }

        except Exception as e:
            logger.error(f"Error getting table stats: {e}")
            return {"error": str(e)}

    async def get_slow_queries(self, limit: int = 10) -> list[dict[str, Any]]:
        """Get recent slow queries from history."""
        slow_queries = [q for q in self.query_history if q["is_slow"]]
        slow_queries.sort(key=lambda x: x["execution_time_ms"], reverse=True)
        return slow_queries[:limit]

    async def get_performance_summary(self) -> dict[str, Any]:
        """Get overall query performance summary."""
        if not self.query_history:
            return {
                "total_queries": 0,
                "slow_queries": 0,
                "avg_execution_time_ms": 0,
                "max_execution_time_ms": 0,
            }

        total = len(self.query_history)
        slow = sum(1 for q in self.query_history if q["is_slow"])
        avg_time = sum(q["execution_time_ms"] for q in self.query_history) / total
        max_time = max(q["execution_time_ms"] for q in self.query_history)

        return {
            "total_queries": total,
            "slow_queries": slow,
            "slow_query_percentage": round((slow / total) * 100, 2),
            "avg_execution_time_ms": round(avg_time, 2),
            "max_execution_time_ms": round(max_time, 2),
            "threshold_ms": self.slow_query_threshold,
        }


# Helper function
def execution_time_from_plan(plan: Any) -> float:
    """Extract execution time from query plan."""
    try:
        if isinstance(plan, list) and plan:
            return plan[0].get("Execution Time", 0)
        elif isinstance(plan, dict):
            return plan.get("Execution Time", 0)
    except Exception:
        pass
    return 0
