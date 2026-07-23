import os
import json
import logging
from pathlib import Path
from qdrant_client import AsyncQdrantClient
from qdrant_client.http.models import PointStruct, VectorParams, Distance

logger = logging.getLogger("autonomous_agents.memory_ingestor")

QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
COLLECTION_NAME = "predator-agent-memory"

class MemoryIngestor:
    def __init__(self):
        self.qdrant = AsyncQdrantClient(url=QDRANT_URL)

    async def init_collection(self):
        try:
            collections = await self.qdrant.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if COLLECTION_NAME not in collection_names:
                logger.info(f"Creating Qdrant collection: {COLLECTION_NAME}")
                await self.qdrant.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
        except Exception as e:
            logger.error(f"Error initializing Qdrant collection: {e}")

    async def ingest_memory(self):
        await self.init_collection()
        logger.info("Starting memory ingestion from .claw-rag and .azr")

        # Mock sentence-transformers to avoid heavy dependencies if not present
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')

        workspace_root = Path("/Users/Shared/Predator_60")
        
        # 1. Ingest .claw-rag summaries
        claw_rag_dir = workspace_root / ".claw-rag" / "summaries"
        if claw_rag_dir.exists():
            for md_file in claw_rag_dir.glob("*.md"):
                content = md_file.read_text()
                vector = model.encode(content).tolist()
                point = PointStruct(
                    id=abs(hash(md_file.name)),
                    vector=vector,
                    payload={"source": "claw-rag", "filename": md_file.name, "content": content}
                )
                await self.qdrant.upsert(collection_name=COLLECTION_NAME, points=[point])
                logger.debug(f"Ingested {md_file.name}")

        # 2. Ingest .azr/memory
        azr_memory_dir = workspace_root / ".azr" / "memory"
        if azr_memory_dir.exists():
            for jsonl_file in azr_memory_dir.glob("*.jsonl"):
                with jsonl_file.open() as f:
                    for i, line in enumerate(f):
                        data = json.loads(line)
                        content = str(data)
                        vector = model.encode(content).tolist()
                        point = PointStruct(
                            id=abs(hash(f"{jsonl_file.name}_{i}")),
                            vector=vector,
                            payload={"source": "azr-memory", "filename": jsonl_file.name, "line": i, "content": content}
                        )
                        await self.qdrant.upsert(collection_name=COLLECTION_NAME, points=[point])
                logger.debug(f"Ingested {jsonl_file.name}")

        logger.info("Memory ingestion completed successfully.")

memory_ingestor = MemoryIngestor()
