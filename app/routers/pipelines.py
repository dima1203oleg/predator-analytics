from __future__ import annotations

import random

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/pipelines", tags=["pipelines"])

# Mock status for different database pipelines
DB_PIPELINES = {
    "minio": {
        "name": "MinIO Object Storage",
        "color": "rose",
        "progress": 100,
        "status": "completed",
    },
    "postgres": {
        "name": "PostgreSQL Database",
        "color": "blue",
        "progress": 85,
        "status": "running",
    },
    "qdrant": {
        "name": "Qdrant Vector Engine",
        "color": "purple",
        "progress": 40,
        "status": "running",
    },
    "graph": {"name": "Neo4j Graph Database", "color": "emerald", "progress": 0, "status": "idle"},
}


@router.get("/")
async def list_pipelines():
    """Get status of all active data pipelines."""
    # Simulate dynamic progress
    for data in DB_PIPELINES.values():
        if data["status"] == "running":
            data["progress"] = min(100, data["progress"] + random.randint(1, 5))
            if data["progress"] == 100:
                data["status"] = "completed"
                # Start next idle pipeline if exists
                for next_data in DB_PIPELINES.values():
                    if next_data["status"] == "idle":
                        next_data["status"] = "running"
                        break

    return [
        {
            "id": k,
            **v,
            "items_processed": 1000 + random.randint(1, 500),
            "items_total": 2500,
            "latency_ms": 10 + random.randint(1, 50),
        }
        for k, v in DB_PIPELINES.items()
    ]


@router.post("/{db_id}/restart")
async def restart_pipeline(db_id: str):
    if db_id not in DB_PIPELINES:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    DB_PIPELINES[db_id]["status"] = "running"
    DB_PIPELINES[db_id]["progress"] = 0
    return {"status": "restarted", "id": db_id}
