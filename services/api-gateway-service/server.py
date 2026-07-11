import asyncio
import os
import json
import logging
import httpx
from contextlib import asynccontextmanager
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from aiokafka import AIOKafkaConsumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-gateway")

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:29092")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-explainability:8002")
TOPICS = [
    "entity.created",
    "entity.updated",
    "edge.created",
    "edge.updated",
    "risk.updated",
    "ai.drone.event",
    "system.state.changed",
    "graph.snapshot"
]

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        if not self.active_connections:
            return
        
        # Broadcast concurrently
        tasks = []
        for connection in self.active_connections:
            tasks.append(connection.send_text(message))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for idx, res in enumerate(results):
            if isinstance(res, Exception):
                # We could try to identify the connection and remove it,
                # but standard disconnect handler should catch it
                pass

manager = ConnectionManager()

# Kafka consumer task
async def consume_events():
    while True:
        try:
            logger.info(f"Starting Kafka consumer for topics {TOPICS} on broker {KAFKA_BROKER}")
            consumer = AIOKafkaConsumer(
                *TOPICS,
                bootstrap_servers=KAFKA_BROKER,
                group_id="api-gateway-group",
                auto_offset_reset="latest" # Only get new events for realtime
            )
            await consumer.start()
            try:
                async for msg in consumer:
                    try:
                        payload_str = msg.value.decode('utf-8')
                        # Route directly to websockets
                        await manager.broadcast(payload_str)
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
            finally:
                await consumer.stop()
        except Exception as e:
            logger.error(f"Kafka consumer connection error: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    consumer_task = asyncio.create_task(consume_events())
    yield
    # Shutdown
    consumer_task.cancel()

app = FastAPI(title="Predator API Gateway", lifespan=lifespan)

# CORS
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3030")
origins = [o.strip() for o in origins_str.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "api-gateway"}

@app.post("/api/v1/camera/focus")
async def camera_focus(payload: dict):
    # In a real system, this might push an event to Redpanda
    # For now, we simulate broadcasting a system state event
    event = {
        "event": "system.state.changed",
        "payload": {
            "trigger": "camera_focus",
            "target": payload.get("target_node"),
            "mode": payload.get("mode", "investigation")
        }
    }
    await manager.broadcast(json.dumps(event))
    return {"status": "event_dispatched"}

@app.post("/api/v1/ai/explain")
async def ai_explain(payload: dict):
    # Proxy to AI explainability service
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{AI_SERVICE_URL}/api/v1/explain", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error calling AI service: {e}")
            return {"error": "AI service unavailable", "details": str(e)}

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, maybe handle client ping/pong or commands
            data = await websocket.receive_text()
            logger.debug(f"Received WS data from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
