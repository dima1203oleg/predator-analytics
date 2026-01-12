
import logging
import asyncio
from typing import Dict, Any, List, Optional
from .registry import registry
import json

logger = logging.getLogger("tools.v25")

@registry.register(name="get_v25_pulse", description="Get real-time system pulse score and health status from v25 Aggregator")
async def get_v25_pulse() -> str:
    """
    Retrieve current health score, active alerts, and degradation reasons.
    """
    try:
        # Dynamic import to avoid circular dependency
        from app.services.health_aggregator import health_aggregator
        pulse = await health_aggregator.get_system_pulse()
        return json.dumps(pulse, indent=2)
    except Exception as e:
        return f"Error fetching pulse: {e}"

@registry.register(name="manage_simulation", description="Manage Digital Twin simulations (start_stress_test, start_data_poisoning, list_simulations)")
async def manage_simulation(action: str, target: str = "backend", intensity: float = 0.5) -> str:
    """
    Start or list digital twin simulations.
    Actions: start_stress_test, start_data_poisoning, list_simulations, get_status
    """
    try:
        from app.services.simulation_service import simulation_service

        if action == "start_stress_test":
            res = await simulation_service.run_stress_test(target, intensity)
            return json.dumps(res, indent=2)
        elif action == "start_data_poisoning":
            res = await simulation_service.run_data_poisoning(target, intensity)
            return json.dumps(res, indent=2)
        elif action == "list_simulations":
            res = simulation_service.list_simulations()
            return json.dumps(res, indent=2)
        elif action == "get_status":
            res = simulation_service.get_status()
            return json.dumps(res, indent=2)
        else:
             return f"Unknown action: {action}"
    except Exception as e:
        return f"Simulation error: {e}"

@registry.register(name="trigger_guardian_recovery", description="Manually trigger the Self-Healing Guardian recovery loop")
async def trigger_guardian_recovery() -> str:
    """
    Force the Guardian to run its auto-recovery logic immediately.
    """
    try:
        from libs.core.guardian import guardian
        res = await guardian.run_auto_recovery()
        return json.dumps(res, indent=2)
    except Exception as e:
        return f"Guardian trigger failed: {e}"

@registry.register(name="system_maintenance", description="Execute AI Maintenance tasks (vacuum_db, reclaim_vectors)")
async def system_maintenance(task: str) -> str:
    """
    Execute pro-active maintenance tasks to optimize performance.
    Tasks: vacuum_db, reclaim_vectors
    """
    try:
        from libs.core.guardian import guardian

        if task == "vacuum_db":
            res = await guardian.vacuum_analytical_storage()
        elif task == "reclaim_vectors":
            res = await guardian.reclaim_vector_space()
        else:
            return f"Unknown maintenance task: {task}"

        return json.dumps(res, indent=2)
    except Exception as e:
        return f"Maintenance failed: {e}"


# ===== NEW V25.1 TOOLS =====

@registry.register(
    name="e2e_analyze",
    description="Execute E2E multi-database analysis across PostgreSQL, OpenSearch, and Qdrant"
)
async def e2e_analyze(query: str, databases: List[str] = None, limit: int = 10) -> str:
    """
    Perform cross-database analysis and pattern detection.
    Args:
        query: Search/analysis query
        databases: List of databases to query (postgresql, opensearch, qdrant)
        limit: Max results per database
    """
    try:
        import httpx

        payload = {
            "query": query,
            "databases": databases or ["postgresql", "opensearch"],
            "limit_per_db": limit,
            "generate_cases": True
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://localhost:8000/api/v25/analyze/e2e",
                json=payload
            )
            return response.text

    except Exception as e:
        return json.dumps({"error": str(e), "success": False})


