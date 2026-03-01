from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException
import httpx

from app.libs.core.reality import get_juridical_transpiler


router = APIRouter(prefix="/ledger", tags=["Truth Ledger"])
transpiler = get_juridical_transpiler()

LEDGER_SERVICE_URL = os.getenv("LEDGER_SERVICE_URL", "http://truth-ledger:8000")


async def proxy_ledger(path: str):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{LEDGER_SERVICE_URL}/{path}")
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Ledger service error")
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/entries")
async def get_latest_entries(limit: int = 15):
    """Proxy to Truth Ledger list_entries."""
    return await proxy_ledger(f"entries?limit={limit}")


@router.get("/entry/{id}")
async def get_entry(id: int):
    """Proxy to Truth Ledger get_entry_details."""
    return await proxy_ledger(f"entry/{id}")


@router.get("/report/{id}")
async def get_juridical_report(id: int):
    """Generated juridical report for a specific ledger entry.
    If the entry indicates an anomaly, returns the Anomaly Report.
    """
    entry = await proxy_ledger(f"entry/{id}")
    payload = entry.get("payload", {})

    # Identify type of report needed
    if payload.get("anomaly_found"):
        doc = transpiler.generate_document(
            "anomaly_report",
            {
                "details": payload.get("result", "Unknown anomaly"),
                "anomaly_id": f"ledger_{id}_proof",
            },
        )
    elif entry.get("entity_type") == "proposal" and entry.get("action") == "execute":
        doc = transpiler.generate_document(
            "vpc_certificate",
            {"witness_count": payload.get("witness_count", 0), "context_hash": entry.get("hash")},
        )
    else:
        doc = transpiler.generate_document(
            "compliance_affidavit",
            {
                "action": entry.get("action"),
                "entity": f"{entry.get('entity_type')}:{entry.get('entity_id')}",
            },
        )

    return doc.dict()
