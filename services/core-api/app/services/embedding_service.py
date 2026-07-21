import logging
from typing import List, Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Генерація векторних ембедингів (embeddings) через локальний Ollama / LiteLLM.
    Zero-Local-Deployment: очікується, що Ollama запущена на NVIDIA сервері.
    """
    def __init__(self, host: str = "http://127.0.0.1:11434"):
        self.host = host
        # Використовуємо nomic-embed-text або mxbai-embed-large, які оптимізовані для пошуку
        self.model = "nomic-embed-text:latest" 
        
    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Генерує ембединг для одного тексту.
        """
        if not text or len(text.strip()) == 0:
            return None
            
        url = f"{self.host}/api/embeddings"
        payload = {
            "model": self.model,
            "prompt": text
        }
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("embedding")
        except Exception as e:
            logger.error(f"Помилка генерації ембедингу через Ollama ({self.model}): {e}")
            return None
            
    async def generate_embeddings_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Генерує ембединги для списку текстів.
        """
        results = []
        # Ollama API/embeddings поки що обробляє по одному запиту, 
        # тому робимо послідовно (в майбутньому замінити на batch endpoint якщо з'явиться)
        for text in texts:
            emb = await self.generate_embedding(text)
            results.append(emb)
        return results

embedding_service = EmbeddingService()
