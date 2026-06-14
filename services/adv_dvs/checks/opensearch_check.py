"""ADV DVS: OpenSearch Check."""
import os
import asyncio
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.opensearch")

async def check_opensearch() -> dict:
    """Перевіряє з'єднання з OpenSearch."""
    try:
        from opensearchpy import AsyncOpenSearch
    except ImportError:
        return {"status": "fail", "component": "opensearch", "message": "opensearchpy is not installed"}

    host = os.getenv("OPENSEARCH_HOST", "opensearch")
    port = int(os.getenv("OPENSEARCH_PORT", "9200"))
    
    logger.info("Перевірка підключення до OpenSearch")
    try:
        client = AsyncOpenSearch(
            hosts=[{'host': host, 'port': port}],
            http_compress=True,
            use_ssl=False,
            verify_certs=False,
        )
        info = await client.info()
        await client.close()
        return {"status": "passed", "component": "opensearch", "message": f"Підключення успішне. Кластер: {info.get('cluster_name')}"}
    except Exception as e:
        logger.error(f"Помилка OpenSearch: {e}")
        return {"status": "fail", "component": "opensearch", "message": str(e)}
