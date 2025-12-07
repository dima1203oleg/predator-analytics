from typing import Dict, Any
from ..core.base_agent import BaseAgent, AgentResponse, AgentConfig
from ...services.qdrant_service import get_qdrant_service
from ...services.embedding_service import get_embedding_service

class RetrieverAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentConfig(name="RetrieverAgent"))
        # Bind vector services
        self.qdrant = get_qdrant_service()
        self.embedding = get_embedding_service()

    async def process(self, inputs: Dict[str, Any]) -> AgentResponse:
        query = inputs.get("query", "")
        self._log_activity(f"Retrieving data for query: {query}")
        
        try:
            # 1. Generate Vector (Async)
            # This triggers model loading on first run (might be slow)
            query_vector = await self.embedding.generate_embedding_async(query)
            
            # 2. Semantic Search
            # We search for implicit meaning, not just keywords
            results = await self.qdrant.search(query_vector, limit=15)
            
            # 3. Format Results
            data = []
            for hit in results:
                payload = hit.get("metadata", {})
                # Normalize result structure
                item = {
                    "id": str(hit.get("id")),
                    "content": payload.get("text") or payload.get("content") or payload.get("snippet") or "No content",
                    "title": payload.get("title") or "Untitled",
                    "score": hit.get("score"),
                    "source": "qdrant_knowledge_base",
                    "metadata": payload
                }
                data.append(item)
            
            self._log_activity(f"Found {len(data)} semantic matches")
            
            return AgentResponse(
                agent_name=self.name,
                result={
                    "status": "success", 
                    "source": "vector_db", 
                    "data": data,
                    "count": len(data)
                },
                metadata={"confidence": 0.85 if data else 0.1, "engine": "qdrant"}
            )
            
        except Exception as e:
            self._log_activity(f"Vector search failed: {e}", level="error")
            # Fail gracefully
            return AgentResponse(
                agent_name=self.name,
                result={"status": "error", "error": str(e), "data": []},
                metadata={"confidence": 0.0}
            )
