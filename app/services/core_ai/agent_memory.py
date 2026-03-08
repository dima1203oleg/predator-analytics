import logging
from typing import Dict, Any, List
import random

logger = logging.getLogger(__name__)

class AgentMemory:
    """
    Agent Memory (COMP-206)
    Manages long-term and short-term memory for AI agents using 
    PostgreSQL for structured data and Qdrant for vector embeddings.
    """
    def __init__(self):
        self.memory_store = {} # Simulated store

    def store_context(self, session_id: str, context: Dict[str, Any]):
        """
        Stores interaction context in memory.
        """
        if session_id not in self.memory_store:
            self.memory_store[session_id] = []
        self.memory_store[session_id].append(context)
        return {"status": "stored", "session_id": session_id}

    def retrieve_memory(self, session_id: str, query_embedding: List[float] = None) -> List[Dict[str, Any]]:
        """
        Retrieves relevant memories based on session or embedding similarity.
        """
        return self.memory_store.get(session_id, [])[-10:] # Last 10 interactions

    def clear_memory(self, session_id: str):
        if session_id in self.memory_store:
            del self.memory_store[session_id]
        return {"status": "cleared"}
