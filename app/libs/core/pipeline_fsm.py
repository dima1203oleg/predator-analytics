from datetime import datetime
from enum import Enum
import json
from typing import List, Optional

import redis.asyncio as aioredis


class PipelineState(Enum):
    UPLOADED = "UPLOADED"
    VALIDATING = "VALIDATING"
    PARSING = "PARSING"
    TRANSFORMING = "TRANSFORMING"
    ENTITY_RESOLUTION = "ENTITY_RESOLUTION"
    STORING = "STORING"
    INDEXING = "INDEXING"
    READY = "READY"
    FAILED = "FAILED"

class KnowledgePipeline:
    """Manages the Knowledge Import Pipeline FSM using Redis as the Single Source of Truth.
    """
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client

    async def initialize(self, source_id: str, metadata: dict) -> str:
        """Initialize the pipeline for a new source"""
        key = self._get_key(source_id)
        data = {
            "state": PipelineState.UPLOADED.value,
            "progress": 0,
            "source_id": source_id,
            "metadata": json.dumps(metadata),
            "started_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "task_id": metadata.get("task_id", ""),
            "filename": metadata.get("filename", ""),
            "errors": "[]"
        }
        await self.redis.hset(key, mapping=data)
        # Set expiry for 24 hours to keep history
        await self.redis.expire(key, 86400)
        return key

    async def transition(self, source_id: str, new_state: PipelineState, progress: int = None, details: str = None) -> None:
        """Transition to a new state"""
        key = self._get_key(source_id)
        update = {
            "state": new_state.value,
            "updated_at": datetime.now().isoformat()
        }
        if progress is not None:
            update["progress"] = progress

        if details:
            # Append to history/details if needed, but for now we might just log it
            # Or store in metadata
            pass

        await self.redis.hset(key, mapping=update)

    async def fail(self, source_id: str, error_message: str) -> None:
        """Mark pipeline as FAILED"""
        key = self._get_key(source_id)

        # Get existing errors
        current_errors = await self.redis.hget(key, "errors")
        errors = json.loads(current_errors) if current_errors else []
        errors.append({
            "timestamp": datetime.now().isoformat(),
            "message": error_message
        })

        update = {
            "state": PipelineState.FAILED.value,
            "errors": json.dumps(errors),
            "updated_at": datetime.now().isoformat()
        }
        await self.redis.hset(key, mapping=update)

    async def get_status(self, source_id: str) -> dict:
        """Get current pipeline status"""
        key = self._get_key(source_id)
        data = await self.redis.hgetall(key)
        if not data:
            return None

        # Decode fields if necessary (redis-py decode_responses=True handles this usually)
        return data

    def _get_key(self, source_id: str) -> str:
        return f"redis:pipeline:{source_id}"
