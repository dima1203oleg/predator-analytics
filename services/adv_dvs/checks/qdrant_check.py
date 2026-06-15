"""ADV DVS: Qdrant Check."""
import os
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.qdrant")

async def check_qdrant() -> dict:
    """
    Перевіряє з'єднання з Qdrant.
    Згідно з HR-20, Qdrant використовується тільки як векторна пам'ять (embeddings).
    """
    try:
        from qdrant_client import AsyncQdrantClient
    except ImportError:
        return {"status": "fail", "component": "qdrant", "message": "qdrant_client is not installed"}

    host = os.getenv("QDRANT_HOST", "qdrant")
    port = int(os.getenv("QDRANT_PORT", "6333"))
    logger.info("Перевірка підключення до Qdrant (Vector Memory)")
    try:
        client = AsyncQdrantClient(host=host, port=port, timeout=5.0)
        # Перевіряємо доступність
        collections_response = await client.get_collections()
        
        collections = [c.name for c in collections_response.collections]
        return {
            "status": "passed", 
            "component": "qdrant", 
            "message": "Підключення успішне. Векторна пам'ять доступна.",
            "details": {"collections": collections}
        }
    except Exception as e:
        logger.error(f"Помилка Qdrant: {e}")
        return {"status": "fail", "component": "qdrant", "message": str(e)}
