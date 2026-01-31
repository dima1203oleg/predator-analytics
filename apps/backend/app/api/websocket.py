"""
WebSocket Router
Provides real-time updates through WebSocket connections
"""
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from typing import Dict, Any, List, Set
import logging
import json
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.subscription_channels: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"New WebSocket connection. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        self.active_connections.discard(websocket)
        # Remove from all subscription channels
        for channel_clients in self.subscription_channels.values():
            channel_clients.discard(websocket)
        logger.info(f"WebSocket disconnected. Remaining connections: {len(self.active_connections)}")
    
    def subscribe(self, websocket: WebSocket, channel: str):
        """Subscribe a WebSocket to a specific channel"""
        if channel not in self.subscription_channels:
            self.subscription_channels[channel] = set()
        self.subscription_channels[channel].add(websocket)
        logger.info(f"Client subscribed to channel: {channel}")
    
    def unsubscribe(self, websocket: WebSocket, channel: str):
        """Unsubscribe a WebSocket from a channel"""
        if channel in self.subscription_channels:
            self.subscription_channels[channel].discard(websocket)
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific WebSocket"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_to_channel(self, channel: str, message: Dict[str, Any]):
        """Broadcast a message to all clients subscribed to a specific channel"""
        if channel not in self.subscription_channels:
            return
        
        disconnected = set()
        for connection in self.subscription_channels[channel]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to channel {channel}: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.unsubscribe(conn, channel)
            if conn in self.active_connections:
                self.disconnect(conn)


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time system events
    
    Clients can send messages to subscribe to specific channels:
    {"action": "subscribe", "channel": "system"}
    {"action": "unsubscribe", "channel": "system"}
    
    Available channels:
    - system: System-level events
    - jobs: Job status updates
    - training: ML training progress
    - search: Search events
    - diagnostics: System diagnostics
    """
    await manager.connect(websocket)
    
    # Send welcome message
    await manager.send_personal_message({
        "type": "connection",
        "status": "connected",
        "timestamp": datetime.utcnow().isoformat(),
        "available_channels": ["system", "jobs", "training", "search", "diagnostics"]
    }, websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                action = message.get("action")
                
                if action == "subscribe":
                    channel = message.get("channel")
                    if channel:
                        manager.subscribe(websocket, channel)
                        await manager.send_personal_message({
                            "type": "subscription",
                            "status": "subscribed",
                            "channel": channel,
                            "timestamp": datetime.utcnow().isoformat()
                        }, websocket)
                
                elif action == "unsubscribe":
                    channel = message.get("channel")
                    if channel:
                        manager.unsubscribe(websocket, channel)
                        await manager.send_personal_message({
                            "type": "subscription",
                            "status": "unsubscribed",
                            "channel": channel,
                            "timestamp": datetime.utcnow().isoformat()
                        }, websocket)
                
                elif action == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }, websocket)
                
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": f"Unknown action: {action}",
                        "timestamp": datetime.utcnow().isoformat()
                    }, websocket)
            
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.utcnow().isoformat()
                }, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.websocket("/ws/omniscience")
async def websocket_omniscience_endpoint(websocket: WebSocket):
    """
    Omniscience WebSocket endpoint
    Provides real-time stream of system state, training progress, and trinity reasoning
    """
    await manager.connect(websocket)
    
    # Send initial state
    await manager.send_personal_message({
        "type": "omniscience",
        "event": "connected",
        "timestamp": datetime.utcnow().isoformat(),
        "system_version": "v25.0",
        "features": ["health_monitoring", "training_progress", "trinity_reasoning"]
    }, websocket)
    
    try:
        # Subscribe to all relevant channels
        channels = ["system", "jobs", "training", "diagnostics", "trinity"]
        for channel in channels:
            manager.subscribe(websocket, channel)
        
        # Keep connection alive and handle client messages
        while True:
            data = await websocket.receive_text()
            # Process client requests if needed
            try:
                message = json.loads(data)
                if message.get("action") == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    }, websocket)
            except json.JSONDecodeError:
                pass
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Omniscience WebSocket error: {e}")
        manager.disconnect(websocket)


# Helper functions to broadcast events (to be used by other parts of the application)

async def broadcast_system_event(event_type: str, data: Dict[str, Any]):
    """Broadcast a system event to all subscribed clients"""
    message = {
        "type": "system_event",
        "event_type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_channel("system", message)


async def broadcast_job_update(job_id: str, status: str, progress: float = None, details: Dict[str, Any] = None):
    """Broadcast a job status update"""
    message = {
        "type": "job_update",
        "job_id": job_id,
        "status": status,
        "progress": progress,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_channel("jobs", message)


async def broadcast_training_update(model_id: str, epoch: int, loss: float, metrics: Dict[str, Any] = None):
    """Broadcast ML training progress"""
    message = {
        "type": "training_update",
        "model_id": model_id,
        "epoch": epoch,
        "loss": loss,
        "metrics": metrics or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_channel("training", message)


async def broadcast_diagnostic_alert(severity: str, component: str, alert_message: str, details: Dict[str, Any] = None):
    """Broadcast a diagnostic alert"""
    message = {
        "type": "diagnostic_alert",
        "severity": severity,
        "component": component,
        "message": alert_message,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_channel("diagnostics", message)


async def broadcast_trinity_reasoning(stage: str, agent: str, reasoning: str, decision: Dict[str, Any] = None):
    """Broadcast Trinity agent reasoning trace"""
    message = {
        "type": "trinity_reasoning",
        "stage": stage,
        "agent": agent,
        "reasoning": reasoning,
        "decision": decision or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_channel("trinity", message)
