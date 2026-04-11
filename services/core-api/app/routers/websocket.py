"""
🔌 WebSocket Service для PREDATOR Analytics v56.1.4

Real-time updates для dashboard, alerts, та monitoring через WebSocket connections.
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Set

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant_id
from predator_common.logging import get_logger
from predator_common.models import Alert, Declaration, RiskScore

logger = get_logger("websocket")

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manager для WebSocket connections."""

    def __init__(self):
        # tenant_id -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Global broadcast connections
        self.broadcast_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, tenant_id: str = None):
        """Підключити WebSocket client."""
        await websocket.accept()
        
        if tenant_id:
            if tenant_id not in self.active_connections:
                self.active_connections[tenant_id] = set()
            self.active_connections[tenant_id].add(websocket)
            logger.info(
                f"WebSocket connected for tenant {tenant_id}",
                extra={"tenant_id": tenant_id, "total_connections": len(self.active_connections[tenant_id])}
            )
        else:
            self.broadcast_connections.add(websocket)
            logger.info(
                "WebSocket connected for broadcast",
                extra={"total_broadcast": len(self.broadcast_connections)}
            )

    def disconnect(self, websocket: WebSocket, tenant_id: str = None):
        """Відключити WebSocket client."""
        if tenant_id and tenant_id in self.active_connections:
            self.active_connections[tenant_id].discard(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]
            logger.info(
                f"WebSocket disconnected for tenant {tenant_id}",
                extra={"tenant_id": tenant_id}
            )
        else:
            self.broadcast_connections.discard(websocket)
            logger.info("WebSocket disconnected from broadcast")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Надіслати повідомлення конкретному client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast_to_tenant(self, message: dict, tenant_id: str):
        """Надіслати повідомлення всім clients tenant'а."""
        if tenant_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[tenant_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to tenant {tenant_id}: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected clients
            for conn in disconnected:
                self.disconnect(conn, tenant_id)

    async def broadcast_to_all(self, message: dict):
        """Надіслати повідомження всім connected clients."""
        disconnected = set()
        
        # Broadcast to tenant-specific connections
        for tenant_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting: {e}")
                    disconnected.add((connection, tenant_id))
        
        # Broadcast to global connections
        for connection in self.broadcast_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to global: {e}")
                disconnected.add((connection, None))
        
        # Clean up
        for conn, tenant_id in disconnected:
            self.disconnect(conn, tenant_id)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """
    WebSocket endpoint для real-time dashboard updates.
    
    Надсилає оновлення:
    - Нові декларації
    - Зміни в risk scores
    - Нові alerts
    - Оновлення статистики
    """
    tenant_id = None
    await manager.connect(websocket, tenant_id)
    
    try:
        while True:
            # Receive messages from client (optional - for subscriptions)
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                action = message.get("action")
                
                if action == "subscribe":
                    tenant_id = message.get("tenant_id")
                    await manager.send_personal_message({
                        "type": "subscription_confirmed",
                        "tenant_id": tenant_id,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }, websocket)
                
                elif action == "unsubscribe":
                    tenant_id = None
                    await manager.send_personal_message({
                        "type": "unsubscribed",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }, websocket)
                    
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON"
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        manager.disconnect(websocket, tenant_id)


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """
    WebSocket endpoint для real-time alerts notifications.
    
    Надсилає нові alerts миттєво при їх створенні.
    """
    tenant_id = None
    await manager.connect(websocket, tenant_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                if message.get("action") == "subscribe":
                    tenant_id = message.get("tenant_id")
                    await manager.send_personal_message({
                        "type": "alerts_subscribed",
                        "tenant_id": tenant_id
                    }, websocket)
                    
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
    except Exception as e:
        logger.error(f"WebSocket alerts error: {e}", exc_info=True)
        manager.disconnect(websocket, tenant_id)


# ═══════════════════════════════════════════════════════════════
# Helper functions для відправки real-time updates
# ═══════════════════════════════════════════════════════════════

async def notify_new_declaration(tenant_id: str, declaration_data: dict):
    """Сповістити про нову декларацію."""
    await manager.broadcast_to_tenant({
        "type": "new_declaration",
        "data": declaration_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, tenant_id)


async def notify_risk_score_change(tenant_id: str, ueid: str, new_score: float):
    """Сповістити про зміну risk score."""
    await manager.broadcast_to_tenant({
        "type": "risk_score_updated",
        "ueid": ueid,
        "new_score": new_score,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, tenant_id)


async def notify_new_alert(tenant_id: str, alert_data: dict):
    """Сповістити про новий alert."""
    await manager.broadcast_to_tenant({
        "type": "new_alert",
        "data": alert_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, tenant_id)


async def broadcast_dashboard_update(stats: dict):
    """Broadcast dashboard statistics update to all clients."""
    await manager.broadcast_to_all({
        "type": "dashboard_update",
        "data": stats,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


# ═══════════════════════════════════════════════════════════════
# Background task для periodic dashboard updates
# ═══════════════════════════════════════════════════════════════

async def periodic_dashboard_updates(db: AsyncSession, interval: int = 30):
    """
    Periodically fetch and broadcast dashboard updates.
    
    Args:
        db: Database session
        interval: Update interval in seconds
    """
    while True:
        try:
            # Fetch latest stats
            declarations_count = await db.scalar(select(func.count()).select_from(Declaration)) or 0
            high_risk_count = await db.scalar(
                select(func.count()).select_from(RiskScore).where(RiskScore.cers >= 80)
            ) or 0
            alerts_count = await db.scalar(select(func.count()).select_from(Alert)) or 0
            
            # Broadcast update
            await broadcast_dashboard_update({
                "total_declarations": declarations_count,
                "high_risk_count": high_risk_count,
                "active_alerts": alerts_count,
            })
            
            logger.debug("Dashboard update broadcasted")
            
        except Exception as e:
            logger.error(f"Error in periodic dashboard updates: {e}")
        
        await asyncio.sleep(interval)
