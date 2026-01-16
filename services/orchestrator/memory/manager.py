"""
Advanced Memory Manager - Hierarchical Memory System (v29.0 Hybrid)
Implements short-term, working, long-term, and episodic memory
Powered by UnifiedMemoryManager (Redis + Qdrant + OpenSearch)
"""
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from collections import deque
import logging

from libs.core.memory.unified_memory import memory_manager as unified_backend

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
            id=data.get("id", ""),
            type=data.get("type", "unknown"),
            content=data.get("content", ""),
            metadata=data.get("metadata", {}),
            importance=data.get("importance", 0.5),
            timestamp=datetime.fromisoformat(data.get("timestamp", datetime.now().isoformat()))
        )


class WorkingMemory:
    """
    In-process working memory for active task context
    Fast access, limited size (RAM Only)
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


class AdvancedMemoryManager:
    """
    Unified memory manager with hierarchical architecture
    Coordinates all memory tiers for optimal recall and storage
    """
    def __init__(self, redis_client=None, db_session=None, qdrant_client=None):
        self.working = WorkingMemory()

        # We ignore passed clients and use the UnifiedMemoryManager singleton
        self.backend = unified_backend

    async def remember(self, event: MemoryEvent):
        """
        Store event in appropriate memory tiers based on importance
        """
        logger.debug(f"Remembering event: {event.type} - {event.content[:50]}...")

        # Update working memory if task related
        if event.metadata.get("task_related", False):
            self.working.add(event)

        # Store in Unified Backend
        # Tags for filtering
        tags = [
            f"type:{event.type}",
            f"importance:{int(event.importance * 10)}"
        ]

        if event.metadata.get("task_type"):
            tags.append(f"task_type:{event.metadata['task_type']}")

        # Persist (Redis + Qdrant + OpenSearch)
        await self.backend.store(
            content=f"{event.type.upper()}: {event.content}",
            role=event.type,
            tags=tags
        )

        logger.info(f"💾 Memorized: {event.type} (importance: {event.importance})")

    async def recall(self, query: str, limit: int = 10) -> List[MemoryEvent]:
        """
        Semantic search over all memory tiers using Unified Backend
        """
        results = await self.backend.recall(query, limit=limit)

        memory_events = []
        for res in results:
            memory_events.append(MemoryEvent(
                id=res.get("id", hashlib.md5(res.get("content", "").encode()).hexdigest()),
                type=res.get("role", "unknown"),
                content=res.get("content", ""),
                importance=res.get("score", 0.5), # Use relevance score as importance proxy
                metadata={"source": res.get("source", "unified"), "timestamp": res.get("timestamp")}
            ))

        return memory_events

    async def recall_similar_tasks(self, task_description: str) -> List[MemoryEvent]:
        """
        Find memories of similar tasks we've done before
        """
        return await self.recall(f"task: {task_description}", limit=5)

    async def recall_errors(self, error_type: str) -> List[MemoryEvent]:
        """
        Find memories of similar errors and how we fixed them
        """
        # We construct a query explicitly looking for errors
        return await self.recall(f"error failure: {error_type}", limit=5)

    async def get_working_context(self) -> Dict:
        """Get current working memory context"""
        return self.working.get_context()

    async def start_task(self, task: Dict):
        """Initialize working memory for new task"""
        self.working.set_current_task(task)

        # Pre-load relevant memories
        relevant = await self.recall_similar_tasks(task.get("description", ""))
        for event in relevant[:3]:
            # Mark as context for current working memory
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
                "task_type": task.get("type", "unknown"),
                "task_related": True
            },
            importance=0.8 if success else 0.9  # Failures are important to remember
        )
        await self.remember(event)

        # Clear working memory for next task
        self.working.clear()


# Singleton instance
_memory_manager: Optional[AdvancedMemoryManager] = None

def get_memory_manager(redis_client=None, db_session=None) -> AdvancedMemoryManager:
    """Get or create memory manager singleton"""
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = AdvancedMemoryManager(redis_client, db_session)
    return _memory_manager
