"""
Advanced Memory Manager - Hierarchical Memory System
Implements short-term, working, long-term, and episodic memory
Based on 2024 state-of-the-art AI agent memory architectures
"""
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from collections import deque
import logging

logger = logging.getLogger("memory.manager")


@dataclass
class MemoryEvent:
    """A single memory event/experience"""
    id: str
    type: str  # task, error, success, insight, code_change
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    importance: float = 0.5  # 0-1 scale
    timestamp: datetime = field(default_factory=datetime.now)
    embedding: Optional[List[float]] = None

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type,
            "content": self.content[:500],  # Truncate for storage
            "metadata": self.metadata,
            "importance": self.importance,
            "timestamp": self.timestamp.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "MemoryEvent":
        return cls(
            id=data["id"],
            type=data["type"],
            content=data["content"],
            metadata=data.get("metadata", {}),
            importance=data.get("importance", 0.5),
            timestamp=datetime.fromisoformat(data["timestamp"])
        )


class ShortTermMemory:
    """
    Redis-backed short-term memory
    TTL: 1 hour, stores recent interactions
    """
    def __init__(self, redis_client, prefix: str = "stm:", ttl: int = 3600):
        self.redis = redis_client
        self.prefix = prefix
        self.ttl = ttl
        self.max_items = 100

    async def store(self, event: MemoryEvent):
        """Store event in short-term memory"""
        if not self.redis:
            return

        key = f"{self.prefix}{event.id}"
        try:
            await self.redis.setex(
                key,
                self.ttl,
                json.dumps(event.to_dict())
            )

            # Also add to recent list
            await self.redis.lpush(f"{self.prefix}recent", event.id)
            await self.redis.ltrim(f"{self.prefix}recent", 0, self.max_items - 1)
            await self.redis.expire(f"{self.prefix}recent", self.ttl)

        except Exception as e:
            logger.error(f"ShortTermMemory store error: {e}")

    async def get(self, event_id: str) -> Optional[MemoryEvent]:
        """Retrieve specific event"""
        if not self.redis:
            return None

        try:
            data = await self.redis.get(f"{self.prefix}{event_id}")
            if data:
                return MemoryEvent.from_dict(json.loads(data))
        except Exception as e:
            logger.error(f"ShortTermMemory get error: {e}")
        return None

    async def get_recent(self, limit: int = 10) -> List[MemoryEvent]:
        """Get most recent events"""
        if not self.redis:
            return []

        events = []
        try:
            ids = await self.redis.lrange(f"{self.prefix}recent", 0, limit - 1)
            for event_id in ids:
                event = await self.get(event_id)
                if event:
                    events.append(event)
        except Exception as e:
            logger.error(f"ShortTermMemory get_recent error: {e}")
        return events


class WorkingMemory:
    """
    In-process working memory for active task context
    Fast access, limited size
    """
    def __init__(self, max_size: int = 1000):
        self.buffer: deque = deque(maxlen=max_size)
        self.current_task: Optional[Dict] = None
        self.intermediate_results: List[Any] = []

    def add(self, event: MemoryEvent):
        """Add to working memory"""
        self.buffer.append(event)

    def set_current_task(self, task: Dict):
        """Set the currently active task"""
        self.current_task = task
        self.intermediate_results = []

    def add_intermediate_result(self, result: Any):
        """Store intermediate computation result"""
        self.intermediate_results.append(result)

    def get_context(self) -> Dict:
        """Get full working memory context"""
        return {
            "current_task": self.current_task,
            "intermediate_results": self.intermediate_results[-5:],  # Last 5
            "recent_events": [e.to_dict() for e in list(self.buffer)[-10:]]
        }

    def clear(self):
        """Clear working memory for new task"""
        self.buffer.clear()
        self.current_task = None
        self.intermediate_results = []


class LongTermMemory:
    """
    PostgreSQL-backed long-term memory
    Stores important patterns, successful solutions, errors
    """
    def __init__(self, db_session=None):
        self.db = db_session
        self._local_cache: Dict[str, MemoryEvent] = {}

    async def store(self, event: MemoryEvent):
        """Store important event in long-term memory"""
        # For now, use local cache (can be extended to PostgreSQL)
        self._local_cache[event.id] = event

        # Persist to file as backup
        await self._persist_to_file(event)

    async def _persist_to_file(self, event: MemoryEvent):
        """Persist memory to file"""
        try:
            import os
            memory_dir = "/app/logs/memory"
            os.makedirs(memory_dir, exist_ok=True)

            filename = f"{memory_dir}/{event.type}_{event.id}.json"
            with open(filename, "w") as f:
                json.dump(event.to_dict(), f, indent=2)
        except Exception as e:
            logger.error(f"LongTermMemory persist error: {e}")

    async def search_by_type(self, event_type: str, limit: int = 10) -> List[MemoryEvent]:
        """Search memories by type"""
        results = [
            e for e in self._local_cache.values()
            if e.type == event_type
        ]
        return sorted(results, key=lambda x: x.timestamp, reverse=True)[:limit]

    async def get_successful_patterns(self, task_type: str) -> List[MemoryEvent]:
        """Get successful patterns for similar tasks"""
        return [
            e for e in self._local_cache.values()
            if e.type == "success" and task_type in e.metadata.get("task_type", "")
        ]