@registry.register(
    name="optimizer_status",
    description="Get Autonomous Optimizer status, metrics and drift history"
)
async def optimizer_status() -> str:
    """
    Get current autonomous optimizer status including:
    - Running state and interval
    - Optimization level (1-5)
    - Metrics history
    - Drift velocity
    """
    try:
        from app.services.autonomous_optimizer import autonomous_optimizer
        status = autonomous_optimizer.get_status()
        return json.dumps(status, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


@registry.register(
    name="force_optimization",
    description="Force an immediate optimization check cycle"
)
async def force_optimization() -> str:
    """
    Trigger immediate drift check and optimization if needed.
    """
    try:
        from app.services.autonomous_optimizer import autonomous_optimizer
        result = await autonomous_optimizer.force_check()
        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "success": False})


@registry.register(
    name="create_case",
    description="Create a new case from analysis findings"
)
async def create_case(
    title: str,
    situation: str,
    conclusion: str,
    risk_score: int = 50,
    sector: str = "BIZ",
    status: str = "УВАГА"
) -> str:
    """
    Create a new case in the system.
    Args:
        title: Case title
        situation: Description of the situation
        conclusion: Analysis conclusion
        risk_score: Risk score 1-100
        sector: Sector code (GOV, BIZ, MED, SCI, SYS)
        status: Status (КРИТИЧНО, УВАГА, БЕЗПЕЧНО)
    """
    try:
        import httpx

        payload = {
            "title": title,
            "situation": situation,
            "conclusion": conclusion,
            "riskScore": risk_score,
            "sector": sector,
            "status": status
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://localhost:8000/api/v1/cases/",
                json=payload
            )
            return response.text

    except Exception as e:
        return json.dumps({"error": str(e), "success": False})


@registry.register(
    name="list_data_sources",
    description="List all available data sources and their status"
)
async def list_data_sources() -> str:
    """
    Get list of all data sources with their current status.
    """
    try:
        import httpx

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://localhost:8000/api/v1/sources/")
            return response.text

    except Exception as e:
        return json.dumps({"error": str(e)})


@registry.register(
    name="query_database",
    description="Execute a query on a specific database (postgresql, opensearch, qdrant)"
)
async def query_database(database: str, query: str, limit: int = 10) -> str:
    """
    Query a specific database.
    Args:
        database: Target database (postgresql, opensearch, qdrant)
        query: Query string or search term
        limit: Max results
    """
    try:
        if database == "postgresql":
            from libs.core.database import get_db_ctx
            from sqlalchemy import text

            async with get_db_ctx() as db:
                result = await db.execute(
                    text(f"SELECT * FROM gold.documents WHERE content ILIKE :pattern LIMIT :limit"),
                    {"pattern": f"%{query}%", "limit": limit}
                )
                rows = result.fetchall()
                return json.dumps([dict(r._mapping) for r in rows], indent=2, default=str)

        elif database == "opensearch":
            from app.services.opensearch_indexer import OpenSearchIndexer

            indexer = OpenSearchIndexer()
            response = await indexer.search(
                index_name="documents_safe",
                query=query,
                size=limit
            )
            await indexer.close()
            hits = response.get("hits", {}).get("hits", [])
            return json.dumps([h["_source"] for h in hits], indent=2)

        elif database == "qdrant":
            from app.services.qdrant_service import QdrantService
            from app.services.embedding_service import EmbeddingService

            qdrant = QdrantService()
            embedder = EmbeddingService()
            vector = await embedder.generate_embedding_async(query)
            results = await qdrant.search(query_vector=vector, limit=limit)
            return json.dumps(results, indent=2, default=str)

        else:
            return json.dumps({"error": f"Unknown database: {database}"})

    except Exception as e:
        return json.dumps({"error": str(e)})


@registry.register(
    name="get_system_stats",
    description="Get comprehensive system statistics"
)
async def get_system_stats() -> str:
    """
    Get system-wide statistics including document counts, models, and storage.
    """
    try:
        import httpx

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://localhost:8000/api/v25/stats")
            return response.text

    except Exception as e:
        return json.dumps({"error": str(e)})
