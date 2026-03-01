from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import psutil

from app.services.websocket_service import manager


logger = logging.getLogger("predator.websocket.api")
router = APIRouter()


@router.websocket("/ws/v1/system-events")
async def system_events_websocket(websocket: WebSocket, tenant_id: str | None = None):
    await manager.connect(websocket, tenant_id)
    try:
        while True:
            # Keep connection alive and handle client-side pings
            data = await websocket.receive_text()
            # Simple echo or heartbeat logic if needed
            await websocket.send_json({"status": "alive", "received": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
        logger.info(f"WebSocket disconnected: {tenant_id or 'broadcast'}")
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
        manager.disconnect(websocket, tenant_id)


@router.websocket("/ws/metrics")
async def realtime_metrics_websocket(websocket: WebSocket):
    """Real-time system metrics WebSocket endpoint.
    Streams CPU, memory, disk, and network stats every 5 seconds.
    """
    await websocket.accept()
    logger.info("WebSocket /ws/metrics connected")

    try:
        while True:
            # Gather real system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")

            # Network I/O
            net_io = psutil.net_io_counters()

            metrics = {
                "type": "metrics",
                "timestamp": datetime.now(UTC).isoformat(),
                "cpu": {"percent": cpu_percent, "cores": psutil.cpu_count()},
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used,
                },
                "disk": {"total": disk.total, "used": disk.used, "free": disk.free, "percent": disk.percent},
                "network": {
                    "bytes_sent": net_io.bytes_sent,
                    "bytes_recv": net_io.bytes_recv,
                    "packets_sent": net_io.packets_sent,
                    "packets_recv": net_io.packets_recv,
                },
            }

            await websocket.send_json(metrics)
            await asyncio.sleep(5)  # Update every 5 seconds

    except WebSocketDisconnect:
        logger.info("WebSocket /ws/metrics disconnected")
    except Exception as e:
        logger.exception(f"WebSocket /ws/metrics error: {e}")
