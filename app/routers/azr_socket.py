from __future__ import annotations

"""
🔌 AZR NERVOUS SYSTEM - WebSocket Bridge
========================================
Connects the AZR Unified Brain directly to the Web Interface.
Broadcasts OODA cycles, ZK proofs, and Chaos events in real-time.
"""

import asyncio
import contextlib

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.libs.core.azr import get_azr

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            with contextlib.suppress(Exception):
                await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/azr-brain")
async def azr_brain_socket(websocket: WebSocket):
    """Real-time feed of AZR's consciousness."""
    await manager.connect(websocket)
    try:
        # Get reference to the brain
        azr = get_azr()

        last_cycle = 0

        while True:
            # 1. Send Heartbeat (Health & Status)
            status = azr.get_status()

            # Optimization: Only send heavy data if cycle changed or every 2s
            await manager.broadcast(
                {
                    "type": "HEARTBEAT",
                    "phase": status["phase"],
                    "health": status["health"],
                    "cycles": status["cycle_count"],
                    "ledger_size": status["truth_ledger"]["entries"],
                }
            )

            # 2. Check for new Truth Ledger entries (Thoughts/Actions)
            # In a real event-driven architecture, we would subscribe to an event bus.
            # Here we poll for simplicity.
            if status["cycle_count"] > last_cycle:
                # New cycle completed!
                last_cycle = status["cycle_count"]

                # Send Cycle Analytics
                await manager.broadcast(
                    {
                        "type": "CYCLE_COMPLETE",
                        "metrics": status["metrics"],
                        "prediction": {
                            # Mocking prediction visualization data if not available directly in stats
                            "cpu_trend": "stable",
                            "next_action": "OBSERVE",
                        },
                    }
                )

                # Check for threats active
                if status["health"]["score"] < 90:
                    await manager.broadcast(
                        {
                            "type": "ALERT",
                            "level": "warning",
                            "message": "System stability slightly degraded. Self-healing active.",
                        }
                    )

            await asyncio.sleep(1)  # Frequency 1Hz

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