class EpisodicMemory:
    """
    Vector-based episodic memory for semantic search
    "How did we solve a similar problem before?"
    """
    def __init__(self, qdrant_client=None):
        self.qdrant = qdrant_client
        self.collection_name = "episodic_memory"
        self._local_index: List[Dict] = []  # Fallback if no Qdrant

    async def store(self, event: MemoryEvent, embedding: List[float]):
        """Store event with its embedding"""
        event.embedding = embedding

        # Store in local index (can be extended to Qdrant)
        self._local_index.append({
            "id": event.id,
            "event": event.to_dict(),
            "embedding": embedding
        })

        # Keep only last 1000
        if len(self._local_index) > 1000:
            self._local_index = self._local_index[-1000:]

    async def search(self, query_embedding: List[float], limit: int = 5) -> List[MemoryEvent]:
        """Semantic search over memories"""
        if not self._local_index:
            return []

        # Simple cosine similarity (can be replaced with Qdrant)
        def cosine_sim(a: List[float], b: List[float]) -> float:
            if not a or not b or len(a) != len(b):
                return 0.0
            dot = sum(x * y for x, y in zip(a, b))
            norm_a = sum(x * x for x in a) ** 0.5
            norm_b = sum(x * x for x in b) ** 0.5
            return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0

        # Score all memories
        scored = [
            (cosine_sim(query_embedding, item["embedding"]), item["event"])
            for item in self._local_index
            if item.get("embedding")
        ]

        # Return top results
        scored.sort(key=lambda x: x[0], reverse=True)
        return [MemoryEvent.from_dict(item[1]) for score, item in scored[:limit] if score > 0.5]


class AdvancedMemoryManager:
    """
    Unified memory manager with hierarchical architecture
    Coordinates all memory tiers for optimal recall and storage
    """
    def __init__(self, redis_client=None, db_session=None, qdrant_client=None):
        self.short_term = ShortTermMemory(redis_client)
        self.working = WorkingMemory()
        self.long_term = LongTermMemory(db_session)
        self.episodic = EpisodicMemory(qdrant_client)

        # Memory consolidation settings
        self.consolidation_threshold = 0.7
        self._embedding_cache: Dict[str, List[float]] = {}

    async def remember(self, event: MemoryEvent):
        """
        Store event in appropriate memory tiers based on importance
        """
        logger.debug(f"Remembering event: {event.type} - {event.content[:50]}...")

        # Always store in short-term
        await self.short_term.store(event)

        # Working memory for task-related events
        if event.metadata.get("task_related", False):
            self.working.add(event)

        # Long-term for important events
        if event.importance >= self.consolidation_threshold:
            await self.long_term.store(event)

            # Episodic with embedding for semantic search
            embedding = await self._get_embedding(event.content)
            if embedding:
                await self.episodic.store(event, embedding)

        logger.info(f"💾 Memorized: {event.type} (importance: {event.importance})")

    async def recall(self, query: str, limit: int = 10) -> List[MemoryEvent]:
        """
        Semantic search over all memory tiers
        Returns most relevant memories
        """
        results = []

        # Search episodic memory
        query_embedding = await self._get_embedding(query)
        if query_embedding:
            episodic_results = await self.episodic.search(query_embedding, limit)
            results.extend(episodic_results)

        # Also check recent short-term
        recent = await self.short_term.get_recent(limit // 2)
        results.extend(recent)

        # Deduplicate
        seen_ids = set()
        unique_results = []
        for event in results:
            if event.id not in seen_ids:
                seen_ids.add(event.id)
                unique_results.append(event)

        return unique_results[:limit]

    async def recall_similar_tasks(self, task_description: str) -> List[MemoryEvent]:
        """
        Find memories of similar tasks we've done before
        Useful for learning from past experience
        """
        return await self.recall(f"task: {task_description}", limit=5)

    async def recall_errors(self, error_type: str) -> List[MemoryEvent]:
        """
        Find memories of similar errors and how we fixed them
        """
        return await self.long_term.search_by_type("error", limit=5)

    async def get_working_context(self) -> Dict:
        """Get current working memory context"""
        return self.working.get_context()

    async def start_task(self, task: Dict):
        """Initialize working memory for new task"""
        self.working.set_current_task(task)

        # Pre-load relevant memories
        relevant = await self.recall_similar_tasks(task.get("description", ""))
        for event in relevant[:3]:
            self.working.add(event)

    async def complete_task(self, task: Dict, success: bool, result: Any = None):
        """
        Record task completion and consolidate memories
        """
        event = MemoryEvent(
            id=f"task_{hashlib.md5(str(task).encode()).hexdigest()[:8]}_{int(datetime.now().timestamp())}",
            type="success" if success else "failure",
            content=f"Task: {task.get('description', 'unknown')}\nResult: {str(result)[:200]}",
            metadata={
                "task": task,
                "success": success,
                "task_type": task.get("type", "unknown")
            },
            importance=0.8 if success else 0.9  # Failures are important to remember
        )
        await self.remember(event)

        # Clear working memory
        self.working.clear()

    async def _get_embedding(self, text: str) -> Optional[List[float]]:
        """
        Get embedding for text (uses simple hash-based embedding as fallback)
        Can be replaced with real embedding model
        """
        # Check cache
        cache_key = hashlib.md5(text[:500].encode()).hexdigest()
        if cache_key in self._embedding_cache:
            return self._embedding_cache[cache_key]

        # Simple pseudo-embedding based on character frequencies
        # In production, use real embedding model
        embedding = [0.0] * 128
        for i, char in enumerate(text[:500]):
            idx = ord(char) % 128
            embedding[idx] += 1.0 / (i + 1)

        # Normalize
        norm = sum(x * x for x in embedding) ** 0.5
        if norm > 0:
            embedding = [x / norm for x in embedding]

        self._embedding_cache[cache_key] = embedding
        return embedding


# Singleton instance
_memory_manager: Optional[AdvancedMemoryManager] = None

def get_memory_manager(redis_client=None, db_session=None) -> AdvancedMemoryManager:
    """Get or create memory manager singleton"""
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = AdvancedMemoryManager(redis_client, db_session)
    return _memory_manager
