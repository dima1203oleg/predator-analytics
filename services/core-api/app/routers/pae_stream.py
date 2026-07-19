from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
import asyncio

from app.services.pae.orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pae", tags=["pae"])

@router.websocket("/stream")
async def pae_stream(websocket: WebSocket):
    """
    WebSocket ендпоінт для двонаправленої взаємодії з PREDATOR Abstraction Engine (PAE).
    Отримує наміри (Intents) від UI та стрімить композитні результати у реальному часі.
    """
    await websocket.accept()
    logger.info("New WebSocket connection to PAE Stream established.")
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                intent = json.loads(data)
                logger.debug(f"Received Intent: {intent}")
                
                # Відправляємо проміжний статус (The Pulse)
                await websocket.send_json({
                    "type": "pulse",
                    "status": "processing",
                    "latency": 5
                })
                
                # Обробка через PAE Orchestrator
                result = await orchestrator.process_intent(intent)
                
                # Відправляємо результати (The Synthesis)
                await websocket.send_json({
                    "type": "synthesis",
                    "data": result
                })
                
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON intent"})
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected from PAE Stream.")
    except Exception as e:
        logger.error(f"Error in PAE stream: {e}")
