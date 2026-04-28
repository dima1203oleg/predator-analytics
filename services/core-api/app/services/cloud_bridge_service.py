import asyncio
import httpx
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class CloudBridgeService:
    """
    🦅 PREDATOR Cloud Bridge Service
    Координує роботу між iMac (Local Compute) та Google Colab (Cloud Hybrid).
    """
    
    def __init__(self):
        self.colab_url = None
        self.is_connected = False
        self.last_heartbeat = None

    async def check_colab_status(self, tunnel_url: str) -> bool:
        """Перевіряє доступність вузла Colab через zrok."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{tunnel_url}/api/v1/health")
                if response.status_code == 200:
                    self.colab_url = tunnel_url
                    self.is_connected = True
                    logger.info(f"[CLOUD] Успішно підключено до Colab: {tunnel_url}")
                    return True
        except Exception as e:
            logger.error(f"[CLOUD] Помилка підключення до Colab: {e}")
            self.is_connected = False
        return False

    async def route_llm_request(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Маршрутизація запиту до LLM:
        Sovereign (Local) -> Hybrid (Groq) -> Cloud (Colab/Gemini)
        """
        # Якщо локальний VRAM переповнений (>7.6GB), форсуємо перехід в хмару
        # (Логіка VramGuardian на бекенді)
        if self.is_connected and self.colab_url:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.colab_url}/api/v1/ai/generate",
                    json=payload
                )
                return response.json()
        return None

cloud_bridge = CloudBridgeService()
